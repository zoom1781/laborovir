import { readFileSync, writeFileSync } from 'node:fs';
import type { Skill } from '../types.js';
import { checkPathAllowed } from '../../tools/sandbox.js';

export const fileEditSkill: Skill = {
  manifest: { name: 'file-edit', version: '0.1.0', description: 'Edit files' },
  tools: [
    {
      name: 'file_edit',
      description: 'Replace a string in a file',
      input_schema: {
        type: 'object',
        properties: {
          path: { type: 'string', description: 'File path' },
          old_string: { type: 'string', description: 'String to find' },
          new_string: { type: 'string', description: 'Replacement string' },
        },
        required: ['path', 'old_string', 'new_string'],
      },
      async execute(input) {
        const { path, old_string, new_string } = input as { path: string; old_string: string; new_string: string };
        checkPathAllowed(path);
        try {
          const content = readFileSync(path, 'utf-8');
          if (!content.includes(old_string)) {
            return { success: false, output: '', error: 'old_string not found in file' };
          }
          writeFileSync(path, content.replace(old_string, new_string), 'utf-8');
          return { success: true, output: `Edited ${path}` };
        } catch (err) {
          return { success: false, output: '', error: String(err) };
        }
      },
    },
  ],
};
