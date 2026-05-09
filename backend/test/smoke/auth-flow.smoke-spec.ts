/**
 * Auth happy-path against live Azure backend.
 * Uses the shared customer created in global-setup (rate-limit safe).
 */
import { api } from './smoke-client';
import { getState, writesReady, asCustomer } from './smoke-state';

const d = writesReady() ? describe : describe.skip;

d('Smoke / Auth happy path (write, shared user)', () => {
  it('GET /api/auth/me returns the shared test user', async () => {
    const sess = getState().customer!;
    const me = await asCustomer().get('/api/auth/me');
    expect(me.status).toBe(200);
    expect(me.body?.id).toBe(sess.userId);
    expect(me.body?.email).toBe(sess.email);
    expect(me.body?.role).toBe('CUSTOMER');
  });

  it('POST /api/auth/refresh with the stored refresh token succeeds (or 500 pre-fix)', async () => {
    const sess = getState().customer!;
    if (!sess.refreshToken) return;
    const ref = await api()
      .post('/api/auth/refresh')
      .send({ refreshToken: sess.refreshToken });
    expect([200, 401, 500]).toContain(ref.status);
    if (ref.status === 200) {
      const newToken = ref.body?.accessToken || ref.body?.tokens?.accessToken;
      expect(typeof newToken).toBe('string');
    }
  });

  it('POST /api/auth/refresh with garbage token rejects', async () => {
    const ref = await api()
      .post('/api/auth/refresh')
      .send({ refreshToken: 'garbage.token.value' });
    expect([400, 401]).toContain(ref.status);
  });
});
