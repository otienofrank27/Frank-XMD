const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const packageJson = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
const sourceFiles = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (['node_modules', '.git'].includes(entry.name)) continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(fullPath);
    else if (entry.isFile() && entry.name.endsWith('.js')) sourceFiles.push(fullPath);
  }
}

walk(root);
const missingImports = [];
for (const file of sourceFiles) {
  const source = fs.readFileSync(file, 'utf8');
  for (const match of source.matchAll(/require\(['"]([^'"]+)['"]\)/g)) {
    const request = match[1];
    if (!request.startsWith('.')) continue;
    const base = path.resolve(path.dirname(file), request);
    if (![base, base + '.js', base + '.json', path.join(base, 'index.js'), path.join(base, 'index.json')]
      .some(candidate => fs.existsSync(candidate))) {
      missingImports.push(`${path.relative(root, file)} -> ${request}`);
    }
  }
}
assert.deepStrictEqual(missingImports, [], 'Every relative CommonJS import must resolve.');

const missingScriptFiles = [];
for (const [name, command] of Object.entries(packageJson.scripts || {})) {
  for (const match of command.matchAll(/(?:^|&&|\|\|)\s*node\s+(?!-)[^\s&|]+/g)) {
    const target = match[0].replace(/^(?:&&|\|\|)?\s*node\s+/, '').trim();
    if (target.startsWith('-')) continue;
    if (!fs.existsSync(path.resolve(root, target))) missingScriptFiles.push(`${name} -> ${target}`);
  }
}
assert.deepStrictEqual(missingScriptFiles, [], 'Every package script must reference an existing file.');


const entrypoint = fs.readFileSync(path.join(root, 'index.js'), 'utf8');
assert(entrypoint.includes('const pairingCode = !process.argv.includes("--qr-login")'),
  'Pairing-code login must be the default; QR login must require the explicit --qr-login flag.');
assert(entrypoint.includes('for (const mek of chatUpdate.messages)') &&
  entrypoint.includes('messages: [mek]'),
  'Every message in a WhatsApp upsert batch must be processed individually.');

const dispatcher = fs.readFileSync(path.join(root, 'main.js'), 'utf8');
assert(/ownerCommands\s*=\s*\[[^\]]*'\.pair'/.test(dispatcher),
  'Pairing-code requests must be restricted to owner/sudo users.');

const menu = fs.readFileSync(path.join(root, 'commands', 'help.js'), 'utf8');
assert(menu.includes('data.isPublic === false'),
  'The menu must display the persisted public/private mode.');

const config = fs.readFileSync(path.join(root, 'config.js'), 'utf8');
const settings = fs.readFileSync(path.join(root, 'settings.js'), 'utf8');
assert(!/global\.APIKeys\s*=\s*\{[\s\S]*?['"][^'"]+['"]\s*:\s*['"][^'"]+['"]/.test(config),
  'Provider credentials must not be hard-coded in config.js.');
assert(!/ApiKey:\s*process\.env\.[A-Z0-9_]+\s*\|\|\s*['"][^'"]+['"]/.test(settings),
  'Provider credentials must not have hard-coded fallback values.');

console.log(`Repository integrity checks passed for ${sourceFiles.length} JavaScript files.`);
