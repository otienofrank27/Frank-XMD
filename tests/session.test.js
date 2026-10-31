import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { decodeSession, encodeSession } from '../src/utils/session.js';
import { loadConfig } from '../src/config/config.js';

describe('WhatsApp credential safety', () => {
  it('does not export credentials as shareable session IDs', () => {
    assert.throws(() => encodeSession({ registered: true }), /disabled/i);
  });
  it('does not restore credentials from legacy session IDs', () => {
    assert.equal(decodeSession('eyJyZWdpc3RlcmVkIjp0cnVlfQ'), null);
  });
  it('allows dashboard mode without a global WhatsApp owner number', () => {
    const config = loadConfig();
    assert.equal(typeof config.ownerNumber, 'string');
    assert.equal(typeof config.sessionId, 'string');
  });
});
