export default {
  name: 'time',
  aliases: ['now', 'date'],
  category: 'general',
  description: 'Display the current time.',
  usage: '.time',
  async execute({ sock, ctx, config }) {
    let formatted;
    try {
      formatted = new Intl.DateTimeFormat('en-GB', {
        timeZone: config.timezone,
        dateStyle: 'full',
        timeStyle: 'long'
      }).format(new Date());
    } catch {
      formatted = new Date().toISOString();
    }

    await sock.sendMessage(ctx.chatJid, {
      text: `Timezone: ${config.timezone}\n${formatted}`
    }, { quoted: ctx.msg });
  }
};
