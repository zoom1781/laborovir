import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { routeMessage } from './router.js';
import { listSessions, closeDb } from './session.js';
import { eventBus } from './events.js';
import { logger } from '../shared/logger.js';

const port = parseInt(process.env.GATEWAY_PORT ?? '7100', 10);
const host = process.env.GATEWAY_HOST ?? '127.0.0.1';

const app = Fastify({ logger: false });

await app.register(websocket);

app.get('/health', async () => ({ status: 'ok', uptime: process.uptime() }));

app.post<{ Body: { channel: string; text: string; sessionId?: string; userId?: string } }>(
  '/api/message',
  async (request, reply) => {
    const { channel, text, sessionId, userId } = request.body;
    if (!channel || !text) {
      return reply.status(400).send({ error: 'channel and text required' });
    }
    const response = await routeMessage(channel, text, sessionId, userId);
    return { response, sessionId };
  },
);

app.get('/api/sessions', async () => {
  return listSessions();
});

app.get('/api/skills', async () => {
  return { builtin: ['exec', 'file-read', 'file-write', 'file-edit', 'search', 'browser'] };
});

app.register(async (fastify) => {
  fastify.get('/ws', { websocket: true }, (socket) => {
    const forward = (event: string) => {
      eventBus.on(event as any, (data: unknown) => {
        socket.send(JSON.stringify({ event, data }));
      });
    };
    forward('message:in');
    forward('message:out');
    forward('agent:thinking');
    forward('agent:tool_use');

    socket.on('message', async (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString());
        if (msg.type === 'message' && msg.channel && msg.text) {
          const response = await routeMessage(msg.channel, msg.text, msg.sessionId, msg.userId);
          socket.send(JSON.stringify({ event: 'response', data: { response } }));
        }
      } catch (err) {
        socket.send(JSON.stringify({ event: 'error', data: { message: 'Invalid message' } }));
      }
    });
  });
});

const shutdown = async () => {
  logger.info('Shutting down gateway...');
  closeDb();
  await app.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

try {
  await app.listen({ port, host });
  logger.info(`Gateway listening on ${host}:${port}`);
} catch (err) {
  logger.error(err, 'Failed to start gateway');
  process.exit(1);
}
