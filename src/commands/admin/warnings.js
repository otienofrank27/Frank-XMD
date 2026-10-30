import { resolveTargetJid } from '../../middleware/permissions.js';
import { stripJidDevice } from '../../utils/jid.js';

export default {
  name: 'warnings',
  aliases: ['warns', 'warnlist'],
  category: 'admin',
  description: 'Show warning counts for a user or the group.',
  usage: '.warnings [@user]',
  groupOnly: true,
  adminOnly: true,
  async execute({ sock, ctx, settings, config, metadata }) {
    const group = settings.getGroup(ctx.chatJid);
    const target = resolveTargetJid(ctx, ctx.args[0], metadata);

    if (target) {
      const count = settings.getWarnings(ctx.chatJid, target);
      await sock.sendMessage(ctx.chatJid, {
        text: `@${stripJidDevice(target).split('@')[0]} has ${count}/${config.maxWarnings} warnings.`,
        mentions: [stripJidDevice(target)]
      }, { quoted: ctx.msg });
      return;
    }

    const entries = Object.entries(group.warnings || {});
    if (!entries.length) {
      await sock.sendMessage(ctx.chatJid, { text: 'No warnings recorded in this group.' }, { quoted: ctx.msg });
      return;
    }

    const mentions = entries.map(([jid]) => jid);
    const lines = entries.map(([jid, count]) => `@${jid.split('@')[0]}  ${count}/${config.maxWarnings}`);
    await sock.sendMessage(ctx.chatJid, {
      text: `Warning list\n${lines.join('\n')}`,
      mentions
    }, { quoted: ctx.msg });
  }
};
