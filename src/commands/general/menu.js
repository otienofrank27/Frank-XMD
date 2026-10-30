import { sendMenu } from '../../utils/menuImage.js';

export default {
  name: 'menu',
  aliases: ['commands', 'list'],
  category: 'general',
  description: 'Display the professional image menu.',
  usage: '.menu',
  async execute({ sock, ctx, config, registry, botState }) {
    await sendMenu(sock, ctx.chatJid, {
      config,
      registry,
      extra: { prefix: botState?.get?.().prefix || config.prefix },
      quoted: ctx.msg
    });
  }
};
