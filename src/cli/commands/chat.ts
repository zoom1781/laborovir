import { Command } from 'commander';
import { startTUI } from '../../tui/app.js';

export function registerChat(program: Command): void {
  program
    .command('chat')
    .description('Open interactive chat TUI')
    .action(async () => {
      await startTUI();
    });
}
