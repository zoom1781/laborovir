import chalk from 'chalk';
import { Marked } from 'marked';
// @ts-expect-error no types for marked-terminal
import { markedTerminal } from 'marked-terminal';
import { highlight } from 'cli-highlight';

const marked = new Marked();
marked.use(markedTerminal({
  code: (code: string) => code, // we handle code ourselves
  blockquote: chalk.gray.italic,
  strong: chalk.bold,
  em: chalk.italic,
  del: chalk.strikethrough,
  link: chalk.cyan.underline,
  href: chalk.cyan.underline,
  heading: chalk.bold.cyan,
  listitem: chalk.white,
  table: chalk.white,
  paragraph: chalk.white,
}) as any);

export function renderMarkdown(text: string): string {
  // Pre-process code blocks with syntax highlighting
  const highlighted = text.replace(
    /```(\w+)?\n([\s\S]*?)```/g,
    (_match, lang: string | undefined, code: string) => {
      const trimmed = code.trimEnd();
      try {
        const hl = highlight(trimmed, { language: lang || 'plaintext', ignoreIllegals: true });
        const langLabel = lang ? chalk.dim.bgGray(` ${lang} `) : '';
        const border = chalk.dim('│');
        const lines = hl.split('\n').map(l => `  ${border} ${l}`).join('\n');
        return `\n  ${chalk.dim('┌')}${langLabel}${chalk.dim('─'.repeat(Math.max(0, 40 - (lang?.length ?? 0))))}\n${lines}\n  ${chalk.dim('└' + '─'.repeat(40))}\n`;
      } catch {
        const border = chalk.dim('│');
        const lines = trimmed.split('\n').map(l => `  ${border} ${l}`).join('\n');
        return `\n  ${chalk.dim('┌──────────')}\n${lines}\n  ${chalk.dim('└──────────')}\n`;
      }
    }
  );

  // Highlight inline code
  const withInlineCode = highlighted.replace(
    /`([^`]+)`/g,
    (_match, code: string) => chalk.bgGray.white(` ${code} `)
  );

  const rendered = marked.parse(withInlineCode);
  if (typeof rendered !== 'string') return withInlineCode;
  return rendered.trimEnd();
}

export function renderUserMessage(text: string, timestamp: Date): string {
  const time = formatTime(timestamp);
  const header = `  ${chalk.bold.blue('❯ You')} ${chalk.dim(time)}`;
  const body = text.split('\n').map(l => `    ${chalk.white(l)}`).join('\n');
  return `\n${header}\n${body}`;
}

export function renderAssistantMessage(text: string, timestamp: Date, duration?: number): string {
  const time = formatTime(timestamp);
  const dur = duration ? chalk.dim(` (${formatDuration(duration)})`) : '';
  const header = `  ${chalk.bold.green('◆ Assistant')} ${chalk.dim(time)}${dur}`;
  const body = renderMarkdown(text).split('\n').map(l => `    ${l}`).join('\n');
  return `\n${header}\n\n${body}`;
}

export function renderToolUse(tool: string, input?: string): string {
  const inputPreview = input ? chalk.dim(` → ${truncate(input, 60)}`) : '';
  return `    ${chalk.yellow('⚡')} ${chalk.yellow(tool)}${inputPreview}`;
}

export function renderThinking(elapsed: number): string {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  const frame = frames[Math.floor(elapsed / 80) % frames.length];
  return `  ${chalk.cyan(frame)} ${chalk.dim('Thinking...')} ${chalk.dim(`${(elapsed / 1000).toFixed(1)}s`)}`;
}

export function renderStreamChunk(accumulated: string): string {
  const rendered = renderMarkdown(accumulated);
  const lines = rendered.split('\n').map(l => `    ${l}`).join('\n');
  return `\n  ${chalk.bold.green('◆ Assistant')}\n\n${lines}`;
}

export function renderStatusBar(opts: {
  provider: string;
  model: string;
  gateway: boolean;
  session?: string;
  messages: number;
}): string {
  const cols = process.stdout.columns || 80;

  const left = [
    opts.gateway ? chalk.green('●') : chalk.red('○'),
    chalk.dim(opts.provider),
    chalk.dim('/'),
    chalk.white(opts.model),
  ].join(' ');

  const right = [
    opts.session ? chalk.dim(`session:${opts.session.slice(0, 8)}`) : '',
    chalk.dim(`${opts.messages} msgs`),
  ].filter(Boolean).join(chalk.dim(' │ '));

  const pad = Math.max(0, cols - stripAnsi(left).length - stripAnsi(right).length - 4);
  return chalk.bgGray(` ${left}${' '.repeat(pad)} ${right} `);
}

export function renderBox(title: string, lines: string[]): string {
  const cols = Math.min(process.stdout.columns || 80, 80);
  const innerWidth = cols - 6;
  const top = `  ${chalk.dim('╭─')} ${chalk.bold(title)} ${chalk.dim('─'.repeat(Math.max(0, innerWidth - title.length - 3)))}${chalk.dim('╮')}`;
  const bottom = `  ${chalk.dim('╰' + '─'.repeat(innerWidth + 2) + '╯')}`;
  const body = lines.map(l => {
    const stripped = stripAnsi(l);
    const padLen = Math.max(0, innerWidth - stripped.length);
    return `  ${chalk.dim('│')} ${l}${' '.repeat(padLen)} ${chalk.dim('│')}`;
  });
  return [top, ...body, bottom].join('\n');
}

export function renderDivider(label?: string): string {
  const cols = Math.min(process.stdout.columns || 80, 100);
  if (label) {
    const side = Math.max(0, Math.floor((cols - label.length - 4) / 2));
    return chalk.dim('─'.repeat(side) + ' ' + label + ' ' + '─'.repeat(side));
  }
  return chalk.dim('─'.repeat(cols));
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function truncate(str: string, max: number): string {
  const clean = str.replace(/\n/g, ' ').trim();
  return clean.length > max ? clean.slice(0, max) + '…' : clean;
}

function stripAnsi(str: string): string {
  return str.replace(/\x1B\[[0-9;]*m/g, '');
}
