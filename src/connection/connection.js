import { Boom } from '@hapi/boom';
import makeWASocket, {
  Browsers,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  useMultiFileAuthState
} from '@whiskeysockets/baileys';
import { logger } from '../utils/logger.js';
import { registerMessageHandler } from '../handlers/messageHandler.js';
import { registerGroupEvents } from '../events/groupEvents.js';


const RECONNECT_BASE_MS = 2000;
const RECONNECT_MAX_MS = 30000;
const RECONNECT_MAX_ATTEMPTS = 12;

const NO_RECONNECT = new Set([
  DisconnectReason.loggedOut,
  DisconnectReason.badSession,
  DisconnectReason.multideviceMismatch,
  DisconnectReason.forbidden,
  DisconnectReason.connectionReplaced
]);

function statusFromError(error) {
  if (error instanceof Boom) {
    return error.output?.statusCode;
  }
  return error?.output?.statusCode || error?.status || error?.statusCode;
}

export function createConnectionManager({ config, settings, botState, commandRegistry, rateLimiter, statusStore, sessionControl, onQr = () => {}, onStatus = () => {}, onPairingCode = () => {} }) {
  let sock = null;
  let connecting = false;
  let reconnectAttempts = 0;
  let stopped = false;
  let generation = 0;
  let reconnectTimer = null;
  let pairingTimer = null;

  function scheduleReconnect(currentGeneration) {
    if (stopped || currentGeneration !== generation) {
      return;
    }
    if (reconnectTimer) {
      return;
    }
    if (reconnectAttempts >= RECONNECT_MAX_ATTEMPTS) {
      logger.error({ reconnectAttempts }, 'Max reconnect attempts reached');
      stopped = true;
      return;
    }

    reconnectAttempts += 1;
    const wait = Math.min(RECONNECT_BASE_MS * 2 ** (reconnectAttempts - 1), RECONNECT_MAX_MS);
    logger.info({ wait, reconnectAttempts }, 'Reconnecting');
    reconnectTimer = setTimeout(() => {
      reconnectTimer = null;
      start().catch((error) => {
        logger.error({ err: error.message }, 'Reconnect failed');
      });
    }, wait);
  }

  async function start() {
    if (stopped) {
      return null;
    }
    if (connecting) {
      logger.warn('Connection attempt already in progress');
      return sock;
    }

    connecting = true;
    const currentGeneration = ++generation;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }

    try {
      // Each managed session has its own private authDir. Never import or copy credentials between users.
      const { state, saveCreds } = await useMultiFileAuthState(config.authDir);
      const { version, isLatest } = await fetchLatestBaileysVersion();
      logger.info({ version: version.join('.'), isLatest }, 'Using WhatsApp Web version');

      const baileysLogger = logger.child({ module: 'baileys' });
      baileysLogger.level = config.logLevel === 'debug' ? 'debug' : 'silent';

      const socket = makeWASocket({
        version,
        logger: baileysLogger,
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, baileysLogger)
        },
        browser: Browsers.ubuntu(config.botName),
        markOnlineOnConnect: config.markOnlineOnConnect,
        syncFullHistory: false,
        generateHighQualityLinkPreview: false,
        getMessage: async () => undefined
      });

      sock = socket;

      socket.ev.on('creds.update', saveCreds);
      socket.ev.on('connection.update', async (update) => {
        if (currentGeneration !== generation) {
          return;
        }

        const { connection, lastDisconnect, qr } = update;

        if (qr) {
          onQr(qr);
          logger.info({ session: config.sessionLabel || 'private' }, 'A WhatsApp linking QR is ready');
        }

        if (connection === 'open') {
          reconnectAttempts = 0;
          logger.info({ bot: config.botName, jid: socket.user?.id, session: config.sessionLabel || 'private' }, 'WhatsApp connection opened');
          onStatus({ status: 'connected', jid: socket.user?.id || null, lid: socket.user?.lid || null });
        }

        if (connection === 'close') {
          const status = statusFromError(lastDisconnect?.error);
          const reasonName = Object.entries(DisconnectReason).find(([, value]) => value === status)?.[0] || 'unknown';
          logger.warn({ status, reasonName, session: config.sessionLabel || 'private' }, 'Connection closed');
          onStatus({ status: 'disconnected', reason: reasonName });

          if (stopped || currentGeneration !== generation) {
            return;
          }

          if (status === DisconnectReason.loggedOut || status === DisconnectReason.badSession) {
            logger.error('Session is invalid or logged out. Delete auth/ and pair again.');
            stopped = true;
            return;
          }

          if (NO_RECONNECT.has(status)) {
            logger.error({ status, reasonName }, 'Not reconnecting due to terminal disconnect reason');
            stopped = true;
            return;
          }

          scheduleReconnect(currentGeneration);
        }
      });

      if (config.pairingNumber && !state.creds.registered) {
        pairingTimer = setTimeout(() => {
          pairingTimer = null;
          if (stopped || currentGeneration !== generation) return;
          socket.requestPairingCode(config.pairingNumber)
            .then(onPairingCode)
            .catch((error) => logger.warn({ err: error.message }, 'Phone pairing code request failed'));
        }, 1200);
      }

      registerMessageHandler(socket, { config, settings, botState, commandRegistry, rateLimiter, statusStore, sessionControl });
      registerGroupEvents(socket, { config, settings });

      return socket;
    } catch (error) {
      logger.error({ err: error.message }, 'Failed to start WhatsApp connection');
      throw error;
    } finally {
      connecting = false;
    }
  }

  async function stop() {
    stopped = true;
    generation += 1;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (pairingTimer) {
      clearTimeout(pairingTimer);
      pairingTimer = null;
    }
    try {
      sock?.end?.(undefined);
    } catch (error) {
      logger.warn({ err: error.message }, 'Error while stopping socket');
    }
    sock = null;
  }

  return { start, stop, getSocket: () => sock };
}

export default createConnectionManager;
