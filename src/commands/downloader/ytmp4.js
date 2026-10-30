import { downloadMediaUrl } from '../../utils/download.js';
import { firstUrl, isHttpUrl } from '../../utils/media.js';
import { logger } from '../../utils/logger.js';

export default {
  name: 'ytmp4',
  aliases: ['video'],
  category: 'downloader',
  description: 'Download video from a YouTube or media URL. Requires yt-dlp.',
  usage: '.ytmp4 <url>',
  async execute({ sock, ctx }) {
    const url = firstUrl(ctx.rawArgs) || ctx.args[0];
    if (!isHttpUrl(url)) {
      await sock.sendMessage(ctx.chatJid, { text: 'Usage: .ytmp4 <https://...>' }, { quoted: ctx.msg });
      return;
    }
    await sock.sendMessage(ctx.chatJid, { text: 'Downloading video…' }, { quoted: ctx.msg });
    try {
      const file = await downloadMediaUrl(url, { audioOnly: false });
      await sock.sendMessage(ctx.chatJid, {
        video: file.buffer,
        caption: 'Downloaded video',
        mimetype: 'video/mp4'
      }, { quoted: ctx.msg });
    } catch (error) {
      logger.warn({ err: error.message }, 'ytmp4 failed');
      await sock.sendMessage(ctx.chatJid, {
        text: error.code === 'NO_YTDLP'
          ? 'yt-dlp is not installed. Install it on the host to enable video downloads.'
          : 'Download failed. Try a shorter public video under 12MB.'
      }, { quoted: ctx.msg });
    }
  }
};
