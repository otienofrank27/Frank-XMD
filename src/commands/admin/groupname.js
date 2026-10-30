import { isBotAdmin } from '../../middleware/permissions.js';
import { publicErrorMessage } from '../../middleware/errorHandler.js';

export default {
  name: 'groupname',
  aliases: ['setname', 'subject'],
  category: 'admin',
  description: 'Update the group subject.',
  usage: '.groupname <name>',
  groupOnly: true,
  adminOnly: true,
  async execute({ sock, ctx, metadata, config }) {
    if (!isBotAdmin(metadata, sock)) {
      await sock.sendMessage(ctx.chatJid, {
        text: 'The bot must be a group admin to change the group name.'
      }, { quoted: ctx.msg });
      return;
    }

    const name = ctx.rawArgs.trim();
    if (!name) {
      await sock.sendMessage(ctx.chatJid, { text: 'Usage: .groupname <name>' }, { quoted: ctx.msg });
      return;
    }
    if (name.length > 100) {
      await sock.sendMessage(ctx.chatJid, { text: 'Group name is too long (max 100 characters).' }, { quoted: ctx.msg });
      return;
    }

    try {
      await sock.groupUpdateSubject(ctx.chatJid, name.slice(0, config.maxMessageChars));
      await sock.sendMessage(ctx.chatJid, { text: `Group name updated to: ${name}` }, { quoted: ctx.msg });
    } catch (error) {
      await sock.sendMessage(ctx.chatJid, { text: publicErrorMessage(error) }, { quoted: ctx.msg });
    }
  }
};
