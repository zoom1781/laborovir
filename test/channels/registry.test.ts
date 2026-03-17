import { describe, it, expect } from 'vitest';
import { getAdapter, disconnectAll } from '../../src/channels/registry.js';

describe('Channel Registry', () => {
  it('returns undefined for unknown adapter', () => {
    expect(getAdapter('nonexistent')).toBeUndefined();
  });

  it('disconnectAll does not throw when empty', async () => {
    await expect(disconnectAll()).resolves.toBeUndefined();
  });
});
