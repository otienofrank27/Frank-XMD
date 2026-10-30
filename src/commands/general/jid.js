import { stripJidDevice } from '../../utils/jid.js';

export default {
  name: 'jid',
  aliases: ['id'],
  category: 'general',
  description: 'Show the current chat or sender JID.',
  usage: '.jid',
  async execute({ sock, ctx }) {
    const lines = [
      `Chat: ${stripJidDevice(ctx.chatJid)}`,
      `Sender: ${stripJidDevice(ctx.senderJid)}`
    ];

    if (ctx.mentions[0]) {
      lines.push(`Mention: ${stripJidDevice(ctx.mentions[0])}`);
    }
    if (ctx.quoted?.participant) {
      lines.push(`Quoted: ${stripJidDevice(ctx.quoted.participant)}`);
    }

    await sock.sendMessage(ctx.chatJid, { text: lines.join('\n') }, { quoted: ctx.msg });
  }
};
