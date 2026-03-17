import type { Skill } from './types.js';
import { execSkill } from './builtin/exec.js';
import { fileReadSkill } from './builtin/file-read.js';
import { fileWriteSkill } from './builtin/file-write.js';
import { fileEditSkill } from './builtin/file-edit.js';
import { searchSkill } from './builtin/search.js';
import { browserSkill } from './builtin/browser.js';

const builtinSkills: Skill[] = [
  execSkill, fileReadSkill, fileWriteSkill, fileEditSkill, searchSkill, browserSkill,
];

export async function loadBuiltinSkills(): Promise<Skill[]> {
  return builtinSkills;
}

export async function loadExternalSkill(path: string): Promise<Skill> {
  const mod = await import(path);
  return mod.default as Skill;
}
