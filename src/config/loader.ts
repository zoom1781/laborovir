import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { parse, stringify } from 'yaml';
import { configSchema, type Config } from './schema.js';
import { defaultConfig } from './defaults.js';
import { CONFIG_DIR, CONFIG_FILE } from '../shared/constants.js';
import { ConfigError } from '../shared/errors.js';

function interpolateEnv(value: string): string {
  return value.replace(/\$\{(\w+)\}/g, (_, key) => process.env[key] ?? '');
}

function interpolateObject(obj: unknown): unknown {
  if (typeof obj === 'string') return interpolateEnv(obj);
  if (Array.isArray(obj)) return obj.map(interpolateObject);
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(obj)) {
      result[k] = interpolateObject(v);
    }
    return result;
  }
  return obj;
}

export function loadConfig(): Config {
  if (!existsSync(CONFIG_FILE)) {
    return defaultConfig;
  }
  try {
    const raw = readFileSync(CONFIG_FILE, 'utf-8');
    const parsed = parse(raw);
    const interpolated = interpolateObject(parsed);
    return configSchema.parse(interpolated);
  } catch (err) {
    throw new ConfigError(`Failed to load config: ${err instanceof Error ? err.message : String(err)}`);
  }
}

export function saveConfig(config: Config): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(CONFIG_FILE, stringify(config), 'utf-8');
}

export function ensureConfigDir(): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
}
