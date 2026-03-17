import type { ToolDefinition } from '../tools/types.js';

export interface SkillManifest {
  name: string;
  version: string;
  description: string;
  author?: string;
}

export interface Skill {
  manifest: SkillManifest;
  tools: ToolDefinition[];
}
