import type { ChannelAdapter, Message } from '../types.js';
import type { ChannelConfig } from '../../config/schema.js';

export default class SlackAdapter implements ChannelAdapter {
  name = 'slack';
  private config: ChannelConfig;
  private handler?: (msg: Message) => void;

  constructor(config: ChannelConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    // TODO: Initialize Slack bot with this.config.token
    console.log('Slack adapter connected (stub)');
  }

  async disconnect(): Promise<void> {
    // TODO: Disconnect Slack RTM / socket
  }

  async send(userId: string, text: string): Promise<void> {
    // TODO: Send message via Slack API
    console.log(`[slack → ${userId}] ${text}`);
  }

  onMessage(handler: (msg: Message) => void): void {
    this.handler = handler;
  }
}
