import { fetchJson } from '../../utils/download.js';
import { logger } from '../../utils/logger.js';

export default {
  name: 'wiki',
  aliases: ['wikipedia'],
  category: 'downloader',
  description: 'Look up a Wikipedia summary.',
  usage: '.wiki <topic>',
  async execute({ sock, ctx }) {
    const query = ctx.rawArgs.trim();
    if (!query) {
      await sock.sendMessage(ctx.chatJid, { text: 'Usage: .wiki <topic>' }, { quoted: ctx.msg });
      return;
    }
    try {
      const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
      const data = await fetchJson(url);
      const extract = String(data.extract || 'No summary found.').slice(0, 900);
      await sock.sendMessage(ctx.chatJid, {
        text: `*${data.title || query}*\n${extract}\n${data.content_urls?.desktop?.page || ''}`
      }, { quoted: ctx.msg });
    } catch (error) {
      logger.warn({ err: error.message }, 'wiki failed');
      await sock.sendMessage(ctx.chatJid, { text: 'No Wikipedia page found for that topic.' }, { quoted: ctx.msg });
    }
  }
};
