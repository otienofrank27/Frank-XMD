export default {
  name: 'restart',
  aliases: [],
  category: 'owner',
  description: 'Exit the process so a supervisor can restart the bot.',
  usage: '.restart',
  ownerOnly: true,
  async execute({ sock, ctx }) {
    await sock.sendMessage(ctx.chatJid, {
      text: 'Restarting. If no process manager is running, start the bot again with npm start.'
    }, { quoted: ctx.msg });
    setTimeout(() => process.exit(0), 500);
  }
};
