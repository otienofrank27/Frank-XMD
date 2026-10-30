const games = new Map();

function emptyBoard() {
  return ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
}

function render(board) {
  return [
    ` ${board[0]} | ${board[1]} | ${board[2]} `,
    '---+---+---',
    ` ${board[3]} | ${board[4]} | ${board[5]} `,
    '---+---+---',
    ` ${board[6]} | ${board[7]} | ${board[8]} `
  ].join('\n');
}

function winner(board) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
  ];
  for (const [a, b, c] of lines) {
    if (board[a] === board[b] && board[b] === board[c]) {
      return board[a];
    }
  }
  return board.every((cell) => cell === 'X' || cell === 'O') ? 'draw' : null;
}

function botMove(board) {
  const free = board.map((cell, index) => (cell !== 'X' && cell !== 'O' ? index : -1)).filter((i) => i >= 0);
  if (!free.length) return;
  const pick = free[Math.floor(Math.random() * free.length)];
  board[pick] = 'O';
}

export default {
  name: 'tictactoe',
  aliases: ['ttt'],
  category: 'fun',
  description: 'Play tic-tac-toe against the bot.',
  usage: '.tictactoe start | .tictactoe <1-9>',
  async execute({ sock, ctx }) {
    const key = `${ctx.chatJid}:${ctx.senderJid}`;
    const arg = (ctx.args[0] || '').toLowerCase();

    if (arg === 'start' || !games.has(key)) {
      const board = emptyBoard();
      games.set(key, board);
      await sock.sendMessage(ctx.chatJid, {
        text: `Tic-tac-toe started. You are X.\nSend .ttt <1-9>\n\n${render(board)}`
      }, { quoted: ctx.msg });
      return;
    }

    const pos = Number.parseInt(arg, 10);
    const board = games.get(key);
    if (!Number.isInteger(pos) || pos < 1 || pos > 9) {
      await sock.sendMessage(ctx.chatJid, { text: 'Choose a cell 1-9, or .ttt start' }, { quoted: ctx.msg });
      return;
    }
    if (board[pos - 1] === 'X' || board[pos - 1] === 'O') {
      await sock.sendMessage(ctx.chatJid, { text: 'That cell is taken.' }, { quoted: ctx.msg });
      return;
    }

    board[pos - 1] = 'X';
    let result = winner(board);
    if (!result) {
      botMove(board);
      result = winner(board);
    }

    let status = render(board);
    if (result === 'X') {
      status += '\n\nYou win.';
      games.delete(key);
    } else if (result === 'O') {
      status += '\n\nBot wins.';
      games.delete(key);
    } else if (result === 'draw') {
      status += '\n\nDraw.';
      games.delete(key);
    }

    await sock.sendMessage(ctx.chatJid, { text: status }, { quoted: ctx.msg });
  }
};
