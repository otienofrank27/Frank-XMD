import { downloadQuotedMedia } from '../../utils/media.js';
import { logger } from '../../utils/logger.js';

export default {
  name: 'getvo',
  aliases: ['viewonce'],
  category: 'tools',
  description: 'Extract a quoted view-once image or video.',
  usage: '.getvo (reply to view-once media)',
  async execute({ sock, ctx }) {
    try {
      const downloaded = await downloadQuotedMedia(sock, ctx);
      if (!downloaded) {
        await sock.sendMessage(ctx.chatJid, { text: 'Reply to a view-once image or video.' }, { quoted: ctx.msg });
        return;
      }
      if (downloaded.media.image) {
        await sock.sendMessage(ctx.chatJid, { image: downloaded.buffer, caption: 'View-once image' }, { quoted: ctx.msg });
        return;
      }
      if (downloaded.media.video) {
        await sock.sendMessage(ctx.chatJid, { video: downloaded.buffer, caption: 'View-once video' }, { quoted: ctx.msg });
        return;
      }
      await sock.sendMessage(ctx.chatJid, { text: 'That message has no extractable media.' }, { quoted: ctx.msg });
    } catch (error) {
      logger.warn({ err: error.message }, 'getvo failed');
      await sock.sendMessage(ctx.chatJid, { text: 'Could not extract that view-once message.' }, { quoted: ctx.msg });
    }
  }
};
