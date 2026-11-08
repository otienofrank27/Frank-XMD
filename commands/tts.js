const fs = require('fs');
const path = require('path');
const gTTS = require('gtts');
const fetch = require('node-fetch');
const ffmpeg = require('fluent-ffmpeg');

const KHAYA_LANGUAGES = Object.freeze({
    swahili: 'swa',
    kiswahili: 'swa',
    sw: 'swa',
    kikuyu: 'kik',
    ki: 'kik',
    luo: 'luo'
});
const KAMBA_ALIASES = new Set(['kikamba', 'kamba', 'kam']);

function pcmToWav(pcm, sampleRate = 24000) {
    const channels = 1;
    const bitsPerSample = 16;
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

function generateGoogleEnglish(text, filePath) {
    return new Promise((resolve, reject) => {
        try {
            new gTTS(text, 'en').save(filePath, error => error ? reject(error) : resolve());
        } catch (error) {
            reject(error);
        }
    });
}

async function generateKhayaAudio(text, language) {
    const apiKey = process.env.KHAYA_API_KEY;
    if (!apiKey) throw new Error('Set KHAYA_API_KEY in your private environment variables to use Swahili, Kikuyu and Luo voices.');
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
        throw new Error(`Khaya TTS returned HTTP ${response.status}: ${detail}`);
    }
    const audio = await response.buffer();
    const contentType = response.headers.get('content-type') || '';
    if (!audio.length || (!audio.subarray(0, 4).equals(Buffer.from('RIFF')) && !contentType.startsWith('audio/'))) {
        throw new Error('Khaya TTS returned an invalid audio response.');
    }
    return { audio, extension: audio.subarray(0, 4).toString() === 'RIFF' ? 'wav' : 'audio' };
}

async function generateKambaAudio(text) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('Set GEMINI_API_KEY in your private environment variables to use the Kikamba voice.');
    const endpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent';
    const response = await fetch(`${endpoint}?key=${encodeURIComponent(apiKey)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: `Speak this text in natural, authentic Kikamba (Kamba), with native Kikamba pronunciation and intonation. Do not translate, paraphrase, or add words. Text to speak: ${text}`
                }]
            }],
            generationConfig: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' }
                    }
                }
            }
        }),
        timeout: 60000
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error?.message || `Gemini TTS returned HTTP ${response.status}.`);
    const part = data?.candidates?.[0]?.content?.parts?.find(item => item.inlineData?.data);
    if (!part) throw new Error('Gemini did not return speech audio. Try shorter text.');
    const mimeType = part.inlineData.mimeType || '';
    const sampleRate = Number(mimeType.match(/rate=(\d+)/i)?.[1]) || 24000;
    return { audio: pcmToWav(Buffer.from(part.inlineData.data, 'base64'), sampleRate), extension: 'wav' };
}

function convertWavToMp3(inputPath, outputPath) {
    return new Promise((resolve, reject) => {
        ffmpeg(inputPath)
            .noVideo()
            .audioCodec('libmp3lame')
            .audioBitrate(128)
            .format('mp3')
            .on('end', resolve)
            .on('error', reject)
            .save(outputPath);
    });
}

async function sendGeneratedAudio(sock, chatId, message, filePath, extension) {
    if (extension === 'wav') {
        const mp3Path = filePath.replace(/\.wav$/i, '.mp3');
        try {
            await convertWavToMp3(filePath, mp3Path);
            await sock.sendMessage(chatId, {
                audio: { url: mp3Path },
                mimetype: 'audio/mpeg'
            }, { quoted: message });
            return mp3Path;
        } catch (error) {
            console.warn('[say] WAV-to-MP3 conversion unavailable; sending WAV audio:', error.message);
        }
    }

    await sock.sendMessage(chatId, {
        audio: { url: filePath },
        mimetype: extension === 'mp3' ? 'audio/mpeg' : 'audio/wav'
    }, { quoted: message });
    return null;
}

async function ttsCommand(sock, chatId, text, message, language = 'english', commandName = '.say') {
    const selectedLanguage = String(language || 'english').toLowerCase();
    const speechText = String(text || '').trim();
    if (!speechText) {
        await sock.sendMessage(chatId, {
            text: 'Provide text to speak. Usage: .say <language> <text>\nLanguages: english, swahili, kikuyu, kikamba, luo\nExample: .say kikuyu Wĩ mwega'
        }, { quoted: message });
        return;
    }

    const tempDir = path.join(__dirname, '..', 'temp');
    const fileName = `frankxmd-say-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const isEnglish = ['english', 'en'].includes(selectedLanguage);
    const isKamba = KAMBA_ALIASES.has(selectedLanguage);
    const khayaLanguage = KHAYA_LANGUAGES[selectedLanguage];
    const filePath = path.join(tempDir, `${fileName}.${isEnglish ? 'mp3' : 'wav'}`);
    let convertedPath = null;

    try {
        fs.mkdirSync(tempDir, { recursive: true });

        // Keep the legacy .tts command working without requiring a paid API key.
        if (isEnglish) {
            await generateGoogleEnglish(speechText, filePath);
            await sock.sendMessage(chatId, {
                audio: { url: filePath },
                mimetype: 'audio/mpeg'
            }, { quoted: message });
            return;
        }

        let result;
        if (isKamba) {
            result = await generateKambaAudio(speechText);
        } else if (khayaLanguage) {
            result = await generateKhayaAudio(speechText, khayaLanguage);
        } else {
            throw new Error('Unsupported language. Use English, Swahili, Kikuyu, Kikamba or Luo.');
        }

        fs.writeFileSync(filePath, result.audio);
        convertedPath = await sendGeneratedAudio(sock, chatId, message, filePath, result.extension);
    } catch (error) {
        console.error(`[${commandName}]`, error);
        await sock.sendMessage(chatId, {
            text: `Could not generate ${selectedLanguage} speech: ${error.message}`
        }, { quoted: message });
    } finally {
        for (const candidate of [filePath, convertedPath]) {
            if (!candidate) continue;
            try { if (fs.existsSync(candidate)) fs.unlinkSync(candidate); } catch (cleanupError) {
                console.warn('[say] Could not remove temporary audio file:', cleanupError.message);
            }
        }
    }
}

module.exports = ttsCommand;
