import { Command } from 'commander';
import inquirer from 'inquirer';
import ora from 'ora';
import { saveConfig, ensureConfigDir } from '../../config/loader.js';
import { defaultConfig } from '../../config/defaults.js';
import type { Config } from '../../config/schema.js';

export function registerOnboard(program: Command): void {
  program
    .command('onboard')
    .description('Interactive setup wizard')
    .action(async () => {
      console.log('\n🔧 Laborovir Workman Setup\n');

      const answers = await inquirer.prompt([
        {
          type: 'list',
          name: 'provider',
          message: 'Choose your AI provider:',
          choices: ['claude', 'openai', 'ollama'],
          default: 'claude',
        },
        {
          type: 'input',
          name: 'model',
          message: 'Model name:',
          default: (ans: { provider: string }) =>
            ans.provider === 'claude' ? 'claude-sonnet-4-20250514'
              : ans.provider === 'openai' ? 'gpt-4o'
              : 'llama3',
        },
        {
          type: 'password',
          name: 'apiKey',
          message: 'API key (leave blank if using env var):',
          mask: '*',
        },
        {
          type: 'checkbox',
          name: 'channels',
          message: 'Enable channels:',
          choices: [
            { name: 'stdin (terminal)', value: 'stdin', checked: true },
            { name: 'Telegram', value: 'telegram' },
            { name: 'Discord', value: 'discord' },
            { name: 'Slack', value: 'slack' },
            { name: 'WhatsApp', value: 'whatsapp' },
          ],
        },
        {
          type: 'number',
          name: 'port',
          message: 'Gateway port:',
          default: 7100,
        },
      ]);

      const spinner = ora('Writing configuration...').start();

      const config: Config = {
        ...defaultConfig,
        agent: {
          provider: answers.provider,
          model: answers.model,
          ...(answers.apiKey ? { apiKey: answers.apiKey } : {}),
        },
        gateway: {
          port: answers.port,
          host: '127.0.0.1',
        },
        channels: (answers.channels as string[]).map((type: string) => ({
          type: type as Config['channels'][number]['type'],
          enabled: true,
        })),
      };

      ensureConfigDir();
      saveConfig(config);
      spinner.succeed('Configuration saved to ~/.laborovir/config.yaml');
      console.log('\nRun `laborovir doctor` to verify your setup.\n');
    });
}
