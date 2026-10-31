import { jidToNumber, sameUser, stripJidDevice } from '../utils/jid.js';

const ADMIN_ROLES = new Set(['admin', 'superadmin']);

export function isOwner(senderJid, config) {
  if (!senderJid || !config) return false;
  if (config.ownerJid && sameUser(senderJid, config.ownerJid)) return true;
  const senderNumber = jidToNumber(senderJid);
  const ownerNumber = String(config.ownerNumber || '').replace(/\\D/g, '');
  return Boolean(senderNumber && ownerNumber && senderNumber === ownerNumber);
}

export function isTrustedNumber(senderJid, config) {
  const number = jidToNumber(senderJid);
  return config.trustedNumbers.includes(number);
}

function participantIds(p) {
  return [
    p?.id,
    p?.jid,
    p?.lid,
    p?.phoneNumber,
    p?.pn
  ].map(stripJidDevice).filter(Boolean);
}

export function getParticipant(metadata, userJid) {
  if (!metadata?.participants) {
    return null;
  }
  const target = stripJidDevice(userJid);
  const targetNumber = jidToNumber(userJid);
  return metadata.participants.find((p) => {
    const ids = participantIds(p);
    if (ids.includes(target)) {
      return true;
    }
    if (!targetNumber) {
      return false;
    }
    return ids.some((id) => jidToNumber(id) === targetNumber);
  }) || null;
}

export function isGroupAdmin(metadata, userJid) {
  const participant = getParticipant(metadata, userJid);
  if (!participant) {
    return false;
  }
  const role = participant.admin || participant.role || null;
  return ADMIN_ROLES.has(String(role));
}

export function botParticipant(metadata, sock) {
  const candidates = [
    sock?.user?.id,
    sock?.user?.lid,
    sock?.user?.pn,
    sock?.user?.jid
  ].filter(Boolean);
  for (const candidate of candidates) {
    const found = getParticipant(metadata, candidate);
    if (found) {
      return found;
    }
  }
  return null;
}

export function isBotAdmin(metadata, sock) {
  const participant = botParticipant(metadata, sock);
  if (!participant) {
    return false;
  }
  const role = participant.admin || participant.role || null;
  return ADMIN_ROLES.has(String(role));
}

export function canUseAdminCommands(ctx, metadata, config) {
  if (ctx.fromMe || isOwner(ctx.senderJid, config)) {
    return true;
  }
  if (!ctx.isGroup) {
    return false;
  }
  return isGroupAdmin(metadata, ctx.senderJid);
}

export function assertGroup(ctx) {
  if (!ctx.isGroup) {
    return 'This command can only be used in a group.';
  }
  return null;
}

export function resolveTargetJid(ctx, arg, metadata) {
  let target = null;
  if (ctx.mentions.length) {
    target = stripJidDevice(ctx.mentions[0]);
  } else if (ctx.quoted?.participant) {
    target = stripJidDevice(ctx.quoted.participant);
  } else if (arg) {
    const digits = String(arg).replace(/\D/g, '');
    if (digits) {
      target = `${digits}@s.whatsapp.net`;
    }
  }
  if (!target) {
    return null;
  }
  const participant = getParticipant(metadata, target);
  return participant ? stripJidDevice(participant.id || participant.jid || target) : target;
}

export default {
  isOwner,
  isTrustedNumber,
  getParticipant,
  isGroupAdmin,
  botParticipant,
  isBotAdmin,
  canUseAdminCommands,
  assertGroup,
  resolveTargetJid
};
