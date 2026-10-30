import { spawn } from 'node:child_process';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { logger } from './logger.js';
import { unwrapMessage } from './messages.js';

const MAX_BYTES = 8 * 1024 * 1024;

export function getQuotedOrCurrent(ctx) {
  if (ctx.quoted?.message) {
    return {
      key: ctx.quoted.key || {
        remoteJid: ctx.chatJid,
        id: ctx.quoted.stanzaId,
        participant: ctx.quoted.participant
      },
      message: ctx.quoted.message
    };
  }
  return ctx.msg;
}

export function findMedia(message) {
  const unwrapped = unwrapMessage(message) || {};
  return {
    image: unwrapped.imageMessage || null,
    video: unwrapped.videoMessage || null,
    audio: unwrapped.audioMessage || null,
    sticker: unwrapped.stickerMessage || null,
    document: unwrapped.documentMessage || null,
    viewOnce: unwrapped.viewOnceMessage || unwrapped.viewOnceMessageV2 || null
  };
}

export async function downloadQuotedMedia(sock, ctx) {
  const source = getQuotedOrCurrent(ctx);
  if (!source?.message) {
    return null;
  }
  const media = findMedia(source.message);
  if (!media.image && !media.video && !media.audio && !media.sticker && !media.document) {
    return null;
  }
  const buffer = await downloadMediaMessage(source, 'buffer', {}, {
    logger,
    reuploadRequest: sock.updateMediaMessage
  });
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
    return null;
  }
  if (buffer.length > MAX_BYTES) {
    const error = new Error('Media exceeds the 8MB safety limit.');
    error.code = 'MEDIA_TOO_LARGE';
    throw error;
  }
  return { buffer, media, source };
}

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', (error) => reject(error));
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(stderr.slice(0, 400) || `${command} exited ${code}`));
      }
    });
  });
}

export async function hasBinary(name) {
  try {
    await run(name, ['-version']);
    return true;
  } catch {
    try {
      await run(name, ['--version']);
      return true;
    } catch {
      return false;
    }
  }
}

export async function convertWithFfmpeg(inputBuffer, args, outputName) {
  const dir = await mkdtemp(join(tmpdir(), 'wa-media-'));
  const inputPath = join(dir, 'input.bin');
  const outputPath = join(dir, outputName);
  await writeFile(inputPath, inputBuffer);
  await run('ffmpeg', ['-y', '-i', inputPath, ...args, outputPath]);
  return readFile(outputPath);
}

export function isHttpUrl(value) {
  try {
    const url = new URL(String(value));
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}

export function firstUrl(text = '') {
  const match = String(text).match(/https?:\/\/[^\s<>"']+/i);
  return match ? match[0] : '';
}

export default {
  getQuotedOrCurrent,
  findMedia,
  downloadQuotedMedia,
  hasBinary,
  convertWithFfmpeg,
  isHttpUrl,
  firstUrl
};
