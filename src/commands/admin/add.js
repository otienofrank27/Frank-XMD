import { isBotAdmin } from '../../middleware/permissions.js';
import { publicErrorMessage } from '../../middleware/errorHandler.js';
import { numberToJid, stripJidDevice } from '../../utils/jid.js';

export default {
  name: 'add',
  aliases: ['invite'],
  category: 'admin',
  description: 'Attempt to add a participant when WhatsApp permits it.',
  usage: '.add <number>',
  groupOnly: true,
  adminOnly: true,
  async execute({ sock, ctx, metadata }) {
    if (!isBotAdmin(metadata, sock)) {
      await sock.sendMessage(ctx.chatJid, {
        text: 'The bot must be a group admin to add participants.'
      }, { quoted: ctx.msg });
      return;
    }

    const digits = String(ctx.args[0] || '').replace(/\D/g, '');
    if (!digits || digits.length < 8) {
      await sock.sendMessage(ctx.chatJid, {
        text: 'Provide a full number with country code. Usage: .add 1234567890\nWhatsApp may still reject the add if privacy settings require an invite link.'
      }, { quoted: ctx.msg });
      return;
    }

    const target = numberToJid(digits);

    try {
      const onWa = await sock.onWhatsApp(target);
      if (!onWa?.[0]?.exists) {
        await sock.sendMessage(ctx.chatJid, {
          text: `+${digits} is not a registered WhatsApp account, so it was not added.`
        }, { quoted: ctx.msg });
        return;
      }

      const jid = onWa[0].jid || target;
      const result = await sock.groupParticipantsUpdate(ctx.chatJid, [jid], 'add');
      const status = result?.[0]?.status;
      if (status && !['200', 200].includes(status)) {
        await sock.sendMessage(ctx.chatJid, {
          text: `WhatsApp rejected the add (status ${status}). The user may need a private invite link instead.`
        }, { quoted: ctx.msg });
        return;
      }

      await sock.sendMessage(ctx.chatJid, {
        text: `Add request sent for @${stripJidDevice(jid).split('@')[0]}`,
        mentions: [stripJidDevice(jid)]
      }, { quoted: ctx.msg });
    } catch (error) {
      await sock.sendMessage(ctx.chatJid, { text: publicErrorMessage(error) }, { quoted: ctx.msg });
    }
  }
};
