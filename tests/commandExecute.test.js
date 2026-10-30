import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { loadConfig } from '../src/config/config.js';
import { createCommandRegistry, loadCommands } from '../src/handlers/commandHandler.js';
import { createGroupSettings } from '../src/database/groupSettings.js';
import { createBotState } from '../src/database/botState.js';
import { parseCommand } from '../src/utils/messages.js';
import { renderMenuImage } from '../src/utils/menuImage.js';

function mockSock() {
  const sent = [];
  return {
    sent,
    user: { id: '254748642275:1@s.whatsapp.net' },
    async sendMessage(jid, content) {
      sent.push({ jid, content });
      return { key: { id: 'mock', remoteJid: jid, fromMe: true } };
    },
    async groupMetadata() {
      return {
        id: '120363@g.us',
        subject: 'Test Group',
        desc: 'Demo',
        creation: Math.floor(Date.now() / 1000),
        announce: false,
        restrict: false,
        participants: [
          { id: '254748642275@s.whatsapp.net', admin: 'superadmin' },
          { id: '254700000000@s.whatsapp.net', admin: 'admin' },
          { id: '254711111111@s.whatsapp.net', admin: null }
        ]
      };
    },
    async groupParticipantsUpdate() {
      return [{ status: 200 }];
    },
    async groupUpdateSubject() {},
    async groupUpdateDescription() {},
    async groupSettingUpdate() {},
    async groupInviteCode() {
      return 'ABCDEF';
    },
    async groupRevokeInvite() {
      return 'NEWCODE';
    },
    async groupLeave() {},
    async groupAcceptInvite() {
      return '120363@g.us';
    },
    async groupFetchAllParticipating() {
      return { '120363@g.us': { id: '120363@g.us', subject: 'Test Group' } };
    },
    async onWhatsApp(jid) {
      return [{ exists: true, jid }];
    },
    async updateBlockStatus() {},
    async fetchPrivacySettings() {
      return { lastSeen: 'all' };
    },
    async updateLastSeenPrivacy() {},
    async readMessages() {},
    updateMediaMessage: async () => {}
  };
}

function ctxFor(commandName, extra = {}) {
  const chatJid = extra.chatJid || '120363@g.us';
  return {
    chatJid,
    senderJid: '254748642275@s.whatsapp.net',
    isGroup: chatJid.endsWith('@g.us'),
    fromMe: false,
    text: `.${commandName}`,
    args: extra.args || [],
    rawArgs: extra.rawArgs || (extra.args || []).join(' '),
    mentions: extra.mentions || ['254711111111@s.whatsapp.net'],
    quoted: extra.quoted || null,
    msg: { key: { id: 'm1', remoteJid: chatJid, participant: '254748642275@s.whatsapp.net' } },
    key: { id: 'm1', remoteJid: chatJid },
    commandName,
    invoked: extra.invoked || commandName,
    unwrapped: extra.unwrapped || { conversation: `.${commandName}` }
  };
}

const SKIP_EXECUTE = new Set(['restart', 'shutdown']);

describe('settings and menu image', () => {
    it('loads owner identity from the settings file', () => {
    const config = loadConfig();
    assert.equal(config.ownerName, 'Frank');
    assert.equal(config.ownerNumber, '254748642275');
    assert.equal(config.ownerCountry, 'KE');
    assert.ok(config.settingsFile.endsWith('settings'));
    assert.equal(typeof config.sessionId, 'string');
    assert.equal(config.workInGroups, true);
    assert.equal(config.workInPrivate, true);
  });

  it('renders a JPEG menu image', async () => {
    const config = loadConfig();
    const registry = createCommandRegistry();
    await loadCommands(registry);
    const buffer = await renderMenuImage({ config, registry, extra: { banner: 'Login successful. Bot is online.' } });
    assert.ok(Buffer.isBuffer(buffer));
    assert.ok(buffer.length > 20000);
    assert.equal(buffer[0], 0xff);
    assert.equal(buffer[1], 0xd8);
    assert.ok(existsSync(config.menu.backgroundPath));
    assert.ok(existsSync(config.menu.techImagePath));
  });
});

describe('every command executes', () => {
  it('parses and runs each registered command without throwing', async () => {
    const config = loadConfig();
    const settings = createGroupSettings(config);
    const botState = createBotState(config);
    const registry = createCommandRegistry();
    await loadCommands(registry);
    const sock = mockSock();
    const metadata = await sock.groupMetadata();
    const failures = [];

    for (const command of registry.list()) {
      const names = [command.name, ...(command.aliases || [])];
      for (const name of names) {
        const parsed = parseCommand(`.${name}`, config.prefix);
        assert.ok(parsed, `failed to parse .${name}`);
        assert.equal(registry.get(parsed.name)?.name, command.name);

        if (SKIP_EXECUTE.has(command.name)) {
          continue;
        }

        const extra = {};
        if (['kick', 'promote', 'demote', 'warn', 'resetwarn', 'warnings', 'block', 'unblock'].includes(command.name)) {
          extra.args = ['254711111111'];
          extra.mentions = ['254711111111@s.whatsapp.net'];
        }
        if (['add', 'join'].includes(command.name)) {
          extra.args = command.name === 'join' ? ['ABCDEFGH'] : ['254711111111'];
          extra.rawArgs = extra.args[0];
        }
        if (['groupname', 'groupdesc', 'broadcast', 'setprefix', 'tagall', 'hidetag', 'quote'].includes(command.name)) {
          extra.args = command.name === 'setprefix' ? ['.'] : ['hello'];
          extra.rawArgs = extra.args.join(' ');
        }
        if (['antilink', 'welcome', 'goodbye', 'antispam', 'antidelete', 'antiviewonce', 'antiword', 'mute', 'unmute', 'autoviewstatus', 'autoread'].includes(command.name)) {
          extra.args = ['on'];
        }
        if (['ytmp3', 'ytmp4', 'ig', 'spotify', 'google', 'wiki'].includes(command.name)) {
          extra.args = command.name === 'google' || command.name === 'wiki' ? ['kenya'] : ['https://example.com'];
          extra.rawArgs = extra.args.join(' ');
        }
        if (['help', 'tictactoe', 'quiz', 'wordle', 'mathgame', 'roll'].includes(command.name)) {
          extra.args = command.name === 'help' ? ['ping'] : ['start'];
        }
        if (command.name === 'lastseen') {
          extra.args = ['all'];
        }

        const groupCtx = ctxFor(command.name, extra);
        groupCtx.invoked = name;
        try {
          await command.execute({ sock, ctx: groupCtx, config, settings, botState, metadata, registry });
        } catch (error) {
          failures.push(`group .${name}: ${error.message}`);
        }

        if (!command.groupOnly) {
          const dmCtx = ctxFor(command.name, { ...extra, chatJid: '254748642275@s.whatsapp.net' });
          dmCtx.invoked = name;
          try {
            await command.execute({ sock, ctx: dmCtx, config, settings, botState, metadata: null, registry });
          } catch (error) {
            failures.push(`dm .${name}: ${error.message}`);
          }
        }
      }
    }

    assert.equal(failures.length, 0, failures.join('\n'));
  });
});
