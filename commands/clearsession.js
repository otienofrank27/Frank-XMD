const fs = require('fs');
const path = require('path');
const os = require('os');
const isOwnerOrSudo = require('../lib/isOwner');

const channelInfo = {
    contextInfo: {
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
            newsletterJid: '120363161513685998@newsletter',
            newsletterName: 'FrankXMD',
            serverMessageId: -1
        }
    }
};

async function clearSessionCommand(sock, chatId, msg) {
    try {
        const senderId = msg.key.participant || msg.key.remoteJid;
        const isOwner = await isOwnerOrSudo(senderId, sock, chatId);
        
        if (!msg.key.fromMe && !isOwner) {
            await sock.sendMessage(chatId, { 
                text: '❌ This command can only be used by the owner!',
                ...channelInfo
            });
            return;
        }

        if (typeof sock.logout !== 'function') {
            await sock.sendMessage(chatId, {
                text: 'This WhatsApp connection does not expose a logout method. Stop FrankXMD, then run npm run reset-session from the project folder.'
            }, { quoted: msg });
            return;
        }

        await sock.sendMessage(chatId, {
            text: 'Logging out this linked WhatsApp session now. Restart FrankXMD and scan the new QR code to link it again.'
        }, { quoted: msg });

        // Let Baileys perform a proper logout. index.js handles the logged-out
        // connection event and removes the complete auth directory. Never delete
        // individual key files from an active session.
        await sock.logout();

    } catch (error) {
        console.error('Error in clearsession command:', error);
        await sock.sendMessage(chatId, { 
            text: '❌ Failed to clear session files!',
            ...channelInfo
        });
    }
}

module.exports = clearSessionCommand; 