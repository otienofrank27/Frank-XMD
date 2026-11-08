const assert = require('assert');
const { resolveSpeechLanguage, pcmToWav } = require('./tts');

const cases = [
    ['english', { provider: 'google', language: 'en' }],
    ['en', { provider: 'google', language: 'en' }],
    ['swahili', { provider: 'khaya', language: 'swa' }],
    ['kiswahili', { provider: 'khaya', language: 'swa' }],
    ['sw', { provider: 'khaya', language: 'swa' }],
    ['kikuyu', { provider: 'khaya', language: 'kik' }],
    ['ki', { provider: 'khaya', language: 'kik' }],
    ['luo', { provider: 'khaya', language: 'luo' }],
    ['kikamba', { provider: 'gemini', language: 'kikamba' }],
    ['kamba', { provider: 'gemini', language: 'kikamba' }],
    ['kam', { provider: 'gemini', language: 'kikamba' }]
];

for (const [input, expected] of cases) {
    assert.deepStrictEqual(resolveSpeechLanguage(input), expected, `Language mapping failed for ${input}`);
}
assert.strictEqual(resolveSpeechLanguage('unsupported'), null);

const wav = pcmToWav(Buffer.from([0, 0, 1, 0]), 24000);
assert.strictEqual(wav.toString('ascii', 0, 4), 'RIFF');
assert.strictEqual(wav.toString('ascii', 8, 12), 'WAVE');
assert.strictEqual(wav.toString('ascii', 36, 40), 'data');
assert.strictEqual(wav.readUInt32LE(24), 24000);
assert.strictEqual(wav.readUInt32LE(40), 4);
assert.throws(() => pcmToWav(Buffer.alloc(0)), /invalid 16-bit PCM/);

console.log('TTS unit tests passed: language routing and WAV packaging.');
