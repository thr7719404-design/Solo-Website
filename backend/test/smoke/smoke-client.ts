/**
 * Shared HTTP client for live read-only smoke tests against the deployed backend.
 *
 * Defaults to the production Azure Container Apps URL but can be overridden
 * with TEST_BASE_URL env var (e.g. http://localhost:3000 for local runs).
 *
 * NOTE: These tests are READ-ONLY by contract. Do not add POST/PATCH/DELETE
 * calls to non-validation endpoints here without explicit guard/cleanup.
 */
import * as request from 'supertest';

export const BASE_URL =
  process.env.TEST_BASE_URL ||
  'https://backend-qlyb5greec2io.whiteriver-ae956411.eastus2.azurecontainerapps.io';

export const api = () => request(BASE_URL);

export interface RouteCheck {
  method: 'GET';
  path: string;
  expectStatus?: number[]; // default [200]
  expectAuth?: boolean;    // when true, expect 401/403 without token
  description?: string;
}

/** Endpoints we expect to be publicly reachable with 2xx. */
export const PUBLIC_GET_ROUTES: RouteCheck[] = [
  { method: 'GET', path: '/api/health',                    expectStatus: [200] },
  { method: 'GET', path: '/api/health/live',               expectStatus: [200] },
  { method: 'GET', path: '/api/health/ready',              expectStatus: [200, 503] },
  { method: 'GET', path: '/api/catalog/version',           expectStatus: [200] },
  { method: 'GET', path: '/api/catalog/health',            expectStatus: [200] },
  { method: 'GET', path: '/api/products',                  expectStatus: [200] },
  { method: 'GET', path: '/api/products?limit=5',          expectStatus: [200] },
  { method: 'GET', path: '/api/products/featured',         expectStatus: [200] },
  { method: 'GET', path: '/api/products/best-sellers',     expectStatus: [200] },
  { method: 'GET', path: '/api/products/new-arrivals',     expectStatus: [200] },
  { method: 'GET', path: '/api/products/inventory/categories', expectStatus: [200] },
  { method: 'GET', path: '/api/products/inventory/brands', expectStatus: [200] },
  { method: 'GET', path: '/api/categories',                expectStatus: [200] },
  { method: 'GET', path: '/api/subcategories',             expectStatus: [200] },
  { method: 'GET', path: '/api/brands',                    expectStatus: [200] },
  { method: 'GET', path: '/api/announcements/active',      expectStatus: [200] },
  { method: 'GET', path: '/api/content/home',              expectStatus: [200] },
  { method: 'GET', path: '/api/content/banners',           expectStatus: [200] },
  { method: 'GET', path: '/api/content/loyalty-config',    expectStatus: [200] },
  { method: 'GET', path: '/api/cms/home-page',             expectStatus: [200] },
  { method: 'GET', path: '/api/navigation/menu/main',      expectStatus: [200, 404] },
  { method: 'GET', path: '/api/settings/vat',              expectStatus: [200] },
  { method: 'GET', path: '/api/settings/loyalty',          expectStatus: [200] },
  { method: 'GET', path: '/api/settings/shipping',         expectStatus: [200] },
  { method: 'GET', path: '/api/stripe/config',             expectStatus: [200] },
  { method: 'GET', path: '/api/tabby/config',              expectStatus: [200, 404] },
  { method: 'GET', path: '/api/tamara/config',             expectStatus: [200, 404] },
  { method: 'GET', path: '/api/debug/status',              expectStatus: [200, 404] },
];

/** Endpoints that MUST require auth — request without token should fail. */
export const PROTECTED_GET_ROUTES: RouteCheck[] = [
  { method: 'GET', path: '/api/auth/me',                   expectAuth: true },
  { method: 'GET', path: '/api/account/profile',           expectAuth: true },
  { method: 'GET', path: '/api/account/orders',            expectAuth: true },
  { method: 'GET', path: '/api/account/addresses',         expectAuth: true },
  { method: 'GET', path: '/api/account/loyalty',           expectAuth: true },
  { method: 'GET', path: '/api/account/payment-methods',   expectAuth: true },
  { method: 'GET', path: '/api/cart',                      expectAuth: true },
  { method: 'GET', path: '/api/favorites',                 expectAuth: true },
  { method: 'GET', path: '/api/orders',                    expectAuth: true },
  { method: 'GET', path: '/api/returns',                   expectAuth: true },

  // Admin endpoints
  { method: 'GET', path: '/api/admin/stats',               expectAuth: true },
  { method: 'GET', path: '/api/admin/orders',              expectAuth: true },
  { method: 'GET', path: '/api/admin/customers',           expectAuth: true },
  { method: 'GET', path: '/api/admin/returns',             expectAuth: true },
  { method: 'GET', path: '/api/admin/announcements',       expectAuth: true },
  { method: 'GET', path: '/api/admin/stock/low-stock',     expectAuth: true },
  { method: 'GET', path: '/api/admin/product-groups',      expectAuth: true },
  { method: 'GET', path: '/api/admin/reports',             expectAuth: true },
  { method: 'GET', path: '/api/admin/reports/financial',   expectAuth: true },
  { method: 'GET', path: '/api/admin/reports/revenue',     expectAuth: true },
  { method: 'GET', path: '/api/admin/reports/orders',      expectAuth: true },
  { method: 'GET', path: '/api/admin/reports/products',    expectAuth: true },
  { method: 'GET', path: '/api/admin/reports/stock',       expectAuth: true },
  { method: 'GET', path: '/api/admin/reports/customers',   expectAuth: true },
  { method: 'GET', path: '/api/admin/reports/vat',         expectAuth: true },
  { method: 'GET', path: '/api/admin/reports/categories',  expectAuth: true },
  { method: 'GET', path: '/api/admin/reports/promos',      expectAuth: true },
  { method: 'GET', path: '/api/admin/reports/inventory-value', expectAuth: true },
  { method: 'GET', path: '/api/admin/reports/catalog-health',  expectAuth: true },
  { method: 'GET', path: '/api/admin/reports/abandoned-carts', expectAuth: true },
  { method: 'GET', path: '/api/admin/reports/failed-payments', expectAuth: true },
  { method: 'GET', path: '/api/admin/reports/loyalty',     expectAuth: true },
  { method: 'GET', path: '/api/admin/reports/repeat-rate', expectAuth: true },
  { method: 'GET', path: '/api/admin/reports/bulk-orders', expectAuth: true },
  { method: 'GET', path: '/api/admin/reports/invoices',    expectAuth: true },
  { method: 'GET', path: '/api/admin/reports/order-pipeline',  expectAuth: true },
  { method: 'GET', path: '/api/admin/reports/featured-performance', expectAuth: true },
  { method: 'GET', path: '/api/bulk-orders/admin',         expectAuth: true },
  { method: 'GET', path: '/api/promo-codes',               expectAuth: true },
];

export interface CheckResult {
  path: string;
  method: string;
  expected: number[];
  actual: number;
  ok: boolean;
  errorBody?: unknown;
  durationMs: number;
}

export async function runRouteCheck(route: RouteCheck, token?: string): Promise<CheckResult> {
  const expected =
    route.expectAuth ? [401, 403] : (route.expectStatus ?? [200]);
  const start = Date.now();
  let actual = 0;
  let errorBody: unknown;
  try {
    let req = api().get(route.path);
    if (token) req = req.set('Authorization', `Bearer ${token}`);
    const res = await req;
    actual = res.status;
    if (!expected.includes(actual)) errorBody = res.body;
  } catch (e: any) {
    actual = e?.status || 0;
    errorBody = e?.message || String(e);
  }
  return {
    path: route.path,
    method: route.method,
    expected,
    actual,
    ok: expected.includes(actual),
    errorBody: expected.includes(actual) ? undefined : errorBody,
    durationMs: Date.now() - start,
  };
}
