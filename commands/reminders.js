const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const DATA_FILE = path.join(DATA_DIR, 'reminders.json');
const MAX_DELAY_MS = 30 * 24 * 60 * 60 * 1000;
let activeSocket = null;
let processing = false;

function readReminders() {
    try {
        const parsed = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        if (error.code !== 'ENOENT') console.error('[reminders] Could not read reminders:', error.message);
        return [];
    }
}

function writeReminders(reminders) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    const temporaryFile = DATA_FILE + '.tmp';
    fs.writeFileSync(temporaryFile, JSON.stringify(reminders, null, 2), { mode: 0o600 });
    fs.renameSync(temporaryFile, DATA_FILE);
}

function parseDuration(value) {
    const match = /^(\d+)(s|m|h|d)$/i.exec(value || '');
    if (!match) return null;
    const amount = Number(match[1]);
    const unit = match[2].toLowerCase();
    const multiplier = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit];
    const duration = amount * multiplier;
    if (!Number.isSafeInteger(duration) || duration < 10000 || duration > MAX_DELAY_MS) return null;
    return duration;
}

function createId(reminders) {
    let id;
    do {
        id = Math.random().toString(36).slice(2, 7).toUpperCase();
    } while (reminders.some(item => item.id === id));
    return id;
}

async function deliverDueReminders() {
    if (!activeSocket || processing) return;
    processing = true;
    try {
        const now = Date.now();
        const reminders = readReminders();
        const due = reminders.filter(item => Number(item.dueAt) <= now);
        if (!due.length) return;

        const dueIds = new Set(due.map(item => item.id));
        writeReminders(reminders.filter(item => !dueIds.has(item.id)));

        const retry = [];
        for (const reminder of due) {
            try {
                // Group reminders are delivered privately to their creator.
                const destination = reminder.chatId.endsWith('@g.us') ? reminder.senderId : reminder.chatId;
                await activeSocket.sendMessage(destination, {
                    text: '⏰ REMINDER\\n\\n' + reminder.text + '\\n\\nScheduled: ' +
                        new Date(reminder.dueAt).toLocaleString()
                });
            } catch (error) {
                console.error('[reminders] Delivery failed for ' + reminder.id + ':', error.message);
                retry.push({ ...reminder, dueAt: Date.now() + 60000 });
            }
        }
        if (retry.length) writeReminders([...readReminders(), ...retry]);
    } catch (error) {
        console.error('[reminders] Scheduler error:', error.message);
    } finally {
        processing = false;
    }
}

const scheduler = setInterval(deliverDueReminders, 5000);
if (typeof scheduler.unref === 'function') scheduler.unref();

function resumeReminders(sock) {
    activeSocket = sock;
    deliverDueReminders().catch(error => console.error('[reminders] Resume error:', error.message));
}

async function reminderCommand(sock, chatId, message, userMessage) {
    activeSocket = sock;
    const senderId = message.key.participant || message.key.remoteJid;
    const parts = userMessage.trim().split(/\s+/);
    const command = (parts[0] || '').toLowerCase();

    if (command === '.reminders') {
        const mine = readReminders()
            .filter(item => item.chatId === chatId && item.senderId === senderId)
            .sort((a, b) => a.dueAt - b.dueAt);
        if (!mine.length) {
            return sock.sendMessage(chatId, { text: 'You have no pending reminders in this chat.' }, { quoted: message });
        }
        const lines = mine.map(item =>
            '• ' + item.id + ' — ' + new Date(item.dueAt).toLocaleString() + '\n  ' + item.text
        );
        return sock.sendMessage(chatId, {
            text: 'YOUR REMINDERS (' + mine.length + ')\n\n' + lines.join('\n\n') +
                '\n\nCancel one with .cancelreminder ID'
        }, { quoted: message });
    }

    if (command === '.cancelreminder') {
        const id = (parts[1] || '').toUpperCase();
        if (!id) {
            return sock.sendMessage(chatId, { text: 'Usage: .cancelreminder ID\nGet IDs with .reminders.' }, { quoted: message });
        }
        const reminders = readReminders();
        const target = reminders.find(item => item.id === id && item.chatId === chatId && item.senderId === senderId);
        if (!target) {
            return sock.sendMessage(chatId, { text: 'Reminder not found. You can only cancel your own reminders in this chat.' }, { quoted: message });
        }
        writeReminders(reminders.filter(item => item.id !== id));
        return sock.sendMessage(chatId, { text: 'Reminder ' + id + ' cancelled.' }, { quoted: message });
    }

    const duration = parseDuration(parts[1]);
    const reminderText = parts.slice(2).join(' ').trim();
    if (!duration || !reminderText) {
        return sock.sendMessage(chatId, {
            text: 'REMINDER COMMANDS\n\n.remind 10m Drink water\n.remind 2h Check the oven\n.remind 1d Submit the assignment\n.reminders — list your reminders\n.cancelreminder ID — cancel a reminder\n\nUse s, m, h or d. Minimum 10 seconds; maximum 30 days.'
        }, { quoted: message });
    }

    const reminders = readReminders();
    const dueAt = Date.now() + duration;
    const reminder = {
        id: createId(reminders),
        chatId,
        senderId,
        text: reminderText.slice(0, 1000),
        createdAt: Date.now(),
        dueAt
    };
    reminders.push(reminder);
    writeReminders(reminders);

    return sock.sendMessage(chatId, {
        text: 'Reminder saved.\n\nID: ' + reminder.id +
            '\nWhen: ' + new Date(dueAt).toLocaleString() +
            '\nMessage: ' + reminder.text +
            '\n\nUse .reminders to manage your reminders.'
    }, { quoted: message });
}

module.exports = { reminderCommand, resumeReminders };
