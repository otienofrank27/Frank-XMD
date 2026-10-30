import { isBotAdmin } from '../../middleware/permissions.js';
import { publicErrorMessage } from '../../middleware/errorHandler.js';

export default {
  name: 'unmute',
  aliases: ['unsilence'],
  category: 'admin',
  description: 'Unmute bot commands, or allow member messaging when supported.',
  usage: '.unmute [group]',
  groupOnly: true,
  adminOnly: true,
  async execute({ sock, ctx, settings, metadata }) {
    const mode = (ctx.args[0] || 'bot').toLowerCase();

    if (mode === 'group') {
      if (!isBotAdmin(metadata, sock)) {
        await sock.sendMessage(ctx.chatJid, {
          text: 'The bot must be a group admin to open member messaging. Use .unmute without arguments to unmute the bot only.'
        }, { quoted: ctx.msg });
        return;
      }
      try {
        await sock.groupSettingUpdate(ctx.chatJid, 'not_announcement');
        await sock.sendMessage(ctx.chatJid, {
          text: 'Group messaging is open to all members.'
        }, { quoted: ctx.msg });
      } catch (error) {
        await sock.sendMessage(ctx.chatJid, { text: publicErrorMessage(error) }, { quoted: ctx.msg });
      }
      return;
    }

    settings.setFlag(ctx.chatJid, 'muted', false);
    await sock.sendMessage(ctx.chatJid, {
      text: 'Bot commands are unmuted in this group.'
    }, { quoted: ctx.msg });
  }
};
