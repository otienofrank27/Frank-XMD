import { formatDuration } from './messages.js';

export const CATEGORY_META = [
  { id: 'general', title: 'GENERAL', hint: 'status, help, identity' },
  { id: 'admin', title: 'GROUP ADMIN', hint: 'moderation and group controls' },
  { id: 'media', title: 'MEDIA', hint: 'stickers, convert, compress' },
  { id: 'downloader', title: 'DOWNLOADERS', hint: 'youtube, social, search' },
  { id: 'owner', title: 'OWNER', hint: 'bot controls, privacy, broadcast' },
  { id: 'fun', title: 'FUN & GAMES', hint: 'quiz, wordle, truth or dare' },
  { id: 'tools', title: 'TOOLS', hint: 'status, view-once, extras' }
];

function pad(text, width) {
  const value = String(text);
  if (value.length >= width) {
    return value.slice(0, width);
  }
  return value + ' '.repeat(width - value.length);
}

function commandTokens(commands, prefix) {
  return commands.map((cmd) => {
    const aliases = (cmd.aliases || []).slice(0, 2).map((alias) => `${prefix}${alias}`);
    const head = `${prefix}${cmd.name}`;
    return aliases.length ? `${head}  |  ${aliases.join('  |  ')}` : head;
  });
}

function chunk(items, size) {
  const rows = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

export function buildMenu({ config, registry, extra = {} }) {
  const prefix = extra.prefix || config.prefix;
  const commands = registry.list();
  const runtime = formatDuration(Date.now() - config.startedAt);
  const now = extra.nowText || new Date().toLocaleString('en-KE', { timeZone: config.timezone });

  const header = [
    '┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓',
    `┃  ${pad(config.botName.toUpperCase(), 36)}┃`,
    `┃  ${pad('Secure WhatsApp Assistant', 36)}┃`,
    '┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛',
    '',
    `  Owner     ${config.ownerName}`,
    `  Number    +${config.ownerNumber}`,
    `  Region    ${config.ownerCountry || 'KE'}`,
    `  Prefix    ${prefix}`,
    `  Runtime   ${runtime}`,
    `  Time      ${now}`,
    `  Commands  ${commands.length}`,
    extra.banner ? `\n  ${extra.banner}` : '',
    '',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
  ].filter((line, index, arr) => !(line === '' && arr[index - 1] === ''));

  const sections = [];
  for (const category of CATEGORY_META) {
    const list = commands.filter((cmd) => cmd.category === category.id);
    if (!list.length) {
      continue;
    }
    sections.push(`┌─ ${category.title}`);
    sections.push(`│  ${category.hint}`);
    for (const token of commandTokens(list, prefix)) {
      sections.push(`│  ${token}`);
    }
    sections.push('└');
    sections.push('');
  }

  const footer = [
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━',
    `  Help     ${prefix}help <command>`,
    `  Example  ${prefix}ping`,
    '  Admin commands require group admin rights.',
    '  Owner commands are limited to Frank.',
    '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'
  ];

  return [...header, '', ...sections, ...footer].join('\n');
}

export function compactMenu({ config, registry, extra = {} }) {
  const prefix = extra.prefix || config.prefix;
  const commands = registry.list();
  const lines = [
    `*${config.botName}*  |  ${config.ownerName}  |  ${config.ownerCountry || 'KE'}`,
    `Prefix ${prefix}   Runtime ${formatDuration(Date.now() - config.startedAt)}`,
    ''
  ];
  for (const category of CATEGORY_META) {
    const list = commands.filter((cmd) => cmd.category === category.id);
    if (!list.length) continue;
    const names = list.map((cmd) => `${prefix}${cmd.name}`);
    lines.push(`*${category.title}*`);
    for (const row of chunk(names, 4)) {
      lines.push(row.join('   '));
    }
    lines.push('');
  }
  lines.push(`Use ${prefix}help <command> for usage.`);
  return lines.join('\n');
}

export default { buildMenu, compactMenu, CATEGORY_META };
