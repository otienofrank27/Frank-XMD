import { fetchJson } from '../../utils/download.js';
import { logger } from '../../utils/logger.js';

export default {
  name: 'google',
  aliases: ['g', 'search'],
  category: 'downloader',
  description: 'Search the web via DuckDuckGo instant answers.',
  usage: '.google <query>',
  async execute({ sock, ctx }) {
    const query = ctx.rawArgs.trim();
    if (!query) {
      await sock.sendMessage(ctx.chatJid, { text: 'Usage: .google <query>' }, { quoted: ctx.msg });
      return;
    }
    try {
      const data = await fetchJson(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
      const heading = data.Heading || query;
      const abstract = data.AbstractText || data.RelatedTopics?.[0]?.Text || 'No instant answer found.';
      const source = data.AbstractURL || data.RelatedTopics?.[0]?.FirstURL || '';
      await sock.sendMessage(ctx.chatJid, {
        text: `*${heading}*\n${abstract}${source ? `\n${source}` : ''}`
      }, { quoted: ctx.msg });
    } catch (error) {
      logger.warn({ err: error.message }, 'google search failed');
      await sock.sendMessage(ctx.chatJid, { text: 'Search failed. Try again later.' }, { quoted: ctx.msg });
    }
  }
};
