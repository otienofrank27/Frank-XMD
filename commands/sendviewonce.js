const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
async function toBuffer(stream) { const parts=[]; for await (const p of stream) parts.push(p); return Buffer.concat(parts); }
async function sendViewOnceCommand(sock, chatId, message) {
  const ctx = message.message?.extendedTextMessage?.contextInfo || message.message?.imageMessage?.contextInfo || message.message?.videoMessage?.contextInfo;
  const q = ctx?.quotedMessage;
  if (!q) return sock.sendMessage(chatId,{text:'Reply to a normal image or video with .sendvo to send it as view-once.'},{quoted:message});
  const content = q.ephemeralMessage?.message || q;
  const media = content.imageMessage ? ['image',content.imageMessage] : content.videoMessage ? ['video',content.videoMessage] : null;
  if (!media) return sock.sendMessage(chatId,{text:'Only regular images and videos are supported.'},{quoted:message});
  try {
    const buffer = await toBuffer(await downloadContentFromMessage(media[1],media[0]));
    const payload = media[0] === 'image' ? {image:buffer,caption:media[1].caption || '',viewOnce:true} : {video:buffer,caption:media[1].caption || '',viewOnce:true};
    await sock.sendMessage(chatId,payload,{quoted:message});
  } catch(e) { console.error('[SENDVO]',e); await sock.sendMessage(chatId,{text:'Unable to send that media as view-once.'},{quoted:message}); }
}
module.exports = sendViewOnceCommand;
