import type { ChannelAdapter } from './types.js';
import type { Config } from '../config/schema.js';
import { logger } from '../shared/logger.js';

const adapters = new Map<string, ChannelAdapter>();

export async function loadAdapters(config: Config): Promise<void> {
  for (const ch of config.channels) {
    if (!ch.enabled) continue;
    try {
      const mod = await import(`./adapters/${ch.type}.js`);
      const adapter: ChannelAdapter = new mod.default(ch);
      adapters.set(ch.type, adapter);
      await adapter.connect();
      logger.info(`Channel ${ch.type} connected`);
    } catch (err) {
      logger.warn({ err }, `Failed to load channel adapter: ${ch.type}`);
    }
  }
}

export function getAdapter(name: string): ChannelAdapter | undefined {
  return adapters.get(name);
}

export async function disconnectAll(): Promise<void> {
  for (const [name, adapter] of adapters) {
    try {
      await adapter.disconnect();
      logger.info(`Channel ${name} disconnected`);
    } catch (err) {
      logger.warn({ err }, `Error disconnecting ${name}`);
    }
  }
  adapters.clear();
}
