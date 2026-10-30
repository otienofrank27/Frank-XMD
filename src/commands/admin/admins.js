import { isGroupAdmin } from '../../middleware/permissions.js';
import { participantJid } from '../../utils/jid.js';

export default {
  name: 'admins',
  aliases: ['adminlist', 'listadmins'],
  category: 'admin',
  description: 'Mention group administrators.',
  usage: '.admins',
  groupOnly: true,
  adminOnly: true,
  async execute({ sock, ctx, metadata }) {
    const admins = (metadata?.participants || []).filter((p) => isGroupAdmin(metadata, participantJid(p) || p.id));
    if (!admins.length) {
      await sock.sendMessage(ctx.chatJid, { text: 'No admins found.' }, { quoted: ctx.msg });
      return;
    }

    const mentions = admins.map(participantJid).filter(Boolean);
    const tags = mentions.map((jid) => `@${jid.split('@')[0]}`).join('\n');
    await sock.sendMessage(ctx.chatJid, {
      text: `Group admins:\n${tags}`,
      mentions
    }, { quoted: ctx.msg });
  }
};
