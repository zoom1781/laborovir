import { createInterface } from 'node:readline';
import { randomUUID } from 'node:crypto';
import type { ChannelAdapter, Message } from '../types.js';

export default class StdinAdapter implements ChannelAdapter {
  name = 'stdin';
  private handler?: (msg: Message) => void;
  private rl?: ReturnType<typeof createInterface>;

  async connect(): Promise<void> {
    this.rl = createInterface({ input: process.stdin, output: process.stdout });
    this.rl.on('line', (line) => {
      if (this.handler && line.trim()) {
        this.handler({
          id: randomUUID(),
          channel: 'stdin',
          userId: 'local',
          text: line.trim(),
          timestamp: Date.now(),
        });
      }
    });
  }

  async disconnect(): Promise<void> {
    this.rl?.close();
  }

  async send(_userId: string, text: string): Promise<void> {
    console.log(text);
  }

  onMessage(handler: (msg: Message) => void): void {
    this.handler = handler;
  }
}
