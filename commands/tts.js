const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

const KHAYA_LANGUAGES = {
    english: 'eng',
    en: 'eng',
    swahili: 'swa',
    kiswahili: 'swa',
    sw: 'swa',
    kikuyu: 'kik',
    ki: 'kik',
    luo: 'luo'
};

const KAMBA_ALIASES = new Set(['kikamba', 'kamba', 'kam']);

function pcmToWav(pcm, sampleRate = 24000, channels = 1, bitsPerSample = 16) {
    const header = Buffer.alloc(44);
    const byteRate = sampleRate * channels * bitsPerSample / 8;
    const blockAlign = channels * bitsPerSample / 8;
    header.write('RIFF', 0);
    header.writeUInt32LE(36 + pcm.length, 4);
    header.write('WAVE', 8);
    header.write('fmt ', 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(channels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(byteRate, 28);
    header.writeUInt16LE(blockAlign, 32);
    header.writeUInt16LE(bitsPerSample, 34);
    header.write('data', 36);
    header.writeUInt32LE(pcm.length, 40);
    return Buffer.concat([header, pcm]);
}

async function generateKhayaAudio(text, language) {
    const apiKey = process.env.KHAYA_API_KEY;
    if (!apiKey) throw new Error('African-language speech service is not configured yet.');
    const response = await fetch('https://translation-api.ghananlp.org/tts/v1/tts', {
        method: 'POST',
        headers: {
            'Ocp-Apim-Subscription-Key': apiKey,
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache'
        },
        body: JSON.stringify({ text, language }),
        timeout: 60000
    });
    if (!response.ok) {
        const detail = (await response.text()).slice(0, 250);
        throw new Error(`Speech service returned HTTP ${response.status}: ${detail}`);
    }
    const audio = await response.buffer();
    if (!audio.length || (audio.toString('ascii', 0, 4) !== 'RIFF' && !response.headers.get('content-type')?.startsWith('audio/'))) {
        throw new Error('Speech service returned an invalid audio response.');
    }
    return audio;
}

async function generateKambaAudio(text) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Kikamba speech generation is not configured yet.');
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: `Speak the following text naturally in the Kikamba (Kamba) language, using authentic Kamba pronunciation and intonation. Do not translate it. Text: ${text}` }] }],
            generationConfig: {
                responseModalities: ['AUDIO'],
                speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } }
            }
        }),
        timeout: 60000
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || `Kikamba speech service returned HTTP ${response.status}.`);
    const part = data?.candidates?.[0]?.content?.parts?.find(item => item.inlineData?.data);
    if (!part) throw new Error('Kikamba speech service did not return audio.');
    const pcm = Buffer.from(part.inlineData.data, 'base64');
    return pcmToWav(pcm, 24000, 1, 16);
}

async function ttsCommand(sock, chatId, text, message, language = 'english') {
    if (!text || !text.trim()) {
        await sock.sendMessage(chatId, {
            text: 'Please provide text. Usage: .say <language> <text>\nLanguages: english, swahili, kikuyu, kikamba, luo'
        }, { quoted: message });
        return;
    }

    const selectedLanguage = String(language || 'english').toLowerCase();
    const fileName = `say-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.wav`;
    const filePath = path.join(__dirname, '..', 'temp', fileName);

    try {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        const audio = KAMBA_ALIASES.has(selectedLanguage)
            ? await generateKambaAudio(text.trim())
            : await generateKhayaAudio(text.trim(), KHAYA_LANGUAGES[selectedLanguage] || 'eng');
        fs.writeFileSync(filePath, audio);
        await sock.sendMessage(chatId, {
            audio: { url: filePath },
            mimetype: 'audio/wav',
            ptt: true
        }, { quoted: message });
    } catch (error) {
        console.error('[say] TTS generation failed:', error.message);
        await sock.sendMessage(chatId, {
            text: `Could not generate ${selectedLanguage} speech: ${error.message}`
        }, { quoted: message });
    } finally {
        try { if (fs.existsSync(filePath)) fs.unlinkSync(filePath); } catch (_) {}
    }
}

module.exports = ttsCommand;
