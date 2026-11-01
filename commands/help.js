const settings = require('../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message) {
    const botName = settings.botName || 'FrankXMD';
    const version = settings.version || '3.0.0';
    const owner = settings.botOwner || 'Marvin Frank';
    const prefix = '.';

    const sections = [
        { title: 'GENERAL & BOT', commands: ['help', 'menu', 'bot', 'list', 'ping', 'alive', 'owner', 'info', 'botinfo', 'about', 'version', 'status', 'speed', 'runtime', 'uptime', 'time', 'date', 'jid', 'github', 'git', 'sc', 'script', 'repo', 'support', 'feedback', 'report'] },
        { title: 'AI & IMAGE GENERATION', commands: ['ai', 'gpt', 'gemini', 'ask', 'aichat', 'chatgpt', 'deepseek', 'claude', 'aiexplain', 'aicode', 'aiprompt', 'aifast', 'imagine', 'flux', 'dalle', 'sora'] },
        { title: 'GROUP MANAGEMENT', commands: ['groupinfo', 'infogp', 'infogrupo', 'staff', 'admins', 'listadmin', 'members', 'groupmembers', 'membercount', 'groupcount', 'topmembers', 'kick', 'ban', 'unban', 'promote', 'demote', 'mute', 'unmute', 'warn', 'warnings', 'clear', 'delete', 'del', 'tag', 'tagall', 'tagnotadmin', 'hidetag', 'resetlink', 'revoke', 'setgname', 'setgdesc', 'setgpp', 'groupstatus', 'togstatus', 'swgc', 'gstatus', 'gs'] },
        { title: 'GROUP SECURITY & AUTOMATION', commands: ['antilink', 'antitag', 'antibot', 'nobot', 'antibadword', 'welcome', 'goodbye', 'chatbot', 'mention', 'setmention', 'automation', 'autolist', 'autoreply', 'schedule'] },
        { title: 'DOWNLOADS & MEDIA', commands: ['play', 'mp3', 'ytmp3', 'song', 'music', 'video', 'ytmp4', 'ytv', 'ytvid', 'spotify', 'tiktok', 'tt', 'instagram', 'insta', 'ig', 'igs', 'igsc', 'facebook', 'fb', 'twitter', 'x', 'xdl', 'twdl', 'ss', 'ssweb', 'screenshot', 'tourl', 'url'] },
        { title: 'STICKERS, IMAGES & EFFECTS', commands: ['sticker', 's', 'simage', 'take', 'steal', 'attp', 'emojimix', 'emix', 'tg', 'tgsticker', 'stickertelegram', 'telesticker', 'gif', 'meme', 'blur', 'metallic', 'ice', 'snow', 'impressive', 'matrix', 'light', 'neon', 'devil', 'purple', 'thunder', 'leaves', '1917', 'arena', 'hacker', 'sand', 'blackpink', 'glitch', 'fire', 'removebg', 'remini', 'crop'] },
        { title: 'FUN, ANIME & GAMES', commands: ['joke', 'quote', 'fact', 'weather', 'news', 'lyrics', '8ball', 'truth', 'dare', 'trivia', 'answer', 'hangman', 'guess', 'ttt', 'tictactoe', 'move', 'surrender', 'compliment', 'insult', 'flirt', 'ship', 'simp', 'stupid', 'itssostupid', 'iss', 'character', 'waste', 'goodnight', 'lovenight', 'gn', 'shayari', 'shayri', 'roseday', 'animu', 'nom', 'poke', 'cry', 'kiss', 'pat', 'hug', 'wink', 'facepalm', 'face-palm', 'animuquote', 'loli', 'heart', 'horny', 'circle', 'lgbt', 'lolice', 'simpcard', 'tonikawa', 'its-so-stupid', 'namecard', 'oogway', 'oogway2', 'tweet', 'ytcomment', 'comrade', 'gay', 'glass', 'jail', 'passed', 'triggered'] },
        { title: 'UTILITIES', commands: ['tts', 'translate', 'trt', 'calc', 'calculate', 'qr', 'qrcode', 'b64e', 'base64encode', 'b64d', 'base64decode', 'reverse', 'upper', 'lower', 'poll', 'pollhelp', 'grouplink', 'link', 'getpp', 'profilepic', 'define', 'dictionary', 'wikipedia', 'google', 'search', 'currency', 'country', 'ip', 'unit', 'vv', 'sendvo', 'vv2'] },
        { title: 'OWNER & BOT SETTINGS', commands: ['mode', 'settings', 'update', 'clearsession', 'clearsesi', 'cleartmp', 'antidelete', 'autoread', 'autoreact', 'autoreaction', 'areact', 'autotyping', 'autostatus', 'statusview', 'viewstatus', 'savestatus', 'savesm', 'savest', 'anticall', 'pmblocker', 'setpp', 'sudo', 'pair'] }
    ];

    const fullMenu = [
        '╭━━━━━━━━━━━━━━━━━━━━━━╮',
        '       ✨ *' + botName.toUpperCase() + '*',
        '       *WHATSAPP ASSISTANT*',
        '╰━━━━━━━━━━━━━━━━━━━━━━╯',
        '',
        '*BOT OVERVIEW*',
        'Version: ' + version,
        'Owner: ' + owner,
        'Mode: ' + (settings.commandMode || 'public').toUpperCase(),
        'Prefix: ' + prefix,
        ''
    ];

    for (const section of sections) {
        fullMenu.push('▸ *' + section.title + '*');
        fullMenu.push(section.commands.map(command => prefix + command).join('  '));
        fullMenu.push('');
    }

    fullMenu.push('Use .help to reopen this menu.', 'Reply to media when a command requests it.');

    // Keep the existing banner unchanged, then send the complete command
    // directory as the menu text directly underneath it. WhatsApp image captions
    // are limited to 1,024 characters, while text messages allow a much longer menu.
    const bannerCaption = '✨ *' + botName.toUpperCase() + '*  |  v' + version;


    try {
        const imagePath = path.join(__dirname, '../assets/frankxmd-banner.png.png');
        if (fs.existsSync(imagePath)) {
            // Preserve the current banner artwork and styling exactly as-is.
            await sock.sendMessage(chatId, {
                image: fs.readFileSync(imagePath),
                caption: bannerCaption
            }, { quoted: message });
            // List every command in a readable, categorized text menu below it.
            await sock.sendMessage(chatId, {
                text: fullMenu.join('\n')
            });
        } else {
            console.error('FrankXMD menu banner not found:', imagePath);
            await sock.sendMessage(chatId, {
                text: fullMenu.join('\n')
            }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(chatId, {
            text: fullMenu.join('\n')
        }, { quoted: message });
    }
}

module.exports = helpCommand;
