import { Command } from 'commander';
import { loadConfig, saveConfig } from '../../config/loader.js';

export function registerSkills(program: Command): void {
  const skills = program
    .command('skills')
    .description('Manage skills');

  skills.command('list')
    .description('List installed skills')
    .action(() => {
      const config = loadConfig();
      console.log('\nBuiltin skills:', config.skills.builtinEnabled ? 'enabled' : 'disabled');
      if (config.skills.builtinEnabled) {
        console.log('  - exec (shell command execution)');
        console.log('  - file-read');
        console.log('  - file-write');
        console.log('  - file-edit');
        console.log('  - search (grep/glob)');
        console.log('  - browser (headless)');
      }
      if (config.skills.external.length > 0) {
        console.log('\nExternal skills:');
        for (const s of config.skills.external) {
          console.log(`  - ${s}`);
        }
      } else {
        console.log('\nNo external skills installed.');
      }
      console.log();
    });

  skills.command('install')
    .argument('<path>', 'Path to skill module')
    .description('Install an external skill')
    .action((path: string) => {
      const config = loadConfig();
      if (config.skills.external.includes(path)) {
        console.log('Skill already installed.');
        return;
      }
      config.skills.external.push(path);
      saveConfig(config);
      console.log(`Installed skill: ${path}`);
    });

  skills.command('remove')
    .argument('<path>', 'Path to skill module')
    .description('Remove an external skill')
    .action((path: string) => {
      const config = loadConfig();
      const idx = config.skills.external.indexOf(path);
      if (idx === -1) {
        console.log('Skill not found.');
        return;
      }
      config.skills.external.splice(idx, 1);
      saveConfig(config);
      console.log(`Removed skill: ${path}`);
    });
}
