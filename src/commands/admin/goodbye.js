export default {
  name: 'goodbye',
  aliases: ['bye'],
  category: 'admin',
  description: 'Enable or disable departure messages.',
  usage: '.goodbye on|off',
  groupOnly: true,
  adminOnly: true,
  async execute({ sock, ctx, settings }) {
    const arg = (ctx.args[0] || '').toLowerCase();
    if (!['on', 'off'].includes(arg)) {
      const current = settings.getGroup(ctx.chatJid).goodbye ? 'on' : 'off';
      await sock.sendMessage(ctx.chatJid, {
        text: `Usage: .goodbye on|off\nCurrent: ${current}`
      }, { quoted: ctx.msg });
      return;
    }

    settings.setFlag(ctx.chatJid, 'goodbye', arg === 'on');
    await sock.sendMessage(ctx.chatJid, {
      text: `Goodbye messages are now ${arg}.`
    }, { quoted: ctx.msg });
  }
};
