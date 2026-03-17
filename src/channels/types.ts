export interface Message {
  id: string;
  channel: string;
  userId: string;
  text: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

export interface ChannelAdapter {
  name: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  send(userId: string, text: string): Promise<void>;
  onMessage(handler: (msg: Message) => void): void;
}
