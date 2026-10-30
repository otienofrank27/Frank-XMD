import { isBotAdmin } from '../../middleware/permissions.js';
import { publicErrorMessage } from '../../middleware/errorHandler.js';

export default {
  name: 'linkgroup',
  aliases: ['grouplink', 'invitelink'],
  category: 'admin',
  description: 'Get the current group invite link.',
  usage: '.linkgroup',
  groupOnly: true,
  adminOnly: true,
  async execute({ sock, ctx, metadata }) {
    if (!isBotAdmin(metadata, sock)) {
      await sock.sendMessage(ctx.chatJid, {
        text: 'The bot must be a group admin to read the invite link.'
      }, { quoted: ctx.msg });
      return;
    }

    try {
      const code = await sock.groupInviteCode(ctx.chatJid);
      await sock.sendMessage(ctx.chatJid, {
        text: `Group invite link:\nhttps://chat.whatsapp.com/${code}`
      }, { quoted: ctx.msg });
    } catch (error) {
      await sock.sendMessage(ctx.chatJid, { text: publicErrorMessage(error) }, { quoted: ctx.msg });
    }
  }
};
