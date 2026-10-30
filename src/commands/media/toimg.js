import { downloadQuotedMedia, hasBinary, convertWithFfmpeg } from '../../utils/media.js';
import { logger } from '../../utils/logger.js';

export default {
  name: 'toimg',
  aliases: ['toimage'],
  category: 'media',
  description: 'Convert a sticker to an image.',
  usage: '.toimg (reply to a sticker)',
  async execute({ sock, ctx }) {
    try {
      const downloaded = await downloadQuotedMedia(sock, ctx);
      if (!downloaded?.media.sticker && !downloaded?.media.image) {
        await sock.sendMessage(ctx.chatJid, { text: 'Reply to a sticker.' }, { quoted: ctx.msg });
        return;
      }
      let buffer = downloaded.buffer;
      if (await hasBinary('ffmpeg')) {
        buffer = await convertWithFfmpeg(downloaded.buffer, ['-vf', 'scale=512:512:force_original_aspect_ratio=decrease'], 'out.png');
      }
      await sock.sendMessage(ctx.chatJid, { image: buffer, caption: 'Converted image' }, { quoted: ctx.msg });
    } catch (error) {
      logger.warn({ err: error.message }, 'toimg failed');
      await sock.sendMessage(ctx.chatJid, { text: 'Could not convert that sticker. ffmpeg may be required.' }, { quoted: ctx.msg });
    }
  }
};
