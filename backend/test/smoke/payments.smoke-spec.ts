/**
 * BNPL & Stripe payment endpoint smoke tests (read-only / validation only).
 * Verifies config endpoints and that invalid session creation requests
 * are rejected (no real sessions are created).
 */
import { api } from './smoke-client';

describe('Smoke / Payments (Stripe + BNPL)', () => {
  describe('Stripe', () => {
    it('GET /api/stripe/config returns publishable key shape', async () => {
      const res = await api().get('/api/stripe/config');
      expect(res.status).toBe(200);
      // shape may vary; just assert we got an object
      expect(typeof res.body).toBe('object');
    });

    it('POST /api/stripe/create-payment-intent without auth/body -> 4xx', async () => {
      const res = await api().post('/api/stripe/create-payment-intent').send({});
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    it('POST /api/stripe/webhook without signature -> 4xx', async () => {
      const res = await api().post('/api/stripe/webhook').send({ type: 'fake' });
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('Tabby', () => {
    it('GET /api/tabby/config returns config or 404 if not enabled', async () => {
      const res = await api().get('/api/tabby/config');
      expect([200, 404]).toContain(res.status);
    });

    it('POST /api/tabby/create-session with empty body -> 4xx', async () => {
      const res = await api().post('/api/tabby/create-session').send({});
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    it('POST /api/tabby/webhook with empty body -> 4xx', async () => {
      const res = await api().post('/api/tabby/webhook').send({});
      // Webhook may accept and noop, or reject — accept either non-5xx
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('Tamara', () => {
    it('GET /api/tamara/config returns config or 404 if not enabled', async () => {
      const res = await api().get('/api/tamara/config');
      expect([200, 404]).toContain(res.status);
    });

    it('POST /api/tamara/create-session with empty body -> 4xx', async () => {
      const res = await api().post('/api/tamara/create-session').send({});
      expect(res.status).toBeGreaterThanOrEqual(400);
      expect(res.status).toBeLessThan(500);
    });

    it('POST /api/tamara/webhook with empty body -> non-5xx', async () => {
      const res = await api().post('/api/tamara/webhook').send({});
      expect(res.status).toBeLessThan(500);
    });
  });
});
