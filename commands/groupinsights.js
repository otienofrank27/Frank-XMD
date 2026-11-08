function getContextInfo(message) {
    const body = message?.message || {};
    return body.extendedTextMessage?.contextInfo ||
        body.imageMessage?.contextInfo ||
        body.videoMessage?.contextInfo ||
        body.documentMessage?.contextInfo ||
        body.buttonsResponseMessage?.contextInfo ||
        body.templateButtonReplyMessage?.contextInfo ||
        {};
}

async function groupStatsCommand(sock, chatId, message) {
    if (!chatId.endsWith('@g.us')) {
        return sock.sendMessage(chatId, { text: 'This command can only be used in a group.' }, { quoted: message });
    }

    try {
        const metadata = await sock.groupMetadata(chatId);
        const participants = Array.isArray(metadata.participants) ? metadata.participants : [];
        const admins = participants.filter(item => item.admin === 'admin' || item.admin === 'superadmin');
        const created = metadata.creation ? new Date(metadata.creation * 1000).toLocaleString() : 'Not provided';
        const owner = metadata.owner || 'Not provided';
        const description = typeof metadata.desc === 'string' && metadata.desc.trim()
            ? metadata.desc.trim()
            : 'No group description';

        const lines = [
            'GROUP INSIGHTS',
            '',
            'Name: ' + (metadata.subject || 'Unnamed group'),
            'Members: ' + participants.length,
            'Administrators: ' + admins.length,
            'Regular members: ' + Math.max(0, participants.length - admins.length),
            'Group owner: ' + owner,
            'Created: ' + created,
            'Announcement-only: ' + (metadata.announce ? 'Yes' : 'No'),
            'Restricted editing: ' + (metadata.restrict ? 'Yes' : 'No'),
            '',
            'Description:',
            description.slice(0, 1000)
        ];
        return sock.sendMessage(chatId, { text: lines.join('\n') }, { quoted: message });
    } catch (error) {
        console.error('[groupstats] Failed:', error.message);
        return sock.sendMessage(chatId, { text: 'Could not retrieve group information. Please try again.' }, { quoted: message });
    }
}

async function userInfoCommand(sock, chatId, message) {
    const context = getContextInfo(message);
    const mentioned = context.mentionedJid?.[0];
    const quoted = context.participant || context.remoteJid;
    const target = mentioned || quoted || message.key.participant || message.key.remoteJid;

    if (!target || target === 'status@broadcast') {
        return sock.sendMessage(chatId, { text: 'Tag a member or reply to their message with .userinfo.' }, { quoted: message });
    }

    let displayName = target;
    try {
        if (typeof sock.getName === 'function') {
            displayName = await sock.getName(target) || target;
        }
    } catch {}

    let role = 'Not available';
    if (chatId.endsWith('@g.us')) {
        try {
            const metadata = await sock.groupMetadata(chatId);
            const participant = (metadata.participants || []).find(item => item.id === target || item.jid === target);
            if (participant) {
                role = participant.admin === 'superadmin' ? 'Group owner' :
                    participant.admin === 'admin' ? 'Administrator' : 'Member';
            } else {
                role = 'Not a current group member';
            }
        } catch {}
    }

    const lines = [
        'USER INFORMATION',
        '',
        'Name: ' + displayName,
        'WhatsApp ID: ' + target,
        'Chat role: ' + role
    ];
    return sock.sendMessage(chatId, { text: lines.join('\n') }, { quoted: message });
}

module.exports = { groupStatsCommand, userInfoCommand };
