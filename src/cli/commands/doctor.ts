import { Command } from 'commander';
import { existsSync } from 'node:fs';
import { CONFIG_FILE, PID_FILE } from '../../shared/constants.js';
import { loadConfig } from '../../config/loader.js';

export function registerDoctor(program: Command): void {
  program
    .command('doctor')
    .description('Run diagnostics')
    .action(async () => {
      console.log('\nLaborovir Doctor\n');
      let ok = true;

      // Node version
      const nodeVersion = process.versions.node;
      const major = parseInt(nodeVersion.split('.')[0], 10);
      if (major >= 22) {
        console.log(`  ✓ Node.js ${nodeVersion}`);
      } else {
        console.log(`  ✗ Node.js ${nodeVersion} (need >=22)`);
        ok = false;
      }

      // Config file
      if (existsSync(CONFIG_FILE)) {
        console.log(`  ✓ Config file exists`);
        try {
          const config = loadConfig();
          console.log(`  ✓ Config is valid (provider: ${config.agent.provider})`);

          // API key
          if (config.agent.apiKey || process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY) {
            console.log(`  ✓ API key configured`);
          } else if (config.agent.provider !== 'ollama') {
            console.log(`  ✗ No API key found`);
            ok = false;
          }
        } catch (err) {
          console.log(`  ✗ Config invalid: ${err instanceof Error ? err.message : err}`);
          ok = false;
        }
      } else {
        console.log(`  ✗ No config file (run \`laborovir onboard\`)`);
        ok = false;
      }

      // Gateway
      if (existsSync(PID_FILE)) {
        try {
          const config = loadConfig();
          const res = await fetch(`http://${config.gateway.host}:${config.gateway.port}/health`);
          if (res.ok) {
            console.log(`  ✓ Gateway reachable`);
          } else {
            console.log(`  ✗ Gateway returned ${res.status}`);
            ok = false;
          }
        } catch {
          console.log(`  ✗ Gateway not reachable`);
          ok = false;
        }
      } else {
        console.log(`  - Gateway not running`);
      }

      console.log(ok ? '\nAll checks passed.\n' : '\nSome checks failed.\n');
      process.exitCode = ok ? 0 : 1;
    });
}
