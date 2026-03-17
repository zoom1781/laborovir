import { describe, it, expect } from 'vitest';
import { loadBuiltinSkills } from '../../src/skills/registry.js';

describe('Skills Registry', () => {
  it('loads builtin skills', async () => {
    const skills = await loadBuiltinSkills();
    expect(skills.length).toBeGreaterThan(0);
    expect(skills.map(s => s.manifest.name)).toContain('exec');
    expect(skills.map(s => s.manifest.name)).toContain('file-read');
  });

  it('each skill has tools', async () => {
    const skills = await loadBuiltinSkills();
    for (const skill of skills) {
      expect(skill.tools.length).toBeGreaterThan(0);
      for (const tool of skill.tools) {
        expect(tool.name).toBeTruthy();
        expect(tool.description).toBeTruthy();
        expect(typeof tool.execute).toBe('function');
      }
    }
  });
});
