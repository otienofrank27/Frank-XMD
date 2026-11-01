const settings = require('../settings');
const fs = require('fs');
const path = require('path');

async function helpCommand(sock, chatId, message) {
    const botName = settings.botName || 'FrankXMD';
    const version = settings.version || '3.0.0';
    const owner = settings.botOwner || 'Marvin Frank';
    const prefix = '.';

    const sections = [
        { title: 'GENERAL', commands: ['help/menu', 'ping', 'alive', 'owner', 'botinfo/info', 'speed', 'time', 'date', 'joke', 'quote', 'fact', 'weather', 'news', 'tts', 'attp', 'lyrics', '8ball', 'groupinfo', 'members', 'membercount', 'staff', 'jid', 'url'] },
        { title: 'AI', commands: ['ai', 'gpt', 'gemini', 'ask', 'deepseek', 'claude', 'aiexplain', 'aicode', 'aiprompt', 'imagine', 'sora'] },
        { title: 'GROUP ADMIN', commands: ['ban', 'kick', 'promote', 'demote', 'mute', 'unmute', 'delete/del', 'warn', 'warnings', 'tag', 'tagall', 'tagnotadmin', 'hidetag', 'clear', 'resetlink', 'groupstatus', 'setgname', 'setgdesc', 'setgpp'] },
        { title: 'GROUP SECURITY', commands: ['antilink', 'antibadword', 'antibot', 'antitag', 'welcome', 'goodbye', 'chatbot'] },
        { title: 'DOWNLOADS', commands: ['play', 'song', 'music', 'video', 'ytv', 'spotify', 'tiktok', 'instagram', 'facebook', 'twitter', 'ss', 'tourl'] },
        { title: 'STICKERS & IMAGES', commands: ['sticker', 'simage', 'take', 'emojimix', 'removebg', 'remini', 'blur', 'crop', 'tgsticker', 'gif', 'meme'] },
        { title: 'FUN & GAMES', commands: ['truth', 'dare', 'trivia', 'answer', 'hangman', 'guess', 'tictactoe', 'compliment', 'insult', 'flirt', 'ship', 'simp', 'character', 'wasted', 'goodnight', 'roseday', 'shayari'] },
        { title: 'CREATIVE TEXT', commands: ['metallic', 'ice', 'snow', 'neon', 'matrix', 'fire', 'glitch', 'hacker', 'thunder', 'purple', 'blackpink', 'impressive'] },
        { title: 'UTILITIES', commands: ['vv/viewonce', 'vv2', 'trt', 'translate', 'github', 'repo/script', 'country', 'currency', 'define', 'wikipedia', 'google', 'unit', 'ip'] },
        { title: 'OWNER SETTINGS', commands: ['mode', 'settings', 'update', 'clearsession', 'cleartmp', 'antidelete', 'autoread', 'autoreact', 'autotyping', 'autostatus', 'savestatus', 'anticall', 'pmblocker', 'setpp', 'sudo', 'mention'] }
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

    // WhatsApp image captions have a strict length limit. Keep the complete
    // command list compact enough to appear directly underneath the banner
    // in the same message bubble.
    const captionLines = [
        '✨ *' + botName.toUpperCase() + '*  |  v' + version,
        '_WhatsApp Multi-Device Assistant_',
        'Owner: ' + owner + '  •  Prefix: ' + prefix,
        ''
    ];

    for (const section of sections) {
        captionLines.push('*' + section.title + '*');
        captionLines.push(section.commands.map(command => prefix + command).join('  '));
    }

    captionLines.push('', 'Use .help to reopen • Replace command arguments as needed.');
    let caption = captionLines.join('\n');
    if (caption.length > 1024) {
        // Preserve every category and as many commands as possible if branding
        // details or future command additions push the caption over the limit.
        caption = caption.slice(0, 1000).replace(/\s+\S*$/, '') + '\n…';
    }

    try {
        const imagePath = path.join(__dirname, '../assets/frankxmd-banner.png.png');
        if (fs.existsSync(imagePath)) {
            await sock.sendMessage(chatId, {
                image: fs.readFileSync(imagePath),
                caption
            }, { quoted: message });
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
