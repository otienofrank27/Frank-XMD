const settings = require('../settings');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

async function helpCommand(sock, chatId, message) {
    const botName = settings.botName || 'FRANKXMD';
    const version = settings.version || '3.0.8';
    const owner = settings.botOwner || 'Marvin Frank';
    const mode = (settings.commandMode || 'public').toUpperCase();
    const prefix = '.';

    const sections = [
        { title: '📌 BOT OVERVIEW', overview: true },
        { title: '📌 GENERAL & BOT', commands: ['help', 'menu', 'bot', 'list', 'ping', 'alive', 'owner', 'info', 'botinfo', 'about', 'version', 'status', 'speed', 'runtime', 'uptime', 'time', 'date', 'jid', 'github', 'git', 'sc', 'script', 'repo', 'support', 'feedback', 'report'] },
        { title: '🤖 AI & IMAGE GENERATION', commands: ['ai', 'gpt', 'gemini', 'ask', 'aichat', 'chatgpt', 'deepseek', 'claude', 'aiexplain', 'aicode', 'aiprompt', 'aifast', 'imagine', 'flux', 'dalle', 'sora'] },
        { title: '👥 GROUP MANAGEMENT', commands: ['groupinfo', 'infogp', 'infogrupo', 'staff', 'admins', 'listadmin', 'members', 'groupmembers', 'membercount', 'groupcount', 'topmembers', 'kick', 'ban', 'unban', 'promote', 'demote', 'mute', 'unmute', 'warn', 'warnings', 'clear', 'delete', 'del', 'tag', 'tagall', 'tagnotadmin', 'hidetag', 'resetlink', 'revoke', 'setgname', 'setgdesc', 'setgpp', 'groupstatus', 'togstatus', 'swgc', 'gstatus', 'gs'] },
        { title: '🛡️ SECURITY & AUTOMATION', commands: ['antilink', 'antitag', 'antibot', 'nobot', 'antibadword', 'welcome', 'goodbye', 'chatbot', 'mention', 'setmention', 'automation', 'autolist', 'autoreply', 'schedule'] },
        { title: '📥 DOWNLOADS & MEDIA', commands: ['play', 'mp3', 'ytmp3', 'song', 'music', 'video', 'ytmp4', 'ytv', 'ytvid', 'spotify', 'tiktok', 'tt', 'instagram', 'insta', 'ig', 'igs', 'igsc', 'facebook', 'fb', 'twitter', 'x', 'xdl', 'twdl', 'ss', 'ssweb', 'screenshot', 'tourl', 'url'] },
        { title: '🖼️ STICKERS & EFFECTS', commands: ['sticker', 's', 'cimage', 'take', 'steal', 'attp', 'emojimix', 'emix', 'tg', 'tgsticker', 'stickeertegram', 'telesticker', 'gif', 'meme', 'blur', 'metallic', 'ice', 'snow', 'impressive', 'matrix', 'light', 'neon', 'devil', 'purple', 'thunder', 'leaves', '1917', 'arena', 'hacker', 'sand', 'blackpink', 'glitch', 'fire', 'removebg', 'remini', 'crop'] },
        { title: '🎮 FUN & GAMES', commands: ['joke', 'quote', 'fact', 'weather', 'news', 'lyrics', '8ball', 'truth', 'dare', 'trivia', 'answer', 'hangman', 'guess', 'ttt', 'tictactoe', 'move', 'surrender', 'compliment', 'insult', 'flirt', 'ship', 'simp', 'stupid', 'itssostupid', 'iss', 'character', 'waifu', 'goodnight', 'lovenight', 'gn', 'shayari', 'shayri', 'roseday', 'animu', 'nom', 'poke', 'cry', 'kiss', 'pat', 'hug', 'wink', 'facepalm', 'face-palm', 'animuquote', 'kill', 'heart', 'horny', 'circle', 'lgbt', 'police', 'simpcard', 'tonikawa', 'its-so-stupid', 'namecard', 'oogway', 'oogway2', 'tweet', 'ytcomment', 'comrade', 'gay', 'glass', 'jail', 'passed', 'triggered'] },
        { title: '🛠️ UTILITIES', commands: ['tts', 'translate', 'trt', 'calc', 'calculate', 'qr', 'qrcode', 'b64e', 'base64encode', 'b64d', 'base64decode', 'reverse', 'upper', 'lower', 'poll', 'pollhelp', 'grouplink', 'link', 'getpp', 'profilepic', 'define', 'dictionary', 'wikipedia', 'google', 'search', 'currency', 'country', 'ip', 'unit', 'vv', 'sandvv', 'vv2'] },
        { title: '⚙️ SETTINGS & OWNER', commands: ['mode', 'settings', 'update', 'clearsession', 'clearcache', 'cleartmp', 'antidelete', 'autoread', 'autoreact', 'autoreaction', 'areact', 'autotyping', 'autostatus', 'statusview', 'viewstatus', 'savestatus', 'savesm', 'savest', 'anticall', 'pmblocker', 'setpp', 'sudo', 'pair'] }
    ];

    const esc = (value) => String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    const width = 1080;
    const padding = 64;
    const lineHeight = 42;
    const sectionGap = 30;
    const fontSize = 29;
    const titleSize = 34;
    const imagePath = path.join(__dirname, '../assets/frankxmd-banner.png.png');

    try {
        if (!fs.existsSync(imagePath)) throw new Error('Menu banner image not found: ' + imagePath);

        const banner = await sharp(fs.readFileSync(imagePath))
            .rotate()
            .resize({ width: width - 48, height: 620, fit: 'inside', withoutEnlargement: true })
            .png()
            .toBuffer();
        const bannerMeta = await sharp(banner).metadata();
        const bannerHeight = bannerMeta.height || 400;

        const textLines = [];
        textLines.push({ text: '╭─── TOPPING ASSISTANT ───╮', type: 'masthead' });
        textLines.push({ text: '│      ' + botName.toUpperCase() + ' BOT      │', type: 'brand' });
        textLines.push({ text: '╰─────────────────────────╯', type: 'masthead' });
        textLines.push({ text: '', type: 'gap' });
        textLines.push({ text: '🤖 BOT OVERVIEW', type: 'section' });
        textLines.push({ text: '⚙️ Version: ' + version, type: 'normal' });
        textLines.push({ text: '👤 Owner: ' + owner, type: 'normal' });
        textLines.push({ text: '🌐 Mode: ' + mode, type: 'normal' });
        textLines.push({ text: '🔑 Prefix: ' + prefix, type: 'normal' });
        textLines.push({ text: '────────────────────────────────────────', type: 'separator' });

        for (const section of sections.slice(1)) {
            textLines.push({ text: section.title, type: 'section' });
            for (const command of section.commands) {
                textLines.push({ text: '▫️ ' + prefix + command, type: 'normal' });
            }
            textLines.push({ text: '────────────────────────────────────────', type: 'separator' });
        }

        textLines.push({ text: '╰──────────────────────────────────────╯', type: 'masthead' });
        textLines.push({ text: 'Use ' + prefix + 'help or ' + prefix + 'menu to display this menu.', type: 'footer' });

        let y = 58;
        const svgParts = [];
        for (const item of textLines) {
            if (item.type === 'gap') { y += 22; continue; }
            const isSection = item.type === 'section';
            const isBrand = item.type === 'brand';
            const size = isSection ? titleSize : isBrand ? 36 : item.type === 'footer' ? 24 : fontSize;
            const weight = isSection || isBrand ? 700 : 400;
            const color = isSection ? '#64d9ff' : isBrand ? '#ffffff' : item.type === 'separator' ? '#526174' : '#e8eef7';
            if (isSection) {
                svgParts.push('<rect x="38" y="' + (y - 31) + '" width="' + (width - 76) + '" height="48" rx="10" fill="#172536"/>');
            }
            svgParts.push('<text x="' + padding + '" y="' + y + '" fill="' + color + '" font-family="Noto Color Emoji, DejaVu Sans, sans-serif" font-size="' + size + '" font-weight="' + weight + '">' + esc(item.text) + '</text>');
            y += item.type === 'separator' ? 24 : lineHeight;
        }

        const contentHeight = y + 44;
        const totalHeight = bannerHeight + 44 + contentHeight;
        const svg = Buffer.from(
            '<svg width="' + width + '" height="' + contentHeight + '" xmlns="http://www.w3.org/2000/svg">' +
            '<defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#08111f"/><stop offset="1" stop-color="#101e30"/></linearGradient></defs>' +
            '<rect width="100%" height="100%" fill="url(#bg)"/>' + svgParts.join('') + '</svg>'
        );

        const output = await sharp({
            create: { width, height: totalHeight, channels: 4, background: '#08111f' }
        })
            .composite([
                { input: banner, left: Math.round((width - (bannerMeta.width || width)) / 2), top: 0 },
                { input: svg, left: 0, top: bannerHeight + 44 }
            ])
            .png({ compressionLevel: 9 })
            .toBuffer();

        // One image message: banner first, complete menu directly underneath it.
        await sock.sendMessage(chatId, { image: output, mimetype: 'image/png' }, { quoted: message });
    } catch (error) {
        console.error('Error generating FrankXMD menu image:', error);
        // Fallback still sends one message, never a separate banner and text message.
        const fallback = [
            botName.toUpperCase() + ' BOT',
            'Version: ' + version,
            'Owner: ' + owner,
            'Mode: ' + mode,
            'Prefix: ' + prefix,
            '',
            ...sections.slice(1).flatMap(section => [section.title, ...section.commands.map(command => prefix + command), ''])
        ].join('\n');
        await sock.sendMessage(chatId, { text: fallback }, { quoted: message });
    }
}

module.exports = helpCommand;
