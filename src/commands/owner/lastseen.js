export default {
  name: 'lastseen',
  aliases: ['privacy'],
  category: 'owner',
  description: 'Update last-seen / online privacy or show current privacy snapshot.',
  usage: '.lastseen all|contacts|contact_blacklist|none   |   .privacy',
  ownerOnly: true,
  async execute({ sock, ctx, botState }) {
    if (ctx.invoked === 'privacy' || ctx.args[0] === 'show') {
      try {
        const privacy = await sock.fetchPrivacySettings(true);
        await sock.sendMessage(ctx.chatJid, {
          text: `Privacy snapshot:\n${JSON.stringify(privacy, null, 2).slice(0, 1500)}`
        }, { quoted: ctx.msg });
      } catch {
        await sock.sendMessage(ctx.chatJid, { text: 'Could not fetch privacy settings.' }, { quoted: ctx.msg });
      }
      return;
    }

    const value = (ctx.args[0] || '').toLowerCase();
    const allowed = ['all', 'contacts', 'contact_blacklist', 'none'];
    if (!allowed.includes(value)) {
      await sock.sendMessage(ctx.chatJid, {
        text: `Usage: .lastseen ${allowed.join('|')}\nUse .privacy to inspect current settings.`
      }, { quoted: ctx.msg });
      return;
    }

    try {
      await sock.updateLastSeenPrivacy(value);
      botState.set({ lastseen: value });
      try {
        const { updateSettings } = await import('../../config/config.js');
        updateSettings({ lastseen: value });
      } catch {
        // runtime value still applies
      }
      await sock.sendMessage(ctx.chatJid, { text: `Last seen privacy set to ${value}.` }, { quoted: ctx.msg });
    } catch {
      await sock.sendMessage(ctx.chatJid, { text: 'WhatsApp rejected the privacy update.' }, { quoted: ctx.msg });
    }
  }
};
