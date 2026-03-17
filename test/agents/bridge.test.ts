import { describe, it, expect } from 'vitest';
import { runAgentBridge } from '../../src/agents/bridge.js';
import { defaultConfig } from '../../src/config/defaults.js';

describe('Agent Bridge', () => {
  it('is a function', () => {
    expect(typeof runAgentBridge).toBe('function');
  });
});
