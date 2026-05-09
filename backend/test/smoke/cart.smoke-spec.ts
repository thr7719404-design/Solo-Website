/**
 * Cart write-path smoke against live Azure backend.
 * Uses shared customer from global-setup. Cleans up cart at the end.
 */
import { api } from './smoke-client';
import { writesReady, asCustomer } from './smoke-state';

const d = writesReady() ? describe : describe.skip;

async function pickProductId(): Promise<string | null> {
  const res = await api().get('/api/products?limit=20');
  if (res.status !== 200) return null;
  const list = res.body?.data || res.body?.products || res.body || [];
  for (const p of list) {
    const stock = p.stock ?? p.stockQuantity ?? p.totalStock;
    if (p.id && (stock === undefined || stock > 0)) return String(p.id);
  }
  return list[0]?.id ? String(list[0].id) : null;
}

d('Smoke / Cart write flow', () => {
  let productId: string | null = null;

  beforeAll(async () => {
    productId = await pickProductId();
  }, 30000);

  afterAll(async () => {
    // Final cart clear so the user is left with no orphan rows
    await asCustomer().delete('/api/cart');
  }, 30000);

  it('GET /api/cart returns a cart object', async () => {
    const res = await asCustomer().get('/api/cart');
    expect(res.status).toBe(200);
    const items = res.body?.items || res.body?.cart?.items || [];
    expect(Array.isArray(items)).toBe(true);
  });

  it('POST /api/cart/items adds a product', async () => {
    if (!productId) {
      // eslint-disable-next-line no-console
      console.warn('[cart] no product available — skipping');
      return;
    }
    // Ensure clean cart first
    await asCustomer().delete('/api/cart');
    const res = await asCustomer()
      .post('/api/cart/items')
      .send({ type: 'PRODUCT', itemId: productId, quantity: 1 });
    expect([200, 201]).toContain(res.status);

    const get = await asCustomer().get('/api/cart');
    expect(get.status).toBe(200);
    const items = get.body?.items || get.body?.cart?.items || [];
    expect(items.length).toBeGreaterThan(0);
  });

  it('PATCH /api/cart/items/:id updates quantity', async () => {
    const cart = await asCustomer().get('/api/cart');
    const items = cart.body?.items || cart.body?.cart?.items || [];
    if (!items.length) return;
    const itemId = items[0].id;
    const res = await asCustomer()
      .patch(`/api/cart/items/${itemId}`)
      .send({ quantity: 2 });
    expect([200, 204]).toContain(res.status);

    const after = await asCustomer().get('/api/cart');
    const updated = (after.body?.items || after.body?.cart?.items || [])[0];
    if (updated) {
      expect(updated.quantity).toBe(2);
    }
  });

  it('DELETE /api/cart/items/:id removes the line', async () => {
    const cart = await asCustomer().get('/api/cart');
    const items = cart.body?.items || cart.body?.cart?.items || [];
    if (!items.length) return;
    const itemId = items[0].id;
    const res = await asCustomer().delete(`/api/cart/items/${itemId}`);
    expect([200, 204]).toContain(res.status);
  });

  it('DELETE /api/cart clears the cart', async () => {
    const res = await asCustomer().delete('/api/cart');
    expect([200, 204]).toContain(res.status);

    const get = await asCustomer().get('/api/cart');
    const items = get.body?.items || get.body?.cart?.items || [];
    expect(items.length).toBe(0);
  });
});
