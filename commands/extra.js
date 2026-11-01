
function calculate(expression) {
  const s = expression.replace(/\s+/g, '');
  if (!s || s.length > 100 || !/^[0-9+\-*/().%^]+$/.test(s)) throw new Error('Use numbers and operators only.');
  let i = 0;
  function expr() { let v = term(); while (s[i] === '+' || s[i] === '-') { const op = s[i++]; const r = term(); v = op === '+' ? v + r : v - r; } return v; }
  function term() { let v = power(); while (['*', '/', '%'].includes(s[i])) { const op = s[i++]; const r = power(); if ((op === '/' || op === '%') && r === 0) throw new Error('Division by zero is not allowed.'); v = op === '*' ? v * r : op === '/' ? v / r : v % r; } return v; }
  function power() { let v = unary(); if (s[i] === '^') { i++; v = Math.pow(v, power()); } return v; }
  function unary() { if (s[i] === '+') { i++; return unary(); } if (s[i] === '-') { i++; return -unary(); } return atom(); }
  function atom() { if (s[i] === '(') { i++; const v = expr(); if (s[i++] !== ')') throw new Error('Check your brackets.'); return v; } const m = s.slice(i).match(/^(?:\d+(?:\.\d*)?|\.\d+)/); if (!m) throw new Error('Invalid calculation.'); i += m[0].length; return Number(m[0]); }
  const result = expr();
  if (i !== s.length || !Number.isFinite(result)) throw new Error('Invalid or out-of-range calculation.');
  return result;
}

async function extraCommand(sock, chatId, message, command, args, isGroup) {
  const quoted = message.message?.extendedTextMessage?.contextInfo;
  const mentions = quoted?.mentionedJid || [];
  const target = mentions[0] || quoted?.participant || message.key.participant || message.key.remoteJid;
  const reply = (text) => sock.sendMessage(chatId, { text }, { quoted: message });
  switch (command) {
    case 'calc': case 'calculate':
      try { return reply(`🧮 *Result:* ${calculate(args)}`); }
      catch (e) { return reply(`❌ ${e.message}\nExample: .calc (25 + 5) * 2`); }
    case 'qr': case 'qrcode': {
      if (!args) return reply('Usage: .qr <text or link>');
      const QRCode = require('qrcode');
      const buffer = await QRCode.toBuffer(args, { type: 'png', width: 640, margin: 2 });
      return sock.sendMessage(chatId, { image: buffer, caption: 'Here is your QR code.' }, { quoted: message });
    }
    case 'b64e': case 'base64encode':
      if (!args) return reply('Usage: .b64e <text>');
      return reply(Buffer.from(args, 'utf8').toString('base64'));
    case 'b64d': case 'base64decode':
      try { if (!args || !/^[A-Za-z0-9+/]*={0,2}$/.test(args)) throw new Error(); return reply(Buffer.from(args, 'base64').toString('utf8')); }
      catch { return reply('Invalid Base64 input.'); }
    case 'reverse': return args ? reply(args.split('').reverse().join('')) : reply('Usage: .reverse <text>');
    case 'upper': return args ? reply(args.toUpperCase()) : reply('Usage: .upper <text>');
    case 'lower': return args ? reply(args.toLowerCase()) : reply('Usage: .lower <text>');
    case 'poll': {
      const parts = args.split('|').map(x => x.trim()).filter(Boolean);
      if (parts.length < 3) return reply('Usage: .poll Question | Option 1 | Option 2 [| Option 3...]');
      if (parts.length > 13) return reply('A poll can have at most 12 options.');
      return sock.sendMessage(chatId, { poll: { name: parts[0], values: parts.slice(1), selectableCount: 1 } }, { quoted: message });
    }
    case 'groupinfo': {
      if (!isGroup) return reply('This command only works in groups.');
      const meta = await sock.groupMetadata(chatId);
      const admins = meta.participants.filter(p => p.admin).length;
      return reply(`👥 *${meta.subject || 'Group'}*\nID: ${chatId}\nMembers: ${meta.participants.length}\nAdmins: ${admins}\nCreated: ${meta.creation ? new Date(meta.creation * 1000).toLocaleString() : 'Unavailable'}\nDescription: ${meta.desc || 'None'}`);
    }
    case 'grouplink': case 'link': {
      if (!isGroup) return reply('This command only works in groups.');
      const code = await sock.groupInviteCode(chatId);
      return reply(`🔗 Group invite link:\nhttps://chat.whatsapp.com/${code}`);
    }
    case 'getpp': case 'profilepic': {
      try { const url = await sock.profilePictureUrl(target, 'image'); return sock.sendMessage(chatId, { image: { url }, caption: `Profile picture for @${target.split('@')[0]}`, mentions: [target] }, { quoted: message }); }
      catch { return reply('No profile picture is available or the account privacy settings prevent access.'); }
    }
    case 'runtime': case 'uptime': {
      const sec = Math.floor(process.uptime());
      const d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
      return reply(`⏱️ FrankXMD uptime: ${d}d ${h}h ${m}m ${s}s`);
    }
    case 'pollhelp': return reply('Create a WhatsApp poll with: .poll Question | Option 1 | Option 2');
    default: return false;
  }
}
module.exports = { extraCommand };
