export default {
  name: 'alive',
  aliases: ['online'],
  category: 'general',
  description: 'Confirm the bot is online.',
  usage: '.alive',
  async execute({ sock, ctx, config }) {
    await sock.sendMessage(ctx.chatJid, {
      text: `${config.botName} is online and ready.`
    }, { quoted: ctx.msg });
  }
};
