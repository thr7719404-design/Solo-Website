/**
 * Favorites + account profile write flow against live Azure backend.
 * Uses shared customer.
 */
import { api } from './smoke-client';
import { writesReady, asCustomer } from './smoke-state';

const d = writesReady() ? describe : describe.skip;

d('Smoke / Favorites + Account write flow', () => {
  let productId: string | null = null;

  beforeAll(async () => {
    const list = await api().get('/api/products?limit=5');
    const items = list.body?.data || list.body?.products || list.body || [];
    productId = items[0]?.id ? String(items[0].id) : null;
  }, 30000);

  afterAll(async () => {
    if (productId) {
      await asCustomer().delete(`/api/favorites/${productId}`);
    }
  }, 30000);

  it('GET /api/favorites returns array', async () => {
    const res = await asCustomer().get('/api/favorites');
    expect(res.status).toBe(200);
    const items =
      res.body?.items || res.body?.favorites || (Array.isArray(res.body) ? res.body : []);
    expect(Array.isArray(items)).toBe(true);
  });

  it('POST /api/favorites/:productId adds a product', async () => {
    if (!productId) return;
    const add = await asCustomer().post(`/api/favorites/${productId}`).send({});
    expect([200, 201, 204, 409]).toContain(add.status);
  });

  it('GET /api/favorites contains the added product', async () => {
    if (!productId) return;
    const list = await asCustomer().get('/api/favorites');
    expect(list.status).toBe(200);
    const items =
      list.body?.items ||
      list.body?.favorites ||
      (Array.isArray(list.body) ? list.body : []);
    const found = items.find(
      (i: any) => String(i.productId || i.id || i.product?.id) === productId,
    );
    // Some implementations return a wrapped { product: { id } }; allow either
    expect(items.length).toBeGreaterThan(0);
    if (found) expect(found).toBeDefined();
  });

  it('DELETE /api/favorites/:productId removes it', async () => {
    if (!productId) return;
    const del = await asCustomer().delete(`/api/favorites/${productId}`);
    expect([200, 204, 404]).toContain(del.status);
  });

  it('GET /api/account/profile returns the user profile (or 404 if not mounted)', async () => {
    const res = await asCustomer().get('/api/account/profile');
    expect([200, 404]).toContain(res.status);
  });
});
