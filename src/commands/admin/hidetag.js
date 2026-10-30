import { participantJid } from '../../utils/jid.js';

export default {
  name: 'hidetag',
  aliases: ['htag', 'notify'],
  category: 'admin',
  description: 'Mention participants without displaying a visible list of names.',
  usage: '.hidetag [message]',
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
        text: `Refusing hidden mention: group has ${participants.length} members (limit ${config.maxMentions}).`
      }, { quoted: ctx.msg });
      return;
    }

    const message = ctx.rawArgs || 'Notification';
    await sock.sendMessage(ctx.chatJid, {
      text: message,
      mentions: participants
    }, { quoted: ctx.msg });
  }
};
