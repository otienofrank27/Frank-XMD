import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pino from 'pino';

const __dirname = dirname(fileURLToPath(import.meta.url));
const logsDir = join(__dirname, '../../logs');

mkdirSync(logsDir, { recursive: true });

const level = process.env.LOG_LEVEL || 'info';

export const logger = pino({
  level,
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      'auth',
      'creds',
      'keys',
      'noiseKey',
      'signedIdentityKey',
      'signedPreKey',
      'registrationId',
      'advSecretKey',
      'pairingEphemeralKeyPair',
      'signalIdentities',
      '*.password',
      '*.token',
      '*.secret'
    ],
    censor: '[REDACTED]'
  },
  transport: {
    targets: [
      {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard',
          ignore: 'pid,hostname'
        },
        level
      },
      {
        target: 'pino/file',
        options: {
          destination: join(logsDir, 'bot.log'),
          mkdir: true
        },
        level
      }
    ]
  }
});

export function childLogger(bindings) {
  return logger.child(bindings);
}

export default logger;
