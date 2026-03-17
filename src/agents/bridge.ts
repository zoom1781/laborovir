import type { Config } from '../config/schema.js';
import type { AgentProvider, AgentMessage, AgentChunk } from './types.js';
import { ClaudeProvider } from './providers/claude.js';
import { OpenAIProvider } from './providers/openai.js';
import { OllamaProvider } from './providers/ollama.js';
import { getBuiltinTools, executeTool } from '../tools/executor.js';
import { eventBus } from '../gateway/events.js';
import { MAX_TOOL_ITERATIONS } from '../shared/constants.js';
import { AgentError } from '../shared/errors.js';

function createProvider(config: Config): AgentProvider {
  switch (config.agent.provider) {
    case 'claude':
      return new ClaudeProvider(config.agent.apiKey, config.agent.model);
    case 'openai':
      return new OpenAIProvider(config.agent.apiKey, config.agent.model);
    case 'ollama':
      return new OllamaProvider(config.agent.baseUrl, config.agent.model);
    default:
      throw new AgentError(`Unknown provider: ${config.agent.provider}`);
  }
}

export async function runAgentBridge(config: Config, messages: AgentMessage[], sessionId: string): Promise<string> {
  const provider = createProvider(config);
  const tools = getBuiltinTools();
  let iterations = 0;
  const conversationMessages = [...messages];

  while (iterations < MAX_TOOL_ITERATIONS) {
    iterations++;
    eventBus.emit('agent:thinking', { sessionId });

    const chunks: AgentChunk[] = [];
    for await (const chunk of provider.chat(conversationMessages, tools)) {
      chunks.push(chunk);
    }

    let responseText = '';
    let hasToolUse = false;

    for (const chunk of chunks) {
      if (chunk.type === 'text' && chunk.text) {
        responseText += chunk.text;
      } else if (chunk.type === 'tool_use' && chunk.toolName) {
        hasToolUse = true;
        eventBus.emit('agent:tool_use', { sessionId, tool: chunk.toolName, input: chunk.toolInput });

        const result = await executeTool(chunk.toolName, chunk.toolInput as Record<string, unknown>);
        conversationMessages.push({ role: 'assistant', content: `[tool_use: ${chunk.toolName}]` });
        conversationMessages.push({ role: 'user', content: `[tool_result: ${JSON.stringify(result)}]` });
      }
    }

    if (!hasToolUse) {
      return responseText;
    }
  }

  throw new AgentError('Max tool iterations reached');
}
