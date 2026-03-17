import { describe, it, expect } from 'vitest';
import { execSync } from 'node:child_process';
import { join } from 'node:path';

const bin = join(import.meta.dirname, '..', '..', 'bin', 'laborovir.js');

describe('CLI', () => {
  it('prints version', () => {
    const out = execSync(`node ${bin} --version`, { encoding: 'utf-8' });
    expect(out.trim()).toBe('0.1.0');
  });

  it('prints help', () => {
    const out = execSync(`node ${bin} --help`, { encoding: 'utf-8' });
    expect(out).toContain('Laborovir Workman');
    expect(out).toContain('onboard');
    expect(out).toContain('gateway');
    expect(out).toContain('doctor');
  });

  it('doctor runs without crash', () => {
    try {
      const out = execSync(`node ${bin} doctor`, { encoding: 'utf-8' });
      expect(out).toContain('Laborovir Doctor');
    } catch (err: any) {
      // Doctor exits 1 when checks fail (e.g. no config), that's expected
      expect(err.stdout).toContain('Laborovir Doctor');
    }
  });

  it('config get returns defaults when no config file', () => {
    const out = execSync(`node ${bin} config get`, { encoding: 'utf-8' });
    expect(out).toContain('version');
  });

  it('skills list shows builtins', () => {
    const out = execSync(`node ${bin} skills list`, { encoding: 'utf-8' });
    expect(out).toContain('exec');
    expect(out).toContain('file-read');
  });
});
