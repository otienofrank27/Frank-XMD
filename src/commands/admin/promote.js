import { getParticipant, isBotAdmin, isGroupAdmin, resolveTargetJid } from '../../middleware/permissions.js';
import { publicErrorMessage } from '../../middleware/errorHandler.js';
import { stripJidDevice } from '../../utils/jid.js';

export default {
  name: 'promote',
  aliases: ['admin'],
  category: 'admin',
  description: 'Promote a participant to group admin.',
  usage: '.promote @user',
  groupOnly: true,
  adminOnly: true,
  async execute({ sock, ctx, metadata }) {
    if (!isBotAdmin(metadata, sock)) {
      await sock.sendMessage(ctx.chatJid, {
        text: 'The bot must be a group admin to promote participants.'
      }, { quoted: ctx.msg });
      return;
    }

    const target = resolveTargetJid(ctx, ctx.args[0], metadata);
    if (!target) {
      await sock.sendMessage(ctx.chatJid, {
        text: 'Mention a user, reply to their message, or provide a number. Usage: .promote @user'
      }, { quoted: ctx.msg });
      return;
    }

    if (!getParticipant(metadata, target)) {
      await sock.sendMessage(ctx.chatJid, { text: 'That user is not a participant in this group.' }, { quoted: ctx.msg });
      return;
    }

    if (isGroupAdmin(metadata, target)) {
      await sock.sendMessage(ctx.chatJid, { text: 'That user is already a group admin.' }, { quoted: ctx.msg });
      return;
    }

    try {
      const result = await sock.groupParticipantsUpdate(ctx.chatJid, [target], 'promote');
      const status = result?.[0]?.status;
      if (status && !['200', 200].includes(status)) {
        await sock.sendMessage(ctx.chatJid, {
          text: `WhatsApp rejected the promotion (status ${status}).`
        }, { quoted: ctx.msg });
        return;
      }
      await sock.sendMessage(ctx.chatJid, {
        text: `Promoted @${stripJidDevice(target).split('@')[0]}`,
        mentions: [stripJidDevice(target)]
      }, { quoted: ctx.msg });
    } catch (error) {
      await sock.sendMessage(ctx.chatJid, { text: publicErrorMessage(error) }, { quoted: ctx.msg });
    }
  }
};
