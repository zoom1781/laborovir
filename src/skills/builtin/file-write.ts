import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Skill } from '../types.js';
import { checkPathAllowed } from '../../tools/sandbox.js';

export const fileWriteSkill: Skill = {
  manifest: { name: 'file-write', version: '0.1.0', description: 'Write files' },
  tools: [
    {
      name: 'file_write',
      description: 'Write content to a file',
      input_schema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path' },
          content: { type: 'string', description: 'Content to write' },
        },
        required: ['path', 'content'],
      },
      async execute(input) {
        const { path, content } = input as { path: string; content: string };
        checkPathAllowed(path);
        try {
          mkdirSync(dirname(path), { recursive: true });
          writeFileSync(path, content, 'utf-8');
          return { success: true, output: `Written to ${path}` };
        } catch (err) {
          return { success: false, output: '', error: String(err) };
        }
      },
    },
  ],
};
