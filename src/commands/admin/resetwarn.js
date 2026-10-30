import { resolveTargetJid } from '../../middleware/permissions.js';
import { stripJidDevice } from '../../utils/jid.js';

export default {
  name: 'resetwarn',
  aliases: ['unwarn', 'clearwarn'],
  category: 'admin',
  description: 'Reset warnings for a user.',
  usage: '.resetwarn @user',
  groupOnly: true,
  adminOnly: true,
  async execute({ sock, ctx, settings, metadata }) {
    const target = resolveTargetJid(ctx, ctx.args[0], metadata);
    if (!target) {
      await sock.sendMessage(ctx.chatJid, {
        text: 'Mention a user, reply to their message, or provide a number. Usage: .resetwarn @user'
      }, { quoted: ctx.msg });
      return;
    }

    settings.resetWarnings(ctx.chatJid, target);
    await sock.sendMessage(ctx.chatJid, {
      text: `Warnings reset for @${stripJidDevice(target).split('@')[0]}`,
      mentions: [stripJidDevice(target)]
    }, { quoted: ctx.msg });
  }
};
