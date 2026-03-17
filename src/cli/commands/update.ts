import { Command } from 'commander';
import { execSync } from 'node:child_process';
import ora from 'ora';

export function registerUpdate(program: Command): void {
  program
    .command('update')
    .description('Pull latest version from GitHub and rebuild')
    .action(async () => {
      const spinner = ora('Checking for updates...').start();

      try {
        // Find the package root (where package.json lives)
        const root = execSync('npm prefix -g', { encoding: 'utf-8' }).trim();
        const installDir = execSync(`node -e "console.log(require.resolve('laborovir/package.json'))"`, {
          encoding: 'utf-8',
        }).trim().replace('/package.json', '');

        spinner.text = 'Pulling latest changes...';
        const pullOutput = execSync('git pull origin main', { cwd: installDir, encoding: 'utf-8' });

        if (pullOutput.includes('Already up to date')) {
          spinner.succeed('Already on the latest version.');
          return;
        }

        spinner.text = 'Installing dependencies...';
        execSync('npm install', { cwd: installDir, encoding: 'utf-8', timeout: 120000 });

        spinner.text = 'Building...';
        execSync('npm run build', { cwd: installDir, encoding: 'utf-8', timeout: 60000 });

        spinner.succeed('Updated to latest version.');
        console.log(pullOutput.trim());
      } catch {
        spinner.fail('Auto-detect failed. Trying current directory...');

        // Fallback: update from cwd if it's the repo
        const fallback = ora('Updating from current directory...').start();
        try {
          execSync('git pull origin main', { encoding: 'utf-8', stdio: 'pipe' });
          fallback.text = 'Installing dependencies...';
          execSync('npm install', { encoding: 'utf-8', stdio: 'pipe', timeout: 120000 });
          fallback.text = 'Building...';
          execSync('npm run build', { encoding: 'utf-8', stdio: 'pipe', timeout: 60000 });
          fallback.succeed('Updated to latest version.');
        } catch (err: unknown) {
          fallback.fail(`Update failed: ${err instanceof Error ? err.message : String(err)}`);
          console.log('\nManual update:');
          console.log('  cd /path/to/laborovir');
          console.log('  git pull origin main');
          console.log('  npm install && npm run build');
        }
      }
    });
}
