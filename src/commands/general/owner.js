export default {
  name: 'owner',
  aliases: ['creator'],
  category: 'general',
  description: 'Display configured owner information.',
  usage: '.owner',
  async execute({ sock, ctx, config }) {
    const vcard =
      'BEGIN:VCARD\n' +
      'VERSION:3.0\n' +
      `FN:${config.ownerName}\n` +
      `TEL;type=CELL;type=VOICE;waid=${config.ownerNumber}:+${config.ownerNumber}\n` +
      'END:VCARD';

    await sock.sendMessage(ctx.chatJid, {
      contacts: {
        displayName: config.ownerName,
        contacts: [{ vcard }]
      }
    }, { quoted: ctx.msg });

    await sock.sendMessage(ctx.chatJid, {
      text: `Owner: ${config.ownerName}\nNumber: +${config.ownerNumber}\nRegion: ${config.ownerCountry || 'KE'}`
    }, { quoted: ctx.msg });
  }
};
