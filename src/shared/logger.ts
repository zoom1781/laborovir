import pino from 'pino';
import { APP_NAME } from './constants.js';

export const logger = pino({
  name: APP_NAME,
  level: process.env.LOG_LEVEL ?? 'info',
  transport: process.stdout.isTTY
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});
