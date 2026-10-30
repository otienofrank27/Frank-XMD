import { isBotAdmin } from '../../middleware/permissions.js';
import { publicErrorMessage } from '../../middleware/errorHandler.js';

export default {
  name: 'opengroup',
  aliases: ['open'],
  category: 'admin',
  description: 'Allow all members to send messages.',
  usage: '.opengroup',
  groupOnly: true,
  adminOnly: true,
  async execute({ sock, ctx, metadata }) {
    if (!isBotAdmin(metadata, sock)) {
      await sock.sendMessage(ctx.chatJid, {
        text: 'The bot must be a group admin to open the group.'
      }, { quoted: ctx.msg });
      return;
    }

    try {
      await sock.groupSettingUpdate(ctx.chatJid, 'not_announcement');
      await sock.sendMessage(ctx.chatJid, { text: 'Group opened. All members can send messages.' }, { quoted: ctx.msg });
    } catch (error) {
      await sock.sendMessage(ctx.chatJid, { text: publicErrorMessage(error) }, { quoted: ctx.msg });
    }
  }
};
