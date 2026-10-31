export default {
  name: 'shutdown',
  aliases: ['stop'],
  category: 'owner',
  description: 'Stop only this linked WhatsApp session.',
  usage: '.shutdown',
  ownerOnly: true,
  async execute({ sock, ctx, sessionControl }) {
    await sock.sendMessage(ctx.chatJid, {
      text: 'Stopping your FRANK-XMD session. You can resume it from your dashboard; other users will remain connected.'
    }, { quoted: ctx.msg });
    if (sessionControl?.stop) {
      await sessionControl.stop();
    }
  }
};
