import type { ChannelAdapter, Message } from '../types.js';
import type { ChannelConfig } from '../../config/schema.js';

export default class WhatsAppAdapter implements ChannelAdapter {
  name = 'whatsapp';
  private config: ChannelConfig;
  private handler?: (msg: Message) => void;

  constructor(config: ChannelConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    // TODO: Initialize WhatsApp client with this.config.token
    console.log('WhatsApp adapter connected (stub)');
  }

  async disconnect(): Promise<void> {
    // TODO: Disconnect WhatsApp client
  }

  async send(userId: string, text: string): Promise<void> {
    // TODO: Send message via WhatsApp API
    console.log(`[whatsapp → ${userId}] ${text}`);
  }

  onMessage(handler: (msg: Message) => void): void {
    this.handler = handler;
  }
}
