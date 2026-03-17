import { EventEmitter } from 'node:events';

export interface GatewayEvents {
  'message:in': (msg: { channel: string; sessionId: string; text: string; userId?: string }) => void;
  'message:out': (msg: { channel: string; sessionId: string; text: string }) => void;
  'agent:thinking': (data: { sessionId: string }) => void;
  'agent:tool_use': (data: { sessionId: string; tool: string; input: unknown }) => void;
  'error': (err: Error) => void;
}

class TypedEventEmitter extends EventEmitter {
  override emit<K extends keyof GatewayEvents>(event: K, ...args: Parameters<GatewayEvents[K]>): boolean {
    return super.emit(event, ...args);
  }
  override on<K extends keyof GatewayEvents>(event: K, listener: GatewayEvents[K]): this {
    return super.on(event, listener as (...args: unknown[]) => void);
  }
}

export const eventBus = new TypedEventEmitter();
