import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { logger } from './logger.js';

export function encodeSession(creds) {
  return Buffer.from(JSON.stringify(creds)).toString('base64url');
}

export function decodeSession(sessionId) {
  const raw = String(sessionId || '').trim();
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(raw, 'base64url').toString('utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function restoreSession(config) {
  const sessionId = String(config.sessionId || '').trim();
  if (!sessionId) {
    return false;
  }
  const creds = decodeSession(sessionId);
  if (!creds) {
    logger.warn('Invalid sessionId in settings; QR login may be required');
    return false;
  }
  writeFileSync(join(config.authDir, 'creds.json'), JSON.stringify(creds, null, 2), { mode: 0o600 });
  logger.info('Restored WhatsApp session from settings sessionId');
  return true;
}

export function captureSessionId(config) {
  const credsPath = join(config.authDir, 'creds.json');
  if (!existsSync(credsPath)) {
    return '';
  }
  try {
    const creds = JSON.parse(readFileSync(credsPath, 'utf8'));
    if (!creds || typeof creds !== 'object') {
      return '';
    }
    return encodeSession(creds);
  } catch (error) {
    logger.warn({ err: error.message }, 'Failed to capture session ID');
    return '';
  }
}

export async function sendSessionIdToOwner(sock, config, sessionId) {
  const body = [
    `*${config.botName}* login`,
    '',
    'Login successful. Bot is online.',
    '',
    'Paste this session ID into the settings file as sessionId when deploying:',
    '',
    sessionId,
    '',
    `Owner number: ${config.ownerNumber}`
  ].join('\n');

  if (body.length <= 3500) {
    await sock.sendMessage(config.ownerJid, { text: body });
    return;
  }

  await sock.sendMessage(config.ownerJid, {
    document: Buffer.from(sessionId, 'utf8'),
    fileName: 'session-id.txt',
    mimetype: 'text/plain',
    caption: `Login successful. Paste this session ID into the settings file as sessionId when deploying. Owner: ${config.ownerNumber}`
  });
}
