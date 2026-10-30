import { getParticipant, isGroupAdmin, isOwner, resolveTargetJid } from '../../middleware/permissions.js';
import { publicErrorMessage } from '../../middleware/errorHandler.js';
import { stripJidDevice } from '../../utils/jid.js';

export default {
  name: 'warn',
  aliases: ['warning'],
  category: 'admin',
  description: 'Issue warnings and track configurable warning counts.',
  usage: '.warn @user',
  groupOnly: true,
  adminOnly: true,
  async execute({ sock, ctx, config, settings, metadata }) {
    const target = resolveTargetJid(ctx, ctx.args[0], metadata);
    if (!target) {
      await sock.sendMessage(ctx.chatJid, {
        text: 'Mention a user, reply to their message, or provide a number. Usage: .warn @user'
      }, { quoted: ctx.msg });
      return;
    }

    if (isOwner(target, config)) {
      await sock.sendMessage(ctx.chatJid, { text: 'Cannot warn the bot owner.' }, { quoted: ctx.msg });
      return;
    }

    if (!getParticipant(metadata, target)) {
      await sock.sendMessage(ctx.chatJid, { text: 'That user is not a participant in this group.' }, { quoted: ctx.msg });
      return;
    }

    if (isGroupAdmin(metadata, target) && !isOwner(ctx.senderJid, config)) {
      await sock.sendMessage(ctx.chatJid, { text: 'Cannot warn another admin unless you are the bot owner.' }, { quoted: ctx.msg });
      return;
    }

    const count = settings.addWarning(ctx.chatJid, target);
    const tag = `@${stripJidDevice(target).split('@')[0]}`;

    if (count >= config.maxWarnings) {
      await sock.sendMessage(ctx.chatJid, {
        text: `${tag} reached ${count}/${config.maxWarnings} warnings.`,
        mentions: [stripJidDevice(target)]
      }, { quoted: ctx.msg });

      try {
        const result = await sock.groupParticipantsUpdate(ctx.chatJid, [target], 'remove');
        const status = result?.[0]?.status;
        if (status && !['200', 200].includes(status)) {
          await sock.sendMessage(ctx.chatJid, {
            text: `Warning recorded, but WhatsApp rejected the automatic kick (status ${status}).`
          }, { quoted: ctx.msg });
          return;
        }
        settings.resetWarnings(ctx.chatJid, target);
        await sock.sendMessage(ctx.chatJid, {
          text: `${tag} was removed after reaching the warning limit.`,
          mentions: [stripJidDevice(target)]
        }, { quoted: ctx.msg });
      } catch (error) {
        await sock.sendMessage(ctx.chatJid, {
          text: `Warning recorded, but kick failed: ${publicErrorMessage(error)}`
        }, { quoted: ctx.msg });
      }
      return;
    }

    await sock.sendMessage(ctx.chatJid, {
      text: `${tag} has ${count}/${config.maxWarnings} warnings.`,
      mentions: [stripJidDevice(target)]
    }, { quoted: ctx.msg });
  }
};
