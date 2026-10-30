import { isBotAdmin, isGroupAdmin, isOwner, resolveTargetJid, getParticipant } from '../../middleware/permissions.js';
import { publicErrorMessage } from '../../middleware/errorHandler.js';
import { stripJidDevice } from '../../utils/jid.js';

const recentKicks = new Map();

export default {
  name: 'kick',
  aliases: ['remove'],
  category: 'admin',
  description: 'Remove a participant from the group.',
  usage: '.kick @user',
  groupOnly: true,
  adminOnly: true,
  async execute({ sock, ctx, config, metadata }) {
    if (!isBotAdmin(metadata, sock)) {
      await sock.sendMessage(ctx.chatJid, {
        text: 'The bot must be a group admin to remove participants.'
      }, { quoted: ctx.msg });
      return;
    }

    const target = resolveTargetJid(ctx, ctx.args[0], metadata);
    if (!target) {
      await sock.sendMessage(ctx.chatJid, {
        text: 'Mention a user, reply to their message, or provide a number. Usage: .kick @user'
      }, { quoted: ctx.msg });
      return;
    }

    if (isOwner(target, config)) {
      await sock.sendMessage(ctx.chatJid, { text: 'Cannot kick the bot owner.' }, { quoted: ctx.msg });
      return;
    }

    const participant = getParticipant(metadata, target);
    if (!participant) {
      await sock.sendMessage(ctx.chatJid, { text: 'That user is not a participant in this group.' }, { quoted: ctx.msg });
      return;
    }

    if (isGroupAdmin(metadata, target) && !isOwner(ctx.senderJid, config)) {
      await sock.sendMessage(ctx.chatJid, { text: 'Cannot kick another admin unless you are the bot owner.' }, { quoted: ctx.msg });
      return;
    }

    const botJid = stripJidDevice(sock.user?.id || '');
    if (stripJidDevice(target) === botJid) {
      await sock.sendMessage(ctx.chatJid, { text: 'The bot cannot kick itself.' }, { quoted: ctx.msg });
      return;
    }

    const dedupeKey = `${ctx.chatJid}:${stripJidDevice(target)}`;
    const last = recentKicks.get(dedupeKey) || 0;
    if (Date.now() - last < 8000) {
      await sock.sendMessage(ctx.chatJid, { text: 'That kick was already attempted recently. Wait a few seconds.' }, { quoted: ctx.msg });
      return;
    }
    recentKicks.set(dedupeKey, Date.now());

    try {
      const result = await sock.groupParticipantsUpdate(ctx.chatJid, [target], 'remove');
      const status = result?.[0]?.status;
      if (status && !['200', 200].includes(status)) {
        await sock.sendMessage(ctx.chatJid, {
          text: `WhatsApp rejected the kick (status ${status}). The user was not removed.`
        }, { quoted: ctx.msg });
        return;
      }
      await sock.sendMessage(ctx.chatJid, {
        text: `Removed @${stripJidDevice(target).split('@')[0]}`,
        mentions: [stripJidDevice(target)]
      }, { quoted: ctx.msg });
    } catch (error) {
      await sock.sendMessage(ctx.chatJid, { text: publicErrorMessage(error) }, { quoted: ctx.msg });
    }
  }
};
