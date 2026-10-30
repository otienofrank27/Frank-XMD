export default {
  name: 'ping',
  aliases: ['p', 'speed'],
  category: 'general',
  description: 'Show response time and bot status.',
  usage: '.ping',
  async execute({ sock, ctx }) {
    const started = Date.now();
    const sent = await sock.sendMessage(ctx.chatJid, { text: 'Pinging…' }, { quoted: ctx.msg });
    const latency = Date.now() - started;
    const memory = Math.round(process.memoryUsage().rss / 1024 / 1024);

    await sock.sendMessage(ctx.chatJid, {
      text: `Pong\nLatency: ${latency}ms\nMemory: ${memory}MB\nStatus: online`,
      edit: sent.key
    }).catch(async () => {
      await sock.sendMessage(ctx.chatJid, {
        text: `Pong\nLatency: ${latency}ms\nMemory: ${memory}MB\nStatus: online`
      }, { quoted: ctx.msg });
    });
  }
};
