const LID_SUFFIX = '@lid';
const USER_SUFFIX = '@s.whatsapp.net';
const GROUP_SUFFIX = '@g.us';
const BROADCAST_SUFFIX = '@broadcast';
const NEWSLETTER_SUFFIX = '@newsletter';

export function isGroupJid(jid = '') {
  return typeof jid === 'string' && jid.endsWith(GROUP_SUFFIX);
}

export function isUserJid(jid = '') {
  return typeof jid === 'string' && (jid.endsWith(USER_SUFFIX) || jid.endsWith(LID_SUFFIX));
}

export function isStatusBroadcast(jid = '') {
  return jid === 'status@broadcast';
}

export function isBroadcastJid(jid = '') {
  return typeof jid === 'string' && jid.endsWith(BROADCAST_SUFFIX);
}

export function isNewsletterJid(jid = '') {
  return typeof jid === 'string' && jid.endsWith(NEWSLETTER_SUFFIX);
}

export function stripJidDevice(jid = '') {
  if (!jid || typeof jid !== 'string') {
    return '';
  }

  const [userPart, server] = jid.split('@');
  if (!server) {
    return jid;
  }

  const user = userPart.split(':')[0];
  return `${user}@${server}`;
}

export function jidToNumber(jid = '') {
  const normalized = stripJidDevice(jid);
  const user = normalized.split('@')[0] || '';
  return user.replace(/\D/g, '');
}

export function numberToJid(input = '') {
  const digits = String(input).replace(/\D/g, '');
  if (!digits) {
    return '';
  }
  return `${digits}${USER_SUFFIX}`;
}

export function sameUser(a = '', b = '') {
  const leftJid = stripJidDevice(a);
  const rightJid = stripJidDevice(b);
  if (leftJid && rightJid && leftJid === rightJid) return true;
  const left = jidToNumber(a);
  const right = jidToNumber(b);
  return Boolean(left && right && left === right);
}

export function extractMentionedJids(message) {
  const context =
    message?.extendedTextMessage?.contextInfo ||
    message?.imageMessage?.contextInfo ||
    message?.videoMessage?.contextInfo ||
    message?.documentMessage?.contextInfo ||
    message?.stickerMessage?.contextInfo ||
    {};

  const mentioned = Array.isArray(context.mentionedJid) ? context.mentionedJid : [];
  return mentioned.map(stripJidDevice).filter(Boolean);
}

export function getQuotedMessage(message) {
  const context =
    message?.extendedTextMessage?.contextInfo ||
    message?.imageMessage?.contextInfo ||
    message?.videoMessage?.contextInfo ||
    message?.documentMessage?.contextInfo ||
    message?.stickerMessage?.contextInfo ||
    null;

  if (!context?.quotedMessage) {
    return null;
  }

  return {
    key: {
      remoteJid: context.remoteJid || null,
      fromMe: Boolean(context.participant && false),
      id: context.stanzaId,
      participant: context.participant || undefined
    },
    message: context.quotedMessage,
    participant: context.participant || null,
    stanzaId: context.stanzaId || null
  };
}

export function participantJid(entry) {
  if (!entry) {
    return '';
  }
  if (typeof entry === 'string') {
    return stripJidDevice(entry);
  }
  return stripJidDevice(entry.phoneNumber || entry.pn || entry.id || entry.jid || '');
}

export function senderFromMessage(msg) {
  if (!msg?.key) {
    return '';
  }

  if (msg.key.fromMe) {
    return stripJidDevice(msg.key.participantAlt || msg.key.participant || msg.key.remoteJidAlt || msg.key.remoteJid || '');
  }

  if (isGroupJid(msg.key.remoteJid)) {
    return stripJidDevice(msg.key.participantAlt || msg.key.participant || msg.participant || '');
  }

  return stripJidDevice(msg.key.remoteJidAlt || msg.key.remoteJid || '');
}

export default {
  isGroupJid,
  isUserJid,
  isStatusBroadcast,
  isBroadcastJid,
  isNewsletterJid,
  stripJidDevice,
  jidToNumber,
  numberToJid,
  sameUser,
  extractMentionedJids,
  getQuotedMessage,
  senderFromMessage,
  participantJid
};
