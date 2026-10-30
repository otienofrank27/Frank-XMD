import { resolveTargetJid } from '../../middleware/permissions.js';
import { publicErrorMessage } from '../../middleware/errorHandler.js';
import { stripJidDevice } from '../../utils/jid.js';

export default {
  name: 'unblock',
  aliases: [],
  category: 'owner',
  description: 'Unblock a user on WhatsApp.',
  usage: '.unblock @user|number',
  ownerOnly: true,
  async execute({ sock, ctx }) {
    const target = resolveTargetJid(ctx, ctx.args[0]);
    if (!target) {
      await sock.sendMessage(ctx.chatJid, { text: 'Usage: .unblock @user or .unblock 2547...' }, { quoted: ctx.msg });
      return;
    }
    try {
      await sock.updateBlockStatus(target, 'unblock');
      await sock.sendMessage(ctx.chatJid, {
        text: `Unblocked ${stripJidDevice(target)}`
      }, { quoted: ctx.msg });
    } catch (error) {
      await sock.sendMessage(ctx.chatJid, { text: publicErrorMessage(error) }, { quoted: ctx.msg });
    }
  }
};
