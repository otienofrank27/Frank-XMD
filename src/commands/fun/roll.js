export default {
  name: 'roll',
  aliases: ['dice'],
  category: 'fun',
  description: 'Roll a dice. Optional: .roll 20',
  usage: '.roll [sides]',
  async execute({ sock, ctx }) {
    const sides = Math.min(1000, Math.max(2, Number.parseInt(ctx.args[0] || '6', 10) || 6));
    const value = 1 + Math.floor(Math.random() * sides);
    await sock.sendMessage(ctx.chatJid, { text: `Rolled d${sides}: ${value}` }, { quoted: ctx.msg });
  }
};
