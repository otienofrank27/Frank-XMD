import { convertWithFfmpeg, downloadQuotedMedia, hasBinary } from '../../utils/media.js';
import { logger } from '../../utils/logger.js';

export default {
  name: 'tomp3',
  aliases: ['audio'],
  category: 'media',
  description: 'Convert a video or audio message to mp3.',
  usage: '.tomp3 (reply to video/audio)',
  async execute({ sock, ctx }) {
    try {
      if (!(await hasBinary('ffmpeg'))) {
        await sock.sendMessage(ctx.chatJid, { text: 'ffmpeg is not installed on this host.' }, { quoted: ctx.msg });
        return;
      }
      const downloaded = await downloadQuotedMedia(sock, ctx);
      if (!downloaded?.media.video && !downloaded?.media.audio) {
        await sock.sendMessage(ctx.chatJid, { text: 'Reply to a video or audio message.' }, { quoted: ctx.msg });
        return;
      }
      const buffer = await convertWithFfmpeg(downloaded.buffer, ['-vn', '-ac', '2', '-b:a', '128k'], 'out.mp3');
      await sock.sendMessage(ctx.chatJid, {
        audio: buffer,
        mimetype: 'audio/mpeg',
        fileName: 'audio.mp3'
      }, { quoted: ctx.msg });
    } catch (error) {
      logger.warn({ err: error.message }, 'tomp3 failed');
      await sock.sendMessage(ctx.chatJid, { text: 'Conversion failed. Use a shorter clip.' }, { quoted: ctx.msg });
    }
  }
};
