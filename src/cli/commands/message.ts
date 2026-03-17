import { Command } from 'commander';
import { loadConfig } from '../../config/loader.js';

export function registerMessage(program: Command): void {
  program
    .command('message')
    .description('Send a message')
    .command('send')
    .requiredOption('--channel <id>', 'Channel to send to')
    .requiredOption('--text <msg>', 'Message text')
    .action(async (opts: { channel: string; text: string }) => {
      const config = loadConfig();
      const url = `http://${config.gateway.host}:${config.gateway.port}/api/message`;
      try {
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ channel: opts.channel, text: opts.text }),
        });
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
      } catch (err) {
        console.error('Failed to send message. Is the gateway running?');
        process.exitCode = 1;
      }
    });
}
