export default {
  name: 'antispam',
  aliases: ['spam'],
  category: 'admin',
  description: 'Toggle anti-spam protection for rapid repeated messages.',
  usage: '.antispam on|off',
  groupOnly: true,
  adminOnly: true,
  async execute({ sock, ctx, settings }) {
    const arg = (ctx.args[0] || '').toLowerCase();
    if (!['on', 'off'].includes(arg)) {
      const current = settings.getGroup(ctx.chatJid).antispam ? 'on' : 'off';
      await sock.sendMessage(ctx.chatJid, {
        text: `Usage: .antispam on|off\nCurrent: ${current}`
      }, { quoted: ctx.msg });
      return;
    }
    settings.setFlag(ctx.chatJid, 'antispam', arg === 'on');
    await sock.sendMessage(ctx.chatJid, { text: `Antispam is now ${arg}.` }, { quoted: ctx.msg });
  }
};
