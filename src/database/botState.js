import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { logger } from '../utils/logger.js';

const DEFAULT_STATE = {
  prefix: '.',
  autoviewstatus: false,
  autoread: false,
  lastseen: 'available',
  blocked: []
};

export function createBotState(config) {
  const filePath = config.botStatePath;
  mkdirSync(dirname(filePath), { recursive: true });

  let state = {
    ...DEFAULT_STATE,
    prefix: config.prefix,
    autoviewstatus: Boolean(config.autoviewstatus),
    autoread: Boolean(config.autoread),
    lastseen: config.lastseen || 'available'
  };

  if (existsSync(filePath)) {
    try {
      const parsed = JSON.parse(readFileSync(filePath, 'utf8'));
      state = {
        ...state,
        ...parsed,
        prefix: config.prefix,
        autoviewstatus: Boolean(config.autoviewstatus),
        autoread: Boolean(config.autoread),
        lastseen: config.lastseen || parsed.lastseen || 'available'
      };
    } catch (error) {
      logger.warn({ err: error.message }, 'Failed to parse bot state; using defaults');
    }
  }

  let writeChain = Promise.resolve();

  function persist() {
    writeChain = writeChain.then(() => {
      const tmp = `${filePath}.tmp`;
      writeFileSync(tmp, JSON.stringify(state, null, 2), { mode: 0o600 });
      renameSync(tmp, filePath);
    }).catch((error) => {
      logger.error({ err: error.message }, 'Failed to persist bot state');
    });
    return writeChain;
  }

  persist();

  return {
    get() {
      return state;
    },
    set(patch) {
      Object.assign(state, patch);
      persist();
      return state;
    },
    setFlag(flag, value) {
      state[flag] = Boolean(value);
      persist();
      return state;
    }
  };
}

export default createBotState;
