import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig } from '../config/config.js';
import { createGroupSettings } from '../database/groupSettings.js';
import { createBotState } from '../database/botState.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import { createCommandRegistry, loadCommands } from '../handlers/commandHandler.js';
import { createConnectionManager } from '../connection/connection.js';
import { logger } from '../utils/logger.js';

const ROOT = process.cwd();
const USERS_DIR = join(ROOT, 'data', 'multiuser');
const SESSIONS_DIR = join(ROOT, 'sessions');
const REGISTRY_FILE = join(USERS_DIR, 'registry.json');
const MAX_SESSIONS_PER_USER = 3;
const active = new Map();
let registry = { users: {} };

function safeRead(file, fallback) {
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return fallback; }
}
function persist() {
  mkdirSync(USERS_DIR, { recursive: true, mode: 0o700 });
  const tmp = REGISTRY_FILE + '.tmp';
  writeFileSync(tmp, JSON.stringify(registry, null, 2), { mode: 0o600 });
  chmodSync(tmp, 0o600);
  writeFileSync(REGISTRY_FILE, readFileSync(tmp));
}
function userDir(userId) { return join(SESSIONS_DIR, createHash('sha256').update(userId).digest('hex')); }
function sessionDir(userId, sessionId) { return join(userDir(userId), createHash('sha256').update(sessionId).digest('hex')); }
function sessionConfig(authDir, dataDir, ownerNumber, sessionLabel) {
  const base = loadConfig();
  return {
    ...base, ownerNumber, ownerJid: ownerNumber ? ownerNumber + '@s.whatsapp.net' : '',
    authDir, dataDir, logsDir: join(dataDir, 'logs'), assetsDir: base.assetsDir,
    settingsPath: join(dataDir, 'group-settings.json'), botStatePath: join(dataDir, 'bot-state.json'),
    sessionId: '', sessionLabel, ignoreSelf: false, processOwnerCommands: true
  };
}

export async function createSessionManager() {
  mkdirSync(USERS_DIR, { recursive: true, mode: 0o700 });
  mkdirSync(SESSIONS_DIR, { recursive: true, mode: 0o700 });
  registry = safeRead(REGISTRY_FILE, { users: {} });
  if (!registry.users || typeof registry.users !== 'object') registry = { users: {} };
  const commandRegistry = createCommandRegistry();
  await loadCommands(commandRegistry);

  async function startSession(userId, sessionId, method, phoneNumber = '') {
    const user = registry.users[userId];
    if (!user) throw new Error('Dashboard account not found.');
    const entries = Object.values(user.sessions || {});
    const existing = entries.find((s) => s.id === sessionId);
    if (!existing && entries.length >= MAX_SESSIONS_PER_USER) throw new Error('You can connect up to 3 WhatsApp accounts.');
    const key = userId + ':' + sessionId;
    if (active.has(key)) return active.get(key).publicState;

    const dir = sessionDir(userId, sessionId);
    const authDir = join(dir, 'auth');
    const dataDir = join(dir, 'data');
    mkdirSync(authDir, { recursive: true, mode: 0o700 });
    mkdirSync(dataDir, { recursive: true, mode: 0o700 });
    const config = sessionConfig(authDir, dataDir, '', sessionId);
    config.pairingNumber = phoneNumber;
    const settings = createGroupSettings(config);
    const botState = createBotState(config);
    const rateLimiter = createRateLimiter(config);
    const publicState = { id: sessionId, status: 'starting', method, qr: null, pairingCode: null, phone: null, updatedAt: Date.now() };
    const update = (patch) => { Object.assign(publicState, patch, { updatedAt: Date.now() }); };
    const connection = createConnectionManager({
      config, settings, botState, commandRegistry, rateLimiter,
      onQr: async (qr) => {
        const QRCode = (await import('qrcode')).default;
        update({ status: 'waiting_for_scan', qr: await QRCode.toDataURL(qr), pairingCode: null });
      },
      onPairingCode: (code) => update({ status: 'waiting_for_pairing', pairingCode: code, qr: null }),
      onStatus: ({ status, jid, reason }) => {
        if (status === 'connected') {
          const number = String(jid || '').split('@')[0].split(':')[0].replace(/\\D/g, '');
          config.ownerNumber = number;
          config.ownerJid = number ? number + '@s.whatsapp.net' : '';
          update({ status: 'connected', phone: number, qr: null, pairingCode: null });
          const item = registry.users[userId].sessions[sessionId];
          item.phone = number; item.status = 'connected'; item.lastConnectedAt = Date.now(); persist();
        } else update({ status: 'disconnected', reason, qr: null, pairingCode: null });
      }
    });
    const entry = { connection, publicState, config };
    active.set(key, entry);
    user.sessions ||= {};
    user.sessions[sessionId] = { id: sessionId, status: 'starting', method, createdAt: existing?.createdAt || Date.now(), phone: existing?.phone || null };
    persist();
    try { await connection.start(); }
    catch (error) { active.delete(key); update({ status: 'error', error: error.message }); throw error; }
    return publicState;
  }

  async function create(userId, method, phoneNumber = '') {
    const id = randomUUID();
    return startSession(userId, id, method, phoneNumber);
  }
  async function list(userId) {
    const user = registry.users[userId];
    if (!user) return [];
    const items = Object.values(user.sessions || {});
    return items.map((item) => {
      const live = active.get(userId + ':' + item.id)?.publicState;
      return live || { ...item, qr: null, pairingCode: null };
    });
  }
  async function stop(userId, sessionId, remove = false) {
    const user = registry.users[userId];
    if (!user?.sessions?.[sessionId]) throw new Error('Session not found.');
    const key = userId + ':' + sessionId;
    const live = active.get(key);
    if (live) { await live.connection.stop(); active.delete(key); }
    if (remove) {
      delete user.sessions[sessionId];
      const { rmSync } = await import('node:fs');
      rmSync(sessionDir(userId, sessionId), { recursive: true, force: true });
      persist();
      return { removed: true };
    }
    user.sessions[sessionId].status = 'stopped'; persist();
    return { stopped: true };
  }
  async function restoreAll() {
    for (const [userId, user] of Object.entries(registry.users)) {
      for (const item of Object.values(user.sessions || {})) {
        const authDir = join(sessionDir(userId, item.id), 'auth');
        if (existsSync(join(authDir, 'creds.json'))) {
          try { await startSession(userId, item.id, 'restore'); }
          catch (error) { logger.error({ err: error.message, session: item.id }, 'Could not restore user session'); }
        }
      }
    }
  }
  return { create, list, stop, restoreAll };
}

export function getUserRegistry() { return registry; }
export function saveUserRegistry() { persist(); }
