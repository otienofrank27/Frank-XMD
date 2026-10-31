import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createDashboardServer } from '../src/dashboard/server.js';

describe('FRANK-XMD dashboard HTTP surface', () => {
  it('serves the dashboard and protects session APIs behind login', async () => {
    const sessionManager = { list: async () => [], create: async () => ({}), stop: async () => ({}) };
    const dashboard = createDashboardServer({ sessionManager, host: '127.0.0.1', port: 0 });
    const server = await dashboard.listen();
    const address = server.address();
    try {
      const page = await fetch(`http://127.0.0.1:${address.port}/`);
      assert.equal(page.status, 200);
      assert.match(await page.text(), /FRANK-XMD/);

      const sessions = await fetch(`http://127.0.0.1:${address.port}/api/sessions`);
      assert.equal(sessions.status, 401);
      assert.match((await sessions.json()).error, /Sign in/);
    } finally {
      await dashboard.close();
    }
  });
});
