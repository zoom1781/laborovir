import { readFileSync } from 'node:fs';
import type { Skill } from '../types.js';
import { checkPathAllowed } from '../../tools/sandbox.js';

export const fileReadSkill: Skill = {
  manifest: { name: 'file-read', version: '0.1.0', description: 'Read files' },
  tools: [
    {
      name: 'file_read',
      description: 'Read the contents of a file',
      input_schema: {
        type: 'object',
        properties: { path: { type: 'string', description: 'File path to read' } },
        required: ['path'],
      },
      async execute(input) {
        const { path } = input as { path: string };
        checkPathAllowed(path);
        try {
          return { success: true, output: readFileSync(path, 'utf-8') };
        } catch (err) {
          return { success: false, output: '', error: String(err) };
        }
      },
    },
  ],
};
