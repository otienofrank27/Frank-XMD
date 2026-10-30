import { spawn } from 'node:child_process';
import { mkdtemp, readdir, readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { isHttpUrl } from './media.js';

function runCapture(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
    });
    child.on('error', reject);
    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout.trim());
      } else {
        reject(new Error(stderr.slice(-500) || `${command} failed`));
      }
    });
  });
}

export async function hasYtDlp() {
  try {
    await runCapture('yt-dlp', ['--version']);
    return true;
  } catch {
    return false;
  }
}

export async function downloadMediaUrl(url, { audioOnly = false } = {}) {
  if (!isHttpUrl(url)) {
    throw new Error('Provide a valid http(s) URL.');
  }
  if (!(await hasYtDlp())) {
    const error = new Error('yt-dlp is not installed on this host. Install yt-dlp to enable media downloads.');
    error.code = 'NO_YTDLP';
    throw error;
  }

  const dir = await mkdtemp(join(tmpdir(), 'wa-dl-'));
  const output = join(dir, 'media.%(ext)s');
  const args = [
    '--no-playlist',
    '--max-filesize', '12M',
    '-o', output
  ];
  if (audioOnly) {
    args.push('-x', '--audio-format', 'mp3', '--audio-quality', '5');
  } else {
    args.push('-f', 'mp4/best[ext=mp4]/best[filesize<12M]');
  }
  args.push(url);
  await runCapture('yt-dlp', args);

  const files = await readdir(dir);
  const file = files.find((name) => name.startsWith('media.'));
  if (!file) {
    throw new Error('Download completed but no media file was produced.');
  }
  const full = join(dir, file);
  const info = await stat(full);
  if (info.size > 12 * 1024 * 1024) {
    throw new Error('Downloaded file is larger than 12MB.');
  }
  return {
    buffer: await readFile(full),
    filename: file,
    dir
  };
}

export async function fetchJson(url, { timeoutMs = 12000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'user-agent': 'FrankBot/1.0' }
    });
    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }
    return response.json();
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchText(url, { timeoutMs = 12000 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'user-agent': 'FrankBot/1.0' }
    });
    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }
    return response.text();
  } finally {
    clearTimeout(timer);
  }
}

export default {
  hasYtDlp,
  downloadMediaUrl,
  fetchJson,
  fetchText
};
