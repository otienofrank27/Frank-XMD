export default {
  name: 'autoviewstatus',
  aliases: ['avs'],
  category: 'owner',
  description: 'Automatically mark status updates as viewed.',
  usage: '.autoviewstatus on|off',
  ownerOnly: true,
  async execute({ sock, ctx, botState }) {
    const arg = (ctx.args[0] || '').toLowerCase();
    if (!['on', 'off'].includes(arg)) {
      await sock.sendMessage(ctx.chatJid, {
        text: `Usage: .autoviewstatus on|off\nCurrent: ${botState.get().autoviewstatus ? 'on' : 'off'}`
      }, { quoted: ctx.msg });
      return;
    }
    botState.setFlag('autoviewstatus', arg === 'on');
    await sock.sendMessage(ctx.chatJid, { text: `Auto view status is now ${arg}.` }, { quoted: ctx.msg });
  }
};
