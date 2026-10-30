const QUESTIONS = [
  { q: 'What is the capital of Kenya?', a: 'nairobi' },
  { q: 'How many bits are in a byte?', a: '8' },
  { q: 'What planet is known as the Red Planet?', a: 'mars' },
  { q: 'What does HTTP stand for? (answer: hypertext transfer protocol)', a: 'hypertext transfer protocol' },
  { q: 'Year Kenya gained independence?', a: '1963' }
];

const pending = new Map();

export default {
  name: 'quiz',
  aliases: ['trivia'],
  category: 'fun',
  description: 'Ask a trivia question. Reply with .quiz <answer>.',
  usage: '.quiz [answer]',
  async execute({ sock, ctx }) {
    const key = `${ctx.chatJid}:${ctx.senderJid}`;
    const current = pending.get(key);

    if (current && ctx.rawArgs) {
      const guess = ctx.rawArgs.trim().toLowerCase();
      const ok = guess === current.a;
      pending.delete(key);
      await sock.sendMessage(ctx.chatJid, {
        text: ok ? 'Correct.' : `Wrong. Answer: ${current.a}`
      }, { quoted: ctx.msg });
      return;
    }

    const item = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];
    pending.set(key, item);
    await sock.sendMessage(ctx.chatJid, {
      text: `Trivia\n${item.q}\nReply with .quiz <answer>`
    }, { quoted: ctx.msg });
  }
};
