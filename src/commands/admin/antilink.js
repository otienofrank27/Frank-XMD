export default {
  name: 'antilink',
  aliases: ['al'],
  category: 'admin',
  description: 'Detect and remove prohibited group invitation and external links.',
  usage: '.antilink on|off',
  groupOnly: true,
  adminOnly: true,
  async execute({ sock, ctx, settings }) {
    const arg = (ctx.args[0] || '').toLowerCase();
    if (!['on', 'off'].includes(arg)) {
      const current = settings.getGroup(ctx.chatJid).antilink ? 'on' : 'off';
      await sock.sendMessage(ctx.chatJid, {
        text: `Usage: .antilink on|off\nCurrent: ${current}`
      }, { quoted: ctx.msg });
      return;
    }

    settings.setFlag(ctx.chatJid, 'antilink', arg === 'on');
    await sock.sendMessage(ctx.chatJid, {
      text: `Antilink is now ${arg}. Admins, the owner, and trusted users are exempt.`
    }, { quoted: ctx.msg });
  }
};
