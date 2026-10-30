export default {
  name: 'welcome',
  aliases: ['wel'],
  category: 'admin',
  description: 'Enable or disable new-member welcome messages.',
  usage: '.welcome on|off',
  groupOnly: true,
  adminOnly: true,
  async execute({ sock, ctx, settings }) {
    const arg = (ctx.args[0] || '').toLowerCase();
    if (!['on', 'off'].includes(arg)) {
      const current = settings.getGroup(ctx.chatJid).welcome ? 'on' : 'off';
      await sock.sendMessage(ctx.chatJid, {
        text: `Usage: .welcome on|off\nCurrent: ${current}`
      }, { quoted: ctx.msg });
      return;
    }

    settings.setFlag(ctx.chatJid, 'welcome', arg === 'on');
    await sock.sendMessage(ctx.chatJid, {
      text: `Welcome messages are now ${arg}.`
    }, { quoted: ctx.msg });
  }
};
