import { extractMentionedJids, getQuotedMessage, isGroupJid, senderFromMessage } from './jid.js';

const MAX_DEFAULT_CHARS = 4096;

export function unwrapMessage(message) {
  if (!message) {
    return null;
  }

  if (message.ephemeralMessage?.message) {
    return unwrapMessage(message.ephemeralMessage.message);
  }
  if (message.viewOnceMessage?.message) {
    return unwrapMessage(message.viewOnceMessage.message);
  }
  if (message.viewOnceMessageV2?.message) {
    return unwrapMessage(message.viewOnceMessageV2.message);
  }
  if (message.viewOnceMessageV2Extension?.message) {
    return unwrapMessage(message.viewOnceMessageV2Extension.message);
  }
  if (message.documentWithCaptionMessage?.message) {
    return unwrapMessage(message.documentWithCaptionMessage.message);
  }
  if (message.editedMessage?.message) {
    return unwrapMessage(message.editedMessage.message);
  }

  return message;
}

export function extractText(message) {
  const unwrapped = unwrapMessage(message);
  if (!unwrapped) {
    return '';
  }

  return (
    unwrapped.conversation ||
    unwrapped.extendedTextMessage?.text ||
    unwrapped.imageMessage?.caption ||
    unwrapped.videoMessage?.caption ||
    unwrapped.documentMessage?.caption ||
    unwrapped.buttonsMessage?.contentText ||
    unwrapped.listMessage?.description ||
    unwrapped.templateButtonReplyMessage?.selectedId ||
    unwrapped.buttonsResponseMessage?.selectedButtonId ||
    unwrapped.listResponseMessage?.singleSelectReply?.selectedRowId ||
    ''
  ).trim();
}

export function normalizeText(text = '') {
  return String(text)
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function truncateText(text = '', maxChars = MAX_DEFAULT_CHARS) {
  if (text.length <= maxChars) {
    return text;
  }
  return `${text.slice(0, maxChars - 1)}…`;
}

export function parseCommand(text, prefix) {
  const normalized = normalizeText(text);
  if (!normalized.startsWith(prefix)) {
    return null;
  }

  const withoutPrefix = normalized.slice(prefix.length).trim();
  if (!withoutPrefix) {
    return null;
  }

  const [name, ...rest] = withoutPrefix.split(' ');
  return {
    name: name.toLowerCase(),
    args: rest,
    rawArgs: rest.join(' '),
    full: withoutPrefix
  };
}

export function buildContext(msg, config) {
  const unwrapped = unwrapMessage(msg.message);
  const text = extractText(unwrapped);
  const chatJid = msg.key?.remoteJid || '';
  const senderJid = senderFromMessage(msg);
  const quoted = getQuotedMessage(unwrapped);
  const mentions = extractMentionedJids(unwrapped);

  return {
    msg,
    key: msg.key,
    chatJid,
    senderJid,
    fromMe: Boolean(msg.key?.fromMe),
    isGroup: isGroupJid(chatJid),
    isPrivate: !isGroupJid(chatJid),
    text,
    mentions,
    quoted,
    unwrapped,
    timestamp: Number(msg.messageTimestamp || Date.now() / 1000),
    prefix: config.prefix
  };
}

export async function sendText(sock, jid, text, options = {}) {
  const content = truncateText(String(text || ''), options.maxChars || MAX_DEFAULT_CHARS);
  if (!content) {
    return null;
  }
  return sock.sendMessage(jid, { text: content }, options.quoted ? { quoted: options.quoted } : undefined);
}

export async function sendWithMentions(sock, jid, text, mentions = [], options = {}) {
  return sock.sendMessage(
    jid,
    {
      text: truncateText(String(text || ''), options.maxChars || MAX_DEFAULT_CHARS),
      mentions
    },
    options.quoted ? { quoted: options.quoted } : undefined
  );
}

export function formatDuration(ms) {
  const totalSeconds = Math.floor(Math.max(0, ms) / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(' ');
}

export default {
  unwrapMessage,
  extractText,
  normalizeText,
  truncateText,
  parseCommand,
  buildContext,
  sendText,
  sendWithMentions,
  formatDuration
};
