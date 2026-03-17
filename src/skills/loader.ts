import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { SKILLS_DIR } from '../shared/constants.js';
import type { Skill } from './types.js';

export async function discoverExternalSkills(): Promise<Skill[]> {
  if (!existsSync(SKILLS_DIR)) return [];

  const skills: Skill[] = [];
  const entries = readdirSync(SKILLS_DIR, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const indexPath = join(SKILLS_DIR, entry.name, 'index.js');
      if (existsSync(indexPath)) {
        try {
          const mod = await import(indexPath);
          skills.push(mod.default as Skill);
        } catch {
          // Skip invalid skills
        }
      }
    }
  }
  return skills;
}
