import { Command } from 'commander';
import { execSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import ora from 'ora';

export function registerUpdate(program: Command): void {
  program
    .command('update')
    .description('Pull latest version from GitHub and rebuild')
    .action(async () => {
      // Resolve the project root from this file's location: src/cli/commands/ → project root
      const thisFile = fileURLToPath(import.meta.url);
      const projectRoot = resolve(dirname(thisFile), '..', '..', '..');

      const spinner = ora('Pulling latest changes...').start();

      try {
        const pullOutput = execSync('git pull origin main', {
          cwd: projectRoot,
          encoding: 'utf-8',
          stdio: 'pipe',
        });

        if (pullOutput.includes('Already up to date')) {
          spinner.succeed('Already on the latest version.');
          return;
        }

        spinner.text = 'Installing dependencies...';
        execSync('npm install', { cwd: projectRoot, encoding: 'utf-8', stdio: 'pipe', timeout: 120000 });

        spinner.text = 'Building...';
        execSync('npm run build', { cwd: projectRoot, encoding: 'utf-8', stdio: 'pipe', timeout: 60000 });

        spinner.succeed('Updated to latest version.');
        console.log(pullOutput.trim());
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        spinner.fail(`Update failed: ${msg}`);
      }
    });
}
