import { publicErrorMessage } from '../../middleware/errorHandler.js';

export default {
  name: 'leave',
  aliases: ['leavegroup'],
  category: 'owner',
  description: 'Leave the current group.',
  usage: '.leave',
  ownerOnly: true,
  groupOnly: true,
  async execute({ sock, ctx }) {
    try {
      await sock.sendMessage(ctx.chatJid, { text: 'Leaving this group.' }, { quoted: ctx.msg });
      await sock.groupLeave(ctx.chatJid);
    } catch (error) {
      await sock.sendMessage(ctx.chatJid, { text: publicErrorMessage(error) }, { quoted: ctx.msg });
    }
  }
};
