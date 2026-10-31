export default {
  name: 'autoread',
  aliases: ['read'],
  category: 'owner',
  description: 'Automatically mark incoming chats as read.',
  usage: '.autoread on|off',
  ownerOnly: true,
  async execute({ sock, ctx, botState }) {
    const arg = (ctx.args[0] || '').toLowerCase();
    if (!['on', 'off'].includes(arg)) {
      await sock.sendMessage(ctx.chatJid, {
        text: `Usage: .autoread on|off\nCurrent: ${botState.get().autoread ? 'on' : 'off'}`
      }, { quoted: ctx.msg });
      return;
    }
    botState.setFlag('autoread', arg === 'on');
    await sock.sendMessage(ctx.chatJid, { text: `Autoread is now ${arg}.` }, { quoted: ctx.msg });
  }
};
