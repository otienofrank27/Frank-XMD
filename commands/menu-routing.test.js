const assert = require('assert');
const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, '..', 'main.js');
const helpPath = path.join(__dirname, 'help.js');
const extraPath = path.join(__dirname, 'extra.js');
const main = fs.readFileSync(mainPath, 'utf8');
const help = fs.readFileSync(helpPath, 'utf8');
const extra = fs.readFileSync(extraPath, 'utf8');

const menuCommands = [...help.matchAll(/commands:\s*\[([^\]]*)\]/g)]
  .flatMap(section => [...section[1].matchAll(/'([^']+)'/g)].map(match => match[1]));

const routedCommands = new Set();

// Commands dispatched directly by exact-match or prefix-match cases.
for (const match of main.matchAll(/userMessage\.startsWith\('\.([a-z0-9_-]+)\s?'\)/gi)) {
  routedCommands.add(match[1].toLowerCase());
}
for (const match of main.matchAll(/userMessage\s*===\s*'\.([a-z0-9_-]+)'/gi)) {
  routedCommands.add(match[1].toLowerCase());
}

// Commands dispatched through regular-expression switch cases.
for (const pattern of [
  /case\s+\/\^\\\.\(\?:([^)]*)\)/g,
  /case\s+\/\^\\\.\(([^)]*)\)/g,
  /case\s+\/\^\\\.([a-z0-9_-]+)/gi
]) {
  for (const match of main.matchAll(pattern)) {
    for (const command of match[1].split('|')) {
      const normalized = command.replace(/[^a-z0-9_-]/gi, '').toLowerCase();
      if (normalized) routedCommands.add(normalized);
    }
  }
}

// Extra utilities must be present both in the main dispatcher and extra.js.
const extraHandlers = new Set(
  [...extra.matchAll(/case\s+'([^']+)'/g)].map(match => match[1].toLowerCase())
);
const extraDispatch = main.match(
  /case\s+\/\^\\\.\(([^)]*)\)\(\?:\\s\|\$\)\/\.test\(userMessage\)/
);
if (extraDispatch) {
  for (const command of extraDispatch[1].split('|')) {
    const normalized = command.toLowerCase();
    if (extraHandlers.has(normalized)) routedCommands.add(normalized);
  }
}

const missing = [...new Set(menuCommands)].filter(command => !routedCommands.has(command));
assert.deepStrictEqual(
  missing,
  [],
  'Every command displayed in .menu must have a real command-dispatch case.'
);

const importPaths = [...main.matchAll(/require\(['"](\.\/(?:commands|lib)\/[^'"]+)['"]\)/g)]
  .map(match => match[1]);
const missingModules = [...new Set(importPaths)].filter(modulePath =>
  !fs.existsSync(path.join(__dirname, '..', modulePath + '.js')) &&
  !fs.existsSync(path.join(__dirname, '..', modulePath, 'index.js'))
);
assert.deepStrictEqual(
  missingModules,
  [],
  'Every statically imported command/library module must exist.'
);

assert(main.includes('function unwrapMessageContent(content)'),
  'The dispatcher must unwrap common WhatsApp message wrappers.');
assert(main.includes('rawText.slice(commandLength).trim()'),
  'Translate commands must preserve the original casing of user text.');
assert(main.includes('Unknown command:'),
  'Unknown commands must return a helpful reply instead of failing silently.');

console.log('Menu routing tests passed for ' + new Set(menuCommands).size + ' commands.');
console.log('Static command and library imports resolved: ' + new Set(importPaths).size + '.');
