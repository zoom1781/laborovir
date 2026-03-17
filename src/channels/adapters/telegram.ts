import type { ChannelAdapter, Message } from '../types.js';
import type { ChannelConfig } from '../../config/schema.js';

export default class TelegramAdapter implements ChannelAdapter {
  name = 'telegram';
  private config: ChannelConfig;
  private handler?: (msg: Message) => void;

  constructor(config: ChannelConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    // TODO: Initialize Telegram bot with this.config.token
    console.log('Telegram adapter connected (stub)');
  }

  async disconnect(): Promise<void> {
    // TODO: Stop polling / close webhook
  }

  async send(userId: string, text: string): Promise<void> {
    // TODO: Send message via Telegram API
    console.log(`[telegram → ${userId}] ${text}`);
  }

  onMessage(handler: (msg: Message) => void): void {
    this.handler = handler;
  }
}
