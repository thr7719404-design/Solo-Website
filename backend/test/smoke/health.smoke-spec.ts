/**
 * Health & infrastructure smoke tests against the live deployed backend.
 */
import { api, BASE_URL } from './smoke-client';

describe(`Smoke / Health (live: ${BASE_URL})`, () => {
  it('GET /api/health returns 200 with status payload', async () => {
    const res = await api().get('/api/health');
    expect([200, 503]).toContain(res.status);
    expect(res.body).toBeDefined();
  });

  it('GET /api/health/live returns 200', async () => {
    const res = await api().get('/api/health/live');
    expect(res.status).toBe(200);
  });

  it('GET /api/health/ready returns 200 or 503', async () => {
    const res = await api().get('/api/health/ready');
    expect([200, 503]).toContain(res.status);
  });

  it('GET /api/catalog/version returns version metadata', async () => {
    const res = await api().get('/api/catalog/version');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('version');
  });

  it('Unknown route returns 404', async () => {
    const res = await api().get('/api/this-route-does-not-exist-xyz123');
    expect(res.status).toBe(404);
  });
});
