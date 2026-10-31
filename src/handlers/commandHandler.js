import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { logger } from '../utils/logger.js';
import { parseCommand } from '../utils/messages.js';

export function createCommandRegistry() {
  const commands = new Map();

  function register(command) {
    if (!command?.name || typeof command.execute !== 'function') {
      throw new Error('Invalid command export: name and execute are required');
    }

    const names = [command.name, ...(command.aliases || [])].map((n) => String(n).toLowerCase());
    for (const name of names) {
      if (commands.has(name)) {
        throw new Error(`Duplicate command name or alias: ${name}`);
      }
      commands.set(name, command);
    }
  }

  function get(name) {
    return commands.get(String(name || '').toLowerCase()) || null;
  }

  function list() {
    const unique = new Map();
    for (const command of commands.values()) {
      unique.set(command.name, command);
    }
    return [...unique.values()];
  }

  function parse(text, prefix) {
    return parseCommand(text, prefix);
  }

  return { register, get, list, parse };
}

export async function loadCommands(registry, cacheKey = '') {
  const baseDir = join(dirname(fileURLToPath(import.meta.url)), '../commands');
  const categories = ['general', 'admin', 'media', 'downloader', 'owner', 'fun', 'tools'];

  for (const category of categories) {
    const dir = join(baseDir, category);
    let files = [];
    try {
      files = readdirSync(dir).filter((file) => file.endsWith('.js'));
    } catch (error) {
      logger.warn({ dir, err: error.message }, 'Command category directory missing');
      continue;
    }

    for (const file of files) {
      const fullPath = join(dir, file);
      const moduleUrl = pathToFileURL(fullPath).href + (cacheKey ? `?session=${encodeURIComponent(cacheKey)}` : '');
      const mod = await import(moduleUrl);
      const command = mod.default || mod.command;
      if (!command) {
        logger.warn({ file: fullPath }, 'Command file has no default export');
        continue;
      }
      command.category = command.category || category;
      registry.register(command);
      logger.debug({ name: command.name, file }, 'Loaded command');
    }
  }

  logger.info({ count: registry.list().length }, 'Command plugins loaded');
  return registry;
}

export default {
  createCommandRegistry,
  loadCommands
};
