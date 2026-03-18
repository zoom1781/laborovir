import chalk from 'chalk';
import logUpdate from 'log-update';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { loadConfig } from '../config/loader.js';
import { VERSION, APP_NAME } from '../shared/constants.js';
import { InputHandler } from './input.js';
import {
  renderAssistantMessage,
  renderUserMessage,
  renderToolUse,
  renderThinking,
  renderStreamChunk,
  renderStatusBar,
  renderBox,
  renderDivider,
  renderMarkdown,
} from './renderer.js';

interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  timestamp: Date;
  duration?: number;
  tools?: string[];
}

const SLASH_COMMANDS: Record<string, string> = {
  '/help':      'Show available commands',
  '/clear':     'Clear chat history',
  '/compact':   'Summarize and compact conversation',
  '/skills':    'List available skills',
  '/config':    'Show current configuration',
  '/sessions':  'List active sessions',
  '/new':       'Start a new session',
  '/switch':    'Switch session (/switch <id>)',
  '/model':     'Show current model info',
  '/export':    'Export chat to markdown file',
  '/history':   'Show conversation history',
  '/status':    'Show gateway & connection status',
  '/shortcuts': 'Show keyboard shortcuts',
  '/quit':      'Exit the TUI',
};

export async function startTUI(): Promise<void> {
  const config = loadConfig();
  const history: ChatMessage[] = [];
  const gatewayUrl = `http://${config.gateway.host}:${config.gateway.port}`;
  let currentSessionId: string | undefined;
  let gatewayUp = false;
  let wsConnected = false;
  let ws: WebSocket | null = null;

  // Check gateway
  try {
    const res = await fetch(`${gatewayUrl}/health`);
    gatewayUp = res.ok;
  } catch { /* not running */ }

  // Connect WebSocket for streaming events
  if (gatewayUp) {
    try {
      ws = new WebSocket(`ws://${config.gateway.host}:${config.gateway.port}/ws`);
      ws.onopen = () => { wsConnected = true; };
      ws.onclose = () => { wsConnected = false; };
      ws.onerror = () => { wsConnected = false; };
    } catch { /* ws not available */ }
  }

  // Print welcome screen
  printWelcome(gatewayUp, config.agent.provider, config.agent.model);

  if (!gatewayUp) {
    console.log(chalk.yellow('\n  ⚠  Gateway is not running. Start it with: laborovir gateway start\n'));
  }

  // Input handler with tab-completion
  const input = new InputHandler({
    slashCommands: Object.keys(SLASH_COMMANDS),
    onSubmit: async (text) => {
      input.pause();
      await handleMessage(text);
      input.resume();
    },
    onSlashCommand: async (cmd, args) => {
      input.pause();
      await handleSlashCommand(cmd, args);
      input.resume();
    },
    onExit: () => {
      if (ws) ws.close();
      console.log(chalk.dim('\n  Goodbye.\n'));
      process.exit(0);
    },
  });

  input.prompt();

  // --- Message handling ---

  async function handleMessage(text: string): Promise<void> {
    const userTime = new Date();
    history.push({ role: 'user', content: text, timestamp: userTime });
    console.log(renderUserMessage(text, userTime));

    // Animate thinking
    const startTime = Date.now();
    let thinkingInterval: ReturnType<typeof setInterval> | null = null;
    let toolsUsed: string[] = [];

    // Listen for tool_use events via WebSocket
    const toolHandler = ws ? (event: MessageEvent) => {
      try {
        const data = JSON.parse(String(event.data));
        if (data.event === 'agent:tool_use') {
          const toolName = data.data?.tool ?? 'unknown';
          toolsUsed.push(toolName);
          logUpdate.clear();
          console.log(renderToolUse(toolName, JSON.stringify(data.data?.input)));
        }
        if (data.event === 'agent:thinking') {
          // Keep spinner going
        }
      } catch { /* ignore */ }
    } : null;

    if (ws && toolHandler) ws.addEventListener('message', toolHandler);

    thinkingInterval = setInterval(() => {
      logUpdate(renderThinking(Date.now() - startTime));
    }, 80);

    try {
      const res = await fetch(`${gatewayUrl}/api/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'tui',
          text,
          sessionId: currentSessionId,
        }),
      });

      clearInterval(thinkingInterval);
      logUpdate.clear();
      logUpdate.done();

      if (ws && toolHandler) ws.removeEventListener('message', toolHandler);

      const duration = Date.now() - startTime;

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText })) as { error?: string };
        printError(err.error ?? `HTTP ${res.status}`);
      } else {
        const data = await res.json() as { response: string; sessionId?: string };
        if (data.sessionId) currentSessionId = data.sessionId;

        const assistantTime = new Date();
        history.push({
          role: 'assistant',
          content: data.response,
          timestamp: assistantTime,
          duration,
          tools: toolsUsed.length ? toolsUsed : undefined,
        });
        console.log(renderAssistantMessage(data.response, assistantTime, duration));
      }
    } catch {
      clearInterval(thinkingInterval);
      logUpdate.clear();
      logUpdate.done();
      if (ws && toolHandler) ws.removeEventListener('message', toolHandler);
      printError('Could not reach gateway. Is it running?');
      gatewayUp = false;
    }
  }

  // --- Slash commands ---

  async function handleSlashCommand(cmd: string, args: string[]): Promise<void> {
    switch (cmd) {
      case '/help':
        console.log('\n' + renderBox('Commands', [
          '',
          ...Object.entries(SLASH_COMMANDS).map(
            ([k, v]) => `${chalk.cyan(k.padEnd(14))} ${chalk.dim(v)}`
          ),
          '',
          chalk.dim('Multiline: end a line with \\ to continue'),
          chalk.dim('Tab: autocomplete slash commands'),
          '',
        ]));
        break;

      case '/clear':
        history.length = 0;
        currentSessionId = undefined;
        console.clear();
        gatewayUp = await fetch(`${gatewayUrl}/health`).then(() => true).catch(() => false);
        printWelcome(gatewayUp, config.agent.provider, config.agent.model);
        console.log(chalk.dim('  Chat cleared.\n'));
        break;

      case '/compact': {
        if (history.length === 0) {
          console.log(chalk.dim('\n  Nothing to compact.\n'));
          break;
        }
        const msgCount = history.length;
        const userMsgs = history.filter(m => m.role === 'user').length;
        const assistantMsgs = history.filter(m => m.role === 'assistant').length;
        console.log(chalk.dim(`\n  Compacted ${msgCount} messages (${userMsgs} user, ${assistantMsgs} assistant).`));
        // Keep only last 4 messages for context
        const kept = history.splice(0, history.length - 4);
        console.log(chalk.dim(`  Keeping last ${history.length} messages in context.\n`));
        break;
      }

      case '/skills':
        try {
          const res = await fetch(`${gatewayUrl}/api/skills`);
          const data = await res.json() as { builtin: string[] };
          console.log('\n' + renderBox('Skills', [
            '',
            ...data.builtin.map(s => `${chalk.cyan('⚡')} ${s}`),
            '',
          ]));
        } catch {
          printError('Could not reach gateway.');
        }
        break;

      case '/config':
        console.log('\n' + renderBox('Configuration', [
          '',
          `${chalk.dim('Provider:')}   ${chalk.white(config.agent.provider)}`,
          `${chalk.dim('Model:')}      ${chalk.white(config.agent.model)}`,
          `${chalk.dim('Gateway:')}    ${chalk.white(`${config.gateway.host}:${config.gateway.port}`)}`,
          `${chalk.dim('Channels:')}   ${chalk.white(config.channels.filter(c => c.enabled).map(c => c.type).join(', '))}`,
          `${chalk.dim('Workspace:')}  ${chalk.white(config.workspace.rootDir)}`,
          `${chalk.dim('API Key:')}    ${config.agent.apiKey ? chalk.green('✓ configured') : chalk.yellow('✗ not set')}`,
          '',
        ]));
        break;

      case '/sessions':
        try {
          const res = await fetch(`${gatewayUrl}/api/sessions`);
          const sessions = await res.json() as Array<{ id: string; channel: string; updatedAt: string }>;
          if (sessions.length === 0) {
            console.log(chalk.dim('\n  No active sessions.\n'));
          } else {
            const lines = sessions.map(s => {
              const isCurrent = currentSessionId === s.id;
              const marker = isCurrent ? chalk.green('▸') : ' ';
              return `${marker} ${chalk.cyan(s.id.slice(0, 8))}  ${chalk.dim(s.channel.padEnd(10))}  ${chalk.dim(s.updatedAt)}`;
            });
            console.log('\n' + renderBox('Sessions', ['', ...lines, '']));
          }
        } catch {
          printError('Could not reach gateway.');
        }
        break;

      case '/new':
        currentSessionId = undefined;
        history.length = 0;
        console.log(chalk.dim('\n  New session started.\n'));
        break;

      case '/switch':
        if (!args[0]) {
          printError('Usage: /switch <session-id>');
          break;
        }
        try {
          const res = await fetch(`${gatewayUrl}/api/sessions`);
          const sessions = await res.json() as Array<{ id: string; messages: string }>;
          const match = sessions.find(s => s.id.startsWith(args[0]));
          if (!match) {
            printError(`No session matching "${args[0]}"`);
          } else {
            currentSessionId = match.id;
            history.length = 0;
            const msgs = JSON.parse(match.messages || '[]') as Array<{ role: string; content: string }>;
            for (const m of msgs) {
              history.push({ role: m.role as any, content: m.content, timestamp: new Date() });
            }
            console.log(chalk.dim(`\n  Switched to session ${chalk.cyan(match.id.slice(0, 8))} (${msgs.length} messages)\n`));
          }
        } catch {
          printError('Could not reach gateway.');
        }
        break;

      case '/model':
        console.log('\n' + renderBox('Model', [
          '',
          `${chalk.dim('Provider:')}  ${chalk.white(config.agent.provider)}`,
          `${chalk.dim('Model:')}     ${chalk.white(config.agent.model)}`,
          `${chalk.dim('API Key:')}   ${config.agent.apiKey ? chalk.green('✓ configured') : chalk.yellow('✗ not set')}`,
          '',
        ]));
        break;

      case '/export': {
        if (history.length === 0) {
          console.log(chalk.dim('\n  Nothing to export.\n'));
          break;
        }
        const exportDir = join(homedir(), '.laborovir', 'exports');
        mkdirSync(exportDir, { recursive: true });
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `chat-${timestamp}.md`;
        const filepath = join(exportDir, filename);

        let md = `# Laborovir Chat Export\n\n`;
        md += `**Date:** ${new Date().toLocaleString()}\n`;
        md += `**Provider:** ${config.agent.provider} / ${config.agent.model}\n`;
        md += `**Messages:** ${history.length}\n\n---\n\n`;

        for (const msg of history) {
          const role = msg.role === 'user' ? '**You**' : '**Assistant**';
          const time = msg.timestamp.toLocaleTimeString();
          md += `### ${role} _(${time})_\n\n${msg.content}\n\n`;
          if (msg.tools?.length) {
            md += `_Tools used: ${msg.tools.join(', ')}_\n\n`;
          }
          if (msg.duration) {
            md += `_Response time: ${(msg.duration / 1000).toFixed(1)}s_\n\n`;
          }
        }

        writeFileSync(filepath, md, 'utf-8');
        console.log(chalk.green(`\n  ✓ Exported to ${chalk.underline(filepath)}\n`));
        break;
      }

      case '/history': {
        if (history.length === 0) {
          console.log(chalk.dim('\n  No messages yet.\n'));
          break;
        }
        console.log('\n' + renderDivider('History'));
        for (const msg of history) {
          if (msg.role === 'user') {
            console.log(renderUserMessage(msg.content, msg.timestamp));
          } else if (msg.role === 'assistant') {
            console.log(renderAssistantMessage(msg.content, msg.timestamp, msg.duration));
          }
        }
        console.log('\n' + renderDivider());
        break;
      }

      case '/status': {
        const gw = await fetch(`${gatewayUrl}/health`).then(r => r.json()).catch(() => null) as { status: string; uptime: number } | null;
        gatewayUp = !!gw;
        console.log('\n' + renderBox('Status', [
          '',
          `${chalk.dim('Gateway:')}     ${gw ? chalk.green(`● running (uptime: ${(gw.uptime / 60).toFixed(1)}m)`) : chalk.red('○ offline')}`,
          `${chalk.dim('WebSocket:')}   ${wsConnected ? chalk.green('● connected') : chalk.yellow('○ disconnected')}`,
          `${chalk.dim('Session:')}     ${currentSessionId ? chalk.cyan(currentSessionId.slice(0, 8)) : chalk.dim('none')}`,
          `${chalk.dim('Messages:')}    ${chalk.white(String(history.length))}`,
          `${chalk.dim('Provider:')}    ${chalk.white(config.agent.provider)}`,
          `${chalk.dim('Model:')}       ${chalk.white(config.agent.model)}`,
          '',
        ]));
        break;
      }

      case '/shortcuts':
        console.log('\n' + renderBox('Keyboard Shortcuts', [
          '',
          `${chalk.cyan('Tab'.padEnd(16))} ${chalk.dim('Autocomplete slash commands')}`,
          `${chalk.cyan('\\'.padEnd(16))} ${chalk.dim('Continue on next line (multiline)')}`,
          `${chalk.cyan('Enter'.padEnd(16))} ${chalk.dim('Send message / end multiline')}`,
          `${chalk.cyan('Ctrl+C'.padEnd(16))} ${chalk.dim('Cancel multiline / exit')}`,
          `${chalk.cyan('Ctrl+D'.padEnd(16))} ${chalk.dim('Exit')}`,
          `${chalk.cyan('↑ / ↓'.padEnd(16))} ${chalk.dim('Navigate input history')}`,
          '',
        ]));
        break;

      case '/quit':
      case '/exit':
        if (ws) ws.close();
        console.log(chalk.dim('\n  Goodbye.\n'));
        process.exit(0);

      default:
        printError(`Unknown command: ${cmd}. Type /help for available commands.`);
    }
  }
}

// --- Display helpers ---

function printWelcome(gatewayUp: boolean, provider: string, model: string): void {
  const cols = Math.min(process.stdout.columns || 80, 100);

  console.log();
  console.log(renderStatusBar({ provider, model, gateway: gatewayUp, messages: 0 }));
  console.log();

  const logo = [
    chalk.cyan('  ╦  ╔═╗╔╗ ╔═╗╦═╗╔═╗╦  ╦╦╦═╗'),
    chalk.cyan('  ║  ╠═╣╠╩╗║ ║╠╦╝║ ║╚╗╔╝║╠╦╝'),
    chalk.cyan('  ╩═╝╚═╝╚═╝╚═╝╩╚═╚═╝ ╚╝ ╩╩╚═'),
    chalk.dim(`  Workman v${VERSION}`),
  ];

  for (const line of logo) console.log(line);
  console.log();
  console.log(chalk.dim('─'.repeat(cols)));
  console.log();
  console.log(chalk.dim('  Type a message to start chatting, or /help for commands.'));
  console.log(chalk.dim('  Multiline input: end a line with \\ to continue on the next line.'));
  console.log();
}

function printError(text: string): void {
  console.log(`\n  ${chalk.red('✗')} ${chalk.red(text)}\n`);
}
