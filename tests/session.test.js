import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { decodeSession, encodeSession } from '../src/utils/session.js';
import { loadConfig } from '../src/config/config.js';

describe('session id', () => {
  it('round-trips WhatsApp creds through sessionId', () => {
    const creds = { me: { id: '254748642275:1@s.whatsapp.net' }, registered: true };
    const sessionId = encodeSession(creds);
    assert.ok(sessionId.length > 10);
    assert.equal(sessionId.includes('+'), false);
    assert.deepEqual(decodeSession(sessionId), creds);
  });

  it('rejects empty or invalid sessionId', () => {
    assert.equal(decodeSession(''), null);
    assert.equal(decodeSession('not-valid'), null);
  });

  it('exposes ownerNumber and sessionId from the settings file', () => {
    const config = loadConfig();
    assert.equal(config.ownerNumber, '254748642275');
    assert.match(config.settingsFile, /\/settings$/);
    assert.equal(typeof config.sessionId, 'string');
  });
});
