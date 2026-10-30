const DARES = [
  'Send a voice note saying the alphabet backwards as far as you can.',
  'Change your group nickname for 10 minutes.',
  'Compliment the next 3 messages in this chat.',
  'Type with your elbows for one message.',
  'Share a fun fact about Kenya.',
  'Send a sticker that describes your mood.'
];

export default {
  name: 'dare',
  aliases: [],
  category: 'fun',
  description: 'Get a random dare.',
  usage: '.dare',
  async execute({ sock, ctx }) {
    const item = DARES[Math.floor(Math.random() * DARES.length)];
    await sock.sendMessage(ctx.chatJid, { text: `Dare\n${item}` }, { quoted: ctx.msg });
  }
};
