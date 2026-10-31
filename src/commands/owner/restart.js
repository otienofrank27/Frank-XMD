export default {
  name: 'restart',
  aliases: [],
  category: 'owner',
  description: 'Reconnect this linked WhatsApp session.',
  usage: '.restart',
  ownerOnly: true,
  async execute({ sock, ctx }) {
    await sock.sendMessage(ctx.chatJid, {
      text: 'This command is disabled on the shared FRANK-XMD service. Disconnect and reconnect this session from your dashboard.'
    }, { quoted: ctx.msg });
  }
};
