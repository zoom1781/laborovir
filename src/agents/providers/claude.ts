import Anthropic from '@anthropic-ai/sdk';
import type { AgentProvider, AgentChunk, AgentMessage, ToolDef } from '../types.js';

export class ClaudeProvider implements AgentProvider {
  name = 'claude';
  private client: Anthropic;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.client = new Anthropic({ apiKey: apiKey || undefined });
    this.model = model ?? 'claude-sonnet-4-20250514';
  }

  async *chat(messages: AgentMessage[], tools?: ToolDef[]): AsyncGenerator<AgentChunk> {
    const anthropicMessages = messages.map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

    const params: Anthropic.MessageCreateParams = {
      model: this.model,
      max_tokens: 8192,
      messages: anthropicMessages,
      ...(tools?.length ? { tools: tools.map(t => ({ name: t.name, description: t.description, input_schema: t.input_schema as Anthropic.Tool.InputSchema })) } : {}),
    };

    const response = await this.client.messages.create(params);

    for (const block of response.content) {
      if (block.type === 'text') {
        yield { type: 'text', text: block.text };
      } else if (block.type === 'tool_use') {
        yield { type: 'tool_use', toolName: block.name, toolInput: block.input, toolId: block.id };
      }
    }
    yield { type: 'done' };
  }
}
