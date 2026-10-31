import {
  isBroadcastJid,
  isNewsletterJid,
  isStatusBroadcast,
  stripJidDevice
} from '../utils/jid.js';
import { logger } from '../utils/logger.js';
import { buildContext, sendText, unwrapMessage } from '../utils/messages.js';
import { canUseAdminCommands, getParticipant, isGroupAdmin, isOwner, isTrustedNumber } from '../middleware/permissions.js';
import { handleCommandError } from '../middleware/errorHandler.js';
import { findMedia } from '../utils/media.js';
import { rememberStatus } from '../database/statusStore.js';

const processed = new Map();
const PROCESS_TTL_MS = 5 * 60 * 1000;
const MAX_PROCESSED = 2000;
const spamTracker = new Map();

function remember(id) {
  const now = Date.now();
  processed.set(id, now);
  if (processed.size > MAX_PROCESSED) {
    for (const [key, stamp] of processed.entries()) {
      if (now - stamp > PROCESS_TTL_MS) {
        processed.delete(key);
      }
    }
  }
}

function alreadyProcessed(id) {
  if (!id) {
    return false;
  }
  const stamp = processed.get(id);
  if (!stamp) {
    return false;
  }
  if (Date.now() - stamp > PROCESS_TTL_MS) {
    processed.delete(id);
    return false;
  }
  return true;
}

function containsBlockedLink(text, patterns) {
  const lower = String(text || '').toLowerCase();
  return patterns.some((pattern) => lower.includes(pattern.toLowerCase()));
}

function containsBadword(text, words) {
  const lower = ` ${String(text || '').toLowerCase()} `;
  return (words || []).some((word) => word && lower.includes(` ${String(word).toLowerCase()} `));
}

function isSpamming(senderJid, config, now = Date.now()) {
  const windowMs = config.spamWindowMs || 7000;
  const maxHits = config.spamMaxHits || 6;
  const current = spamTracker.get(senderJid);
  if (!current || current.expires <= now) {
    spamTracker.set(senderJid, { count: 1, expires: now + windowMs });
    return false;
  }
  current.count += 1;
  return current.count >= maxHits;
}

async function exemptModeration(sock, ctx, metadata, config, settings) {
  if (isOwner(ctx.senderJid, config) || isTrustedNumber(ctx.senderJid, config) || settings.isTrusted(ctx.chatJid, ctx.senderJid)) {
    return true;
  }
  return isGroupAdmin(metadata, ctx.senderJid);
}

async function loadMetadata(sock, jid) {
  try {
    return await sock.groupMetadata(jid);
  } catch (error) {
    logger.warn({ err: error.message }, 'Failed to load group metadata');
    return null;
  }
}

async function maybeHandleAntilink(sock, ctx, { config, settings, metadata }) {
  const group = settings.getGroup(ctx.chatJid);
  if (!group.antilink || !ctx.text) {
    return false;
  }
  if (!containsBlockedLink(ctx.text, config.antiLinkPatterns)) {
    return false;
  }
  if (!metadata) {
    return false;
  }
  if (await exemptModeration(sock, ctx, metadata, config, settings)) {
    return false;
  }
  try {
    await sock.sendMessage(ctx.chatJid, { delete: ctx.key });
    await sendText(sock, ctx.chatJid, 'Link removed. Invite / external links are not allowed.', { quoted: ctx.msg });
  } catch (error) {
    logger.warn({ err: error.message }, 'Antilink delete failed');
  }
  return true;
}

async function maybeHandleAntiword(sock, ctx, { config, settings, metadata }) {
  const group = settings.getGroup(ctx.chatJid);
  if (!group.antiword || !ctx.text) {
    return false;
  }
  if (!containsBadword(ctx.text, group.badwords)) {
    return false;
  }
  if (!metadata) {
    return false;
  }
  if (await exemptModeration(sock, ctx, metadata, config, settings)) {
    return false;
  }
  try {
    await sock.sendMessage(ctx.chatJid, { delete: ctx.key });
    await sendText(sock, ctx.chatJid, 'Message removed. That word is blocked in this group.');
  } catch (error) {
    logger.warn({ err: error.message }, 'Antiword delete failed');
  }
  return true;
}

async function maybeHandleAntispam(sock, ctx, { config, settings, metadata }) {
  const group = settings.getGroup(ctx.chatJid);
  if (!group.antispam) {
    return false;
  }
  if (!metadata) {
    return false;
  }
  if (await exemptModeration(sock, ctx, metadata, config, settings)) {
    return false;
  }
  if (!isSpamming(ctx.senderJid, config)) {
    return false;
  }
  try {
    await sock.sendMessage(ctx.chatJid, { delete: ctx.key });
    await sendText(sock, ctx.chatJid, `@${stripJidDevice(ctx.senderJid).split('@')[0]} slow down. Spam is blocked.`, {
      quoted: ctx.msg
    });
  } catch (error) {
    logger.warn({ err: error.message }, 'Antispam handling failed');
  }
  return true;
}

async function maybeHandleViewOnce(sock, ctx, settings) {
  if (!ctx.isGroup) {
    return;
  }
  const group = settings.getGroup(ctx.chatJid);
  if (!group.antiviewonce) {
    return;
  }
  const media = findMedia(ctx.unwrapped);
  const vo = ctx.unwrapped?.viewOnceMessageV2?.message
    || ctx.unwrapped?.viewOnceMessage?.message
    || ctx.unwrapped?.viewOnceMessageV2Extension?.message;
  if (!vo && !ctx.unwrapped?.imageMessage?.viewOnce && !ctx.unwrapped?.videoMessage?.viewOnce) {
    return;
  }
  try {
    const { downloadQuotedMedia } = await import('../utils/media.js');
    const downloaded = await downloadQuotedMedia(sock, ctx);
    if (!downloaded?.buffer) {
      return;
    }
    if (downloaded.media.image || vo?.imageMessage) {
      await sock.sendMessage(ctx.chatJid, { image: downloaded.buffer, caption: 'View-once image captured.' });
    } else if (downloaded.media.video || vo?.videoMessage) {
      await sock.sendMessage(ctx.chatJid, { video: downloaded.buffer, caption: 'View-once video captured.' });
    }
  } catch (error) {
    logger.warn({ err: error.message }, 'Antiviewonce capture failed');
  }
}

export function registerMessageHandler(sock, { config, settings, botState, commandRegistry, rateLimiter, statusStore }) {
  const sessionKey = config.sessionLabel || sock.user?.id || 'default';
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (!Array.isArray(messages) || !messages.length) {
      return;
    }

    for (const msg of messages) {
      try {
        const id = msg?.key?.id;
        const scopedId = id ? `${sessionKey}:${id}` : id;
        if (alreadyProcessed(scopedId)) {
          continue;
        }
        remember(scopedId);

        const chatJid = msg.key?.remoteJid || '';
        const state = botState?.get?.() || {};

        if (isStatusBroadcast(chatJid)) {
          (statusStore?.rememberStatus || rememberStatus)(msg);
          if (state.autoviewstatus && msg.key) {
            await sock.readMessages([msg.key]).catch(() => {});
          }
          continue;
        }

        if (!msg?.message) {
          continue;
        }

        if (isBroadcastJid(chatJid) || isNewsletterJid(chatJid)) {
          continue;
        }

        if (msg.messageStubType) {
          continue;
        }

        const unwrapped = unwrapMessage(msg.message);
        if (!unwrapped) {
          continue;
        }

        if (state.autoread && msg.key) {
          await sock.readMessages([msg.key]).catch(() => {});
        }

        const ctx = buildContext(msg, config);
        ctx.botJid = sock.user?.id || '';
        ctx.prefix = state.prefix || config.prefix;
        if (ctx.fromMe && sock.user?.id) {
          ctx.senderJid = stripJidDevice(sock.user.id);
        }

        if (config.ignoreSelf && ctx.fromMe) {
          const ownerUsingLinkedDevice = config.processOwnerCommands && (
            isOwner(ctx.senderJid, config) || isOwner(sock.user?.id, config)
          );
          if (!ownerUsingLinkedDevice) {
            continue;
          }
        }

        if (ctx.text.length > config.maxMessageChars) {
          logger.warn({ senderJid: ctx.senderJid, length: ctx.text.length }, 'Ignored oversized message');
          continue;
        }

        if (ctx.isGroup && !config.workInGroups) {
          continue;
        }
        if (!ctx.isGroup && !config.workInPrivate) {
          continue;
        }

        let metadata = null;
        if (ctx.isGroup) {
          metadata = await loadMetadata(sock, ctx.chatJid);
          if (metadata) {
            const participant = getParticipant(metadata, ctx.senderJid);
            const phoneJid = stripJidDevice(participant?.phoneNumber || participant?.pn || '');
            if (phoneJid.endsWith('@s.whatsapp.net')) {
              ctx.senderJid = phoneJid;
            }
          }
          await maybeHandleViewOnce(sock, ctx, settings);
          if (await maybeHandleAntilink(sock, ctx, { config, settings, metadata })) continue;
          if (await maybeHandleAntiword(sock, ctx, { config, settings, metadata })) continue;
          if (await maybeHandleAntispam(sock, ctx, { config, settings, metadata })) continue;
        }

        const prefix = state.prefix || config.prefix;
        const parsed = commandRegistry.parse(ctx.text, prefix);
        if (!parsed) {
          continue;
        }

        const command = commandRegistry.get(parsed.name);
        if (!command) {
          continue;
        }

        ctx.commandName = command.name;
        ctx.invoked = parsed.name;
        ctx.args = parsed.args;
        ctx.rawArgs = parsed.rawArgs;

        if (ctx.isGroup && settings.getGroup(ctx.chatJid).muted && !command.adminOnly && !isOwner(ctx.senderJid, config)) {
          continue;
        }

        const ownerSender = isOwner(ctx.senderJid, config) || (ctx.fromMe && isOwner(sock.user?.id, config));
        if (!ownerSender) {
          const rate = rateLimiter.checkRateLimit(ctx.senderJid);
          if (!rate.allowed) {
            continue;
          }
          const cooldown = rateLimiter.checkCooldown(ctx.senderJid, command.name);
          if (!cooldown.allowed) {
            continue;
          }
        }

        if (ctx.isGroup && (command.groupOnly || command.adminOnly) && !metadata) {
          try {
            metadata = await sock.groupMetadata(ctx.chatJid);
          } catch {
            await sendText(sock, ctx.chatJid, 'Unable to load group metadata right now.', { quoted: msg });
            continue;
          }
        }

        if (command.groupOnly && !ctx.isGroup) {
          await sendText(sock, ctx.chatJid, 'This command can only be used in a group.', { quoted: msg });
          continue;
        }

        if (command.adminOnly && !canUseAdminCommands(ctx, metadata, config)) {
          await sendText(sock, ctx.chatJid, 'Only group admins or the bot owner can use this command.', { quoted: msg });
          continue;
        }

        if (command.ownerOnly && !ownerSender && !isOwner(ctx.senderJid, config)) {
          await sendText(sock, ctx.chatJid, 'Only the configured owner can use this command.', { quoted: msg });
          continue;
        }

        logger.info({ command: command.name, chatJid: ctx.chatJid, sender: ctx.senderJid }, 'Executing command');
        await command.execute({ sock, ctx, config, settings, botState, metadata, registry: commandRegistry, statusStore });
      } catch (error) {
        const fallbackCtx = {
          chatJid: msg?.key?.remoteJid,
          senderJid: msg?.key?.participant || msg?.key?.remoteJid,
          msg,
          commandName: 'unknown'
        };
        await handleCommandError(error, fallbackCtx, sock);
      }
    }
  });

  sock.ev.on('messages.update', async (updates) => {
    for (const update of updates || []) {
      try {
        const protocol = update.update?.message?.protocolMessage;
        if (!protocol || protocol.type !== 0) {
          continue;
        }
        const chatJid = update.key?.remoteJid;
        if (!chatJid || !settings.getGroup(chatJid).antidelete) {
          continue;
        }
        await sock.sendMessage(chatJid, {
          text: `Delete blocked notice: a message from ${stripJidDevice(update.key?.participant || chatJid)} was deleted. Original content is not recoverable unless it was cached.`
        });
      } catch (error) {
        logger.warn({ err: error.message }, 'Antidelete handler failed');
      }
    }
  });
}

export default registerMessageHandler;
