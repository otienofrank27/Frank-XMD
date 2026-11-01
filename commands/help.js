const settings = require('../settings');

async function helpCommand(sock, chatId, message) {
    const botName = settings.botName || 'FRANKXMD';
    const version = settings.version || '3.0.9';
    const owner = settings.botOwner || 'Marvin Frank';
    const mode = (settings.commandMode || 'public').toUpperCase();
    const prefix = settings.prefix || '.';

    const sections = [
        { title: '*GENERAL & BOT*', commands: ['help', 'menu', 'bot', 'list', 'ping', 'alive', 'owner', 'info', 'botinfo', 'about', 'version', 'status', 'speed', 'runtime', 'uptime', 'time', 'date', 'jid', 'github', 'git', 'sc', 'script', 'repo', 'support', 'feedback', 'report'] },
        { title: '*AI & IMAGE GENERATION*', commands: ['ai', 'gpt', 'gemini', 'ask', 'aichat', 'chatgpt', 'deepseek', 'claude', 'aiexplain', 'aicode', 'aiprompt', 'aifast', 'imagine', 'flux', 'dalle', 'sora'] },
        { title: '*GROUP MANAGEMENT*', commands: ['groupinfo', 'infogp', 'infogrupo', 'staff', 'admins', 'listadmin', 'members', 'groupmembers', 'membercount', 'groupcount', 'topmembers', 'kick', 'ban', 'unban', 'promote', 'demote', 'mute', 'unmute', 'warn', 'warnings', 'clear', 'delete', 'del', 'tag', 'tagall', 'tagnotadmin', 'hidetag', 'resetlink', 'revoke', 'setgname', 'setgdesc', 'setgpp', 'groupstatus', 'togstatus', 'swgc', 'gstatus', 'gs'] },
        { title: '*SECURITY & AUTOMATION*', commands: ['antilink', 'antitag', 'antibot', 'nebot', 'antibadword', 'welcome', 'goodbye', 'chatbot', 'mention', 'setmention', 'automation', 'autolist', 'autoreply', 'schedule'] },
        { title: '*DOWNLOADS & MEDIA*', commands: ['play', 'mp3', 'ymp3', 'song', 'music', 'video', 'ymp4', 'ytv', 'ytvid', 'spotify', 'tiktok', 'tt', 'instagram', 'insta', 'ig', 'igs', 'igsc', 'facebook', 'fb', 'twitter', 'x', 'xdl', 'twdl', 'ss', 'ssweb', 'screenshot', 'tourl', 'url'] },
        { title: '*STICKERS & EFFECTS*', commands: ['sticker', 's', 'cimage', 'take', 'steal', 'attp', 'emojimix', 'emix', 'tg', 'tgsticker', 'stickeertegram', 'telesticker', 'gif', 'meme', 'blur', 'metallic', 'ice', 'snow', 'impressive', 'matrix', 'light', 'neon', 'devil', 'purple', 'thunder', 'leaves', '1917', 'arena', 'hacker', 'sand', 'blackpink', 'glitch', 'fire', 'removebg', 'remini', 'crop'] },
        { title: '*FUN & GAMES*', commands: ['joke', 'quote', 'fact', 'weather', 'news', 'lyrics', '8ball', 'truth', 'dare', 'trivia', 'answer', 'hangman', 'guess', 'ttt', 'tictactoe', 'move', 'surrender', 'compliment', 'insult', 'flirt', 'ship', 'simp', 'stupid', 'itssostupid', 'iss', 'character', 'waifu', 'goodnight', 'lovenight', 'gn', 'shayari', 'shayri', 'roseday', 'animu', 'nom', 'poke', 'cry', 'kiss', 'pat', 'hug', 'wink', 'facepalm', 'face-palm', 'animuquote', 'kill', 'heart', 'horny', 'circle', 'lgbt', 'police', 'simpcard', 'tonikawa', 'its-so-stupid', 'namecard', 'oogway', 'oogway2', 'tweet', 'ytcomment', 'comrade', 'gay', 'glass', 'jail', 'passed', 'triggered'] },
        { title: '*UTILITIES*', commands: ['tts', 'translate', 'trt', 'calc', 'calculate', 'qr', 'qrcode', 'b64e', 'base64encode', 'b64d', 'base64decode', 'reverse', 'upper', 'lower', 'poll', 'pollhelp', 'grouplink', 'link', 'getpp', 'profilepic', 'define', 'dictionary', 'wikipedia', 'google', 'search', 'currency', 'country', 'ip', 'unit', 'vv', 'sandvv', 'vv2'] },
        { title: '*SETTINGS & OWNER*', commands: ['mode', 'settings', 'update', 'clearsession', 'clearcache', 'cleartmp', 'antidelete', 'autoread', 'autoreact', 'autoreaction', 'areact', 'autotyping', 'autostatus', 'statusview', 'viewstatus', 'savestatus', 'savesm', 'savest', 'anticall', 'pmblocker', 'setpp', 'sudo', 'pair'] }
    ];

    const menuLines = [
        '╭─── PRO WHATSAPP BOT ───╮',
        '│          *' + botName.toUpperCase() + ' BOT*           │',
        '╰────────────────────╯',
        '',
        '┌───  *BOT OVERVIEW*',
        '│ ⚙️ Version: ' + version,
        '│ 👤 Owner: ' + owner,
        '│ 🌐 Mode: ' + mode,
        '│ 🔑 Prefix: ' + prefix,
        '└─────────────────',
        ''
    ];

    for (const section of sections) {
        menuLines.push('┌───  ' + section.title);
        for (const command of section.commands) {
            menuLines.push('│ ▫️ ' + prefix + command);
        }
        menuLines.push('└──────────────────────');
        menuLines.push('');
    }

    menuLines.push('╭─────────────────────────╮');
    menuLines.push('│         *MADE BY MARVIN FRANK*          │');
    menuLines.push('╰─────────────────────────╯');

    await sock.sendMessage(chatId, { text: menuLines.join('\n') }, { quoted: message });
}

module.exports = helpCommand;
