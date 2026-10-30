import { isBotAdmin } from '../../middleware/permissions.js';
import { publicErrorMessage } from '../../middleware/errorHandler.js';

export default {
  name: 'revoke',
  aliases: ['resetlink'],
  category: 'admin',
  description: 'Revoke the current group invite link.',
  usage: '.revoke',
  groupOnly: true,
  adminOnly: true,
  async execute({ sock, ctx, metadata }) {
    if (!isBotAdmin(metadata, sock)) {
      await sock.sendMessage(ctx.chatJid, {
        text: 'The bot must be a group admin to revoke the invite link.'
      }, { quoted: ctx.msg });
      return;
    }

    try {
      const code = await sock.groupRevokeInvite(ctx.chatJid);
      await sock.sendMessage(ctx.chatJid, {
        text: `Invite link revoked.\nNew link:\nhttps://chat.whatsapp.com/${code}`
      }, { quoted: ctx.msg });
    } catch (error) {
      await sock.sendMessage(ctx.chatJid, { text: publicErrorMessage(error) }, { quoted: ctx.msg });
    }
  }
};
