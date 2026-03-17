import Ajv from 'ajv';
const AjvDefault = (Ajv as any).default ?? Ajv;
import type { ToolDefinition, ToolResult } from './types.js';
import type { ToolDef } from '../agents/types.js';
import { loadBuiltinSkills } from '../skills/registry.js';

const ajv = new AjvDefault();
const toolRegistry = new Map<string, ToolDefinition>();
let loaded = false;

async function ensureLoaded(): Promise<void> {
  if (loaded) return;
  const skills = await loadBuiltinSkills();
  for (const skill of skills) {
    for (const tool of skill.tools) {
      toolRegistry.set(tool.name, tool);
    }
  }
  loaded = true;
}

export function getBuiltinTools(): ToolDef[] {
  const tools: ToolDef[] = [];
  for (const [, tool] of toolRegistry) {
    tools.push({
      name: tool.name,
      description: tool.description,
      input_schema: tool.input_schema,
    });
  }
  return tools;
}

export async function executeTool(name: string, input: Record<string, unknown>): Promise<ToolResult> {
  await ensureLoaded();
  const tool = toolRegistry.get(name);
  if (!tool) {
    return { success: false, output: '', error: `Unknown tool: ${name}` };
  }

  const validate = ajv.compile(tool.input_schema);
  if (!validate(input)) {
    return { success: false, output: '', error: `Invalid input: ${JSON.stringify(validate.errors)}` };
  }

  try {
    return await tool.execute(input);
  } catch (err) {
    return { success: false, output: '', error: err instanceof Error ? err.message : String(err) };
  }
}
