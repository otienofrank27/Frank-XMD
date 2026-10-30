import { downloadMediaMessage } from '@whiskeysockets/baileys';
import { logger } from '../../utils/logger.js';

const MAX_BYTES = 2 * 1024 * 1024;
const MAX_VIDEO_SECONDS = 8;

export default {
  name: 'sticker',
  aliases: ['s', 'stiker'],
  category: 'media',
  description: 'Convert a supported image or short video into a sticker.',
  usage: '.sticker (reply to image/video or send with caption)',
  async execute({ sock, ctx, config }) {
    const sourceMsg = ctx.quoted
      ? { key: ctx.quoted.key || ctx.key, message: ctx.quoted.message }
      : ctx.msg;

    const mediaMessage = sourceMsg.message || {};
    const image = mediaMessage.imageMessage;
    const video = mediaMessage.videoMessage;

    if (!image && !video) {
      await sock.sendMessage(ctx.chatJid, {
        text: 'Reply to an image or a short video (max 8s), or send one with the .sticker caption.'
      }, { quoted: ctx.msg });
      return;
    }

    if (video?.seconds && video.seconds > MAX_VIDEO_SECONDS) {
      await sock.sendMessage(ctx.chatJid, {
        text: `Video is too long (${video.seconds}s). Maximum is ${MAX_VIDEO_SECONDS} seconds.`
      }, { quoted: ctx.msg });
      return;
    }

    let buffer;
    try {
      buffer = await downloadMediaMessage(sourceMsg, 'buffer', {}, {
        logger,
        reuploadRequest: sock.updateMediaMessage
      });
    } catch (error) {
      logger.warn({ err: error.message }, 'Sticker media download failed');
      await sock.sendMessage(ctx.chatJid, {
        text: 'Could not download that media. It may have expired, or WhatsApp rejected the download.'
      }, { quoted: ctx.msg });
      return;
    }

    if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
      await sock.sendMessage(ctx.chatJid, {
        text: 'Downloaded media was empty.'
      }, { quoted: ctx.msg });
      return;
    }

    if (buffer.length > MAX_BYTES) {
      await sock.sendMessage(ctx.chatJid, {
        text: 'Media is larger than 2MB. Compress it and try again.'
      }, { quoted: ctx.msg });
      return;
    }

    try {
      await sock.sendMessage(ctx.chatJid, {
        sticker: buffer,
        packname: config.stickerPackName || config.botName,
        author: config.stickerPackAuthor || config.ownerName
      }, { quoted: ctx.msg });
    } catch (error) {
      logger.warn({ err: error.message }, 'Sticker send failed');
      await sock.sendMessage(ctx.chatJid, {
        text: 'WhatsApp rejected the sticker. Use a static image (JPG/PNG/WEBP) or a very short video.'
      }, { quoted: ctx.msg });
    }
  }
};
