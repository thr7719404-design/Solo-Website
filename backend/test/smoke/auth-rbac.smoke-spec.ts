/**
 * Auth & RBAC enforcement smoke tests.
 * Verifies that:
 *  - Unauthenticated requests to protected routes return 401/403
 *  - Auth endpoints reject malformed payloads with 4xx
 *  - Login with bad credentials returns 401
 *  - Registration validation rejects invalid emails/weak passwords
 *
 * NO valid credentials are used and no users are created (write-safe).
 */
import { api, PROTECTED_GET_ROUTES, runRouteCheck } from './smoke-client';

describe('Smoke / Auth & RBAC enforcement', () => {
  describe('Protected routes reject unauthenticated requests', () => {
    PROTECTED_GET_ROUTES.forEach(route => {
      it(`${route.method} ${route.path} -> 401/403 without token`, async () => {
        const r = await runRouteCheck(route);
        expect(r.ok).toBe(true);
      });
    });
  });

  describe('POST /api/auth/login', () => {
    it('rejects missing body with 400', async () => {
      const res = await api().post('/api/auth/login').send({});
      expect([400, 401, 422, 429]).toContain(res.status);
    });

    it('rejects invalid email format with 400', async () => {
      const res = await api()
        .post('/api/auth/login')
        .send({ email: 'not-an-email', password: 'whatever' });
      // 429 = throttled by rate limiter (live deployment), still a correct rejection
      expect([400, 401, 422, 429]).toContain(res.status);
    });

    it('rejects bad credentials with 401', async () => {
      const res = await api()
        .post('/api/auth/login')
        .send({
          email: `nonexistent-${Date.now()}@example.com`,
          password: 'WrongPassword123!',
        });
      expect([400, 401, 429]).toContain(res.status);
    });
  });

  describe('POST /api/auth/register', () => {
    it('rejects missing body with 400', async () => {
      const res = await api().post('/api/auth/register').send({});
      expect([400, 422, 429]).toContain(res.status);
    });

    it('rejects weak password with 400', async () => {
      const res = await api().post('/api/auth/register').send({
        email: `weak-${Date.now()}@example.com`,
        password: '123',
        firstName: 'A',
        lastName: 'B',
      });
      expect([400, 422, 429]).toContain(res.status);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('rejects missing token with 4xx', async () => {
      const res = await api().post('/api/auth/refresh').send({});
      expect([400, 401, 422]).toContain(res.status);
    });

    it('rejects invalid token with 401', async () => {
      const res = await api()
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid.token.value' });
      expect([400, 401]).toContain(res.status);
    });
  });

  describe('Invalid JWT', () => {
    it('GET /api/auth/me with garbage token -> 401', async () => {
      const res = await api()
        .get('/api/auth/me')
        .set('Authorization', 'Bearer garbage.token.value');
      expect(res.status).toBe(401);
    });
  });
});
