import { participantJid, stripJidDevice } from '../../utils/jid.js';
import { isBotAdmin } from '../../middleware/permissions.js';

export default {
  name: 'tagall',
  aliases: ['everyone', 'all'],
  category: 'admin',
  description: 'Mention group participants with an optional message.',
  usage: '.tagall [message]',
  groupOnly: true,
  adminOnly: true,
  async execute({ sock, ctx, config, metadata }) {
    const participants = (metadata?.participants || []).map(participantJid).filter(Boolean);
    if (!participants.length) {
      await sock.sendMessage(ctx.chatJid, { text: 'No participants found.' }, { quoted: ctx.msg });
      return;
    }

    if (participants.length > config.maxMentions) {
      await sock.sendMessage(ctx.chatJid, {
        text: `Refusing mass mention: group has ${participants.length} members (limit ${config.maxMentions}).`
      }, { quoted: ctx.msg });
      return;
    }

    const message = ctx.rawArgs || 'Attention everyone.';
    const tags = participants.map((jid) => `@${jid.split('@')[0]}`).join(' ');
    await sock.sendMessage(ctx.chatJid, {
      text: `${message}\n\n${tags}`,
      mentions: participants
    }, { quoted: ctx.msg });

    if (!isBotAdmin(metadata, sock)) {
      await sock.sendMessage(ctx.chatJid, {
        text: 'Note: the bot is not a group admin. Mentions were sent, but moderation actions may fail.'
      }, { quoted: ctx.msg });
    }
  }
};
