export default {
  name: 'antidelete',
  aliases: ['antidel'],
  category: 'admin',
  description: 'Notify the group when a message is deleted.',
  usage: '.antidelete on|off',
  groupOnly: true,
  adminOnly: true,
  async execute({ sock, ctx, settings }) {
    const arg = (ctx.args[0] || '').toLowerCase();
    if (!['on', 'off'].includes(arg)) {
      const current = settings.getGroup(ctx.chatJid).antidelete ? 'on' : 'off';
      await sock.sendMessage(ctx.chatJid, {
        text: `Usage: .antidelete on|off\nCurrent: ${current}\nNote: WhatsApp does not always provide deleted message content.`
      }, { quoted: ctx.msg });
      return;
    }
    settings.setFlag(ctx.chatJid, 'antidelete', arg === 'on');
    await sock.sendMessage(ctx.chatJid, { text: `Antidelete is now ${arg}.` }, { quoted: ctx.msg });
  }
};
