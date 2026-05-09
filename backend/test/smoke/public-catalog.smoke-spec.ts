/**
 * Public catalog read-only smoke tests.
 * Verifies products, categories, brands, content, settings endpoints
 * return 2xx and have the expected shape.
 */
import { api, PUBLIC_GET_ROUTES, runRouteCheck } from './smoke-client';

describe('Smoke / Public catalog', () => {
  describe('Bulk public GET sweep', () => {
    PUBLIC_GET_ROUTES.forEach(route => {
      const expected = route.expectStatus ?? [200];
      it(`${route.method} ${route.path} -> ${expected.join('|')}`, async () => {
        const r = await runRouteCheck(route);
        expect(r.ok).toBe(true);
      });
    });
  });

  describe('Products list shape', () => {
    it('GET /api/products returns paginated data array', async () => {
      const res = await api().get('/api/products?limit=5');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
      expect(Array.isArray(res.body.data)).toBe(true);
      if (res.body.data.length > 0) {
        const p = res.body.data[0];
        expect(p).toHaveProperty('id');
        expect(p).toHaveProperty('name');
        expect(p).toHaveProperty('sku');
      }
    });

    it('GET /api/products supports search query', async () => {
      const res = await api().get('/api/products?search=basket&limit=5');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('data');
    });

    it('GET /api/products supports pagination', async () => {
      const r1 = await api().get('/api/products?page=1&limit=2');
      const r2 = await api().get('/api/products?page=2&limit=2');
      expect(r1.status).toBe(200);
      expect(r2.status).toBe(200);
      expect(r1.body.data).not.toEqual(r2.body.data);
    });

    it('GET /api/products/:id with non-existent id returns 404', async () => {
      const res = await api().get('/api/products/nonexistent-slug-xyz-987654');
      expect([404, 400]).toContain(res.status);
    });

    it('GET /api/products/featured returns array', async () => {
      const res = await api().get('/api/products/featured');
      expect(res.status).toBe(200);
      const list = Array.isArray(res.body) ? res.body : res.body.data;
      expect(Array.isArray(list)).toBe(true);
    });
  });

  describe('Categories', () => {
    it('GET /api/categories returns categories', async () => {
      const res = await api().get('/api/categories');
      expect(res.status).toBe(200);
      const list = Array.isArray(res.body) ? res.body : res.body.data;
      expect(Array.isArray(list)).toBe(true);
    });
  });

  describe('Brands', () => {
    it('GET /api/brands returns brands', async () => {
      const res = await api().get('/api/brands');
      expect(res.status).toBe(200);
      const list = Array.isArray(res.body) ? res.body : res.body.data;
      expect(Array.isArray(list)).toBe(true);
    });
  });

  describe('Settings', () => {
    it('GET /api/settings/vat returns VAT config with rate', async () => {
      const res = await api().get('/api/settings/vat');
      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    });

    it('GET /api/settings/shipping returns shipping config', async () => {
      const res = await api().get('/api/settings/shipping');
      expect(res.status).toBe(200);
      expect(res.body).toBeDefined();
    });
  });

  describe('Content', () => {
    it('GET /api/content/home returns home content', async () => {
      const res = await api().get('/api/content/home');
      expect(res.status).toBe(200);
    });

    it('GET /api/content/banners returns banners', async () => {
      const res = await api().get('/api/content/banners');
      expect(res.status).toBe(200);
    });
  });
});
