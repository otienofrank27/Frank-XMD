const fs = require('fs');
const path = require('path');
const readline = require('readline');

async function confirmReset() {
  if (process.argv.includes('--yes')) return true;
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error('Session reset requires an interactive terminal. Re-run with --yes only if you intentionally want to unlink this bot session.');
    return false;
  }
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const answer = await new Promise(resolve => rl.question('This deletes the local WhatsApp session and requires re-linking. Continue? (yes/no): ', resolve));
    return answer.trim().toLowerCase() === 'yes';
  } finally {
    rl.close();
  }
}

(async () => {
  if (!await confirmReset()) {
    console.log('Session reset cancelled.');
    process.exitCode = 1;
    return;
  }
  const sessionDir = path.join(process.cwd(), 'session');
  fs.rmSync(sessionDir, { recursive: true, force: true });
  fs.mkdirSync(sessionDir, { recursive: true });
  console.log('WhatsApp session removed. Start FrankXMD and link the account again.');
})().catch(error => {
  console.error('Session reset failed:', error.message);
  process.exitCode = 1;
});
