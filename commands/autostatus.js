const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');
const isOwnerOrSudo = require('../lib/isOwner');

const configPath = path.join(__dirname, '../data/autoStatus.json');
const metricsPath = path.join(__dirname, '../data/status-view-metrics.jsonl');
const STATUS_JID = 'status@broadcast';
const DEDUPE_TTL_MS = 24 * 60 * 60 * 1000;
const MAX_DEDUPE_ENTRIES = 5000;

// A bounded in-memory dedupe set prevents repeated Baileys upserts from
// generating duplicate read receipts while keeping the hot path lightweight.
const processed = new Map();
const counters = { detected: 0, requested: 0, failed: 0 };
let config = { enabled: false, reactOn: false };

function loadConfig() {
    try {
        const parsed = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        config = { enabled: parsed.enabled === true, reactOn: parsed.reactOn === true };
    } catch (error) {
        if (error.code !== 'ENOENT') console.error('[status-view] config read:', error.message);
    }
    return config;
}

function saveConfig() {
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

loadConfig();

function statusKind(message = {}) {
    if (message.imageMessage) return 'image';
    if (message.videoMessage) return 'video-or-gif';
    if (message.extendedTextMessage || message.conversation) return 'text';
    if (message.documentMessage) return 'document';
    return 'other';
}

function statusId(key) {
    return key?.id && key?.remoteJid === STATUS_JID
        ? `${key.participant || key.remoteJid}:${key.id}`
        : null;
}

function pruneProcessed(now = Date.now()) {
    for (const [id, at] of processed) {
        if (now - at > DEDUPE_TTL_MS) processed.delete(id);
    }
    while (processed.size > MAX_DEDUPE_ENTRIES) {
        processed.delete(processed.keys().next().value);
    }
}

function recordMetric(record) {
    // Metrics are deliberately written off the event hot path.
    fs.appendFile(metricsPath, JSON.stringify(record) + '\n', error => {
        if (error) console.error('[status-view] metric write:', error.message);
    });
}

function reactToStatus(sock, key) {
    if (!config.reactOn) return;
    Promise.resolve(sock.relayMessage(STATUS_JID, {
        reactionMessage: {
            key: {
                remoteJid: STATUS_JID,
                id: key.id,
                participant: key.participant || key.remoteJid,
                fromMe: false
            },
            text: '💚'
        }
    }, {
        messageId: key.id,
        statusJidList: [key.participant || key.remoteJid]
    })).catch(error => {
        console.error('[status-view] reaction failed:', error.message || error);
    });
}

async function autoStatusCommand(sock, chatId, msg, args = []) {
    try {
        const senderId = msg.key.participant || msg.key.remoteJid;
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
        if (!msg.key.fromMe && !isOwner) {
            return sock.sendMessage(chatId, { text: 'This command can only be used by the owner.' });
        }

        const action = String(args[0] || '').toLowerCase();
        const subAction = String(args[1] || '').toLowerCase();

        if (action === 'on') {
            config.enabled = true;
            saveConfig();
            return sock.sendMessage(chatId, { text: '✅ Auto status view has been enabled!' });
        }
        if (action === 'off') {
            config.enabled = false;
            saveConfig();
            return sock.sendMessage(chatId, { text: 'FRANKXMD auto status viewing is OFF.' });
        }
        if (action === 'react' && ['on', 'off'].includes(subAction)) {
            config.reactOn = subAction === 'on';
            saveConfig();
            return sock.sendMessage(chatId, { text: `Automatic status reactions are now ${config.reactOn ? 'ON' : 'OFF'}.` });
        }
        if (action === 'stats') {
            return sock.sendMessage(chatId, {
                text: [
                    '*FRANKXMD STATUS VIEW METRICS*',
                    `Auto view: ${config.enabled ? 'ON' : 'OFF'}`,
                    `Reactions: ${config.reactOn ? 'ON' : 'OFF'}`,
                    `Events detected: ${counters.detected}`,
                    `Read requests resolved: ${counters.requested}`,
                    `Read requests failed: ${counters.failed}`,
                    '',
                    'Detailed per-status timings: data/status-view-metrics.jsonl',
                    'A resolved readMessages() call means the client request completed; it is not proof of a WhatsApp server-side view acknowledgement.'
                ].join('\n')
            });
        }

        return sock.sendMessage(chatId, {
            text: [
                '*FRANKXMD EVENT-DRIVEN AUTO STATUS*',
                `Auto view: ${config.enabled ? 'ON' : 'OFF'}`,
                `Reactions: ${config.reactOn ? 'ON' : 'OFF'}`,
                '',
                '.autostatus on - enable immediate event-driven viewing',
                '.autostatus off - disable viewing',
                '.autostatus react on/off - toggle reactions',
                '.autostatus stats - show runtime counters'
            ].join('\n')
        });
    } catch (error) {
        console.error('[status-view] command error:', error);
        await sock.sendMessage(chatId, { text: 'Unable to update auto status settings: ' + error.message });
    }
}

/**
 * Called directly from Baileys messages.upsert for status@broadcast messages.
 * No timer, polling loop, artificial delay, media download or sequential queue.
 */
async function handleStatusUpdate(sock, update) {
    if (!config.enabled || !sock || typeof sock.readMessages !== 'function') return;

    const messages = Array.isArray(update?.messages)
        ? update.messages
        : (update?.key ? [update] : []);
    if (!messages.length) return;

    const now = Date.now();
    pruneProcessed(now);
    const candidates = [];

    for (const message of messages) {
        const key = message?.key;
        const id = statusId(key);
        if (!id || processed.has(id)) continue;

        processed.set(id, now);
        candidates.push({
            key,
            id,
            kind: statusKind(message.message),
            detectedAt: new Date().toISOString(),
            detectedEpochMs: now,
            detectedMonoMs: performance.now(),
            whatsappTimestamp: message.messageTimestamp
                ? Number(message.messageTimestamp) * 1000
                : null
        });
    }

    if (!candidates.length) return;

    counters.detected += candidates.length;
    const requestStartedAt = new Date().toISOString();
    const requestStartedMonoMs = performance.now();

    try {
        // Batch all newly delivered status keys in one immediate read receipt call.
        await sock.readMessages(candidates.map(item => item.key));
        const resolvedAt = new Date().toISOString();
        const resolvedMonoMs = performance.now();
        counters.requested += candidates.length;

        for (const item of candidates) {
            const record = {
                event: 'status_read_request_resolved',
                statusId: item.id,
                publisher: item.key.participant || null,
                mediaType: item.kind,
                whatsappTimestamp: item.whatsappTimestamp,
                detectedAt: item.detectedAt,
                readRequestStartedAt: requestStartedAt,
                readRequestResolvedAt: resolvedAt,
                eventToRequestResolvedMs: Number((resolvedMonoMs - item.detectedMonoMs).toFixed(3)),
                requestDurationMs: Number((resolvedMonoMs - requestStartedMonoMs).toFixed(3)),
                // This is intentionally not named "viewedAt": Baileys resolving
                // the client call does not expose a server-side view receipt.
                serverViewConfirmed: false
            };
            recordMetric(record);
            reactToStatus(sock, item.key);
        }
    } catch (error) {
        counters.failed += candidates.length;
        for (const item of candidates) {
            processed.delete(item.id);
            recordMetric({
                event: 'status_read_request_failed',
                statusId: item.id,
                publisher: item.key.participant || null,
                mediaType: item.kind,
                detectedAt: item.detectedAt,
                failedAt: new Date().toISOString(),
                error: error.message || String(error)
            });
        }
        console.error('[status-view] read receipt request failed:', error.message || error);
    }
}

module.exports = { autoStatusCommand, handleStatusUpdate };
