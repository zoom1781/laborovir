import { randomUUID } from 'node:crypto';
import { eventBus } from './events.js';
import { getSession, createSession, updateSessionMessages } from './session.js';
import { runAgentBridge } from '../agents/bridge.js';
import { loadConfig } from '../config/loader.js';

export async function routeMessage(channel: string, text: string, sessionId?: string, userId?: string): Promise<string> {
  const sid = sessionId ?? randomUUID();

  let session = await getSession(sid);
  if (!session) {
    session = await createSession(sid, channel, userId);
  }

  const messages = JSON.parse(session.messages) as Array<{ role: string; content: string }>;
  messages.push({ role: 'user', content: text });

  eventBus.emit('message:in', { channel, sessionId: sid, text, userId });

  const config = loadConfig();
  const response = await runAgentBridge(config, messages, sid);

  messages.push({ role: 'assistant', content: response });
  await updateSessionMessages(sid, messages);

  eventBus.emit('message:out', { channel, sessionId: sid, text: response });

  return response;
}
