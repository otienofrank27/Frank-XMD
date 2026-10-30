import { loadConfig } from './src/config/config.js';
import { logger } from './src/utils/logger.js';
import { createGroupSettings } from './src/database/groupSettings.js';
import { createBotState } from './src/database/botState.js';
import { createRateLimiter } from './src/middleware/rateLimiter.js';
import { createCommandRegistry, loadCommands } from './src/handlers/commandHandler.js';
import { createConnectionManager } from './src/connection/connection.js';

async function main() {
  const config = loadConfig();
  logger.info({ bot: config.botName, prefix: config.prefix, owner: config.ownerName }, 'Starting WhatsApp bot');

  const settings = createGroupSettings(config);
  const botState = createBotState(config);
  if (botState.get().prefix) {
    config.prefix = botState.get().prefix;
  }
  const rateLimiter = createRateLimiter(config);
  const commandRegistry = createCommandRegistry();
  await loadCommands(commandRegistry);

  const connection = createConnectionManager({
    config,
    settings,
    botState,
    commandRegistry,
    rateLimiter
  });

  const shutdown = async (signal) => {
    logger.info({ signal }, 'Shutting down');
    await connection.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('unhandledRejection', (reason) => {
    logger.error({ err: reason instanceof Error ? reason.message : String(reason) }, 'Unhandled rejection');
  });
  process.on('uncaughtException', (error) => {
    logger.error({ err: error.message }, 'Uncaught exception');
  });

  await connection.start();
}

main().catch((error) => {
  logger.error({ err: error.message }, 'Fatal startup error');
  process.exit(1);
});
