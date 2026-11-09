const fs = require('fs');
const path = require('path');

const root = process.cwd();
const targets = ['tmp', 'temp'];
let removed = 0;

for (const name of targets) {
  const directory = path.join(root, name);
  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory, { recursive: true });
    continue;
  }
  const stat = fs.lstatSync(directory);
  if (!stat.isDirectory() || stat.isSymbolicLink()) {
    throw new Error(`Refusing to clean non-directory path: ${directory}`);
  }
  for (const entry of fs.readdirSync(directory)) {
    fs.rmSync(path.join(directory, entry), { recursive: true, force: true });
    removed += 1;
  }
}
console.log(`Cleanup complete. Removed ${removed} temporary item(s).`);
