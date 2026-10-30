import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isOwner,
  isTrustedNumber,
  isGroupAdmin,
  canUseAdminCommands,
  resolveTargetJid,
  getParticipant,
  isBotAdmin
} from '../src/middleware/permissions.js';

const config = {
  ownerNumber: '1234567890',
  ownerJid: '1234567890@s.whatsapp.net',
  trustedNumbers: ['9998887777']
};

const metadata = {
  participants: [
    { id: '1234567890@s.whatsapp.net', admin: 'superadmin' },
    { id: '1111111111@s.whatsapp.net', admin: 'admin' },
    { id: '2222222222@s.whatsapp.net', admin: null },
    { id: '3333333333@s.whatsapp.net' },
    { id: 'botuser@s.whatsapp.net', admin: 'admin' },
    { id: '123456789012345@lid', phoneNumber: '4444444444@s.whatsapp.net', admin: null }
  ]
};

describe('permissions middleware', () => {
  it('identifies the configured owner by JID and number', () => {
    assert.equal(isOwner('1234567890@s.whatsapp.net', config), true);
    assert.equal(isOwner('1234567890:12@s.whatsapp.net', config), true);
    assert.equal(isOwner('1111111111@s.whatsapp.net', config), false);
  });

  it('identifies trusted numbers', () => {
    assert.equal(isTrustedNumber('9998887777@s.whatsapp.net', config), true);
    assert.equal(isTrustedNumber('1111111111@s.whatsapp.net', config), false);
  });

  it('detects group admins from fresh metadata', () => {
    assert.equal(isGroupAdmin(metadata, '1111111111@s.whatsapp.net'), true);
    assert.equal(isGroupAdmin(metadata, '2222222222@s.whatsapp.net'), false);
    assert.equal(isGroupAdmin(metadata, 'missing@s.whatsapp.net'), false);
  });

  it('allows owner to use admin commands even outside groups', () => {
    const ownerCtx = { senderJid: '1234567890@s.whatsapp.net', isGroup: false };
    assert.equal(canUseAdminCommands(ownerCtx, null, config), true);
  });

  it('rejects regular members for admin commands', () => {
    const memberCtx = { senderJid: '2222222222@s.whatsapp.net', isGroup: true };
    assert.equal(canUseAdminCommands(memberCtx, metadata, config), false);
  });

  it('allows group admins for admin commands', () => {
    const adminCtx = { senderJid: '1111111111@s.whatsapp.net', isGroup: true };
    assert.equal(canUseAdminCommands(adminCtx, metadata, config), true);
  });

  it('resolves targets from mentions, quotes, or numbers', () => {
    assert.equal(
      resolveTargetJid({ mentions: ['555@s.whatsapp.net'], quoted: null }, ''),
      '555@s.whatsapp.net'
    );
    assert.equal(
      resolveTargetJid({ mentions: [], quoted: { participant: '666@s.whatsapp.net' } }, ''),
      '666@s.whatsapp.net'
    );
    assert.equal(
      resolveTargetJid({ mentions: [], quoted: null }, '+1 (777) 888-9999'),
      '17778889999@s.whatsapp.net'
    );
    assert.equal(resolveTargetJid({ mentions: [], quoted: null }, ''), null);
  });

  it('finds participants and bot admin status', () => {
    assert.ok(getParticipant(metadata, '3333333333@s.whatsapp.net'));
    assert.ok(getParticipant(metadata, '123456789012345@lid'));
    assert.ok(getParticipant(metadata, '4444444444@s.whatsapp.net'));
    const sock = { user: { id: 'botuser:1@s.whatsapp.net' } };
    assert.equal(isBotAdmin(metadata, sock), true);
    const nonAdminSock = { user: { id: '2222222222@s.whatsapp.net' } };
    assert.equal(isBotAdmin(metadata, nonAdminSock), false);
  });
});
