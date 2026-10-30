import { logger } from '../utils/logger.js';
import { sendText } from '../utils/messages.js';

export function publicErrorMessage(error) {
  const status = error?.output?.statusCode || error?.status || error?.statusCode;
  const message = String(error?.message || error || 'Unknown error');

  if (status === 403 || /not.?admin|forbidden|not authorized/i.test(message)) {
    return 'Action rejected: the bot needs group admin permission, or WhatsApp denied the request.';
  }
  if (status === 408 || /timed?\s?out/i.test(message)) {
    return 'WhatsApp timed out. Try again in a moment.';
  }
  if (/not.?in.?group|not a participant|no longer a participant/i.test(message)) {
    return 'That user is not a group participant.';
  }
  if (/rate.?limit|too many/i.test(message)) {
    return 'Rate limited by WhatsApp. Slow down and retry.';
  }

  return 'The action could not be completed. WhatsApp rejected or failed the request.';
}

export async function handleCommandError(error, ctx, sock) {
  logger.error({
    err: error?.message || String(error),
    command: ctx?.commandName,
    chatJid: ctx?.chatJid,
    senderJid: ctx?.senderJid
  }, 'Command execution failed');

  try {
    await sendText(sock, ctx.chatJid, publicErrorMessage(error), { quoted: ctx.msg });
  } catch (sendError) {
    logger.error({ err: sendError?.message }, 'Failed to send error reply');
  }
}

export function wrapAsync(fn) {
  return async (...args) => {
    try {
      return await fn(...args);
    } catch (error) {
      logger.error({ err: error?.message || String(error) }, 'Unhandled async error');
    }
  };
}

export default {
  publicErrorMessage,
  handleCommandError,
  wrapAsync
};
