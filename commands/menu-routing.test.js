const assert = require('assert');
const fs = require('fs');
const path = require('path');

const mainPath = path.join(__dirname, '..', 'main.js');
const helpPath = path.join(__dirname, 'help.js');
const main = fs.readFileSync(mainPath, 'utf8');
const help = fs.readFileSync(helpPath, 'utf8');

const menuCommands = [...help.matchAll(/commands:\s*\[([^\]]*)\]/g)]
  .flatMap(section => [...section[1].matchAll(/'([^']+)'/g)].map(match => match[1]));

const extraRouted = new Set([
  'info', 'runtime', 'speed', 'time', 'support', 'feedback',
  'remind', 'reminders', 'cancelreminder', 'membercount', 'members',
  'calc', 'qr', 'b64e', 'b64d', 'reverse', 'upper', 'lower', 'poll',
  'grouplink', 'getpp', 'define', 'wikipedia', 'google', 'currency',
  'country', 'ip', 'unit'
]);

const missing = menuCommands.filter(command =>
  !main.includes('.' + command) && !extraRouted.has(command)
);
assert.deepStrictEqual(missing, [], 'Every command displayed in .menu must have a dispatch route.');

const importPaths = [...main.matchAll(/require\(['"](\.\/(?:commands|lib)\/[^'"]+)['"]\)/g)]
  .map(match => match[1]);
const missingModules = [...new Set(importPaths)].filter(modulePath =>
  !fs.existsSync(path.join(__dirname, '..', modulePath + '.js')) &&
  !fs.existsSync(path.join(__dirname, '..', modulePath, 'index.js'))
);
assert.deepStrictEqual(missingModules, [], 'Every statically imported command/library module must exist.');

console.log('Menu routing tests passed for ' + menuCommands.length + ' commands.');
console.log('Static command and library imports resolved: ' + new Set(importPaths).size + '.');
