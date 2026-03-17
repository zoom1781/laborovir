import OpenAI from 'openai';
import type { AgentProvider, AgentChunk, AgentMessage, ToolDef } from '../types.js';

export class OpenAIProvider implements AgentProvider {
  name = 'openai';
  private client: OpenAI;
  private model: string;

  constructor(apiKey?: string, model?: string) {
    this.client = new OpenAI({ apiKey: apiKey || undefined });
    this.model = model ?? 'gpt-4o';
  }

  async *chat(messages: AgentMessage[], tools?: ToolDef[]): AsyncGenerator<AgentChunk> {
    const openaiMessages = messages.map((m) => ({
      role: m.role as 'user' | 'assistant' | 'system',
      content: m.content,
    }));

    const params: OpenAI.ChatCompletionCreateParams = {
      model: this.model,
      messages: openaiMessages,
      ...(tools?.length ? {
        tools: tools.map(t => ({
          type: 'function' as const,
          function: { name: t.name, description: t.description, parameters: t.input_schema },
        })),
      } : {}),
    };

    const response = await this.client.chat.completions.create(params);
    const choice = response.choices[0];

    if (choice.message.content) {
      yield { type: 'text', text: choice.message.content };
    }

    if (choice.message.tool_calls) {
      for (const tc of choice.message.tool_calls) {
        yield {
          type: 'tool_use',
          toolName: tc.function.name,
          toolInput: JSON.parse(tc.function.arguments),
          toolId: tc.id,
        };
      }
    }

    yield { type: 'done' };
  }
}
