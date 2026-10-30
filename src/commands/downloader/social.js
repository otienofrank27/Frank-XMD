import { downloadMediaUrl } from '../../utils/download.js';
import { firstUrl, isHttpUrl } from '../../utils/media.js';
import { logger } from '../../utils/logger.js';

export default {
  name: 'ig',
  aliases: ['instagram', 'tiktok', 'tt', 'fb', 'facebook', 'twitter', 'x'],
  category: 'downloader',
  description: 'Download public Instagram, TikTok, Facebook, or X media. Requires yt-dlp.',
  usage: '.ig|.tiktok|.fb|.twitter <url>',
  async execute({ sock, ctx }) {
    const url = firstUrl(ctx.rawArgs) || ctx.args[0];
    if (!isHttpUrl(url)) {
      await sock.sendMessage(ctx.chatJid, {
        text: 'Send a public post URL.\nUsage: .ig|.tiktok|.fb|.twitter <url>'
      }, { quoted: ctx.msg });
      return;
    }
    await sock.sendMessage(ctx.chatJid, { text: 'Fetching media…' }, { quoted: ctx.msg });
    try {
      const file = await downloadMediaUrl(url, { audioOnly: false });
      const isAudio = file.filename.endsWith('.mp3') || file.filename.endsWith('.m4a');
      if (isAudio) {
        await sock.sendMessage(ctx.chatJid, { audio: file.buffer, mimetype: 'audio/mpeg' }, { quoted: ctx.msg });
        return;
      }
      await sock.sendMessage(ctx.chatJid, { video: file.buffer, caption: 'Downloaded media' }, { quoted: ctx.msg });
    } catch (error) {
      logger.warn({ err: error.message }, 'social download failed');
      await sock.sendMessage(ctx.chatJid, {
        text: error.code === 'NO_YTDLP'
          ? 'yt-dlp is not installed on this host.'
          : 'Could not download that post. It may be private or region-locked.'
      }, { quoted: ctx.msg });
    }
  }
};
