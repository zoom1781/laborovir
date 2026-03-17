import { Command } from 'commander';
import { fork } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync, unlinkSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { PID_FILE, DEFAULT_PORT } from '../../shared/constants.js';
import { loadConfig, ensureConfigDir } from '../../config/loader.js';
import { logger } from '../../shared/logger.js';

function getGatewayPid(): number | null {
  if (!existsSync(PID_FILE)) return null;
  const pid = parseInt(readFileSync(PID_FILE, 'utf-8').trim(), 10);
  try {
    process.kill(pid, 0);
    return pid;
  } catch {
    unlinkSync(PID_FILE);
    return null;
  }
}

export function registerGateway(program: Command): void {
  const gw = program
    .command('gateway')
    .description('Manage the gateway daemon');

  gw.command('start')
    .description('Start the gateway daemon')
    .action(async () => {
      const existing = getGatewayPid();
      if (existing) {
        console.log(`Gateway already running (PID ${existing})`);
        return;
      }

      ensureConfigDir();
      const config = loadConfig();
      const port = config.gateway.port ?? DEFAULT_PORT;

      const __filename = fileURLToPath(import.meta.url);
      const __dirname = dirname(__filename);
      const serverPath = join(__dirname, '..', '..', 'gateway', 'server.js');

      const child = fork(serverPath, [], {
        detached: true,
        stdio: 'ignore',
        env: { ...process.env, GATEWAY_PORT: String(port), GATEWAY_HOST: config.gateway.host },
      });

      if (child.pid) {
        writeFileSync(PID_FILE, String(child.pid));
        child.unref();
        console.log(`Gateway started on ${config.gateway.host}:${port} (PID ${child.pid})`);
      }
    });

  gw.command('stop')
    .description('Stop the gateway daemon')
    .action(() => {
      const pid = getGatewayPid();
      if (!pid) {
        console.log('Gateway is not running');
        return;
      }
      try {
        process.kill(pid, 'SIGTERM');
        unlinkSync(PID_FILE);
        console.log(`Gateway stopped (PID ${pid})`);
      } catch (err) {
        logger.error({ err }, 'Failed to stop gateway');
      }
    });

  gw.command('status')
    .description('Check gateway status')
    .action(async () => {
      const pid = getGatewayPid();
      if (!pid) {
        console.log('Gateway is not running');
        return;
      }
      const config = loadConfig();
      const url = `http://${config.gateway.host}:${config.gateway.port}/health`;
      try {
        const res = await fetch(url);
        const data = await res.json();
        console.log(`Gateway running (PID ${pid})`);
        console.log(`Health: ${JSON.stringify(data)}`);
      } catch {
        console.log(`Gateway process exists (PID ${pid}) but health check failed`);
      }
    });
}
