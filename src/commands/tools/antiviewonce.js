export default {
  name: 'antiviewonce',
  aliases: ['vo'],
  category: 'tools',
  description: 'Reveal view-once media in this group when enabled.',
  usage: '.antiviewonce on|off',
  groupOnly: true,
  adminOnly: true,
  async execute({ sock, ctx, settings }) {
    const arg = (ctx.args[0] || '').toLowerCase();
    if (!['on', 'off'].includes(arg)) {
      const current = settings.getGroup(ctx.chatJid).antiviewonce ? 'on' : 'off';
      await sock.sendMessage(ctx.chatJid, {
        text: `Usage: .antiviewonce on|off\nCurrent: ${current}`
      }, { quoted: ctx.msg });
      return;
    }
    settings.setFlag(ctx.chatJid, 'antiviewonce', arg === 'on');
    await sock.sendMessage(ctx.chatJid, { text: `Antiviewonce is now ${arg}.` }, { quoted: ctx.msg });
  }
};
