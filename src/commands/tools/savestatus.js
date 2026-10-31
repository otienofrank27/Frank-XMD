import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { logger } from '../../utils/logger.js';

export default {
  name: 'savestatus',
  aliases: ['downloadstatus'],
  category: 'tools',
  description: 'Save the latest viewed status media. Enable .autoviewstatus first.',
  usage: '.savestatus',
  async execute({ sock, ctx, statusStore }) {
    const status = statusStore?.latestStatus?.();
    if (!status?.message) {
      await sock.sendMessage(ctx.chatJid, {
        text: 'No recent status cached. Enable .autoviewstatus and wait for a status update.'
      }, { quoted: ctx.msg });
      return;
    }
    try {
      const buffer = await downloadMediaMessage({ key: status.key, message: status.message }, 'buffer', {}, {
        logger,
        reuploadRequest: sock.updateMediaMessage
      });
      const msg = status.message;
      if (msg.imageMessage) {
        await sock.sendMessage(ctx.chatJid, { image: buffer, caption: 'Saved status' }, { quoted: ctx.msg });
        return;
      }
      if (msg.videoMessage) {
        await sock.sendMessage(ctx.chatJid, { video: buffer, caption: 'Saved status' }, { quoted: ctx.msg });
        return;
      }
      await sock.sendMessage(ctx.chatJid, { text: 'Latest status had no downloadable media.' }, { quoted: ctx.msg });
    } catch (error) {
      logger.warn({ err: error.message }, 'savestatus failed');
      await sock.sendMessage(ctx.chatJid, { text: 'Could not download that status.' }, { quoted: ctx.msg });
    }
  }
};
