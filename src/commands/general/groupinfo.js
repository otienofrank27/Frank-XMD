import { isGroupAdmin } from '../../middleware/permissions.js';
import { participantJid } from '../../utils/jid.js';

export default {
  name: 'groupinfo',
  aliases: ['ginfo', 'gi'],
  category: 'general',
  description: 'Show group name, description, member count, admins, and settings.',
  usage: '.groupinfo',
  groupOnly: true,
  async execute({ sock, ctx, settings }) {
    let metadata;
    try {
      metadata = await sock.groupMetadata(ctx.chatJid);
    } catch {
      await sock.sendMessage(ctx.chatJid, {
        text: 'Unable to load group metadata. The bot may not be a participant, or WhatsApp rejected the query.'
      }, { quoted: ctx.msg });
      return;
    }

    const participants = metadata.participants || [];
    const admins = participants.filter((p) => isGroupAdmin(metadata, participantJid(p) || p.id));
    const group = settings.getGroup(ctx.chatJid);
    const announce = metadata.announce ? 'admins only' : 'all members';
    const restrict = metadata.restrict ? 'admins only' : 'all members';

    const adminTags = admins.slice(0, 20).map((p) => `@${participantJid(p).split('@')[0]}`);
    const extra = admins.length > 20 ? `\n…and ${admins.length - 20} more admins` : '';

    const text = [
      `*${metadata.subject || 'Unnamed group'}*`,
      `ID: ${metadata.id}`,
      `Members: ${participants.length}`,
      `Admins: ${admins.length}`,
      `Created: ${metadata.creation ? new Date(metadata.creation * 1000).toISOString() : 'unknown'}`,
      `Messaging: ${announce}`,
      `Edit info: ${restrict}`,
      '',
      `Description:\n${metadata.desc || '(none)'}`,
      '',
      `Bot settings:`,
      `Antilink: ${group.antilink ? 'on' : 'off'}`,
      `Welcome: ${group.welcome ? 'on' : 'off'}`,
      `Goodbye: ${group.goodbye ? 'on' : 'off'}`,
      `Mute (bot ignore): ${group.muted ? 'on' : 'off'}`,
      '',
      `Admins:\n${adminTags.join(' ')}${extra}`
    ].join('\n');

    await sock.sendMessage(ctx.chatJid, {
      text,
      mentions: admins.map(participantJid)
    }, { quoted: ctx.msg });
  }
};
