import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { CATEGORY_META } from './menu.js';
import { formatDuration } from './messages.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const FONT_PATH = join(__dirname, '../../assets/DejaVuSans.ttf');

function hexToRgb(hex, fallback = [7, 11, 20]) {
  const value = String(hex || '').replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    return fallback;
  }
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16)
  ];
}

function escapeXml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function chunk(items, size) {
  const rows = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

function techBackgroundSvg(width, height) {
  const hexes = [];
  const hexSize = 54;
  const hexH = hexSize * Math.sqrt(3);
  for (let row = -1; row < height / hexH + 2; row += 1) {
    for (let col = -1; col < width / (hexSize * 1.5) + 2; col += 1) {
      const x = col * hexSize * 1.5;
      const y = row * hexH + (col % 2 ? hexH / 2 : 0);
      hexes.push(`<polygon points="${x},${y - hexSize * 0.58} ${x + hexSize * 0.5},${y - hexSize * 0.29} ${x + hexSize * 0.5},${y + hexSize * 0.29} ${x},${y + hexSize * 0.58} ${x - hexSize * 0.5},${y + hexSize * 0.29} ${x - hexSize * 0.5},${y - hexSize * 0.29}" fill="none" stroke="rgba(0,229,255,0.07)" stroke-width="1"/>`);
    }
  }

  const traces = [
    'M40 220 H280 V410 H520 V180 H860',
    'M120 780 H340 V980 H610 V760 H980',
    'M60 1280 H300 V1460 H720 V1180 H1040',
    'M900 80 V260 H640 V420',
    'M180 560 H460 V690 H820',
    'M40 980 H220 V1120 H480'
  ];

  const nodes = [
    [280, 220], [520, 410], [860, 180], [340, 780], [610, 980], [980, 760],
    [300, 1280], [720, 1460], [900, 80], [640, 260], [180, 560], [460, 690],
    [820, 690], [220, 980], [480, 1120], [140, 340], [980, 1280], [70, 70]
  ];

  const chips = [
    [820, 980, 160, 110],
    [90, 430, 130, 90],
    [700, 1320, 150, 100]
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="techBg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#020814"/>
      <stop offset="45%" stop-color="#071428"/>
      <stop offset="100%" stop-color="#031018"/>
    </linearGradient>
    <radialGradient id="cyanGlow" cx="18%" cy="12%" r="48%">
      <stop offset="0%" stop-color="rgba(0,229,255,0.28)"/>
      <stop offset="100%" stop-color="rgba(0,229,255,0)"/>
    </radialGradient>
    <radialGradient id="goldGlow" cx="86%" cy="88%" r="42%">
      <stop offset="0%" stop-color="rgba(212,175,55,0.22)"/>
      <stop offset="100%" stop-color="rgba(212,175,55,0)"/>
    </radialGradient>
    <linearGradient id="scan" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(0,229,255,0)"/>
      <stop offset="50%" stop-color="rgba(0,229,255,0.08)"/>
      <stop offset="100%" stop-color="rgba(0,229,255,0)"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" fill="url(#techBg)"/>
  <rect width="${width}" height="${height}" fill="url(#cyanGlow)"/>
  <rect width="${width}" height="${height}" fill="url(#goldGlow)"/>
  <g>${hexes.join('')}</g>
  <g stroke="rgba(0,229,255,0.05)" stroke-width="1">
    ${Array.from({ length: Math.ceil(height / 6) }, (_, i) => `<line x1="0" y1="${i * 6}" x2="${width}" y2="${i * 6}"/>`).join('')}
  </g>
  ${traces.map((d) => `<path d="${d}" fill="none" stroke="#00e5ff" stroke-width="2" opacity="0.35"/>`).join('')}
  ${traces.map((d) => `<path d="${d}" fill="none" stroke="#d4af37" stroke-width="1" opacity="0.22"/>`).join('')}
  ${nodes.map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#00e5ff" opacity="0.7"/><circle cx="${x}" cy="${y}" r="11" fill="none" stroke="#d4af37" stroke-width="1" opacity="0.45"/>`).join('')}
  ${chips.map(([x, y, w, h]) => `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="8" fill="rgba(8,18,32,0.55)" stroke="#00e5ff" stroke-width="1.5" opacity="0.55"/>
    ${Array.from({ length: 6 }, (_, i) => `<rect x="${x + 10 + i * 22}" y="${y - 8}" width="8" height="8" fill="#d4af37" opacity="0.45"/>`).join('')}
    ${Array.from({ length: 6 }, (_, i) => `<rect x="${x + 10 + i * 22}" y="${y + h}" width="8" height="8" fill="#00e5ff" opacity="0.35"/>`).join('')}
  `).join('')}
  <rect width="${width}" height="${height}" fill="url(#scan)"/>
  <text x="40" y="${height - 28}" fill="rgba(0,229,255,0.35)" font-size="16" font-family="DejaVu Sans, sans-serif">SYS // SECURE LINK  ·  GRID ONLINE  ·  NODE KE-NBO</text>
</svg>`;
}

function techGraphicSvg() {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="420" height="420" viewBox="0 0 420 420" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="chip" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0b1c33"/>
      <stop offset="100%" stop-color="#051018"/>
    </linearGradient>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7af3ff"/>
      <stop offset="100%" stop-color="#d4af37"/>
    </linearGradient>
  </defs>
  <circle cx="210" cy="210" r="198" fill="#07111e" stroke="url(#ring)" stroke-width="10"/>
  <circle cx="210" cy="210" r="168" fill="none" stroke="rgba(0,229,255,0.28)" stroke-width="2" stroke-dasharray="8 10"/>
  <rect x="118" y="118" width="184" height="184" rx="18" fill="url(#chip)" stroke="#00e5ff" stroke-width="3"/>
  ${Array.from({ length: 7 }, (_, i) => `<rect x="${132 + i * 22}" y="102" width="10" height="16" fill="${i % 2 ? '#d4af37' : '#00e5ff'}"/>`).join('')}
  ${Array.from({ length: 7 }, (_, i) => `<rect x="${132 + i * 22}" y="302" width="10" height="16" fill="${i % 2 ? '#00e5ff' : '#d4af37'}"/>`).join('')}
  ${Array.from({ length: 7 }, (_, i) => `<rect x="102" y="${132 + i * 22}" width="16" height="10" fill="${i % 2 ? '#d4af37' : '#00e5ff'}"/>`).join('')}
  ${Array.from({ length: 7 }, (_, i) => `<rect x="302" y="${132 + i * 22}" width="16" height="10" fill="${i % 2 ? '#00e5ff' : '#d4af37'}"/>`).join('')}
  <rect x="150" y="150" width="120" height="120" rx="10" fill="rgba(0,229,255,0.08)" stroke="#d4af37" stroke-width="2"/>
  <path d="M170 210 H200 V180 H250 V210 H270" fill="none" stroke="#00e5ff" stroke-width="3"/>
  <path d="M170 230 H210 V250 H250" fill="none" stroke="#d4af37" stroke-width="3"/>
  <circle cx="200" cy="180" r="5" fill="#00e5ff"/>
  <circle cx="250" cy="210" r="5" fill="#d4af37"/>
  <circle cx="210" cy="250" r="5" fill="#00e5ff"/>
  <text x="210" y="390" text-anchor="middle" fill="#7af3ff" font-size="22" font-family="DejaVu Sans, sans-serif" letter-spacing="4">CORE NODE</text>
</svg>`;
}

export async function ensureMenuAssets(config) {
  const bgPath = config.menu.backgroundPath;
  const logoPath = config.menu.logoPath;
  const techPath = config.menu.techImagePath;
  const width = 1080;
  const height = 1920;

  await sharp(Buffer.from(techBackgroundSvg(width, height))).png().toFile(bgPath);

  if (!existsSync(logoPath)) {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="420" height="420" viewBox="0 0 420 420" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#7af3ff"/>
      <stop offset="100%" stop-color="#d4af37"/>
    </linearGradient>
  </defs>
  <circle cx="210" cy="210" r="198" fill="#0b1220" stroke="url(#ring)" stroke-width="18"/>
  <circle cx="210" cy="210" r="150" fill="none" stroke="rgba(122,243,255,0.28)" stroke-width="6"/>
  <text x="210" y="255" text-anchor="middle" font-size="168" font-family="DejaVu Sans, sans-serif" font-weight="700" fill="#f3d77a">${escapeXml((config.botName || 'F').charAt(0).toUpperCase())}</text>
</svg>`;
    await sharp(Buffer.from(svg)).png().toFile(logoPath);
  }

  await sharp(Buffer.from(techGraphicSvg())).png().toFile(techPath);
}

function fontFace() {
  if (!existsSync(FONT_PATH)) {
    return '';
  }
  const b64 = readFileSync(FONT_PATH).toString('base64');
  return `@font-face{font-family:'MenuSans';src:url('data:font/ttf;base64,${b64}') format('truetype');}`;
}

export async function renderMenuImage({ config, registry, extra = {} }) {
  await ensureMenuAssets(config);
  const prefix = extra.prefix || config.prefix;
  const commands = registry.list();
  const runtime = formatDuration(Date.now() - config.startedAt);
  const now = extra.nowText || new Date().toLocaleString('en-KE', {
    timeZone: config.timezone,
    hour12: false
  });

  const width = 1080;
  const paddingX = 56;
  let y = 318;
  const blocks = [];

  for (const category of CATEGORY_META) {
    const list = commands.filter((cmd) => cmd.category === category.id);
    if (!list.length) continue;
    blocks.push({ type: 'title', text: category.title, y });
    y += 42;
    const names = list.map((cmd) => `${prefix}${cmd.name}`);
    for (const row of chunk(names, 4)) {
      blocks.push({ type: 'row', text: row.join('    '), y });
      y += 34;
    }
    y += 22;
  }

  const height = Math.max(1920, y + 160);
  const logoHref = existsSync(config.menu.logoPath)
    ? `data:image/png;base64,${readFileSync(config.menu.logoPath).toString('base64')}`
    : '';
  const techHref = existsSync(config.menu.techImagePath)
    ? `data:image/png;base64,${readFileSync(config.menu.techImagePath).toString('base64')}`
    : '';

  const overlay = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <style>
    ${fontFace()}
    .title { font-family: MenuSans, DejaVu Sans, sans-serif; fill: #f7e7b0; font-size: 52px; font-weight: 700; }
    .tag { font-family: MenuSans, DejaVu Sans, sans-serif; fill: #7af3ff; font-size: 20px; }
    .meta { font-family: MenuSans, DejaVu Sans, sans-serif; fill: #e8e2d2; font-size: 20px; }
    .cat { font-family: MenuSans, DejaVu Sans, sans-serif; fill: #d4af37; font-size: 22px; letter-spacing: 2px; }
    .cmd { font-family: MenuSans, DejaVu Sans, sans-serif; fill: #f4f1ea; font-size: 21px; }
    .foot { font-family: MenuSans, DejaVu Sans, sans-serif; fill: #9adff0; font-size: 17px; }
  </style>
  <rect x="36" y="36" width="${width - 72}" height="${height - 72}" rx="36" fill="rgba(4,10,20,0.28)" stroke="#00e5ff" stroke-width="2"/>
  <rect x="40" y="40" width="${width - 80}" height="${height - 80}" rx="32" fill="none" stroke="#d4af37" stroke-width="1" opacity="0.7"/>
  <rect x="36" y="36" width="${width - 72}" height="8" rx="4" fill="#00e5ff"/>
  ${logoHref ? `<image href="${logoHref}" x="64" y="62" width="112" height="112"/>` : ''}
  ${techHref ? `<image href="${techHref}" x="868" y="54" width="148" height="148"/>` : ''}
  <text class="title" x="198" y="118">${escapeXml(config.botName)}</text>
  <text class="tag" x="198" y="152">${escapeXml(config.menu.tagline)}</text>
  <text class="meta" x="64" y="214">Owner  ${escapeXml(config.ownerName)}   +${escapeXml(config.ownerNumber)}   ${escapeXml(config.ownerCountry || 'KE')}</text>
  <text class="meta" x="64" y="246">Prefix  ${escapeXml(prefix)}    Runtime  ${escapeXml(runtime)}    ${escapeXml(String(commands.length))} commands</text>
  ${extra.banner ? `<text class="tag" x="64" y="278">${escapeXml(extra.banner)}</text>` : ''}
  ${blocks.map((block) => block.type === 'title'
    ? `<text class="cat" x="${paddingX}" y="${block.y}">${escapeXml(block.text)}</text>`
    : `<text class="cmd" x="${paddingX}" y="${block.y}">${escapeXml(block.text)}</text>`).join('\n  ')}
  <text class="foot" x="64" y="${height - 70}">${escapeXml(now)}   Use ${prefix}help command for usage</text>
</svg>`;

  const background = existsSync(config.menu.backgroundPath)
    ? sharp(config.menu.backgroundPath).resize(width, height, { fit: 'cover' })
    : sharp({
      create: {
        width,
        height,
        channels: 3,
        background: hexToRgb(config.menu.background)
      }
    });

  return background
    .composite([{ input: Buffer.from(overlay), top: 0, left: 0 }])
    .jpeg({ quality: 90 })
    .toBuffer();
}

export async function sendMenu(sock, jid, { config, registry, extra = {}, quoted }) {
  const caption = [
    `*${config.botName}*`,
    `${config.menu.tagline}`,
    `Owner: ${config.ownerName}  |  +${config.ownerNumber}  |  ${config.ownerCountry || 'KE'}`,
    extra.banner || '',
    `Prefix: ${extra.prefix || config.prefix}   Help: ${(extra.prefix || config.prefix)}help <command>`
  ].filter(Boolean).join('\n');

  try {
    const image = await renderMenuImage({ config, registry, extra });
    await sock.sendMessage(jid, { image, caption }, quoted ? { quoted } : undefined);
    return true;
  } catch {
    const { buildMenu } = await import('./menu.js');
    await sock.sendMessage(jid, { text: buildMenu({ config, registry, extra }) }, quoted ? { quoted } : undefined);
    return false;
  }
}

export default {
  ensureMenuAssets,
  renderMenuImage,
  sendMenu
};
