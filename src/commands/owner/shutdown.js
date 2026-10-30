export default {
  name: 'shutdown',
  aliases: ['stop'],
  category: 'owner',
  description: 'Stop the bot process.',
  usage: '.shutdown',
  ownerOnly: true,
  async execute({ sock, ctx }) {
    await sock.sendMessage(ctx.chatJid, { text: 'Shutting down.' }, { quoted: ctx.msg });
    setTimeout(() => process.exit(0), 500);
  }
};
