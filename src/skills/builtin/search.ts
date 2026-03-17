import { execSync } from 'node:child_process';
import type { Skill } from '../types.js';

export const searchSkill: Skill = {
  manifest: { name: 'search', version: '0.1.0', description: 'Search files with grep/glob' },
  tools: [
    {
      name: 'search_grep',
      description: 'Search file contents with a regex pattern',
      input_schema: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Regex pattern' },
          path: { type: 'string', description: 'Directory to search in' },
          glob: { type: 'string', description: 'File glob filter' },
        },
        required: ['pattern'],
      },
      async execute(input) {
        const { pattern, path = '.', glob } = input as { pattern: string; path?: string; glob?: string };
        try {
          const globArg = glob ? `--glob '${glob}'` : '';
          const output = execSync(`rg --no-heading -n '${pattern}' ${globArg} '${path}'`, {
            encoding: 'utf-8', maxBuffer: 1024 * 1024, timeout: 10000,
          });
          return { success: true, output: output.trim() };
        } catch (err: unknown) {
          const e = err as { status?: number };
          if (e.status === 1) return { success: true, output: 'No matches found' };
          return { success: false, output: '', error: String(err) };
        }
      },
    },
    {
      name: 'search_glob',
      description: 'Find files matching a glob pattern',
      input_schema: {
        type: 'object',
        properties: {
          pattern: { type: 'string', description: 'Glob pattern' },
          path: { type: 'string', description: 'Root directory' },
        },
        required: ['pattern'],
      },
      async execute(input) {
        const { pattern, path = '.' } = input as { pattern: string; path?: string };
        try {
          const output = execSync(`find '${path}' -name '${pattern}' -type f 2>/dev/null | head -100`, {
            encoding: 'utf-8', timeout: 10000,
          });
          return { success: true, output: output.trim() || 'No files found' };
        } catch (err) {
          return { success: false, output: '', error: String(err) };
        }
      },
    },
  ],
};
