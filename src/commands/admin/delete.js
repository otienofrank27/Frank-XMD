import { isBotAdmin } from '../../middleware/permissions.js';
import { publicErrorMessage } from '../../middleware/errorHandler.js';

export default {
  name: 'delete',
  aliases: ['del', 'd'],
  category: 'admin',
  description: 'Delete a quoted message when permitted.',
  usage: '.delete (reply to a message)',
  groupOnly: true,
  adminOnly: true,
  async execute({ sock, ctx, metadata }) {
    if (!ctx.quoted?.stanzaId) {
      await sock.sendMessage(ctx.chatJid, {
        text: 'Reply to the message you want to delete.'
      }, { quoted: ctx.msg });
      return;
    }

    if (!isBotAdmin(metadata, sock) && !ctx.quoted.key?.fromMe) {
      await sock.sendMessage(ctx.chatJid, {
        text: 'The bot must be a group admin to delete other members\' messages.'
      }, { quoted: ctx.msg });
      return;
    }

    const key = {
      remoteJid: ctx.chatJid,
      fromMe: false,
      id: ctx.quoted.stanzaId,
      participant: ctx.quoted.participant || undefined
    };

    try {
      await sock.sendMessage(ctx.chatJid, { delete: key });
    } catch (error) {
      await sock.sendMessage(ctx.chatJid, { text: publicErrorMessage(error) }, { quoted: ctx.msg });
    }
  }
};
