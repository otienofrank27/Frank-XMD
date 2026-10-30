import { downloadMediaUrl } from '../../utils/download.js';
import { firstUrl, isHttpUrl } from '../../utils/media.js';
import { logger } from '../../utils/logger.js';

export default {
  name: 'spotify',
  aliases: ['soundcloud'],
  category: 'downloader',
  description: 'Attempt to download public Spotify or SoundCloud audio via yt-dlp.',
  usage: '.spotify|.soundcloud <url>',
  async execute({ sock, ctx }) {
    const url = firstUrl(ctx.rawArgs) || ctx.args[0];
    if (!isHttpUrl(url)) {
      await sock.sendMessage(ctx.chatJid, { text: 'Usage: .spotify|.soundcloud <url>' }, { quoted: ctx.msg });
      return;
    }
    await sock.sendMessage(ctx.chatJid, { text: 'Fetching audio…' }, { quoted: ctx.msg });
    try {
      const file = await downloadMediaUrl(url, { audioOnly: true });
      await sock.sendMessage(ctx.chatJid, {
        audio: file.buffer,
        mimetype: 'audio/mpeg',
        fileName: 'track.mp3'
      }, { quoted: ctx.msg });
    } catch (error) {
      logger.warn({ err: error.message }, 'spotify/soundcloud failed');
      await sock.sendMessage(ctx.chatJid, {
        text: 'Could not download that track. Spotify often blocks third-party downloaders; SoundCloud public tracks work more reliably when yt-dlp is installed.'
      }, { quoted: ctx.msg });
    }
  }
};
