import { publicErrorMessage } from '../../middleware/errorHandler.js';

export default {
  name: 'join',
  aliases: [],
  category: 'owner',
  description: 'Join a group using an invite link or code.',
  usage: '.join <invite-link-or-code>',
  ownerOnly: true,
  async execute({ sock, ctx }) {
    const raw = ctx.rawArgs.trim();
    const match = raw.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/i);
    const code = match?.[1] || raw.replace(/[^A-Za-z0-9]/g, '');
    if (!code) {
      await sock.sendMessage(ctx.chatJid, { text: 'Usage: .join https://chat.whatsapp.com/XXXX' }, { quoted: ctx.msg });
      return;
    }
    try {
      const jid = await sock.groupAcceptInvite(code);
      await sock.sendMessage(ctx.chatJid, { text: `Joined group: ${jid}` }, { quoted: ctx.msg });
    } catch (error) {
      await sock.sendMessage(ctx.chatJid, { text: publicErrorMessage(error) }, { quoted: ctx.msg });
    }
  }
};
