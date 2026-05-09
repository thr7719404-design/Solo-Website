# 10 — Testing & QA

## 1. Test pyramid

```
        ┌──────────────┐
        │  E2E (Playwright) │   ← few, slow, against deployed stack
        └──────────────┘
      ┌──────────────────────┐
      │ Integration / smoke   │  ← Jest + Supertest against live API
      └──────────────────────┘
   ┌────────────────────────────────┐
   │ Unit (Vitest / Jest)            │  ← fast, isolated
   └────────────────────────────────┘
```

| Layer | Tool | Location | Status |
|---|---|---|---|
| Frontend unit/component | Vitest 3 + RTL + jsdom | [`frontend-react/src/**/__tests__`](../frontend-react/src/) + [`frontend-react/vitest.config.ts`](../frontend-react/vitest.config.ts) | 9 specs / passing |
| Backend smoke (live) | Jest 29 + Supertest | [`backend/test/smoke/`](../backend/test/smoke/) | 7 specs / passing |
| Backend e2e (legacy) | Jest 29 | [`backend/test/`](../backend/test/) | reserved |
| End-to-end | Playwright + Chromium | [`e2e/smoke/`](../e2e/smoke/) + workspace [`playwright.config.ts`](../playwright.config.ts) | 6 specs / passing |

**Last full run:** 128/128 green (113 backend + 9 frontend + 6 E2E).

## 2. Frontend tests

```powershell
cd frontend-react
npm install
npm run test           # vitest run
npm run test:watch
```

- Setup: [`frontend-react/src/test/setup.ts`](../frontend-react/src/test/setup.ts)
  configures jsdom + RTL globals.
- Notable specs:
  - `VariantSelector.test.tsx` — verifies axes are hidden when only one
    option exists; sibling navigation works when multiple variants exist.
  - `cart.test.ts` — store reducer logic, totals, promo, loyalty.

## 3. Backend smoke tests

The smoke suite hits the **deployed** backend with a single shared QA
customer to stay inside auth rate limits.

```powershell
cd backend
$env:SMOKE_API_URL = 'https://backend-qlyb5greec2io.whiteriver-ae956411.eastus2.azurecontainerapps.io/api'
$env:SMOKE_ADMIN_EMAIL = 'admin@solo-ecommerce.com'
$env:SMOKE_ADMIN_PASSWORD = '<secret>'
npm run test:smoke
```

- Config: [`backend/test/smoke/jest-smoke.json`](../backend/test/smoke/jest-smoke.json)
  → `maxWorkers: 1`.
- Global setup creates one customer `qa-smoke-{runId}@solo-qa.local`.
- Global teardown deletes the customer via
  `DELETE /api/admin/customers/:id` using an admin token.
- Specs cover: auth login/refresh, products list/detail, cart add/update,
  favorites add/remove, orders create (COD path), returns request,
  health.

### Cleanup utility

If a run is interrupted, sweep stragglers with:

```powershell
node backend/scripts/cleanup-smoke-data.js
```

It logs in as admin, lists customers matching `qa-smoke-*@solo-qa.local`,
and deletes them with retry/back-off (60 retries, 30–60 s) — used after
deploys to confirm `qa-smoke matches: 0`.

## 4. End-to-end (Playwright)

```powershell
npx playwright install chromium     # one-time
npx playwright test e2e/smoke
```

- Config: [`playwright.config.ts`](../playwright.config.ts) (workspace
  root). `baseURL` points at the live Static Web App.
- Specs: home loads, navigation renders, product list paginates, product
  detail shows variants, cart add flow, header search.

## 5. Rate-limit guidance

`/api/auth/*` is hard-limited to **5 requests / 15 min / IP**. Tests must:

- Reuse a single login per run (smoke does this via `globalSetup`).
- Avoid registering a new user per spec.
- When iterating locally, wait at least 15 min after hitting the cap or
  switch IP.

## 6. Coverage matrix

| Capability | Unit | Smoke | E2E |
|---|---|---|---|
| Login / refresh / logout | – | ✅ | – |
| Product list | – | ✅ | ✅ |
| Product detail incl. variants | ✅ (frontend) | ✅ | ✅ |
| Cart CRUD | ✅ (frontend store) | ✅ | ✅ |
| Favorites | – | ✅ | – |
| Order create (COD) | – | ✅ | – |
| Stripe checkout | – | – | manual |
| Returns request | – | ✅ | – |
| Admin RBAC | – | ✅ (admin delete customer) | – |
| Health | – | ✅ | – |

## 7. Manual QA checklists (lightweight)

Pre-release smoke (10 min) by a human:

1. Home loads; banners render; navigation tree opens.
2. Search returns results; product detail shows price + VAT line.
3. Add 2 products to cart; apply a promo code; remove one item.
4. Login as known customer; cart persists.
5. Checkout with Stripe test card `4242 4242 4242 4242`; order
   confirmation page; account → orders shows the new order; PDF
   invoice downloads.
6. Admin → orders → mark new order as `PROCESSING`; status history
   updated.
7. Logout → ensure `/account/*` routes redirect.

## 8. CI guidance

- Fast feedback: run **frontend unit** and **backend unit/lint** on every
  PR.
- Smoke: gated to runs against `staging` or post-deploy on `main`,
  serialised (`maxWorkers: 1`) to respect throttling.
- E2E: post-deploy on `main` against the deployed SWA.
- Always run `cleanup-smoke-data.js` as a final stage to avoid residue.

## 9. Quality gates before merge

- ✅ Lint passes (`eslint`)
- ✅ Type-check passes (`tsc --noEmit` / `nest build`)
- ✅ Affected unit tests pass
- ✅ No new `npm audit` HIGH/CRITICAL
- ✅ Schema migrations reviewed and named descriptively
- ✅ Public API change documented in [06 API Reference](./06-api-reference.md)
