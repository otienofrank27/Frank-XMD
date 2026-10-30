export default {
  name: 'antiword',
  aliases: ['badwords'],
  category: 'admin',
  description: 'Toggle bad-word filter or manage the blocked word list.',
  usage: '.antiword on|off|list|add <word>|remove <word>',
  groupOnly: true,
  adminOnly: true,
  async execute({ sock, ctx, settings }) {
    const group = settings.getGroup(ctx.chatJid);
    const action = (ctx.args[0] || '').toLowerCase();

    if (['on', 'off'].includes(action)) {
      settings.setFlag(ctx.chatJid, 'antiword', action === 'on');
      await sock.sendMessage(ctx.chatJid, {
        text: `Antiword is now ${action}.`
      }, { quoted: ctx.msg });
      return;
    }

    if (action === 'list' || !action) {
      await sock.sendMessage(ctx.chatJid, {
        text: [
          `Antiword: ${group.antiword ? 'on' : 'off'}`,
          `Words: ${group.badwords.join(', ') || '(none)'}`,
          'Usage: .antiword on|off|list|add <word>|remove <word>'
        ].join('\n')
      }, { quoted: ctx.msg });
      return;
    }

    if (action === 'add') {
      const word = ctx.args.slice(1).join(' ').trim();
      if (!word) {
        await sock.sendMessage(ctx.chatJid, { text: 'Provide a word to block.' }, { quoted: ctx.msg });
        return;
      }
      const list = settings.addBadword(ctx.chatJid, word);
      await sock.sendMessage(ctx.chatJid, { text: `Blocked words: ${list.join(', ')}` }, { quoted: ctx.msg });
      return;
    }

    if (action === 'remove') {
      const word = ctx.args.slice(1).join(' ').trim();
      const list = settings.removeBadword(ctx.chatJid, word);
      await sock.sendMessage(ctx.chatJid, { text: `Blocked words: ${list.join(', ') || '(none)'}` }, { quoted: ctx.msg });
      return;
    }

    await sock.sendMessage(ctx.chatJid, {
      text: 'Usage: .antiword on|off|list|add <word>|remove <word>'
    }, { quoted: ctx.msg });
  }
};
