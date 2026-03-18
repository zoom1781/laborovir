import { createInterface, type Interface } from 'node:readline';
import chalk from 'chalk';

export interface InputOptions {
  onSubmit: (text: string) => void;
  onSlashCommand: (cmd: string, args: string[]) => void;
  onExit: () => void;
  slashCommands: string[];
}

export class InputHandler {
  private rl: Interface;
  private opts: InputOptions;
  private buffer: string[] = [];
  private multiline = false;
  private inputHistory: string[] = [];

  constructor(opts: InputOptions) {
    this.opts = opts;
    this.rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
      historySize: 500,
      completer: (line: string) => this.completer(line),
    });

    this.rl.on('line', (input) => this.handleLine(input));
    this.rl.on('close', () => this.opts.onExit());

    process.on('SIGINT', () => {
      if (this.multiline) {
        this.multiline = false;
        this.buffer = [];
        console.log(chalk.dim('\n  (multiline cancelled)'));
        this.prompt();
      } else {
        this.opts.onExit();
      }
    });
  }

  prompt(): void {
    if (this.multiline) {
      process.stdout.write(chalk.dim('  ... '));
    } else {
      process.stdout.write(chalk.bold.blue('\n  ❯ '));
    }
  }

  pause(): void {
    this.rl.pause();
  }

  resume(): void {
    this.rl.resume();
    this.prompt();
  }

  close(): void {
    this.rl.close();
  }

  private handleLine(input: string): void {
    const line = input;

    // Multiline: line ends with \
    if (line.endsWith('\\')) {
      this.buffer.push(line.slice(0, -1));
      this.multiline = true;
      this.prompt();
      return;
    }

    if (this.multiline) {
      this.buffer.push(line);
      if (line.trim() === '') {
        // Empty line ends multiline
        const full = this.buffer.join('\n').trim();
        this.buffer = [];
        this.multiline = false;
        if (full) this.dispatch(full);
        else this.prompt();
      } else {
        this.prompt();
      }
      return;
    }

    const trimmed = line.trim();
    if (!trimmed) {
      this.prompt();
      return;
    }

    this.dispatch(trimmed);
  }

  private dispatch(text: string): void {
    this.inputHistory.push(text);

    if (text.startsWith('/')) {
      const parts = text.split(/\s+/);
      const cmd = parts[0];
      const args = parts.slice(1);
      this.opts.onSlashCommand(cmd, args);
    } else {
      this.opts.onSubmit(text);
    }
  }

  private completer(line: string): [string[], string] {
    if (line.startsWith('/')) {
      const hits = this.opts.slashCommands.filter(c => c.startsWith(line));
      return [hits.length ? hits : this.opts.slashCommands, line];
    }
    return [[], line];
  }

  getHistory(): string[] {
    return [...this.inputHistory];
  }
}
