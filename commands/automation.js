const fs = require('fs');
const path = require('path');
const isOwnerOrSudo = require('../lib/isOwner');
const file = path.join(__dirname, '..', 'data', 'automation.json');
function load() {
  try { return JSON.parse(fs.readFileSync(file, 'utf8')); }
  catch { const d = { replies: [], reactions: [], schedules: [] }; save(d); return d; }
}
function save(data) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, JSON.stringify(data, null, 2)); }
function getText(msg) { return msg.message?.conversation || msg.message?.extendedTextMessage?.text || msg.message?.imageMessage?.caption || msg.message?.videoMessage?.caption || ''; }
async function automationCommand(sock, chatId, msg, rawText) {
  const sender = msg.key.participant || msg.key.remoteJid;
  if (!msg.key.fromMe && !(await isOwnerOrSudo(sender, sock, chatId))) return sock.sendMessage(chatId, { text: 'Owner only.' }, { quoted: msg });
  const parts = rawText.trim().split(/\s+/); const cmd = (parts[0] || '').toLowerCase(); const sub = (parts[1] || '').toLowerCase(); const data = load();
  if (cmd === '.automation' || cmd === '.autolist') return sock.sendMessage(chatId, { text: `🤖 *FrankXMD Automation*\n\n.autoreply add <keyword> | <response>\n.autoreply remove <keyword>\n.autoreply list\n.autoreact add <keyword> <emoji>\n.autoreact remove <keyword>\n.autoreact list\n.schedule <minutes> <message>\n.schedule list\n.schedule cancel <id>\n\nAutomation rules and scheduled messages are saved locally.` }, { quoted: msg });
  if (cmd === '.autoreply') {
    if (sub === 'add') { const m = rawText.match(/^\.autoreply\s+add\s+(.+?)\s*\|\s*(.+)$/i); if (!m) return sock.sendMessage(chatId,{text:'Use: .autoreply add hello | Hello there!'}, {quoted:msg}); data.replies = data.replies.filter(x=>x.keyword!==m[1].trim().toLowerCase()); data.replies.push({keyword:m[1].trim().toLowerCase(), response:m[2].trim(), chatId}); save(data); return sock.sendMessage(chatId,{text:`✅ Auto-reply saved for “${m[1].trim()}”.`},{quoted:msg}); }
    if (sub === 'remove') { const k=parts.slice(2).join(' ').toLowerCase(); data.replies=data.replies.filter(x=>x.keyword!==k); save(data); return sock.sendMessage(chatId,{text:'✅ Auto-reply removed (if it existed).'}, {quoted:msg}); }
    if (sub === 'list') return sock.sendMessage(chatId,{text:'Auto-replies:\n'+(data.replies.map(x=>`• ${x.keyword} → ${x.response}`).join('\n')||'None configured.')},{quoted:msg});
  }
  if (cmd === '.autoreact') {
    if (sub === 'add') { const m=rawText.match(/^\.autoreact\s+add\s+(.+?)\s+(\p{Extended_Pictographic})\s*$/u); if(!m) return sock.sendMessage(chatId,{text:'Use: .autoreact add hello ❤️'}, {quoted:msg}); data.reactions=data.reactions.filter(x=>x.keyword!==m[1].trim().toLowerCase()); data.reactions.push({keyword:m[1].trim().toLowerCase(),emoji:m[2],chatId}); save(data); return sock.sendMessage(chatId,{text:'✅ Auto-reaction saved.'},{quoted:msg}); }
    if (sub === 'remove') { const k=parts.slice(2).join(' ').toLowerCase(); data.reactions=data.reactions.filter(x=>x.keyword!==k); save(data); return sock.sendMessage(chatId,{text:'✅ Auto-reaction removed (if it existed).'}, {quoted:msg}); }
    if (sub === 'list') return sock.sendMessage(chatId,{text:'Auto-reactions:\n'+(data.reactions.map(x=>`• ${x.keyword} → ${x.emoji}`).join('\n')||'None configured.')},{quoted:msg});
  }
  if (cmd === '.schedule') {
    if (sub === 'list') return sock.sendMessage(chatId,{text:'Scheduled messages:\n'+(data.schedules.map(x=>`• #${x.id} — ${new Date(x.at).toLocaleString()} — ${x.text}`).join('\n')||'None pending.')},{quoted:msg});
    if (sub === 'cancel') { data.schedules=data.schedules.filter(x=>x.id!==parts[2]); save(data); return sock.sendMessage(chatId,{text:'✅ Schedule cancelled (if found).'}, {quoted:msg}); }
    const mins=Number(parts[1]); const body=parts.slice(2).join(' '); if(!Number.isFinite(mins)||mins<1||mins>525600||!body) return sock.sendMessage(chatId,{text:'Use: .schedule <minutes> <message> (1 minute to 1 year)'},{quoted:msg});
    const id=Date.now().toString(36); data.schedules.push({id,chatId,at:Date.now()+mins*60000,text:body}); save(data); return sock.sendMessage(chatId,{text:`⏰ Message scheduled. ID: ${id}\nIt will be sent in ${mins} minute(s).`},{quoted:msg});
  }
  return sock.sendMessage(chatId,{text:'Unknown automation option. Use .automation for help.'},{quoted:msg});
}
let schedulerStarted = false;
function startScheduler(sock) {
  if (schedulerStarted) return;
  schedulerStarted = true;
  setInterval(async () => {
    const data = load(); const due = data.schedules.filter(x => x.at <= Date.now());
    for (const item of due) { try { await sock.sendMessage(item.chatId, { text: item.text }); } catch (e) { console.error('[schedule]', e.message); } }
    if (due.length) { const sent = new Set(due.map(x => x.id)); data.schedules = data.schedules.filter(x => !sent.has(x.id)); save(data); }
  }, 15000).unref?.();
}
async function handleAutomationMessage(sock, msg, chatId, userMessage) {
  startScheduler(sock);
  if (!msg || msg.key.fromMe || !userMessage || userMessage.startsWith('.')) return;
  const data=load();
  const reply=data.replies.find(x=>x.chatId===chatId && userMessage.toLowerCase().includes(x.keyword));
  if(reply) { await sock.sendMessage(chatId,{text:reply.response},{quoted:msg}); return; }
  const reaction=data.reactions.find(x=>x.chatId===chatId && userMessage.toLowerCase().includes(x.keyword));
  if(reaction) await sock.sendMessage(chatId,{react:{text:reaction.emoji,key:msg.key}});
}
module.exports={automationCommand,handleAutomationMessage};
