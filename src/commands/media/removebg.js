import { downloadQuotedMedia } from '../../utils/media.js';
import { logger } from '../../utils/logger.js';

export default {
  name: 'removebg',
  aliases: ['nobg'],
  category: 'media',
  description: 'Remove image background using REMOVEBG_API_KEY.',
  usage: '.removebg (reply to an image)',
  async execute({ sock, ctx, config }) {
    if (!config.removeBgApiKey) {
      await sock.sendMessage(ctx.chatJid, {
        text: 'Set removeBgApiKey in the settings file to enable background removal.'
      }, { quoted: ctx.msg });
      return;
    }

    try {
      const downloaded = await downloadQuotedMedia(sock, ctx);
      if (!downloaded?.media.image) {
        await sock.sendMessage(ctx.chatJid, { text: 'Reply to an image.' }, { quoted: ctx.msg });
        return;
      }

      const form = new FormData();
      form.append('size', 'auto');
      form.append('image_file', new Blob([downloaded.buffer]), 'image.png');

      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: { 'X-Api-Key': config.removeBgApiKey },
        body: form
      });

      if (!response.ok) {
        await sock.sendMessage(ctx.chatJid, {
          text: `remove.bg rejected the request (${response.status}). Check the API key and quota.`
        }, { quoted: ctx.msg });
        return;
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      await sock.sendMessage(ctx.chatJid, { image: buffer, caption: 'Background removed' }, { quoted: ctx.msg });
    } catch (error) {
      logger.warn({ err: error.message }, 'removebg failed');
      await sock.sendMessage(ctx.chatJid, { text: 'Background removal failed.' }, { quoted: ctx.msg });
    }
  }
};
