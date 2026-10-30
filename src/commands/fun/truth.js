const TRUTHS = [
  'What is a skill you want to learn this year?',
  'What is your most used WhatsApp chat?',
  'What song is stuck in your head right now?',
  'What is a small win from this week?',
  'If you could automate one daily task, what would it be?'
];

export default {
  name: 'truth',
  aliases: [],
  category: 'fun',
  description: 'Get a random truth question.',
  usage: '.truth',
  async execute({ sock, ctx }) {
    const item = TRUTHS[Math.floor(Math.random() * TRUTHS.length)];
    await sock.sendMessage(ctx.chatJid, { text: `Truth\n${item}` }, { quoted: ctx.msg });
  }
};
