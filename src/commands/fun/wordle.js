const WORDS = ['crane', 'slate', 'pride', 'mango', 'flame', 'stone', 'brave', 'light', 'plant', 'world'];
const games = new Map();

function score(secret, guess) {
  return guess.split('').map((ch, i) => {
    if (ch === secret[i]) return `${ch.toUpperCase()} `;
    if (secret.includes(ch)) return `${ch}* `;
    return `${ch}_ `;
  }).join('');
}

export default {
  name: 'wordle',
  aliases: [],
  category: 'fun',
  description: 'Play a 5-letter wordle-style game.',
  usage: '.wordle start | .wordle <guess>',
  async execute({ sock, ctx }) {
    const key = `${ctx.chatJid}:${ctx.senderJid}`;
    const arg = (ctx.args[0] || '').toLowerCase();

    if (arg === 'start' || !games.has(key)) {
      const secret = WORDS[Math.floor(Math.random() * WORDS.length)];
      games.set(key, { secret, tries: 0 });
      await sock.sendMessage(ctx.chatJid, {
        text: 'Wordle started. Guess a 5-letter word.\nUppercase = correct place, * = wrong place, _ = missing.'
      }, { quoted: ctx.msg });
      return;
    }

    const guess = arg;
    if (!/^[a-z]{5}$/.test(guess)) {
      await sock.sendMessage(ctx.chatJid, { text: 'Guess must be exactly 5 letters.' }, { quoted: ctx.msg });
      return;
    }

    const game = games.get(key);
    game.tries += 1;
    if (guess === game.secret) {
      games.delete(key);
      await sock.sendMessage(ctx.chatJid, { text: `Correct. The word was ${game.secret}. Tries: ${game.tries}` }, { quoted: ctx.msg });
      return;
    }
    if (game.tries >= 6) {
      games.delete(key);
      await sock.sendMessage(ctx.chatJid, { text: `Out of tries. The word was ${game.secret}.` }, { quoted: ctx.msg });
      return;
    }
    await sock.sendMessage(ctx.chatJid, {
      text: `${score(game.secret, guess)}\n${6 - game.tries} tries left.`
    }, { quoted: ctx.msg });
  }
};
