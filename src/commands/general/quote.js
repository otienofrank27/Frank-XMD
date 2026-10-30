export default {
  name: 'quote',
  aliases: ['quotes', 'motivate'],
  category: 'general',
  description: 'Return a configurable motivational quote.',
  usage: '.quote',
  async execute({ sock, ctx, config }) {
    await sock.sendMessage(ctx.chatJid, {
      text: config.quoteText
    }, { quoted: ctx.msg });
  }
};
