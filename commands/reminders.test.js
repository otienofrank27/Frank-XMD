const assert = require('assert');
const { parseDuration, getReminderDestination } = require('./reminders');

const cases = [
    ['10s', 10000],
    ['1m', 60000],
    ['2h', 7200000],
    ['1d', 86400000],
    ['30d', 30 * 24 * 60 * 60 * 1000],
    ['9s', null],
    ['0m', null],
    ['31d', null],
    ['1w', null],
    ['abc', null],
    ['', null],
    ['999999999999999999999d', null]
];

for (const [input, expected] of cases) {
    assert.strictEqual(parseDuration(input), expected, 'Unexpected duration result for: ' + input);
}

assert.strictEqual(
    getReminderDestination({ chatId: '120363000000000000@g.us', senderId: '254700000001@s.whatsapp.net' }),
    '254700000001@s.whatsapp.net',
    'Group reminders must be delivered privately to their creator'
);
assert.strictEqual(
    getReminderDestination({ chatId: '254700000001@s.whatsapp.net', senderId: '254700000001@s.whatsapp.net' }),
    '254700000001@s.whatsapp.net',
    'Private-chat reminders must be delivered in the originating chat'
);

console.log('Reminder tests passed: duration validation and delivery routing.');
