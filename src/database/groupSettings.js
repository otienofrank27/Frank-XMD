import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { stripJidDevice } from '../utils/jid.js';
import { logger } from '../utils/logger.js';

function defaultGroup(config) {
  return {
    antilink: Boolean(config.antilinkDefault),
    antiword: Boolean(config.antiwordDefault),
    antispam: Boolean(config.antispamDefault),
    antidelete: Boolean(config.antideleteDefault),
    antiviewonce: Boolean(config.antiviewonceDefault),
    welcome: Boolean(config.welcomeEnabledDefault),
    goodbye: Boolean(config.goodbyeEnabledDefault),
    muted: false,
    warnings: {},
    trusted: [],
    badwords: [...(config.badwords || [])]
  };
}

export function createGroupSettings(config) {
  const filePath = config.settingsPath;
  mkdirSync(dirname(filePath), { recursive: true });

  let store = { groups: {} };

  if (existsSync(filePath)) {
    try {
      const parsed = JSON.parse(readFileSync(filePath, 'utf8'));
      store = {
        groups: parsed?.groups && typeof parsed.groups === 'object' ? parsed.groups : {}
      };
    } catch (error) {
      logger.warn({ err: error.message }, 'Failed to parse group settings; starting empty store');
      store = { groups: {} };
    }
  }

  let writeChain = Promise.resolve();

  function persist() {
    writeChain = writeChain.then(() => {
      const tmp = `${filePath}.tmp`;
      writeFileSync(tmp, JSON.stringify(store, null, 2), { mode: 0o600 });
      renameSync(tmp, filePath);
    }).catch((error) => {
      logger.error({ err: error.message }, 'Failed to persist group settings');
    });
    return writeChain;
  }

  function groupKey(jid) {
    return stripJidDevice(jid);
  }

  function getGroup(jid) {
    const key = groupKey(jid);
    if (!store.groups[key]) {
      store.groups[key] = defaultGroup(config);
      persist();
    }
    const group = store.groups[key];
    group.warnings ||= {};
    group.trusted ||= [];
    group.badwords ||= [...(config.badwords || [])];
    group.antilink ||= false;
    group.antiword ||= false;
    group.antispam ||= false;
    group.antidelete ||= false;
    group.antiviewonce ||= false;
    return group;
  }

  function updateGroup(jid, patch) {
    const group = getGroup(jid);
    Object.assign(group, patch);
    persist();
    return group;
  }

  function setFlag(jid, flag, value) {
    return updateGroup(jid, { [flag]: Boolean(value) });
  }

  function getWarnings(jid, userJid) {
    const group = getGroup(jid);
    return Number(group.warnings[stripJidDevice(userJid)] || 0);
  }

  function addWarning(jid, userJid) {
    const group = getGroup(jid);
    const key = stripJidDevice(userJid);
    const next = Number(group.warnings[key] || 0) + 1;
    group.warnings[key] = next;
    persist();
    return next;
  }

  function resetWarnings(jid, userJid) {
    const group = getGroup(jid);
    delete group.warnings[stripJidDevice(userJid)];
    persist();
  }

  function isTrusted(jid, userJid) {
    const group = getGroup(jid);
    return group.trusted.includes(stripJidDevice(userJid));
  }

  function addTrusted(jid, userJid) {
    const group = getGroup(jid);
    const target = stripJidDevice(userJid);
    if (!group.trusted.includes(target)) {
      group.trusted.push(target);
      persist();
    }
  }

  function addBadword(jid, word) {
    const group = getGroup(jid);
    const cleaned = String(word || '').trim().toLowerCase();
    if (!cleaned) return group.badwords;
    if (!group.badwords.includes(cleaned)) {
      group.badwords.push(cleaned);
      persist();
    }
    return group.badwords;
  }

  function removeBadword(jid, word) {
    const group = getGroup(jid);
    const cleaned = String(word || '').trim().toLowerCase();
    group.badwords = group.badwords.filter((item) => item !== cleaned);
    persist();
    return group.badwords;
  }

  persist();

  return {
    getGroup,
    updateGroup,
    setFlag,
    getWarnings,
    addWarning,
    resetWarnings,
    isTrusted,
    addTrusted,
    addBadword,
    removeBadword
  };
}

export default createGroupSettings;
