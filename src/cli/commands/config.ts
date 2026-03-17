import { Command } from 'commander';
import { loadConfig, saveConfig } from '../../config/loader.js';

export function registerConfig(program: Command): void {
  const cfg = program
    .command('config')
    .description('Manage configuration');

  cfg.command('get')
    .argument('[key]', 'Config key (dot notation)')
    .description('Get a config value')
    .action((key?: string) => {
      const config = loadConfig();
      if (!key) {
        console.log(JSON.stringify(config, null, 2));
        return;
      }
      const parts = key.split('.');
      let value: unknown = config;
      for (const part of parts) {
        if (value && typeof value === 'object' && part in value) {
          value = (value as Record<string, unknown>)[part];
        } else {
          console.log('Key not found');
          return;
        }
      }
      console.log(typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value));
    });

  cfg.command('set')
    .argument('<key>', 'Config key (dot notation)')
    .argument('<value>', 'Value to set')
    .description('Set a config value')
    .action((key: string, value: string) => {
      const config = loadConfig();
      const parts = key.split('.');
      let target: Record<string, unknown> = config as Record<string, unknown>;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!(parts[i] in target) || typeof target[parts[i]] !== 'object') {
          target[parts[i]] = {};
        }
        target = target[parts[i]] as Record<string, unknown>;
      }
      // Try to parse as JSON, fall back to string
      try {
        target[parts[parts.length - 1]] = JSON.parse(value);
      } catch {
        target[parts[parts.length - 1]] = value;
      }
      saveConfig(config);
      console.log(`Set ${key} = ${value}`);
    });
}
