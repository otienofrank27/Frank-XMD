export default {
  name: 'coinflip',
  aliases: ['flip', 'coin'],
  category: 'fun',
  description: 'Flip a coin.',
  usage: '.coinflip',
  async execute({ sock, ctx }) {
    const side = Math.random() < 0.5 ? 'Heads' : 'Tails';
    await sock.sendMessage(ctx.chatJid, { text: side }, { quoted: ctx.msg });
  }
};
