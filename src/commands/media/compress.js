import { convertWithFfmpeg, downloadQuotedMedia, hasBinary } from '../../utils/media.js';
import { logger } from '../../utils/logger.js';

export default {
  name: 'compress',
  aliases: ['tiny'],
  category: 'media',
  description: 'Compress a replied image or video.',
  usage: '.compress (reply to image/video)',
  async execute({ sock, ctx }) {
    try {
      if (!(await hasBinary('ffmpeg'))) {
        await sock.sendMessage(ctx.chatJid, { text: 'ffmpeg is not installed on this host.' }, { quoted: ctx.msg });
        return;
      }
      const downloaded = await downloadQuotedMedia(sock, ctx);
      if (!downloaded) {
        await sock.sendMessage(ctx.chatJid, { text: 'Reply to an image or video.' }, { quoted: ctx.msg });
        return;
      }
      if (downloaded.media.image) {
        const buffer = await convertWithFfmpeg(downloaded.buffer, ['-vf', 'scale=720:-2', '-q:v', '8'], 'out.jpg');
        await sock.sendMessage(ctx.chatJid, { image: buffer, caption: 'Compressed image' }, { quoted: ctx.msg });
        return;
      }
      if (downloaded.media.video) {
        const buffer = await convertWithFfmpeg(downloaded.buffer, ['-vf', 'scale=480:-2', '-b:v', '400k', '-b:a', '64k'], 'out.mp4');
        await sock.sendMessage(ctx.chatJid, { video: buffer, caption: 'Compressed video' }, { quoted: ctx.msg });
        return;
      }
      await sock.sendMessage(ctx.chatJid, { text: 'Only images and videos can be compressed.' }, { quoted: ctx.msg });
    } catch (error) {
      logger.warn({ err: error.message }, 'compress failed');
      await sock.sendMessage(ctx.chatJid, { text: 'Compression failed.' }, { quoted: ctx.msg });
    }
  }
};
