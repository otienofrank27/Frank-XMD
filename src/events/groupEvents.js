import { logger } from '../utils/logger.js';
import { sendWithMentions } from '../utils/messages.js';
import { stripJidDevice } from '../utils/jid.js';

export function registerGroupEvents(sock, { config, settings }) {
  sock.ev.on('group-participants.update', async (event) => {
    try {
      const groupJid = event.id;
      if (!groupJid) {
        return;
      }

      const group = settings.getGroup(groupJid);
      const participants = event.participants || [];
      if (!participants.length) {
        return;
      }

      let metadata;
      try {
        metadata = await sock.groupMetadata(groupJid);
      } catch (error) {
        logger.warn({ err: error.message, groupJid }, 'Failed to load metadata for group event');
        return;
      }

      const subject = metadata.subject || 'this group';

      if (event.action === 'add' && group.welcome) {
        const mentions = participants.map(stripJidDevice);
        const tags = mentions.map((jid) => `@${jid.split('@')[0]}`).join(' ');
        const template = config?.welcomeMessage || 'Welcome {user} to {group}. Please follow the group rules.';
        const text = template.replaceAll('{user}', tags).replaceAll('{group}', subject);
        await sendWithMentions(sock, groupJid, text, mentions);
      }

      if ((event.action === 'remove' || event.action === 'leave') && group.goodbye) {
        const mentions = participants.map(stripJidDevice);
        const tags = mentions.map((jid) => `@${jid.split('@')[0]}`).join(' ');
        const template = config?.goodbyeMessage || '{user} left {group}.';
        const text = template.replaceAll('{user}', tags).replaceAll('{group}', subject);
        await sendWithMentions(sock, groupJid, text, mentions);
      }
    } catch (error) {
      logger.error({ err: error.message }, 'group-participants.update handler failed');
    }
  });

  sock.ev.on('groups.update', async (updates) => {
    for (const update of updates || []) {
      logger.debug({ id: update.id, subject: update.subject }, 'Group updated');
    }
  });
}

export default registerGroupEvents;
