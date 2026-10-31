export default {
  name: 'shutdown',
  aliases: ['stop'],
  category: 'owner',
  description: 'Show how to disconnect this linked WhatsApp session.',
  usage: '.shutdown',
  ownerOnly: true,
  async execute({ sock, ctx }) {
    await sock.sendMessage(ctx.chatJid, { text: 'Use your FRANK-XMD dashboard to disconnect this WhatsApp session. Other users will remain online.' }, { quoted: ctx.msg });
  }
};
