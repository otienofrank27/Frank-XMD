import { createHash, randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync, chmodSync, renameSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { loadConfig } from '../config/config.js';
import { createGroupSettings } from '../database/groupSettings.js';
import { createBotState } from '../database/botState.js';
import { createStatusStore } from '../database/statusStore.js';
import { createRateLimiter } from '../middleware/rateLimiter.js';
import { createCommandRegistry, loadCommands } from '../handlers/commandHandler.js';
import { createConnectionManager } from '../connection/connection.js';
import { logger } from '../utils/logger.js';

const DATA_ROOT = process.env.DATA_DIR || join(process.cwd(), 'data');
const SESSION_ROOT = process.env.SESSIONS_DIR || join(process.cwd(), 'sessions');
const USERS_DIR = join(DATA_ROOT, 'multiuser');
const REGISTRY_FILE = join(USERS_DIR, 'registry.json');
const active = new Map();
let registry = { users: {} };

function readJson(file, fallback) {
  try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return fallback; }
}
function persist() {
  mkdirSync(USERS_DIR, { recursive: true, mode: 0o700 });
  const tmp = REGISTRY_FILE + '.tmp';
  writeFileSync(tmp, JSON.stringify(registry, null, 2), { mode: 0o600 });
  chmodSync(tmp, 0o600);
  renameSync(tmp, REGISTRY_FILE);
}
function sessionDirectory(userId, sessionId) {
  const user = createHash('sha256').update(userId).digest('hex');
  const session = createHash('sha256').update(sessionId).digest('hex');
  return join(SESSION_ROOT, user, session);
}
function makeConfig(authDir, dataDir, label) {
  const base = loadConfig();
  return {
    ...base,
    ownerNumber: '',
    ownerJid: '',
    authDir,
    dataDir,
    logsDir: join(dataDir, 'logs'),
    settingsPath: join(dataDir, 'group-settings.json'),
    botStatePath: join(dataDir, 'bot-state.json'),
    sessionId: '',
    sessionLabel: label,
    ignoreSelf: false,
    processOwnerCommands: true
  };
}

export async function createSessionManager() {
  mkdirSync(USERS_DIR, { recursive: true, mode: 0o700 });
  mkdirSync(SESSION_ROOT, { recursive: true, mode: 0o700 });
  registry = readJson(REGISTRY_FILE, { users: {} });
  if (!registry.users || typeof registry.users !== 'object' || Array.isArray(registry.users)) registry = { users: {} };

  async function start(userId, id, method = 'restore', phone = '') {
    const user = registry.users[userId];
    if (!user) throw new Error('Dashboard account not found.');
    user.sessions ||= {};
    const saved = user.sessions[id];
    if (!saved) throw new Error('Session not found.');
    const key = userId + ':' + id;
    if (active.has(key)) return active.get(key).state;

    const dir = sessionDirectory(userId, id);
    const authDir = join(dir, 'auth');
    const dataDir = join(dir, 'data');
    mkdirSync(authDir, { recursive: true, mode: 0o700 });
    mkdirSync(dataDir, { recursive: true, mode: 0o700 });

    const config = makeConfig(authDir, dataDir, id);
    config.pairingNumber = phone || '';
    const settings = createGroupSettings(config);
    const botState = createBotState(config);
    const rateLimiter = createRateLimiter(config);
    const statusStore = createStatusStore();
    const commandRegistry = createCommandRegistry();
    await loadCommands(commandRegistry, id);

    const state = {
      id, status: 'starting', method, qr: null, pairingCode: null,
      phone: saved.phone || null, updatedAt: Date.now()
    };
    const update = (patch) => Object.assign(state, patch, { updatedAt: Date.now() });

    const connection = createConnectionManager({
      config, settings, botState, commandRegistry, rateLimiter, statusStore,
      onQr: async (qr) => {
        const qrcode = (await import('qrcode')).default;
        update({ status: 'waiting_for_scan', qr: await qrcode.toDataURL(qr), pairingCode: null });
      },
      onPairingCode: (code) => update({ status: 'waiting_for_pairing', pairingCode: code, qr: null }),
      onStatus: ({ status, jid, lid, reason }) => {
        if (status === 'connected') {
          const identity = jid || lid || '';
          const isPhoneJid = String(identity).endsWith('@s.whatsapp.net');
          const phoneNumber = isPhoneJid ? String(identity).split('@')[0].split(':')[0].replace(/\D/g, '') : '';
          config.ownerNumber = phoneNumber;
          config.ownerJid = identity;
          update({ status: 'connected', phone: phoneNumber || null, qr: null, pairingCode: null });
          saved.phone = phoneNumber || saved.phone || null;
          saved.status = 'connected';
          saved.lastConnectedAt = Date.now();
          persist();
        } else {
          update({ status: 'disconnected', reason, qr: null, pairingCode: null });
          if (saved.status !== 'stopped') saved.status = 'disconnected';
          persist();
        }
      }
    });

    active.set(key, { connection, state });
    saved.status = 'starting';
    saved.method = method === 'restore' ? (saved.method || 'qr') : method;
    saved.updatedAt = Date.now();
    persist();
    try {
      await connection.start();
    } catch (error) {
      active.delete(key);
      update({ status: 'error' });
      saved.status = 'error';
      persist();
      throw error;
    }
    return state;
  }

  async function create(userId, method, phone = '') {
    if (!registry.users[userId]) throw new Error('Dashboard account not found.');
    const sessions = registry.users[userId].sessions ||= {};
    if (Object.keys(sessions).length >= 3) throw new Error('Maximum 3 linked accounts per dashboard user.');
    const id = randomUUID();
    sessions[id] = { id, status: 'starting', method, createdAt: Date.now(), phone: null };
    persist();
    return start(userId, id, method, phone);
  }

  async function list(userId) {
    const user = registry.users[userId];
    return Object.values(user?.sessions || {}).map((item) => {
      const live = active.get(userId + ':' + item.id)?.state;
      return live || { ...item, qr: null, pairingCode: null };
    });
  }

  async function stop(userId, id, remove = false) {
    const user = registry.users[userId];
    if (!user?.sessions?.[id]) throw new Error('Session not found.');
    const key = userId + ':' + id;
    const live = active.get(key);
    if (live) {
      await live.connection.stop();
      active.delete(key);
    }
    if (remove) {
      delete user.sessions[id];
      rmSync(sessionDirectory(userId, id), { recursive: true, force: true });
      persist();
      return { removed: true };
    }
    user.sessions[id].status = 'stopped';
    user.sessions[id].stoppedAt = Date.now();
    persist();
    return { stopped: true };
  }

  async function resume(userId, id) {
    const user = registry.users[userId];
    if (!user?.sessions?.[id]) throw new Error('Session not found.');
    return start(userId, id, user.sessions[id].method || 'qr');
  }

  async function restart(userId, id) {
    await stop(userId, id, false);
    return resume(userId, id);
  }

  async function restoreAll() {
    for (const [userId, user] of Object.entries(registry.users)) {
      for (const item of Object.values(user.sessions || {})) {
        if (item.status === 'stopped') continue;
        const authDir = join(sessionDirectory(userId, item.id), 'auth');
        if (existsSync(join(authDir, 'creds.json'))) {
          try { await start(userId, item.id, 'restore'); }
          catch (error) { logger.error({ err: error.message, session: item.id }, 'Could not restore WhatsApp session'); }
        }
      }
    }
  }

  async function shutdownAll() {
    await Promise.all([...active.values()].map(({ connection }) => connection.stop().catch(() => {})));
    active.clear();
  }

  return { create, list, stop, resume, restart, restoreAll, shutdownAll };
}

export function getUserRegistry() { return registry; }
export function saveUserRegistry() { persist(); }
