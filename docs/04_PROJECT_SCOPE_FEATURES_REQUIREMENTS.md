# Solo E-Commerce Platform — Project Scope, Features & Requirements

**Document Version:** 1.1
**Date:** 09 May 2026
**Author:** Solo Engineering Team
**Status:** Final

---

## 1. Document Purpose

This document defines the **scope** of the Solo E-Commerce platform, the
**functional requirements (FR-xxx)** and **non-functional requirements
(NFR-xxx)** that the system must satisfy, the user roles, the assumptions
and constraints, the in/out-of-scope items, and the future roadmap.

It is a contractual reference for engineering, QA, design and operations.

Companions: [01 HLD](./01_HIGH_LEVEL_DESIGN.md),
[02 LLD](./02_LOW_LEVEL_DESIGN.md),
[03 Architecture](./03_ARCHITECTURE_DOCUMENT.md),
[05 Technical Features](./05_TECHNICAL_FEATURES.md).

---

## 2. Project Vision & Goals

Solo is a multi-brand, multi-category, premium-positioned e-commerce
storefront serving the UAE market initially, with planned expansion to
KSA. The platform combines:

- A modern, content-rich storefront for browsing and purchase.
- A complete admin/operations console for catalog, orders, content,
  customers, returns, loyalty and audit.
- A clean, headless API ready for a future mobile companion app
  (React Native / Capacitor).

Strategic goals:

| ID | Goal |
|----|------|
| G1 | Deliver a fast, premium storefront experience (Core Web Vitals "Good" on p75) |
| G2 | Enable non-engineering staff to fully manage catalog and content via the admin SPA |
| G3 | Provide regulator-grade order/payment/audit history (UAE VAT, FTA, PDPL) |
| G4 | Support multiple payment rails: Stripe (cards), Tabby & Tamara (BNPL), Cash on Delivery |
| G5 | Build a loyalty programme that drives repeat purchase |
| G6 | Operate on cloud-native, IaC-managed Azure infrastructure with one-command deploy |
| G7 | Maintain a green, secure baseline against OWASP Top 10 |
| G8 | Make the platform observable with end-to-end traces, structured logs, and dashboards |

---

## 3. Stakeholders & Roles

### 3.1 External Users

| Role | Description |
|------|-------------|
| **Guest** | Anonymous visitor; can browse, search, build cart, start checkout |
| **Customer** | Registered shopper; full purchase, address book, orders, returns, favorites, loyalty |
| **B2B Customer** | Bulk-order requests with quote workflow |

### 3.2 Internal Users

| Role | Description |
|------|-------------|
| **Admin** | Full back-office access: catalog, orders, customers, content, audit, settings |
| **Super Admin** | Admin + system-level settings, role management, irreversible actions |

(Future: granular sub-roles such as `CONTENT_EDITOR`, `ORDER_MANAGER`,
`SUPPORT_AGENT` — see roadmap §10.)

### 3.3 External Systems

| System | Role |
|--------|------|
| Stripe | Card payments + webhook |
| Tabby | BNPL provider |
| Tamara | BNPL provider |
| SMTP relay | Transactional email (order confirmation, password reset, etc.) |
| Azure Blob Storage | Product imagery and CMS media |
| Application Insights | Telemetry, traces, RUM |

---

## 4. In Scope

- React 19 + Vite SPA storefront (responsive, mobile-first, light/dark)
- Admin SPA (lazy-loaded, role-gated)
- NestJS REST API (single deploy unit, ~50 modules)
- PostgreSQL data store (~50 tables)
- Stripe + Tabby + Tamara + Cash on Delivery payment rails
- UAE VAT (5%), AED currency
- Loyalty wallet (earn + redeem)
- Promo codes (percentage + fixed)
- Returns workflow (request → approve → refund)
- CMS for home page, landing pages, banners, navigation, collections,
  announcements
- Append-only audit trail across all admin writes
- Azure deployment via `azd up` / `azd deploy` with Bicep IaC
- Application Insights + Log Analytics observability
- Email notifications via SMTP

## 5. Out of Scope (current release)

- Native mobile applications (planned in roadmap)
- Multi-currency at runtime (AED only at launch — KSA roadmap)
- Multi-language UI beyond English (Arabic in roadmap)
- Marketplace / multi-vendor sellers
- Real-time chat support (use third-party widget for launch)
- Subscription / recurring billing
- Direct social-commerce integrations (Instagram Shop, TikTok Shop)
- ERP / accounting integration (CSV export at launch; deeper roadmap)
- In-store POS integration

---

## 6. Functional Requirements

### 6.1 Storefront — Catalog & Browse

| ID | Requirement |
|----|-------------|
| FR-001 | Storefront SHALL render a configurable home page assembled from CMS sections (hero banner, category tiles, brand strip, collections, editorial, best sellers, new arrivals, promo strip, testimonials) |
| FR-002 | Storefront SHALL provide category and subcategory landing pages |
| FR-003 | Storefront SHALL provide brand and designer landing pages |
| FR-004 | Storefront SHALL provide a faceted product list with filters: category, brand, designer, price range, in-stock, on-sale, new, featured, best seller |
| FR-005 | Storefront SHALL support sort orders: price asc/desc, newest, popular |
| FR-006 | Storefront SHALL paginate product lists with configurable page size |
| FR-007 | Storefront SHALL provide full-text search over product name, SKU, brand, description |
| FR-008 | Product detail page SHALL display gallery, price (incl + excl VAT), stock, variant axes (color/size/material), description, related products |
| FR-009 | Variants SHALL be addressable by slug; switching a variant SHALL update the URL without full reload |
| FR-010 | Storefront SHALL render schedulable banners and announcements |

### 6.2 Account, Auth & Identity

| ID | Requirement |
|----|-------------|
| FR-020 | Users SHALL register with email + password (Argon2id hashed) |
| FR-021 | Users SHALL receive an email-verification link valid for 1 hour |
| FR-022 | Users SHALL log in and receive a 15-minute access JWT plus a 7-day refresh token |
| FR-023 | Refresh tokens SHALL be rotated on use; reuse SHALL revoke the entire chain |
| FR-024 | Users SHALL be able to request password reset via email link |
| FR-025 | Authenticated users SHALL view & update profile (first/last name, phone) |
| FR-026 | Users SHALL maintain an address book (multiple shipping + billing addresses) |
| FR-027 | Users SHALL view order history with status, totals, and downloadable invoice |
| FR-028 | Users SHALL view loyalty balance, lifetime earn, and transaction ledger |
| FR-029 | Users SHALL maintain a favorites list (idempotent add/remove) |
| FR-030 | Users SHALL request returns from delivered orders |

### 6.3 Cart & Checkout

| ID | Requirement |
|----|-------------|
| FR-040 | Guests and authenticated users SHALL build a cart |
| FR-041 | Cart totals SHALL be computed server-side on every read (never trust client) |
| FR-042 | Adding the same SKU to cart twice SHALL merge quantities |
| FR-043 | Setting line quantity to zero SHALL remove the line |
| FR-044 | Promo codes SHALL be validatable from cart with clear error messaging |
| FR-045 | Loyalty redemption SHALL be capped at `min(walletBalance, subtotal × maxRedeemPct)` |
| FR-046 | Checkout SHALL collect shipping address, shipping method, and payment method |
| FR-047 | Checkout SHALL show a final total breakdown before payment confirmation |
| FR-048 | On Stripe selection the SPA SHALL open Stripe Elements with `clientSecret` from API |
| FR-049 | On Tabby/Tamara the SPA SHALL redirect to provider-hosted checkout |
| FR-050 | On Cash on Delivery the order SHALL be created in `PROCESSING` directly |

### 6.4 Orders, Payments & Returns

| ID | Requirement |
|----|-------------|
| FR-060 | Order creation SHALL atomically lock product rows, snapshot totals, decrement stock, post pending loyalty earn, and write audit |
| FR-061 | Stock reservation SHALL move from `reservedQty` to deducted on PAID |
| FR-062 | Webhook processing SHALL be idempotent via provider event tables (`stripe_events`, `tabby_events`, `tamara_events`) |
| FR-063 | Invoices SHALL be generated as PDF (pdfkit), stored, and downloadable |
| FR-064 | Order status transitions SHALL follow the documented state machine and emit `order_status_history` rows |
| FR-065 | Refunds via Stripe SHALL set order status to REFUNDED and roll back loyalty earn |
| FR-066 | Returns SHALL move through `REQUESTED → APPROVED → IN_TRANSIT → RECEIVED → COMPLETED` (or `REJECTED`) |
| FR-067 | Approved returns SHALL trigger Stripe refund + loyalty wallet refund |

### 6.5 Admin — Catalog & Content

| ID | Requirement |
|----|-------------|
| FR-080 | Admin SHALL create / update / soft-delete / restore products with images, pricing, and flags |
| FR-081 | Admin SHALL manage categories, subcategories, brands, designers (CRUD) |
| FR-082 | Admin SHALL manage product groups (variant sets) |
| FR-083 | Admin SHALL upload images via the media module; sharp SHALL generate thumb/medium/large variants |
| FR-084 | Admin SHALL configure the home page (sections, ordering, scheduling) |
| FR-085 | Admin SHALL CRUD landing pages, banners, navigation, collections, announcements |
| FR-086 | Admin SHALL CRUD promo codes (PERCENT/FIXED, min order, max uses, per-user cap, schedule) |

### 6.6 Admin — Operations

| ID | Requirement |
|----|-------------|
| FR-090 | Admin SHALL view dashboard KPIs (revenue today/7d, orders today, new customers 7d, low-stock count) |
| FR-091 | Admin SHALL view the orders queue filtered by status, date range, customer |
| FR-092 | Admin SHALL transition orders through the documented state machine |
| FR-093 | Admin SHALL view customer profiles with order history and loyalty balance |
| FR-094 | Admin SHALL adjust loyalty balances (`ADJUSTED` ledger entry) with reason captured in audit |
| FR-095 | Admin SHALL receive low-stock notifications (in-app + email-optional) |
| FR-096 | Admin SHALL generate reports: sales summary, revenue period, top products, customers LTV, orders by status, low stock |
| FR-097 | Admin SHALL view the audit log filtered by user, action, entity, date range |
| FR-098 | Admin SHALL configure site settings (VAT rate, shipping tiers, loyalty earn rate, redemption cap) |
| FR-099 | Admin SHALL handle bulk-order (B2B) requests through approval workflow |

---

## 7. Non-Functional Requirements

### 7.1 Performance

| ID | Requirement |
|----|-------------|
| NFR-001 | API p95 read latency SHALL be ≤ 700 ms region-internal |
| NFR-002 | API p95 write latency SHALL be ≤ 1.2 s |
| NFR-003 | LCP on storefront pages SHALL be ≤ 2.5 s on 3G p75 |
| NFR-004 | CLS SHALL be ≤ 0.1 on storefront pages |
| NFR-005 | Container cold-start SHALL be ≤ 5 s |
| NFR-006 | Admin lazy chunk SHALL not exceed 500 KB gzipped |

### 7.2 Scalability

| ID | Requirement |
|----|-------------|
| NFR-010 | API SHALL autoscale 1–10 replicas based on concurrent HTTP requests |
| NFR-011 | DB SHALL be vertically scalable without code changes |
| NFR-012 | The system SHALL sustain ≥ 50 concurrent checkouts per minute at launch |
| NFR-013 | Catalog read endpoints SHALL be safe to add a read-replica fan-out later |

### 7.3 Availability

| ID | Requirement |
|----|-------------|
| NFR-020 | Monthly availability SHALL be ≥ 99.9% (≤ 43 min downtime / month) |
| NFR-021 | Planned maintenance SHALL be announced 48 h in advance |
| NFR-022 | Application Insights availability test SHALL ping `/api/health` every 5 minutes |

### 7.4 Security

| ID | Requirement |
|----|-------------|
| NFR-030 | All transport SHALL be HTTPS with HSTS |
| NFR-031 | Passwords SHALL be hashed with Argon2id (memory ≥ 19 MB, time-cost ≥ 2) |
| NFR-032 | Access JWTs SHALL expire ≤ 15 min; refresh tokens ≤ 7 d, rotated on use |
| NFR-033 | All inputs SHALL pass `class-validator` whitelist + transform |
| NFR-034 | Helmet, CORS allow-list, ThrottlerGuard SHALL be globally enabled |
| NFR-035 | Webhooks SHALL verify HMAC signatures and dedup via provider event tables |
| NFR-036 | Containers SHALL run as non-root with minimal Node 20 alpine image |
| NFR-037 | Secrets SHALL be sourced from Container App secrets (Key Vault recommended) |
| NFR-038 | The system SHALL maintain an OWASP Top 10 (2021) green checklist |

### 7.5 Compliance

| ID | Requirement |
|----|-------------|
| NFR-040 | Invoices SHALL include UAE TRN, VAT split, sequential invoice number |
| NFR-041 | VAT rate SHALL be snapshotted per order (`vatRateSnapshot`) for retro correctness |
| NFR-042 | Audit log SHALL be append-only with ≥ 90-day hot retention and cold export |
| NFR-043 | Personal data deletion requests SHALL be supported (PDPL/GDPR alignment) |

### 7.6 Accessibility

| ID | Requirement |
|----|-------------|
| NFR-050 | Storefront SHALL meet WCAG 2.1 AA on key flows (browse, PDP, cart, checkout, account) |
| NFR-051 | All interactive elements SHALL be keyboard-navigable with visible focus |
| NFR-052 | Forms SHALL have proper label/aria associations |

### 7.7 Maintainability & DevOps

| ID | Requirement |
|----|-------------|
| NFR-060 | Codebase SHALL be 100% TypeScript across both tiers |
| NFR-061 | All endpoints SHALL be documented in Swagger UI at `/api/docs` |
| NFR-062 | Backend test coverage on services SHALL be ≥ 70% |
| NFR-063 | Frontend test coverage on stores + hooks SHALL be ≥ 70% |
| NFR-064 | CI SHALL run lint + test + build on every PR |
| NFR-065 | One-command production deploy SHALL be supported via `azd deploy` |

### 7.8 Observability

| ID | Requirement |
|----|-------------|
| NFR-070 | Backend SHALL emit Pino structured logs with correlation IDs |
| NFR-071 | Backend SHALL emit App Insights traces for every HTTP request |
| NFR-072 | Custom events SHALL be emitted for `ORDER_PAID`, `ORDER_REFUNDED`, `RETURN_COMPLETED` |
| NFR-073 | Alerts SHALL fire on error-rate > 1% / 5 min, container-restart > 3 / 10 min, PG CPU > 80% / 10 min |

---

## 8. Assumptions & Constraints

| # | Item |
|---|------|
| A1 | Single primary region: Azure East US 2 (low-cost; UAE Central optional) |
| A2 | Single currency at launch: AED |
| A3 | Single language at launch: English (LTR) |
| A4 | Stripe, Tabby, Tamara provider accounts available |
| A5 | SMTP relay credentials available |
| A6 | UAE TRN issued for invoice generation |
| C1 | Budget excludes premium WAF in launch (recommended in roadmap) |
| C2 | Mobile native app deferred to roadmap |
| C3 | Marketplace / multi-vendor model not in scope |
| C4 | No integration with external ERP at launch (CSV export only) |

---

## 9. Acceptance Criteria

The release SHALL be considered ready when:

- All FR-0xx requirements are implemented and covered by automated tests.
- All NFR-0xx requirements are measured and met in pre-prod load tests.
- Penetration test (OWASP scope) yields no Critical or High findings.
- Disaster recovery drill (DB restore + frontend redeploy) completes
  inside the 4-hour RTO target.
- Admin user-acceptance test sign-off on all admin workflows.
- Customer user-acceptance test sign-off on browse/PDP/cart/checkout/
  account/returns flows.

---

## 10. Future Roadmap

| Phase | Feature |
|-------|---------|
| **Phase 2 (Q3 2026)** | Arabic locale (RTL), KSA market launch (15% VAT), multi-currency |
| **Phase 2** | Granular admin sub-roles (CONTENT_EDITOR, ORDER_MANAGER, SUPPORT_AGENT) |
| **Phase 3 (Q4 2026)** | Mobile companion app — **React Native** (Expo) or **Capacitor** wrapper sharing the React component library |
| **Phase 3** | Real-time inventory sync from supplier feeds |
| **Phase 4 (Q1 2027)** | Multi-region active-passive (Azure UAE Central + East US 2) |
| **Phase 4** | Azure Front Door + WAF in front of SWA + ACA |
| **Phase 4** | Dedicated Redis (cart sessions, rate-limit counters, hot caches) |
| **Phase 5** | Personalised recommendations (Azure ML) |
| **Phase 5** | Marketplace / multi-vendor support |
| **Phase 5** | ERP & accounting integration (Microsoft Dynamics, SAP B1) |

> **Note:** The mobile app strategy is **React Native** or **Capacitor**
> — not Flutter — so we can share components, types, and the existing
> API client with the web codebase.

---

*End of Project Scope, Features & Requirements.*
