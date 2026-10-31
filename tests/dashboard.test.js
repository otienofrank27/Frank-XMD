import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createDashboardServer } from '../src/dashboard/server.js';

describe('dashboard HTTP security and health', () => {
  it('serves the dashboard, exposes a health check and protects session APIs', async () => {
    const sessionManager = {
      list: async () => [],
      create: async () => ({}),
      stop: async () => ({}),
      resume: async () => ({}),
      restart: async () => ({})
    };
    const dashboard = createDashboardServer({ sessionManager, host: '127.0.0.1', port: 0 });
    const server = await dashboard.listen();
    const address = server.address();
    const base = `http://127.0.0.1:${address.port}`;
    try {
      const page = await fetch(base + '/');
      assert.equal(page.status, 200);
      assert.match(await page.text(), /FRANK-XMD/);

      const health = await fetch(base + '/api/health');
      assert.equal(health.status, 200);
      assert.deepEqual(await health.json(), { ok: true });

      const sessions = await fetch(base + '/api/sessions');
      assert.equal(sessions.status, 401);
      assert.match((await sessions.json()).error, /Sign in/);

      const crossOrigin = await fetch(base + '/api/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'http://attacker.example' },
        body: JSON.stringify({ email: 'test@example.com', password: 'correct-horse-battery' })
      });
      assert.equal(crossOrigin.status, 403);
    } finally {
      await dashboard.close();
    }
  });
});
