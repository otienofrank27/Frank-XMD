import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createCommandRegistry, loadCommands } from '../src/handlers/commandHandler.js';
import { createStatusStore } from '../src/database/statusStore.js';
import { isOwner } from '../src/middleware/permissions.js';
import { sameUser } from '../src/utils/jid.js';

describe('multi-user isolation', () => {
  it('loads distinct stateful command modules for separate linked sessions', async () => {
    const first = createCommandRegistry();
    const second = createCommandRegistry();
    await loadCommands(first, 'session-user-one');
    await loadCommands(second, 'session-user-two');
    assert.notEqual(first.get('tictactoe'), second.get('tictactoe'));
    assert.notEqual(first.get('quiz'), second.get('quiz'));
    assert.equal(first.list().length, second.list().length);
  });

  it('keeps WhatsApp status caches independent', () => {
    const first = createStatusStore();
    const second = createStatusStore();
    first.rememberStatus({ key: { id: 'status-1', remoteJid: 'status@broadcast' }, message: { conversation: 'private status' } });
    assert.equal(first.latestStatus().key.id, 'status-1');
    assert.equal(second.latestStatus(), null);
  });

  it('does not treat a missing sender and empty owner configuration as owner', () => {
    const config = { ownerJid: '', ownerNumber: '' };
    assert.equal(isOwner('', config), false);
    assert.equal(isOwner('not-a-phone@lid', config), false);
  });

  it('matches linked-device JIDs only when their account identity matches', () => {
    assert.equal(sameUser('12345:2@s.whatsapp.net', '12345@s.whatsapp.net'), true);
    assert.equal(sameUser('11111@s.whatsapp.net', '22222@s.whatsapp.net'), false);
  });
});
