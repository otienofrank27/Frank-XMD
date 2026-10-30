import { resolveTargetJid } from '../../middleware/permissions.js';
import { publicErrorMessage } from '../../middleware/errorHandler.js';
import { stripJidDevice } from '../../utils/jid.js';

export default {
  name: 'block',
  aliases: [],
  category: 'owner',
  description: 'Block a user on WhatsApp.',
  usage: '.block @user|number',
  ownerOnly: true,
  async execute({ sock, ctx }) {
    const target = resolveTargetJid(ctx, ctx.args[0]);
    if (!target) {
      await sock.sendMessage(ctx.chatJid, { text: 'Usage: .block @user or .block 2547...' }, { quoted: ctx.msg });
      return;
    }
    try {
      await sock.updateBlockStatus(target, 'block');
      await sock.sendMessage(ctx.chatJid, {
        text: `Blocked ${stripJidDevice(target)}`
      }, { quoted: ctx.msg });
    } catch (error) {
      await sock.sendMessage(ctx.chatJid, { text: publicErrorMessage(error) }, { quoted: ctx.msg });
    }
  }
};
