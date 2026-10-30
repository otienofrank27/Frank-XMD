import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createCommandRegistry } from '../src/handlers/commandHandler.js';
import { parseCommand } from '../src/utils/messages.js';
import { createRateLimiter } from '../src/middleware/rateLimiter.js';

describe('command parsing', () => {
  it('parses prefixed commands, aliases-ready names, and arguments', () => {
    const parsed = parseCommand('.kick @user extra', '.');
    assert.deepEqual(parsed, {
      name: 'kick',
      args: ['@user', 'extra'],
      rawArgs: '@user extra',
      full: 'kick @user extra'
    });
  });

  it('returns null when prefix does not match or command is empty', () => {
    assert.equal(parseCommand('kick now', '.'), null);
    assert.equal(parseCommand('.', '.'), null);
    assert.equal(parseCommand('', '.'), null);
    assert.equal(parseCommand('!ping', '.'), null);
  });

  it('normalizes extra whitespace and lowercases the command name', () => {
    const parsed = parseCommand('  .MENU   all  ', '.');
    assert.equal(parsed.name, 'menu');
    assert.deepEqual(parsed.args, ['all']);
  });
});

describe('command registry', () => {
  it('registers commands, aliases, and prevents duplicates', () => {
    const registry = createCommandRegistry();
    registry.register({
      name: 'ping',
      aliases: ['p'],
      execute: async () => {}
    });

    assert.equal(registry.get('ping').name, 'ping');
    assert.equal(registry.get('P').name, 'ping');
    assert.equal(registry.get('missing'), null);
    assert.equal(registry.list().length, 1);

    assert.throws(() => {
      registry.register({ name: 'p', execute: async () => {} });
    }, /Duplicate command/);
  });

  it('rejects invalid command exports', () => {
    const registry = createCommandRegistry();
    assert.throws(() => registry.register({ name: 'x' }), /Invalid command/);
    assert.throws(() => registry.register({ execute: () => {} }), /Invalid command/);
  });

  it('parses text through the registry using the configured prefix', () => {
    const registry = createCommandRegistry();
    const parsed = registry.parse('.help ping', '.');
    assert.equal(parsed.name, 'help');
    assert.deepEqual(parsed.args, ['ping']);
  });
});

describe('rate limiter', () => {
  it('enforces a sliding window and command cooldown', () => {
    const limiter = createRateLimiter({
      rateLimitMax: 2,
      rateLimitWindowMs: 10_000,
      commandCooldownMs: 1000
    });

    const first = limiter.checkRateLimit('1@s.whatsapp.net', 1000);
    const second = limiter.checkRateLimit('1@s.whatsapp.net', 1001);
    const third = limiter.checkRateLimit('1@s.whatsapp.net', 1002);
    assert.equal(first.allowed, true);
    assert.equal(second.allowed, true);
    assert.equal(third.allowed, false);

    const cool1 = limiter.checkCooldown('1@s.whatsapp.net', 'ping', 2000);
    const cool2 = limiter.checkCooldown('1@s.whatsapp.net', 'ping', 2500);
    const cool3 = limiter.checkCooldown('1@s.whatsapp.net', 'ping', 3100);
    assert.equal(cool1.allowed, true);
    assert.equal(cool2.allowed, false);
    assert.equal(cool3.allowed, true);
  });
});
