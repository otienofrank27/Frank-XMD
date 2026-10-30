import { isGroupJid } from '../../utils/jid.js';
import { logger } from '../../utils/logger.js';

export default {
  name: 'broadcast',
  aliases: ['bc'],
  category: 'owner',
  description: 'Send a message to all groups the bot is in.',
  usage: '.broadcast <message>',
  ownerOnly: true,
  async execute({ sock, ctx, config }) {
    const text = ctx.rawArgs.trim();
    if (!text) {
      await sock.sendMessage(ctx.chatJid, { text: 'Usage: .broadcast <message>' }, { quoted: ctx.msg });
      return;
    }
    if (text.length > 1000) {
      await sock.sendMessage(ctx.chatJid, { text: 'Broadcast text is too long (max 1000).' }, { quoted: ctx.msg });
      return;
    }

    let groups = {};
    try {
      groups = await sock.groupFetchAllParticipating();
    } catch (error) {
      await sock.sendMessage(ctx.chatJid, { text: 'Could not load participating groups.' }, { quoted: ctx.msg });
      return;
    }

    const ids = Object.keys(groups).filter(isGroupJid).slice(0, 30);
    let sent = 0;
    let failed = 0;
    for (const jid of ids) {
      try {
        await sock.sendMessage(jid, { text: `Broadcast from ${config.botName}\n\n${text}` });
        sent += 1;
        await new Promise((resolve) => setTimeout(resolve, 1200));
      } catch (error) {
        failed += 1;
        logger.warn({ err: error.message, jid }, 'Broadcast failed for group');
      }
    }

    await sock.sendMessage(ctx.chatJid, {
      text: `Broadcast finished.\nSent: ${sent}\nFailed: ${failed}\nCapped at 30 groups.`
    }, { quoted: ctx.msg });
  }
};
