const settings = require('../settings');

async function helpCommand(sock, chatId, message) {
    const botName = settings.botName || 'FRANKXMD';
    const version = settings.version || '3.0.9';
    const owner = settings.botOwner || 'Marvin Frank';
    const mode = (settings.commandMode || 'public').toUpperCase();
    const prefix = settings.prefix || '.';

    // One canonical command per feature. Synonyms that called the same
    // handler and returned the same response are intentionally omitted.
    const sections = [
        { title: '*GENERAL & BOT*', commands: ['menu', 'ping', 'alive', 'owner', 'repo', 'info', 'runtime', 'speed', 'time', 'jid', 'settings', 'support', 'feedback', 'remind', 'reminders', 'cancelreminder'] },
        { title: '*AI & IMAGE GENERATION*', commands: ['ai', 'imagine', 'sora'] },
        { title: '*GROUP MANAGEMENT*', commands: ['groupinfo', 'groupstats', 'userinfo', 'staff', 'membercount', 'members', 'topmembers', 'kick', 'ban', 'unban', 'promote', 'demote', 'mute', 'unmute', 'warn', 'warnings', 'clear', 'delete', 'tag', 'tagall', 'tagnotadmin', 'hidetag', 'resetlink', 'setgname', 'setgdesc', 'setgpp', 'groupstatus'] },
        { title: '*SECURITY & AUTOMATION*', commands: ['antilink', 'antitag', 'antibot', 'antibadword', 'welcome', 'goodbye', 'chatbot', 'mention', 'setmention', 'automation', 'autolist', 'autoreply', 'schedule', 'autostatus', 'savestatus', 'alwaysonline', 'autotyping', 'autoread', 'areact', 'anticall', 'pmblocker'] },
        { title: '*DOWNLOADS & MEDIA*', commands: ['play', 'video', 'spotify', 'tiktok', 'instagram', 'igs', 'igsc', 'facebook', 'twitter', 'ss', 'tourl', 'stickertelegram', 'sticker', 'simage', 'take', 'attp', 'emojimix', 'gif', 'blur', 'removebg', 'remini', 'crop'] },
        { title: '*FUN & GAMES*', commands: ['meme', 'joke', 'quote', 'fact', 'weather', 'news', 'lyrics', '8ball', 'truth', 'dare', 'trivia', 'answer', 'hangman', 'guess', 'ttt', 'move', 'surrender', 'compliment', 'insult', 'flirt', 'ship', 'simp', 'stupid', 'character', 'goodnight', 'shayari', 'roseday', 'animu', 'heart', 'horny', 'circle', 'lgbt', 'police', 'simpcard', 'tonikawa', 'namecard', 'oogway', 'tweet', 'ytcomment', 'comrade', 'gay', 'glass', 'jail', 'passed', 'triggered'] },
        { title: '*UTILITIES*', commands: ['say', 'tts', 'translate', 'calc', 'qr', 'b64e', 'b64d', 'reverse', 'upper', 'lower', 'poll', 'grouplink', 'getpp', 'define', 'wikipedia', 'google', 'currency', 'country', 'ip', 'unit', 'vv', 'vv2'] },
        { title: '*OWNER & SESSION*', commands: ['mode', 'update', 'clearsession', 'cleartmp', 'antidelete', 'setpp', 'sudo', 'pair'] }
    ];

    const menuLines = [
        '╭─── PRO WHATSAPP BOT ───╮',
        '│       *' + botName.toUpperCase() + ' BOT*       │',
        '╰───────────────────────╯',
        '',
        '┌───  *BOT OVERVIEW*',
        '│ Version: ' + version,
        '│ Owner: ' + owner,
        '│ Mode: ' + mode,
        '│ Prefix: ' + prefix,
        '└───────────────────────',
        ''
    ];

    for (const section of sections) {
        menuLines.push('┌───  ' + section.title);
        for (const command of section.commands) {
            menuLines.push('│ ▫️ ' + prefix + command);
        }
        menuLines.push('└───────────────────────');
        menuLines.push('');
    }

    menuLines.push('SPEECH: .say <language> <text>');
    menuLines.push('Languages: English | Swahili | Kikuyu | Kikamba | Luo');
    menuLines.push('Legacy English: .tts <text>');
    menuLines.push('');

    menuLines.push('╭─────────────────────────╮');
    menuLines.push('│      *MADE BY MARVIN FRANK*      │');
    menuLines.push('╰─────────────────────────╯');

    await sock.sendMessage(chatId, { text: menuLines.join('\n') }, { quoted: message });
}

module.exports = helpCommand;
