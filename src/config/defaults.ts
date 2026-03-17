import type { Config } from './schema.js';

export const defaultConfig: Config = {
  version: 1,
  agent: {
    provider: 'claude',
    model: 'claude-sonnet-4-20250514',
  },
  gateway: {
    port: 7100,
    host: '127.0.0.1',
  },
  channels: [{ type: 'stdin', enabled: true }],
  skills: {
    builtinEnabled: true,
    external: [],
  },
  workspace: {
    rootDir: '~/laborovir-workspace',
  },
};
