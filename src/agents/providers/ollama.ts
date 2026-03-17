import type { AgentProvider, AgentChunk, AgentMessage } from '../types.js';

export class OllamaProvider implements AgentProvider {
  name = 'ollama';
  private baseUrl: string;
  private model: string;

  constructor(baseUrl?: string, model?: string) {
    this.baseUrl = baseUrl ?? 'http://localhost:11434';
    this.model = model ?? 'llama3';
  }

  async *chat(messages: AgentMessage[]): AsyncGenerator<AgentChunk> {
    const res = await fetch(`${this.baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: this.model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        stream: false,
      }),
    });

    const data = await res.json() as { message?: { content?: string } };
    if (data.message?.content) {
      yield { type: 'text', text: data.message.content };
    }
    yield { type: 'done' };
  }
}
