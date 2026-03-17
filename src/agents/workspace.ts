import type { AgentMessage, ToolDef } from './types.js';

export interface Workspace {
  sessionId: string;
  messages: AgentMessage[];
  tools: ToolDef[];
  workingDir: string;
}

const workspaces = new Map<string, Workspace>();

export function getOrCreateWorkspace(sessionId: string, messages: AgentMessage[], tools: ToolDef[], workingDir: string): Workspace {
  let ws = workspaces.get(sessionId);
  if (!ws) {
    ws = { sessionId, messages, tools, workingDir };
    workspaces.set(sessionId, ws);
  } else {
    ws.messages = messages;
  }
  return ws;
}

export function deleteWorkspace(sessionId: string): void {
  workspaces.delete(sessionId);
}
