const assert = require('assert');
const { groupStatsCommand, userInfoCommand } = require('./groupinsights');

async function run() {
    const groupId = '120363000000000000@g.us';
    const message = { key: { remoteJid: groupId, participant: '254700000001@s.whatsapp.net' }, message: {} };
    const sent = [];
    const sock = {
        groupMetadata: async () => ({
            subject: 'FrankXMD Test Group',
            participants: [
                { id: '254700000001@s.whatsapp.net', admin: 'superadmin' },
                { id: '254700000002@s.whatsapp.net', admin: 'admin' },
                { id: '254700000003@s.whatsapp.net' }
            ],
            creation: 1700000000,
            owner: '254700000001@s.whatsapp.net',
            announce: false,
            restrict: true,
            desc: 'A test group'
        }),
        getName: async jid => jid === '254700000003@s.whatsapp.net' ? 'Test Member' : jid,
        sendMessage: async (...args) => { sent.push(args); }
    };

    await groupStatsCommand(sock, groupId, message);
    assert.strictEqual(sent.length, 1);
    assert.match(sent[0][1].text, /FrankXMD Test Group/);
    assert.match(sent[0][1].text, /Members: 3/);
    assert.match(sent[0][1].text, /Administrators: 2/);
    assert.match(sent[0][1].text, /Regular members: 1/);
    assert.match(sent[0][1].text, /Restricted editing: Yes/);

    sent.length = 0;
    await groupStatsCommand(sock, '254700000001@s.whatsapp.net', message);
    assert.match(sent[0][1].text, /only be used in a group/i);

    sent.length = 0;
    const mentionedMessage = {
        key: { remoteJid: groupId, participant: '254700000001@s.whatsapp.net' },
        message: { extendedTextMessage: { contextInfo: { mentionedJid: ['254700000003@s.whatsapp.net'] } } }
    };
    await userInfoCommand(sock, groupId, mentionedMessage);
    assert.match(sent[0][1].text, /Test Member/);
    assert.match(sent[0][1].text, /Member/);
    assert.match(sent[0][1].text, /254700000003@s.whatsapp.net/);

    console.log('Group-insights tests passed: group stats, context validation and member lookup.');
}

run().catch(error => {
    console.error(error);
    process.exitCode = 1;
});
