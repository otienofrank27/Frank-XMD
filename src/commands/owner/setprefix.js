export default {
  name: 'setprefix',
  aliases: ['prefix'],
  category: 'owner',
  description: 'Change the command prefix.',
  usage: '.setprefix <symbol>',
  ownerOnly: true,
  async execute({ sock, ctx, config, botState }) {
    const next = (ctx.args[0] || '').trim();
    if (!next || next.length > 3) {
      await sock.sendMessage(ctx.chatJid, {
        text: `Usage: .setprefix <1-3 chars>\nCurrent: ${botState.get().prefix || config.prefix}`
      }, { quoted: ctx.msg });
      return;
    }
    botState.set({ prefix: next });
    config.prefix = next;
    try {
      const { updateSettings } = await import('../../config/config.js');
      updateSettings({ prefix: next });
    } catch {
      // runtime prefix still applies even if the settings file cannot be written
    }
    await sock.sendMessage(ctx.chatJid, { text: `Prefix updated to ${next}` }, { quoted: ctx.msg });
  }
};
