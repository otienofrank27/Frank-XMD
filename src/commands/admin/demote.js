import { getParticipant, isBotAdmin, isGroupAdmin, isOwner, resolveTargetJid } from '../../middleware/permissions.js';
import { publicErrorMessage } from '../../middleware/errorHandler.js';
import { stripJidDevice } from '../../utils/jid.js';

export default {
  name: 'demote',
  aliases: ['unadmin'],
  category: 'admin',
  description: 'Demote a group admin to a regular member.',
  usage: '.demote @user',
  groupOnly: true,
  adminOnly: true,
  async execute({ sock, ctx, config, metadata }) {
    if (!isBotAdmin(metadata, sock)) {
      await sock.sendMessage(ctx.chatJid, {
        text: 'The bot must be a group admin to demote participants.'
      }, { quoted: ctx.msg });
      return;
    }

    const target = resolveTargetJid(ctx, ctx.args[0], metadata);
    if (!target) {
      await sock.sendMessage(ctx.chatJid, {
        text: 'Mention a user, reply to their message, or provide a number. Usage: .demote @user'
      }, { quoted: ctx.msg });
      return;
    }

    if (isOwner(target, config)) {
      await sock.sendMessage(ctx.chatJid, { text: 'Cannot demote the bot owner.' }, { quoted: ctx.msg });
      return;
    }

    if (!getParticipant(metadata, target)) {
      await sock.sendMessage(ctx.chatJid, { text: 'That user is not a participant in this group.' }, { quoted: ctx.msg });
      return;
    }

    if (!isGroupAdmin(metadata, target)) {
      await sock.sendMessage(ctx.chatJid, { text: 'That user is not a group admin.' }, { quoted: ctx.msg });
      return;
    }

    try {
      const result = await sock.groupParticipantsUpdate(ctx.chatJid, [target], 'demote');
      const status = result?.[0]?.status;
      if (status && !['200', 200].includes(status)) {
        await sock.sendMessage(ctx.chatJid, {
          text: `WhatsApp rejected the demotion (status ${status}).`
        }, { quoted: ctx.msg });
        return;
      }
      await sock.sendMessage(ctx.chatJid, {
        text: `Demoted @${stripJidDevice(target).split('@')[0]}`,
        mentions: [stripJidDevice(target)]
      }, { quoted: ctx.msg });
    } catch (error) {
      await sock.sendMessage(ctx.chatJid, { text: publicErrorMessage(error) }, { quoted: ctx.msg });
    }
  }
};
