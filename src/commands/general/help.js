export default {
  name: 'help',
  aliases: ['h'],
  category: 'general',
  description: 'Explain command usage.',
  usage: '.help [command]',
  async execute({ sock, ctx, config, registry }) {
    const query = (ctx.args[0] || '').replace(new RegExp(`^\\${config.prefix}`), '').toLowerCase();

    if (!query) {
      await sock.sendMessage(ctx.chatJid, {
        text: [
          `${config.botName} help`,
          `Prefix: ${config.prefix}`,
          `Example: ${config.prefix}ping`,
          '',
          `Send ${config.prefix}menu to list commands.`,
          `Send ${config.prefix}help <command> for details.`,
          '',
          'Admin commands require group admin or owner rights.',
          'Some group actions also require the bot itself to be a group admin.'
        ].join('\n')
      }, { quoted: ctx.msg });
      return;
    }

    const command = registry.get(query);
    if (!command) {
      await sock.sendMessage(ctx.chatJid, {
        text: `Unknown command: ${query}`
      }, { quoted: ctx.msg });
      return;
    }

    const aliases = command.aliases?.length ? command.aliases.map((a) => config.prefix + a).join(', ') : 'none';
    const flags = [
      command.groupOnly ? 'group-only' : null,
      command.adminOnly ? 'admin-only' : null,
      command.ownerOnly ? 'owner-only' : null
    ].filter(Boolean).join(', ') || 'none';

    await sock.sendMessage(ctx.chatJid, {
      text: [
        `*${config.prefix}${command.name}*`,
        command.description || '',
        `Usage: ${command.usage || config.prefix + command.name}`,
        `Aliases: ${aliases}`,
        `Restrictions: ${flags}`
      ].join('\n')
    }, { quoted: ctx.msg });
  }
};
