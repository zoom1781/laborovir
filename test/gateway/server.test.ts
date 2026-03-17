import { describe, it, expect } from 'vitest';

describe('Gateway Server', () => {
  it('module exports are valid', async () => {
    // Just verify the module can be imported without the top-level await running
    // (server.ts has top-level await so we test the router instead)
    const { routeMessage } = await import('../../src/gateway/router.js');
    expect(typeof routeMessage).toBe('function');
  });
});
