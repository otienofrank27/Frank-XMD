import { isBotAdmin } from '../../middleware/permissions.js';
import { publicErrorMessage } from '../../middleware/errorHandler.js';

export default {
  name: 'groupdesc',
  aliases: ['setdesc', 'description'],
  category: 'admin',
  description: 'Update the group description.',
  usage: '.groupdesc <description>',
  groupOnly: true,
  adminOnly: true,
  async execute({ sock, ctx, metadata }) {
    if (!isBotAdmin(metadata, sock)) {
      await sock.sendMessage(ctx.chatJid, {
        text: 'The bot must be a group admin to change the group description.'
      }, { quoted: ctx.msg });
      return;
    }

    const desc = ctx.rawArgs.trim();
    if (!desc) {
      await sock.sendMessage(ctx.chatJid, { text: 'Usage: .groupdesc <description>' }, { quoted: ctx.msg });
      return;
    }
    if (desc.length > 2048) {
      await sock.sendMessage(ctx.chatJid, { text: 'Description is too long (max 2048 characters).' }, { quoted: ctx.msg });
      return;
    }

    try {
      await sock.groupUpdateDescription(ctx.chatJid, desc);
      await sock.sendMessage(ctx.chatJid, { text: 'Group description updated.' }, { quoted: ctx.msg });
    } catch (error) {
      await sock.sendMessage(ctx.chatJid, { text: publicErrorMessage(error) }, { quoted: ctx.msg });
    }
  }
};
