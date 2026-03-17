import { z } from 'zod';

const channelSchema = z.object({
  type: z.enum(['stdin', 'telegram', 'discord', 'slack', 'whatsapp']),
  enabled: z.boolean().default(false),
  token: z.string().optional(),
  webhookUrl: z.string().optional(),
});

const agentSchema = z.object({
  provider: z.enum(['claude', 'openai', 'ollama']).default('claude'),
  model: z.string().default('claude-sonnet-4-20250514'),
  apiKey: z.string().optional(),
  baseUrl: z.string().optional(),
});

const gatewaySchema = z.object({
  port: z.number().int().min(1).max(65535).default(7100),
  host: z.string().default('127.0.0.1'),
});

const skillsSchema = z.object({
  builtinEnabled: z.boolean().default(true),
  external: z.array(z.string()).default([]),
});

const workspaceSchema = z.object({
  rootDir: z.string().default('~/laborovir-workspace'),
});

export const configSchema = z.object({
  version: z.number().default(1),
  agent: agentSchema.default({}),
  gateway: gatewaySchema.default({}),
  channels: z.array(channelSchema).default([{ type: 'stdin', enabled: true }]),
  skills: skillsSchema.default({}),
  workspace: workspaceSchema.default({}),
});

export type Config = z.infer<typeof configSchema>;
export type ChannelConfig = z.infer<typeof channelSchema>;
export type AgentConfig = z.infer<typeof agentSchema>;
