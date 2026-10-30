import { convertWithFfmpeg, downloadQuotedMedia, hasBinary } from '../../utils/media.js';
import { logger } from '../../utils/logger.js';

export default {
  name: 'tovn',
  aliases: ['ptt'],
  category: 'media',
  description: 'Convert audio or video into a voice note.',
  usage: '.tovn (reply to audio/video)',
  async execute({ sock, ctx }) {
    try {
      if (!(await hasBinary('ffmpeg'))) {
        await sock.sendMessage(ctx.chatJid, { text: 'ffmpeg is not installed on this host.' }, { quoted: ctx.msg });
        return;
      }
      const downloaded = await downloadQuotedMedia(sock, ctx);
      if (!downloaded?.media.video && !downloaded?.media.audio) {
        await sock.sendMessage(ctx.chatJid, { text: 'Reply to an audio or video message.' }, { quoted: ctx.msg });
        return;
      }
      const buffer = await convertWithFfmpeg(
        downloaded.buffer,
        ['-vn', '-ac', '1', '-c:a', 'libopus', '-b:a', '48k'],
        'out.ogg'
      );
      await sock.sendMessage(ctx.chatJid, {
        audio: buffer,
        mimetype: 'audio/ogg; codecs=opus',
        ptt: true
      }, { quoted: ctx.msg });
    } catch (error) {
      logger.warn({ err: error.message }, 'tovn failed');
      await sock.sendMessage(ctx.chatJid, { text: 'Could not create a voice note from that media.' }, { quoted: ctx.msg });
    }
  }
};
