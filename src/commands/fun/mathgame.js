const pending = new Map();

export default {
  name: 'mathgame',
  aliases: ['math'],
  category: 'fun',
  description: 'Solve a quick arithmetic challenge.',
  usage: '.mathgame [answer]',
  async execute({ sock, ctx }) {
    const key = `${ctx.chatJid}:${ctx.senderJid}`;
    const current = pending.get(key);
    if (current && ctx.args[0]) {
      const guess = Number.parseInt(ctx.args[0], 10);
      pending.delete(key);
      await sock.sendMessage(ctx.chatJid, {
        text: guess === current ? 'Correct.' : `Wrong. Answer: ${current}`
      }, { quoted: ctx.msg });
      return;
    }
    const a = 2 + Math.floor(Math.random() * 20);
    const b = 2 + Math.floor(Math.random() * 12);
    const ops = [
      { s: `${a} + ${b}`, v: a + b },
      { s: `${a} - ${b}`, v: a - b },
      { s: `${a} x ${b}`, v: a * b }
    ];
    const item = ops[Math.floor(Math.random() * ops.length)];
    pending.set(key, item.v);
    await sock.sendMessage(ctx.chatJid, {
      text: `Solve: ${item.s}\nReply with .mathgame <number>`
    }, { quoted: ctx.msg });
  }
};
