import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { numberToJid } from '../utils/jid.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '../..');
const settingsFileName = 'settings';

dotenv.config({ path: join(rootDir, '.env') });

function readSettingsFile() {
  const filePath = join(rootDir, settingsFileName);
  if (!existsSync(filePath)) {
    return {};
  }
  try {
    const parsed = JSON.parse(readFileSync(filePath, 'utf8'));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (error) {
    throw new Error(`Invalid settings file: ${error.message}`);
  }
}

function pick(fileValue, envName, fallback) {
  const envValue = process.env[envName];
  if (envValue !== undefined && envValue !== null && String(envValue).trim() !== '') {
    return String(envValue).trim();
  }
  if (fileValue !== undefined && fileValue !== null && String(fileValue).trim() !== '') {
    return fileValue;
  }
  return fallback;
}

function toBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  if (typeof value === 'boolean') {
    return value;
  }
  return ['1', 'true', 'yes', 'on'].includes(String(value).trim().toLowerCase());
}

function toInt(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }
  let next = parsed;
  if (typeof min === 'number') next = Math.max(min, next);
  if (typeof max === 'number') next = Math.min(max, next);
  return next;
}

function csv(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function loadConfig() {
  const file = readSettingsFile();
  const ownerNumber = String(pick(file.ownerNumber, 'OWNER_NUMBER', '')).replace(/\D/g, '');
  if (!ownerNumber) {
    throw new Error('ownerNumber must be set in the settings file');
  }

  const prefix = String(pick(file.prefix, 'PREFIX', '.'));
  if (prefix.length > 3) {
    throw new Error('prefix must be 1 to 3 characters.');
  }

  const authDir = join(rootDir, 'auth');
  const logsDir = join(rootDir, 'logs');
  const dataDir = join(rootDir, 'data');
  const assetsDir = join(rootDir, 'assets');

  for (const dir of [authDir, logsDir, dataDir, assetsDir]) {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  const trustedNumbers = csv(pick(file.trustedNumbers, 'TRUSTED_NUMBERS', []))
    .map((n) => String(n).replace(/\D/g, ''))
    .filter(Boolean);

  const menu = file.menu && typeof file.menu === 'object' ? file.menu : {};
  const lastseen = String(pick(file.lastseen, 'LASTSEEN', 'available')).toLowerCase();

  return {
    botName: String(pick(file.botName, 'BOT_NAME', 'FrankBot')),
    ownerName: String(pick(file.ownerName, 'OWNER_NAME', 'Frank')),
    ownerNumber,
    ownerJid: numberToJid(ownerNumber),
    sessionId: String(file.sessionId || '').trim(),
    prefix,
    timezone: String(pick(file.timezone, 'TIMEZONE', 'Africa/Nairobi')),
    logLevel: String(pick(file.logLevel, 'LOG_LEVEL', 'info')),
    workInGroups: toBoolean(pick(file.workInGroups, 'WORK_IN_GROUPS', true), true),
    workInPrivate: toBoolean(pick(file.workInPrivate, 'WORK_IN_PRIVATE', true), true),
    ignoreSelf: toBoolean(pick(file.ignoreSelf, 'IGNORE_SELF', true), true),
    processOwnerCommands: toBoolean(pick(file.processOwnerCommands, 'PROCESS_OWNER_COMMANDS', true), true),
    markOnlineOnConnect: toBoolean(pick(file.markOnlineOnConnect, 'MARK_ONLINE_ON_CONNECT', false), false),
    autoviewstatus: toBoolean(pick(file.autoviewstatus, 'AUTOVIEWSTATUS', false), false),
    autoread: toBoolean(pick(file.autoread, 'AUTOREAD', false), false),
    lastseen,
    welcomeEnabledDefault: toBoolean(pick(file.welcomeEnabled, 'WELCOME_ENABLED', true), true),
    goodbyeEnabledDefault: toBoolean(pick(file.goodbyeEnabled, 'GOODBYE_ENABLED', false), false),
    antilinkDefault: toBoolean(pick(file.antilinkDefault, 'ANTILINK_DEFAULT', false), false),
    antiwordDefault: toBoolean(pick(file.antiwordDefault, 'ANTIWORD_DEFAULT', false), false),
    antispamDefault: toBoolean(pick(file.antispamDefault, 'ANTISPAM_DEFAULT', false), false),
    antideleteDefault: toBoolean(pick(file.antideleteDefault, 'ANTIDELETE_DEFAULT', false), false),
    antiviewonceDefault: toBoolean(pick(file.antiviewonceDefault, 'ANTIVIEWONCE_DEFAULT', false), false),
    maxWarnings: toInt(pick(file.maxWarnings, 'MAX_WARNINGS', 3), 3, 1, 20),
    commandCooldownMs: toInt(pick(file.commandCooldownMs, 'COMMAND_COOLDOWN_MS', 1500), 1500, 0, 60000),
    rateLimitMax: toInt(pick(file.rateLimitMax, 'RATE_LIMIT_MAX', 12), 12, 1, 100),
    rateLimitWindowMs: toInt(pick(file.rateLimitWindowMs, 'RATE_LIMIT_WINDOW_MS', 10000), 10000, 1000, 120000),
    maxMessageChars: toInt(pick(file.maxMessageChars, 'MAX_MESSAGE_CHARS', 4096), 4096, 80, 10000),
    maxMentions: toInt(pick(file.maxMentions, 'MAX_MENTIONS', 50), 50, 1, 256),
    spamWindowMs: toInt(pick(file.spamWindowMs, 'SPAM_WINDOW_MS', 7000), 7000, 1000, 60000),
    spamMaxHits: toInt(pick(file.spamMaxHits, 'SPAM_MAX_HITS', 6), 6, 2, 50),
    welcomeMessage: String(pick(
      file.welcomeMessage,
      'WELCOME_MESSAGE',
      'Welcome {user} to {group}. Please follow the group rules.'
    )),
    goodbyeMessage: String(pick(file.goodbyeMessage, 'GOODBYE_MESSAGE', '{user} left {group}.')),
    quoteText: String(pick(
      file.quoteText,
      'QUOTE_TEXT',
      'Stay focused. Small consistent steps beat rare bursts of effort.'
    )),
    trustedNumbers,
    antiLinkPatterns: csv(pick(file.antiLinkPatterns, 'ANTI_LINK_PATTERNS', 'chat.whatsapp.com,wa.me,t.me,discord.gg')),
    badwords: csv(pick(file.badwords, 'BADWORDS', 'fuck,shit,bitch,asshole')),
    ownerCountry: String(pick(file.ownerCountry, 'OWNER_COUNTRY', 'KE')).toUpperCase(),
    removeBgApiKey: String(pick(file.removeBgApiKey, 'REMOVEBG_API_KEY', '')),
    stickerPackName: String(pick(file.stickerPackName, 'STICKER_PACK_NAME', file.botName || 'FrankBot')),
    stickerPackAuthor: String(pick(file.stickerPackAuthor, 'STICKER_PACK_AUTHOR', file.ownerName || 'Frank')),
    menu: {
      tagline: String(menu.tagline || 'Secure WhatsApp Assistant'),
      accent: String(menu.accent || '#d4af37'),
      background: String(menu.background || '#070b14'),
      panel: String(menu.panel || '#10182a'),
      logoPath: join(rootDir, menu.logoPath || 'assets/logo.png'),
      backgroundPath: join(rootDir, menu.backgroundPath || 'assets/menu-bg.png'),
      techImagePath: join(rootDir, menu.techImagePath || 'assets/tech.png')
    },
    authDir,
    logsDir,
    dataDir,
    assetsDir,
    settingsFile: join(rootDir, settingsFileName),
    settingsPath: join(dataDir, 'group-settings.json'),
    botStatePath: join(dataDir, 'bot-state.json'),
    startedAt: Date.now(),
    rootDir
  };
}

export function updateSettings(patch) {
  const filePath = join(rootDir, settingsFileName);
  const current = readSettingsFile();
  const next = { ...current, ...patch };
  const tmp = `${filePath}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(next, null, 2)}\n`, { mode: 0o600 });
  renameSync(tmp, filePath);
  return next;
}

export default loadConfig;
