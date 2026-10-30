import { isBotAdmin } from '../../middleware/permissions.js';
import { publicErrorMessage } from '../../middleware/errorHandler.js';

export default {
  name: 'closegroup',
  aliases: ['close'],
  category: 'admin',
  description: 'Restrict group messaging to admins only.',
  usage: '.closegroup',
  groupOnly: true,
  adminOnly: true,
  async execute({ sock, ctx, metadata }) {
    if (!isBotAdmin(metadata, sock)) {
      await sock.sendMessage(ctx.chatJid, {
        text: 'The bot must be a group admin to close the group.'
      }, { quoted: ctx.msg });
      return;
    }

    try {
      await sock.groupSettingUpdate(ctx.chatJid, 'announcement');
      await sock.sendMessage(ctx.chatJid, { text: 'Group closed. Only admins can send messages.' }, { quoted: ctx.msg });
    } catch (error) {
      await sock.sendMessage(ctx.chatJid, { text: publicErrorMessage(error) }, { quoted: ctx.msg });
    }
  }
};
