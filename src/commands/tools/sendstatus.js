import { downloadQuotedMedia } from '../../utils/media.js';
import { logger } from '../../utils/logger.js';

export default {
  name: 'sendstatus',
  aliases: [],
  category: 'tools',
  description: 'Post a quoted image/video as a status. Owner only.',
  usage: '.sendstatus (reply to image/video)',
  ownerOnly: true,
  async execute({ sock, ctx, config }) {
    try {
      const downloaded = await downloadQuotedMedia(sock, ctx);
      if (!downloaded?.media.image && !downloaded?.media.video) {
        await sock.sendMessage(ctx.chatJid, { text: 'Reply to an image or video.' }, { quoted: ctx.msg });
        return;
      }
      const content = downloaded.media.image
        ? { image: downloaded.buffer, caption: ctx.rawArgs || '' }
        : { video: downloaded.buffer, caption: ctx.rawArgs || '' };
      await sock.sendMessage('status@broadcast', content, {
        statusJidList: [config.ownerJid],
        broadcast: true
      });
      await sock.sendMessage(ctx.chatJid, { text: 'Status posted to your account.' }, { quoted: ctx.msg });
    } catch (error) {
      logger.warn({ err: error.message }, 'sendstatus failed');
      await sock.sendMessage(ctx.chatJid, { text: 'WhatsApp rejected the status post.' }, { quoted: ctx.msg });
    }
  }
};
