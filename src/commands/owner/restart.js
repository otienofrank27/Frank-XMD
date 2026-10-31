export default {
  name: 'restart',
  aliases: [],
  category: 'owner',
  description: 'Restart only this linked WhatsApp session.',
  usage: '.restart',
  ownerOnly: true,
  async execute({ sock, ctx, sessionControl }) {
    await sock.sendMessage(ctx.chatJid, {
      text: 'Restarting your FRANK-XMD session. Other users will remain connected.'
    }, { quoted: ctx.msg });
    if (sessionControl?.restart) {
      await sessionControl.restart();
    }
  }
};
