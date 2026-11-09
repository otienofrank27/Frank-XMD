
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

function parseCurrencyInput(value) {
  const match = String(value || '').trim().match(/^([0-9]+(?:\.[0-9]+)?)\s+([A-Za-z]{3})\s+(?:to\s+)?([A-Za-z]{3})$/i);
  return match ? { amount: match[1], from: match[2].toUpperCase(), to: match[3].toUpperCase() } : null;
}

function isValidIPv4(value) {
  const parts = String(value || '').trim().split('.');
  return parts.length === 4 && parts.every(part => /^\d{1,3}$/.test(part) && Number(part) >= 0 && Number(part) <= 255);
}

function parseUnitInput(value) {
  const match = String(value || '').trim().match(/^(-?\d+(?:\.\d+)?)\s*(km|mi|m|ft|cm|kg|lb|c|f)\s+(?:to\s+)?(km|mi|m|ft|cm|kg|lb|c|f)$/i);
  return match ? { value: Number(match[1]), from: match[2].toLowerCase(), to: match[3].toLowerCase() } : null;
}

async function extraCommand(sock, chatId, message, command, args, isGroup) {
  const quoted = message.message?.extendedTextMessage?.contextInfo;
  const mentions = quoted?.mentionedJid || [];
  const target = mentions[0] || quoted?.participant || message.key.participant || message.key.remoteJid;
  const reply = (text) => sock.sendMessage(chatId, { text }, { quoted: message });
  switch (command) {
    case 'calc': case 'calculate':
      try { return reply(` *Result:* ${calculate(args)}`); }
      catch (e) { return reply(` ${e.message}\nExample: .calc (25 + 5) * 2`); }
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
      return reply(` *${meta.subject || 'Group'}*\nID: ${chatId}\nMembers: ${meta.participants.length}\nAdmins: ${admins}\nCreated: ${meta.creation ? new Date(meta.creation * 1000).toLocaleString() : 'Unavailable'}\nDescription: ${meta.desc || 'None'}`);
    }
    case 'grouplink': case 'link': {
      if (!isGroup) return reply('This command only works in groups.');
      const code = await sock.groupInviteCode(chatId);
      return reply(` Group invite link:\nhttps://chat.whatsapp.com/${code}`);
    }
    case 'getpp': case 'profilepic': {
      try { const url = await sock.profilePictureUrl(target, 'image'); return sock.sendMessage(chatId, { image: { url }, caption: `Profile picture for @${target.split('@')[0]}`, mentions: [target] }, { quoted: message }); }
      catch { return reply('No profile picture is available or the account privacy settings prevent access.'); }
    }
    case 'runtime': case 'uptime': {
      const sec = Math.floor(process.uptime());
      const d = Math.floor(sec / 86400), h = Math.floor(sec % 86400 / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
      return reply(` FrankXMD uptime: ${d}d ${h}h ${m}m ${s}s`);
    }
    case 'pollhelp': return reply('Create a WhatsApp poll with: .poll Question | Option 1 | Option 2');
    case 'support':
      return reply('FrankXMD Support\nRepository: https://github.com/otienofrank27/Frank-XMD\nWhatsApp Channel: https://whatsapp.com/channel/0029Vb95NoALNSZvyIJm8U3D\nOwner: Marvin Frank');
    case 'feedback':
    case 'report':
      return reply('To send feedback or report a bug, include the command used, what you expected, and the error received.\nGitHub: https://github.com/otienofrank27/Frank-XMD/issues\nOwner WhatsApp: +254748642275');

    case 'info': case 'botinfo': case 'about': case 'version': case 'script': case 'repo': case 'status': {
      const fs = require('fs');
      const settings = require('../settings');
      const mem = process.memoryUsage();
      let mode = 'public';
      try { mode = JSON.parse(fs.readFileSync(require('path').join(__dirname, '..', 'data', 'messageCount.json'), 'utf8')).isPublic === false ? 'private' : 'public'; } catch {}
      return reply(` *${settings.botName || 'FrankXMD'}*
Version: ${settings.version || 'Unknown'}
Owner: ${settings.botOwner || 'Bot owner'}
Mode: ${mode}
Uptime: ${Math.floor(process.uptime())} seconds
Memory: ${(mem.rss / 1024 / 1024).toFixed(1)} MB
Repository: https://github.com/otienofrank27/Frank-XMD`);
    }
    case 'speed': {
      const start = Date.now();
      await reply(' Checking response speed...');
      return reply(` Response: ${Date.now() - start} ms`);
    }
    case 'time': case 'date': {
      const now = new Date();
      return reply(` ${now.toLocaleString('en-KE', { timeZone: 'Africa/Nairobi', dateStyle: 'full', timeStyle: 'long' })}`);
    }
    case 'define': case 'dictionary': {
      if (!args) return reply('Usage: .define <word>');
      try {
        const axios = require('axios');
        const { data } = await axios.get(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(args)}`, { timeout: 12000 });
        const entry = data[0], meanings = (entry.meanings || []).slice(0, 3);
        const lines = meanings.map(m => `• *${m.partOfSpeech}*: ${m.definitions?.[0]?.definition || 'No definition'}`);
        return reply(` *${entry.word}*\n${lines.join('\n') || 'No definition found.'}`);
      } catch { return reply('No definition found for that word.'); }
    }
    case 'wikipedia': {
      if (!args) return reply('Usage: .wikipedia <topic>');
      try {
        const axios = require('axios');
        const { data } = await axios.get(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(args.replace(/ /g, '_'))}`, { timeout: 12000 });
        return reply(` *${data.title}*\n\n${data.extract || 'No summary available.'}\n\n${data.content_urls?.desktop?.page || ''}`);
      } catch { return reply('Could not find that Wikipedia article.'); }
    }
    case 'google': case 'search': {
      if (!args) return reply('Usage: .google <search terms>');
      return reply(` Search Google: https://www.google.com/search?q=${encodeURIComponent(args)}`);
    }
    case 'currency': {
      const m = parseCurrencyInput(args);
      if (!m) return reply('Usage: .currency <amount> <FROM> to <TO>\nExample: .currency 100 USD to KES');
      try {
        const axios = require('axios');
        const { data } = await axios.get(`https://api.frankfurter.app/latest?amount=${m.amount}&from=${m.from}&to=${m.to}`, { timeout: 12000 });
        const value = data.rates?.[m.to];
        if (value == null) throw new Error('Unsupported currency');
        return reply(` ${m.amount} ${m.from} = ${value} ${m.to}\nRate date: ${data.date}`);
      } catch { return reply('Currency conversion failed. Check the currency codes and try again.'); }
    }
    case 'country': {
      if (!args) return reply('Usage: .country <country name>');
      try {
        const axios = require('axios');
        const { data } = await axios.get(`https://restcountries.com/v3.1/name/${encodeURIComponent(args)}`, { timeout: 12000 });
        const c = data[0];
        return reply(` *${c.name?.common}*\nCapital: ${c.capital?.join(', ') || 'N/A'}\nRegion: ${c.region || 'N/A'}\nPopulation: ${Number(c.population || 0).toLocaleString()}\nCurrencies: ${Object.values(c.currencies || {}).map(x => x.name).join(', ') || 'N/A'}`);
      } catch { return reply('Country not found.'); }
    }
    case 'ip': {
      if (!isValidIPv4(args)) return reply('Usage: .ip <IPv4 address>');
      try {
        const axios = require('axios');
        const { data } = await axios.get(`https://ipapi.co/${args}/json/`, { timeout: 12000 });
        if (data.error) throw new Error('Lookup failed');
        return reply(` IP: ${data.ip}\nCity: ${data.city || 'N/A'}\nRegion: ${data.region || 'N/A'}\nCountry: ${data.country_name || 'N/A'}\nISP: ${data.org || 'N/A'}`);
      } catch { return reply('IP lookup failed.'); }
    }
    case 'unit': {
      const m = parseUnitInput(args);
      if (!m) return reply('Usage: .unit <value> <unit> to <unit>\nExample: .unit 10 km to mi');
      const n = m.value, from = m.from, to = m.to;
      const groups = { length: { km:1000, mi:1609.344, m:1, ft:0.3048, cm:0.01 }, mass: { kg:1, lb:0.45359237 } };
      let result;
      if (groups.length[from] && groups.length[to]) result = n * groups.length[from] / groups.length[to];
      else if (groups.mass[from] && groups.mass[to]) result = n * groups.mass[from] / groups.mass[to];
      else if (from === 'c' && to === 'f') result = n * 9 / 5 + 32;
      else if (from === 'f' && to === 'c') result = (n - 32) * 5 / 9;
      else return reply('Those units cannot be converted by this command.');
      return reply(` ${n} ${from} = ${Number(result.toFixed(6))} ${to}`);
    }

    case 'membercount': case 'groupcount': {
      if (!isGroup) return reply('This command only works in groups.');
      const meta = await sock.groupMetadata(chatId);
      const members = meta.participants || [];
      const admins = members.filter(p => p.admin === 'admin' || p.admin === 'superadmin').length;
      return reply(` *Group member count*\nGroup: ${meta.subject || 'Group'}\nTotal members: ${members.length}\nAdmins: ${admins}\nRegular members: ${members.length - admins}`);
    }
    case 'members': case 'groupmembers': {
      if (!isGroup) return reply('This command only works in groups.');
      const meta = await sock.groupMetadata(chatId);
      const members = meta.participants || [];
      if (!members.length) return reply('No group members were found.');
      const lines = members.slice(0, 80).map((p, i) => {
        const jid = p.id || p.phoneNumber || p.lid || '';
        const role = p.admin === 'superadmin' ? ' (owner)' : p.admin === 'admin' ? ' (admin)' : '';
        return `${i + 1}. @${jid.split('@')[0].split(':')[0]}${role}`;
      }).filter(Boolean);
      const extra = members.length > 80 ? `\n\nShowing 80 of ${members.length} members.` : '';
      return sock.sendMessage(chatId, { text: ` *${meta.subject || 'Group'} — Members*\n\n${lines.join('\n')}${extra}`, mentions: members.slice(0, 80).map(p => p.id || p.phoneNumber).filter(Boolean) }, { quoted: message });
    }

    case 'support': return reply('For support, contact the bot owner or open an issue: https://github.com/otienofrank27/Frank-XMD/issues');
    case 'feedback': case 'report': {
      if (!args) return reply(`Usage: .${command} <message>`);
      const settings = require('../settings');
      const ownerJid = `${String(settings.ownerNumber || '').replace(/\D/g, '')}@s.whatsapp.net`;
      if (!String(settings.ownerNumber || '').replace(/\D/g, '')) return reply('Owner contact is not configured.');
      await sock.sendMessage(ownerJid, { text: ` *FrankXMD ${command.toUpperCase()}*\nFrom: ${message.key.participant || chatId}\nChat: ${chatId}\n\n${args}` });
      return reply(' Your message has been forwarded to the bot owner.');
    }
    default: return false;
  }
}
module.exports = { extraCommand, parseCurrencyInput, isValidIPv4, parseUnitInput };
