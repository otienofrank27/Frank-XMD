const statuses = [];
const MAX_STATUSES = 30;

export function rememberStatus(msg) {
  if (!msg?.key?.id) {
    return;
  }
  statuses.unshift({
    key: msg.key,
    message: msg.message,
    timestamp: Number(msg.messageTimestamp || Date.now() / 1000),
    participant: msg.key.participant || msg.key.remoteJid
  });
  if (statuses.length > MAX_STATUSES) {
    statuses.length = MAX_STATUSES;
  }
}

export function latestStatus() {
  return statuses[0] || null;
}

export function listStatuses() {
  return [...statuses];
}

export default {
  rememberStatus,
  latestStatus,
  listStatuses
};
