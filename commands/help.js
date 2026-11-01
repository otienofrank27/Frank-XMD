const settings = require('../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message) {
    const botName = settings.botName || 'FrankXMD';
    const version = settings.version || '3.0.0';
    const owner = settings.botOwner || 'Marvin Frank';
    const prefix = '.';

    const sections = [
        {
            title: 'GENERAL',
            icon: '✦',
            commands: [
                'help / menu', 'ping', 'alive', 'owner', 'botinfo / info',
                'speed', 'time', 'date', 'joke', 'quote', 'fact',
                'weather <city>', 'news', 'tts <text>', 'attp <text>',
                'lyrics <song>', '8ball <question>', 'groupinfo',
                'members', 'membercount', 'staff', 'jid', 'url'
            ]
        },
        {
            title: 'ARTIFICIAL INTELLIGENCE',
            icon: '✧',
            commands: [
                'ai <question>', 'gpt <question>', 'gemini <question>',
                'ask <question>', 'deepseek <question>', 'claude <question>',
                'aiexplain <topic>', 'aicode <task>', 'aiprompt <idea>',
                'imagine <prompt>', 'sora <prompt>'
            ]
        },
        {
            title: 'GROUP ADMINISTRATION',
            icon: '◈',
            commands: [
                'ban @user', 'kick @user', 'promote @user', 'demote @user',
                'mute <minutes>', 'unmute', 'delete / del', 'warn @user',
                'warnings @user', 'tag <message>', 'tagall', 'tagnotadmin',
                'hidetag <message>', 'clear', 'resetlink', 'groupstatus <text>',
                'setgname <name>', 'setgdesc <description>', 'setgpp (reply image)'
            ]
        },
        {
            title: 'GROUP SECURITY',
            icon: '◉',
            commands: [
                'antilink <on/off>', 'antibadword <on/off>',
                'antibot <on/off/set/get>', 'antitag <on/off>',
                'welcome <on/off>', 'goodbye <on/off>', 'chatbot <on/off>'
            ]
        },
        {
            title: 'DOWNLOADS & MEDIA',
            icon: '⇩',
            commands: [
                'play <song>', 'song <song>', 'music <song>',
                'video <query>', 'ytv <link>', 'spotify <query>',
                'tiktok <link>', 'instagram <link>', 'facebook <link>',
                'twitter <link>', 'ss <link>', 'tourl (reply to media)'
            ]
        },
        {
            title: 'STICKERS & IMAGES',
            icon: '▧',
            commands: [
                'sticker (reply to image/video)', 'simage (reply to sticker)',
                'take <packname>', 'emojimix <emoji>+<emoji>',
                'removebg (reply to image)', 'remini (reply to image)',
                'blur (reply to image)', 'crop (reply to media)',
                'tgsticker <pack link>', 'gif <search>', 'meme'
            ]
        },
        {
            title: 'FUN & GAMES',
            icon: '◇',
            commands: [
                'truth', 'dare', 'trivia', 'answer <answer>',
                'hangman', 'guess <letter>', 'tictactoe @user',
                'compliment @user', 'insult @user', 'flirt',
                'ship @user', 'simp @user', 'character @user',
                'wasted @user', 'goodnight', 'roseday', 'shayari'
            ]
        },
        {
            title: 'CREATIVE & TEXT TOOLS',
            icon: '✎',
            commands: [
                'metallic <text>', 'ice <text>', 'snow <text>',
                'neon <text>', 'matrix <text>', 'fire <text>',
                'glitch <text>', 'hacker <text>', 'thunder <text>',
                'purple <text>', 'blackpink <text>', 'impressive <text>'
            ]
        },
        {
            title: 'WHATSAPP & UTILITIES',
            icon: '⌘',
            commands: [
                'vv / viewonce', 'vv2', 'trt <text> <language>',
                'translate <text> <language>', 'github <username>',
                'repo / script', 'country <name>', 'currency <amount>',
                'define <word>', 'wikipedia <topic>', 'google <query>',
                'unit <value>', 'ip <address>'
            ]
        },
        {
            title: 'OWNER & BOT SETTINGS',
            icon: '⚙',
            commands: [
                'mode <public/private>', 'settings', 'update',
                'clearsession', 'cleartmp', 'antidelete <on/off>',
                'autoread <on/off>', 'autoreact <on/off>',
                'autotyping <on/off>', 'autostatus <on/off>',
                'savestatus <on/off>', 'anticall <on/off>',
                'pmblocker <on/off/status>', 'setpp (reply to image)',
                'sudo <number>', 'mention <on/off>'
            ]
        }
    ];

    const lines = [
        '╭━━━━━━━━━━━━━━━━━━━━━━╮',
        '       ✨ *' + botName.toUpperCase() + '*',
        '       *WHATSAPP ASSISTANT*',
        '╰━━━━━━━━━━━━━━━━━━━━━━╯',
        '',
        '┌  ◦ *BOT OVERVIEW*',
        '│  Version : ' + version,
        '│  Owner   : ' + owner,
        '│  Mode    : ' + (settings.commandMode || 'public').toUpperCase(),
        '│  Prefix  : ' + prefix,
        '└──────────────────────',
        '',
        'Welcome! Your commands, neatly organised.',
        'Use the examples below by replacing the values in < >.',
        ''
    ];

    for (const section of sections) {
        lines.push('╭─ ' + section.icon + ' *' + section.title + '*');
        for (const command of section.commands) {
            lines.push('│  ' + prefix + command);
        }
        lines.push('╰──────────────────────', '');
    }

    lines.push(
        '╭─ *QUICK TIPS*',
        '│  • Use ' + prefix + 'help to reopen this menu',
        '│  • Reply to media when a command requests it',
        '│  • Admin commands require group admin rights',
        '│  • Owner commands are restricted to the bot owner',
        '╰──────────────────────',
        '',
        '╭━━━━━━━━━━━━━━━━━━━━━━╮',
        '   *POWERED BY ' + botName.toUpperCase() + '*',
        '   _Built for smarter WhatsApp experiences._',
        '╰━━━━━━━━━━━━━━━━━━━━━━╯'
    );

    const helpMessage = lines.join('\n');

    try {
        const imagePath = path.join(__dirname, '../assets/bot_image.jpg');
        const contextInfo = {
            forwardingScore: 1,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
                newsletterJid: '120363161513685998@newsletter',
                newsletterName: botName,
                serverMessageId: -1
            }
        };

        if (fs.existsSync(imagePath)) {
            await sock.sendMessage(chatId, {
                image: fs.readFileSync(imagePath),
                caption: helpMessage,
                contextInfo
            }, { quoted: message });
        } else {
            await sock.sendMessage(chatId, { text: helpMessage, contextInfo }, { quoted: message });
        }
    } catch (error) {
        console.error('Error in help command:', error);
        await sock.sendMessage(chatId, { text: helpMessage }, { quoted: message });
    }
}

module.exports = helpCommand;
