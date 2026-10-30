import { formatDuration } from '../../utils/messages.js';

export default {
  name: 'runtime',
  aliases: ['uptime'],
  category: 'general',
  description: 'Show bot uptime.',
  usage: '.runtime',
  async execute({ sock, ctx, config }) {
    await sock.sendMessage(ctx.chatJid, {
      text: `Runtime: ${formatDuration(Date.now() - config.startedAt)}`
    }, { quoted: ctx.msg });
  }
};
