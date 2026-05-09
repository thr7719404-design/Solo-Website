# 01 — Scope & Vision

## 1. Product summary

Solo is a **direct-to-consumer e-commerce platform** for the MENA market
(primary: UAE) selling premium lifestyle, travel and home goods. It is a
**headless** commerce stack: a NestJS REST API backed by PostgreSQL and a
React (Vite) single-page storefront, deployed on Azure.

The platform supports the full retail lifecycle:

- Product discovery (search, browse, filter, variants, recommendations)
- Customer accounts (register, login, addresses, favorites, loyalty wallet)
- Cart and checkout (cards via Stripe, BNPL via Tabby & Tamara, COD)
- Order lifecycle (placement → fulfilment → shipped → delivered → returns)
- Content management (banners, home page sections, navigation, landing pages)
- Admin operations (catalog CRUD, orders, customers, returns, reports)

## 2. Vision

> *Be the most trusted premium e-commerce destination in the GCC, with a
> bilingual (EN/AR), VAT-compliant, mobile-first experience that scales from
> first sale to enterprise B2B.*

## 3. Business goals

| # | Goal | Success measure |
|---|---|---|
| G1 | Convert visitors to buyers | Conversion rate ≥ 1.5% on product pages |
| G2 | Maximise basket size | Average order value (AOV) trending up MoM |
| G3 | Reduce checkout friction | Stripe + Tabby + Tamara + COD all live; ≤ 4 steps |
| G4 | Earn repeat purchase | Loyalty wallet AED rebates; favorites; saved cards |
| G5 | Stay VAT-compliant | Per-order VAT snapshot; downloadable PDF invoices |
| G6 | Scale via B2B channel | Bulk-order RFQ flow with admin workflow |
| G7 | Enable rapid merchandising | CMS-driven home, category landing, navigation |

## 4. Personas

- **Shopper (Sara)** — UAE resident, mobile-first, expects Arabic + English,
  wants Tabby/Tamara split-pay and free returns.
- **Repeat customer (Khalid)** — uses saved cards, follows favorites, redeems
  loyalty AED at checkout.
- **B2B buyer (Procurement)** — submits a bulk-order RFQ, expects an admin to
  reply with a quote.
- **Merchandiser (Admin)** — schedules banners, builds home page sections,
  curates collections, sets sale prices.
- **Operations admin (Super-admin)** — manages stock, orders, returns,
  customers, reports, settings (VAT rate, shipping tiers).

## 5. In scope

- B2C storefront (web responsive)
- Catalog with variants (color, size, material), brand & designer associations
- Multi-image, dimension, packaging, specifications, soft-delete tombstones
- Cart with promo codes and loyalty redemption
- Checkout with three providers + COD
- Order management & status history
- Returns with refund methods
- Loyalty wallet (earn / redeem / adjust / expire)
- Admin dashboard (catalog, orders, customers, returns, content, settings)
- Bilingual content (EN + AR fields) with English UI
- VAT-correct pricing (per-line + per-order snapshot, 5% UAE VAT)
- PDF invoices, stock movements ledger
- Bulk-order request capture for B2B leads

## 6. Out of scope (current release)

- Native mobile apps (web is responsive-first)
- Multi-currency display (AED only — single-currency snapshot fields exist
  for forward compatibility)
- Multi-warehouse inventory (single virtual warehouse)
- True multi-tenant (single tenant per deployment)
- Marketplace / 3rd-party seller onboarding
- Subscriptions / recurring billing
- In-store POS integration

## 7. Constraints

- **Region:** Primary infra in Azure `eastus2`; CDN for region edge caching is
  served by SWA. PostgreSQL flexible server is single-zone.
- **Compliance:** UAE VAT (5%); future KSA expansion will require 15% rate
  override (already supported via per-order `vatRateSnapshot`).
- **Identity:** First-party JWT auth (no social/SSO yet).
- **Currency:** AED only at the UI layer; DB carries `currencyCode` columns
  ready for future multi-currency.
- **Throttling:** `/api/auth/*` is hard-limited to 5 requests / 15 min / IP to
  resist credential stuffing.

## 8. Quality attributes (NFRs)

| Attribute | Target |
|---|---|
| Availability | 99.5% backend, 99.9% storefront (CDN-served) |
| API latency p95 (read) | < 700 ms region-internal |
| Cold start (container) | < 5 s with min replicas = 1 |
| Security | OWASP Top 10 covered (see [08-security](./08-security-and-compliance.md)) |
| Observability | Application Insights traces + Pino structured logs |
| Recoverability | Daily PG flexible-server automated backups |
| Localization | EN + AR data fields; UI strings English (AR planned) |
| Accessibility | Keyboard navigable; semantic HTML; alt text required on media |

## 9. Glossary

| Term | Meaning |
|---|---|
| SWA | Azure Static Web Apps (frontend host) |
| ACA | Azure Container Apps (backend host) |
| ACR | Azure Container Registry |
| RBAC | Role-based access control: `CUSTOMER`, `ADMIN`, `SUPER_ADMIN` |
| BNPL | Buy-now-pay-later (Tabby, Tamara) |
| Variant | A `Product` row sharing a `productGroupId` with siblings |
| Tombstone | `deletedAt` non-null soft-delete marker on `products` |
| Snapshot fields | VAT/discount/shipping captured on the order at checkout |
| Loyalty AED | Wallet balance redeemable as a discount in AED |
