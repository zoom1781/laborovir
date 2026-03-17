import type { ChannelAdapter, Message } from '../types.js';
import type { ChannelConfig } from '../../config/schema.js';

export default class DiscordAdapter implements ChannelAdapter {
  name = 'discord';
  private config: ChannelConfig;
  private handler?: (msg: Message) => void;

  constructor(config: ChannelConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    // TODO: Initialize Discord bot with this.config.token
    console.log('Discord adapter connected (stub)');
  }

  async disconnect(): Promise<void> {
    // TODO: Destroy Discord client
  }

  async send(userId: string, text: string): Promise<void> {
    // TODO: Send message via Discord API
    console.log(`[discord → ${userId}] ${text}`);
  }

  onMessage(handler: (msg: Message) => void): void {
    this.handler = handler;
  }
}
