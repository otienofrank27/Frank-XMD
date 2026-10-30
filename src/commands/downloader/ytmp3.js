import { downloadMediaUrl } from '../../utils/download.js';
import { firstUrl, isHttpUrl } from '../../utils/media.js';
import { logger } from '../../utils/logger.js';

export default {
  name: 'ytmp3',
  aliases: ['play', 'getsong', 'playmusic'],
  category: 'downloader',
  description: 'Download audio from a YouTube or media URL. Requires yt-dlp.',
  usage: '.ytmp3 <url>',
  async execute({ sock, ctx }) {
    const url = firstUrl(ctx.rawArgs) || ctx.args[0];
    if (!isHttpUrl(url)) {
      await sock.sendMessage(ctx.chatJid, { text: 'Usage: .ytmp3 <https://...>' }, { quoted: ctx.msg });
      return;
    }
    await sock.sendMessage(ctx.chatJid, { text: 'Downloading audio…' }, { quoted: ctx.msg });
    try {
      const file = await downloadMediaUrl(url, { audioOnly: true });
      await sock.sendMessage(ctx.chatJid, {
        audio: file.buffer,
        mimetype: 'audio/mpeg',
        fileName: 'audio.mp3'
      }, { quoted: ctx.msg });
    } catch (error) {
      logger.warn({ err: error.message }, 'ytmp3 failed');
      await sock.sendMessage(ctx.chatJid, {
        text: error.code === 'NO_YTDLP'
          ? 'yt-dlp is not installed. Install it on the host to enable YouTube downloads.'
          : 'Download failed. The link may be private, geo-blocked, or larger than 12MB.'
      }, { quoted: ctx.msg });
    }
  }
};
