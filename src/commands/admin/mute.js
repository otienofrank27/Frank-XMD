import { isBotAdmin } from '../../middleware/permissions.js';
import { publicErrorMessage } from '../../middleware/errorHandler.js';

export default {
  name: 'mute',
  aliases: ['silence'],
  category: 'admin',
  description: 'Mute bot command processing in this group, or restrict member messaging when supported.',
  usage: '.mute [group]',
  groupOnly: true,
  adminOnly: true,
  async execute({ sock, ctx, settings, metadata }) {
    const mode = (ctx.args[0] || 'bot').toLowerCase();

    if (mode === 'group') {
      if (!isBotAdmin(metadata, sock)) {
        await sock.sendMessage(ctx.chatJid, {
          text: 'The bot must be a group admin to restrict member messaging. Use .mute without arguments to mute the bot only.'
        }, { quoted: ctx.msg });
        return;
      }
      try {
        await sock.groupSettingUpdate(ctx.chatJid, 'announcement');
        await sock.sendMessage(ctx.chatJid, {
          text: 'Group messaging restricted to admins.'
        }, { quoted: ctx.msg });
      } catch (error) {
        await sock.sendMessage(ctx.chatJid, { text: publicErrorMessage(error) }, { quoted: ctx.msg });
      }
      return;
    }

    settings.setFlag(ctx.chatJid, 'muted', true);
    await sock.sendMessage(ctx.chatJid, {
      text: 'Bot commands are muted in this group for non-admins. Admins and the owner can still run commands. Use .unmute to restore.'
    }, { quoted: ctx.msg });
  }
};
