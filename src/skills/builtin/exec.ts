import { execSync } from 'node:child_process';
import type { Skill } from '../types.js';
import { checkCommandAllowed } from '../../tools/sandbox.js';

export const execSkill: Skill = {
  manifest: { name: 'exec', version: '0.1.0', description: 'Execute shell commands' },
  tools: [
    {
      name: 'exec',
      description: 'Execute a shell command and return its output',
      input_schema: {
        type: 'object',
        properties: {
          command: { type: 'string', description: 'Shell command to execute' },
          cwd: { type: 'string', description: 'Working directory' },
          timeout: { type: 'number', description: 'Timeout in ms', default: 30000 },
        },
        required: ['command'],
      },
      async execute(input) {
        const { command, cwd, timeout = 30000 } = input as { command: string; cwd?: string; timeout?: number };
        checkCommandAllowed(command);
        try {
          const output = execSync(command, { cwd, timeout, encoding: 'utf-8', maxBuffer: 1024 * 1024 });
          return { success: true, output: output.trim() };
        } catch (err: unknown) {
          const e = err as { stderr?: string; message?: string };
          return { success: false, output: '', error: e.stderr || e.message || String(err) };
        }
      },
    },
  ],
};
