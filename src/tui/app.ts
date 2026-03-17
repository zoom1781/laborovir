import { createInterface } from 'node:readline';
import chalk from 'chalk';
import ora from 'ora';
import { loadConfig } from '../config/loader.js';
import { VERSION, APP_NAME } from '../shared/constants.js';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

const SLASH_COMMANDS: Record<string, string> = {
  '/help': 'Show available commands',
  '/clear': 'Clear chat history',
  '/skills': 'List available skills',
  '/config': 'Show current configuration',
  '/sessions': 'List active sessions',
  '/model': 'Show current model info',
  '/quit': 'Exit the TUI',
};

export async function startTUI(): Promise<void> {
  const config = loadConfig();
  const history: ChatMessage[] = [];
  const gatewayUrl = `http://${config.gateway.host}:${config.gateway.port}`;

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    prompt: '',
    historySize: 200,
  });

  // Check gateway
  let gatewayUp = false;
  try {
    const res = await fetch(`${gatewayUrl}/health`);
    gatewayUp = res.ok;
  } catch { /* not running */ }

  printHeader(gatewayUp, config.agent.provider, config.agent.model);

  if (!gatewayUp) {
    console.log(chalk.yellow('\n  ⚠  Gateway is not running. Start it with: laborovir gateway start\n'));
  }

  printPrompt();

  rl.on('line', async (input) => {
    const line = input.trim();
    if (!line) {
      printPrompt();
      return;
    }

    // Slash commands
    if (line.startsWith('/')) {
      await handleSlashCommand(line, history, config, gatewayUrl);
      printPrompt();
      return;
    }

    // Send message to gateway
    history.push({ role: 'user', content: line, timestamp: new Date() });
    printUserMessage(line);

    const spinner = ora({
      text: chalk.dim('Thinking...'),
      spinner: 'dots',
      color: 'cyan',
    }).start();

    try {
      const res = await fetch(`${gatewayUrl}/api/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel: 'tui', text: line }),
      });

      spinner.stop();

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
        printError(err.error ?? `HTTP ${res.status}`);
      } else {
        const data = await res.json() as { response: string };
        history.push({ role: 'assistant', content: data.response, timestamp: new Date() });
        printAssistantMessage(data.response);
      }
    } catch (err) {
      spinner.stop();
      printError('Could not reach gateway. Is it running?');
    }

    printPrompt();
  });

  rl.on('close', () => {
    console.log(chalk.dim('\n  Goodbye.\n'));
    process.exit(0);
  });

  // Handle Ctrl+C gracefully
  process.on('SIGINT', () => {
    console.log(chalk.dim('\n  Goodbye.\n'));
    rl.close();
    process.exit(0);
  });
}

function printHeader(gatewayUp: boolean, provider: string, model: string): void {
  const width = Math.min(process.stdout.columns || 80, 100);
  const line = chalk.dim('─'.repeat(width));

  console.log('\n' + line);
  console.log(
    chalk.bold.cyan(`  ${APP_NAME}`) +
    chalk.dim(` v${VERSION}`) +
    '  ' +
    (gatewayUp
      ? chalk.green('● gateway connected')
      : chalk.red('○ gateway offline')
    )
  );
  console.log(
    chalk.dim(`  provider: `) + chalk.white(provider) +
    chalk.dim(`  model: `) + chalk.white(model)
  );
  console.log(line);
  console.log(chalk.dim('  Type /help for commands, /quit to exit\n'));
}

function printPrompt(): void {
  process.stdout.write(chalk.bold.blue('\n  ❯ '));
}

function printUserMessage(text: string): void {
  // Already printed via readline, just add spacing
}

function printAssistantMessage(text: string): void {
  const width = Math.min(process.stdout.columns || 80, 96);
  const lines = wrapText(text, width - 6);

  console.log();
  console.log(chalk.bold.green('  ◆ Assistant'));
  console.log();
  for (const l of lines) {
    console.log(chalk.white(`    ${l}`));
  }
}

function printError(text: string): void {
  console.log();
  console.log(chalk.red(`  ✗ Error: ${text}`));
}

function printSystem(text: string): void {
  console.log();
  console.log(chalk.dim(`  ${text}`));
}

function wrapText(text: string, maxWidth: number): string[] {
  const result: string[] = [];
  for (const paragraph of text.split('\n')) {
    if (paragraph.length <= maxWidth) {
      result.push(paragraph);
      continue;
    }
    const words = paragraph.split(' ');
    let line = '';
    for (const word of words) {
      if (line.length + word.length + 1 > maxWidth) {
        result.push(line);
        line = word;
      } else {
        line = line ? line + ' ' + word : word;
      }
    }
    if (line) result.push(line);
  }
  return result;
}

async function handleSlashCommand(
  cmd: string,
  history: ChatMessage[],
  config: ReturnType<typeof loadConfig>,
  gatewayUrl: string,
): Promise<void> {
  const [command, ...args] = cmd.split(' ');

  switch (command) {
    case '/help':
      console.log();
      console.log(chalk.bold('  Commands'));
      console.log();
      for (const [k, v] of Object.entries(SLASH_COMMANDS)) {
        console.log(`  ${chalk.cyan(k.padEnd(14))} ${chalk.dim(v)}`);
      }
      break;

    case '/clear':
      history.length = 0;
      console.clear();
      const gatewayUp = await fetch(`${gatewayUrl}/health`).then(() => true).catch(() => false);
      printHeader(gatewayUp, config.agent.provider, config.agent.model);
      printSystem('Chat cleared.');
      break;

    case '/skills':
      try {
        const res = await fetch(`${gatewayUrl}/api/skills`);
        const data = await res.json() as { builtin: string[] };
        console.log();
        console.log(chalk.bold('  Built-in Skills'));
        console.log();
        for (const s of data.builtin) {
          console.log(`    ${chalk.cyan('•')} ${s}`);
        }
      } catch {
        printError('Could not reach gateway.');
      }
      break;

    case '/config':
      console.log();
      console.log(chalk.bold('  Configuration'));
      console.log();
      console.log(`    ${chalk.dim('Provider:')}  ${config.agent.provider}`);
      console.log(`    ${chalk.dim('Model:')}     ${config.agent.model}`);
      console.log(`    ${chalk.dim('Gateway:')}   ${config.gateway.host}:${config.gateway.port}`);
      console.log(`    ${chalk.dim('Channels:')}  ${config.channels.filter(c => c.enabled).map(c => c.type).join(', ')}`);
      break;

    case '/sessions':
      try {
        const res = await fetch(`${gatewayUrl}/api/sessions`);
        const sessions = await res.json() as Array<{ id: string; channel: string; updatedAt: string }>;
        console.log();
        if (sessions.length === 0) {
          printSystem('No active sessions.');
        } else {
          console.log(chalk.bold('  Sessions'));
          console.log();
          for (const s of sessions) {
            console.log(`    ${chalk.cyan(s.id.slice(0, 8))}  ${chalk.dim(s.channel)}  ${chalk.dim(s.updatedAt)}`);
          }
        }
      } catch {
        printError('Could not reach gateway.');
      }
      break;

    case '/model':
      console.log();
      console.log(`  ${chalk.dim('Provider:')} ${chalk.white(config.agent.provider)}`);
      console.log(`  ${chalk.dim('Model:')}    ${chalk.white(config.agent.model)}`);
      console.log(`  ${chalk.dim('API Key:')} ${config.agent.apiKey ? chalk.green('configured') : chalk.yellow('not set')}`);
      break;

    case '/quit':
    case '/exit':
      console.log(chalk.dim('\n  Goodbye.\n'));
      process.exit(0);

    default:
      printError(`Unknown command: ${command}. Type /help for available commands.`);
  }
}
