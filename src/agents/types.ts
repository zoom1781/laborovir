export interface AgentChunk {
  type: 'text' | 'tool_use' | 'tool_result' | 'done';
  text?: string;
  toolName?: string;
  toolInput?: unknown;
  toolId?: string;
}

export interface AgentMessage {
  role: string;
  content: string;
}

export interface AgentProvider {
  name: string;
  chat(messages: AgentMessage[], tools?: ToolDef[]): AsyncGenerator<AgentChunk>;
}

export interface ToolDef {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
}
