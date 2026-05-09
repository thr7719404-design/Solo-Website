# 06 — API Reference

> Global prefix: **`/api`** · Auth: Bearer JWT in `Authorization` header
> · Format: JSON · Currency: AED · Errors: see [Error contract](./04-low-level-design.md#21-error-contract)
>
> Live Swagger UI: `https://backend-qlyb5greec2io.whiteriver-ae956411.eastus2.azurecontainerapps.io/api/docs`
> (subject to `SWAGGER_ENABLED`).
>
> The most exhaustive examples remain in [BACKEND_API_DOCUMENTATION.md](../BACKEND_API_DOCUMENTATION.md).
> This page is the **catalogue** organised by controller.

## Conventions

- 🔓 = public · 🔐 = JWT required · 🛡 = role required (`ADMIN` or `SUPER_ADMIN`)
- ⏱ = throttled (defaults: 60/min; `/auth/*` is 5/15 min)

## 1. Auth — `/api/auth` (controller: `auth/auth.controller.ts`)

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | `/register` | 🔓 ⏱ | Create customer account |
| POST | `/login` | 🔓 ⏱ | Returns `{ user, tokens: { accessToken, refreshToken } }` |
| POST | `/refresh` | 🔓 ⏱ | Rotate token pair |
| POST | `/logout` | 🔐 ⏱ | Revoke a refresh token |
| POST | `/forgot-password` | 🔓 ⏱ | Send reset email |
| POST | `/reset-password` | 🔓 ⏱ | Consume reset token |
| POST | `/verify-email` | 🔓 ⏱ | Consume verification token |
| GET | `/me` | 🔐 | Current user from JWT |

## 2. Account — `/api/account` (`users/users.controller.ts`)

| Method | Path | Access |
|---|---|---|
| GET / PATCH / DELETE | `/me` | 🔐 |
| GET / POST | `/addresses` | 🔐 |
| GET / PATCH / DELETE | `/addresses/:id` | 🔐 |
| POST | `/addresses/:id/default` | 🔐 |
| GET / POST | `/saved-cards` | 🔐 |
| DELETE | `/saved-cards/:id` | 🔐 |
| GET | `/loyalty/wallet` | 🔐 |
| GET | `/loyalty/transactions` | 🔐 |

## 3. Catalog — `/api/catalog` (`catalog/catalog.controller.ts`)

| Method | Path | Access | Purpose |
|---|---|---|---|
| GET | `/home` | 🔓 | Home page payload (cached) |
| GET | `/landing/:slug` | 🔓 | Landing page payload |
| GET | `/category/:slug` | 🔓 | Category landing payload |
| GET | `/search` | 🔓 | Combined search (products + brands + cats) |

## 4. Products — `/api/products` (& admin)

Public:
| GET | `/api/products` | 🔓 | List with filters/sort/page |
| GET | `/api/products/:idOrSlug` | 🔓 | Detail incl. variants |
| GET | `/api/products/:id/related` | 🔓 | Related (same category/brand) |

Admin (`/api/admin/products`, role `ADMIN`):
| GET / POST | `/` | 🛡 |
| GET / PATCH / DELETE | `/:id` | 🛡 |
| POST | `/:id/restore` | 🛡 |
| POST | `/:id/images` | 🛡 (multipart) |
| PATCH | `/:id/images/reorder` | 🛡 |

Variant groups:
| ANY | `/api/admin/product-groups` | 🛡 | CRUD groups + axes |

## 5. Categories / Subcategories / Brands / Designers / Countries

- `/api/categories` — public list/detail; admin CRUD at `/api/admin/categories`.
- `/api/subcategories` — public list/detail; admin CRUD.
- `/api/brands` — public list/detail; admin CRUD at `/api/admin/brands`.
- `/api/designers` — public list/detail; admin CRUD.
- `/api/countries` — read only.

## 6. Cart — `/api/cart`

| Method | Path | Access |
|---|---|---|
| GET | `/` | 🔓 (guest cookie) / 🔐 |
| POST | `/items` | as above |
| PATCH | `/items/:id` | as above |
| DELETE | `/items/:id` | as above |
| DELETE | `/` | clear |
| POST/DELETE | `/promo` | apply/remove promo |
| POST/DELETE | `/loyalty` | set/clear redemption |

Returns full computed totals on every call.

## 7. Favorites — `/api/favorites`

| GET | `/` | 🔐 | List |
| POST | `/` | 🔐 | `{ productId }` |
| DELETE | `/:productId` | 🔐 | Remove |

## 8. Orders — `/api/orders` (& admin `/api/admin/orders`)

| GET | `/api/orders` | 🔐 | Mine (paged) |
| POST | `/api/orders` | 🔐 | Create from current cart |
| GET | `/api/orders/:id` | 🔐 | Detail |
| GET | `/api/orders/:id/invoice` | 🔐 | PDF invoice |
| GET | `/api/admin/orders` | 🛡 | List w/ filters |
| PATCH | `/api/admin/orders/:id/status` | 🛡 | Move state |
| POST | `/api/admin/orders/:id/refund` | 🛡 | Refund (no return) |

## 9. Returns — `/api/returns` (& admin)

Customer:
| GET | `/api/returns` | 🔐 | Mine |
| POST | `/api/returns` | 🔐 | Request |
| GET | `/api/returns/:id` | 🔐 | Detail |
| POST | `/api/returns/:id/cancel` | 🔐 | Cancel while REQUESTED |

Admin:
| GET | `/api/admin/returns` | 🛡 |
| PATCH | `/api/admin/returns/:id/status` | 🛡 |
| POST | `/api/admin/returns/:id/complete` | 🛡 (refund) |

## 10. Payments

Stripe (`stripe/`):
| POST | `/api/stripe/create-payment-intent` | 🔐 | `{ orderId }` → `{ clientSecret }` |
| POST | `/api/stripe/webhook` | 🔓 (signature) |

Tabby & Tamara mirror the pattern under `/api/tabby/*` and
`/api/tamara/*` (BNPL module: `bnpl/`).

## 11. Promos — `/api/promo-codes` (& admin)

| GET | `/api/promo-codes/:code/validate` | 🔓 | Validate without redeem |
| ANY | `/api/admin/promo-codes` | 🛡 | CRUD |

## 12. Bulk-orders — `/api/bulk-orders`

| POST | `/` | 🔓 | Submit RFQ |
| GET | `/api/admin/bulk-orders` | 🛡 | Queue |
| PATCH | `/api/admin/bulk-orders/:id` | 🛡 | Status / notes |

## 13. CMS / content surfaces

Public read at `/api/content/*`:
| GET | `/home` | 🔓 | Assembled home payload |
| GET | `/category-landing/:slug` | 🔓 |
| GET | `/landing/:slug` | 🔓 |
| GET | `/banners` | 🔓 (filter by placement) |
| GET | `/announcements` | 🔓 |

Admin write under `/api/admin/{banners,landing-pages,home-page,category-landing,navigation,collections,announcements}`.

Other public reads: `/api/navigation`, `/api/announcements`,
`/api/collections/:slug`.

## 14. Media — `/api/media`

| POST | `/upload` | 🛡 (multipart) |
| GET | `/:id` | 🔓 (signed-ish URL) |
| GET | `/library` | 🛡 (paged) |
| DELETE | `/:id` | 🛡 (soft delete) |

## 15. Settings — `/api/settings`

| GET | `/:group/:key` | 🔓 |
| GET | `/:group` | 🔓 |
| PUT | `/:group/:key` | 🛡 |

## 16. Admin

- `/api/admin/customers` — list / detail / soft delete (used by smoke
  cleanup).
- `/api/admin/reports/*` — sales-summary, revenue-period, top-products,
  low-stock, customers-ltv, orders-by-status.
- `/api/admin/seed-images` — dev-only utility.

## 17. Stock — `/api/admin/stock`

| GET | `/movements` | 🛡 |
| POST | `/adjust` | 🛡 |
| GET | `/low` | 🛡 |

## 18. Health & misc

- `GET /api/health` and `GET /api/health/ready` — Terminus health.
- `GET /api/debug/*` — dev-only diagnostic endpoints (gate via env).
- `GET /api/docs` — Swagger UI (when enabled).

## 19. Sample payloads

### Login response

```json
{
  "user": {
    "id": "uuid",
    "email": "admin@solo-ecommerce.com",
    "role": "SUPER_ADMIN",
    "firstName": "Solo",
    "lastName": "Admin"
  },
  "tokens": {
    "accessToken": "eyJ...",
    "refreshToken": "rt_..."
  }
}
```

### Create order request

```json
{
  "shippingAddressId": "addr_uuid",
  "billingAddressId": null,
  "shippingMethod": "STANDARD",
  "paymentMethod": "CREDIT_CARD",
  "promoCode": "WELCOME10",
  "loyaltyAed": 25.00
}
```

### Order response (truncated)

```json
{
  "id": "ord_uuid",
  "orderNumber": "SOL-100023",
  "status": "PAYMENT_PENDING",
  "paymentStatus": "PENDING",
  "subtotalExclVat": 200.00,
  "vatAmount": 10.00,
  "vatRateSnapshot": 0.05,
  "shippingExclVat": 25.00,
  "shippingVat": 1.25,
  "discountExclVat": 20.00,
  "loyaltyRedeemAed": 25.00,
  "loyaltyEarnAed": 2.00,
  "totalInclVat": 191.25,
  "items": [{ "productId": 1, "sku": "SKU-1", "quantity": 2, "lineTotalInclVat": 105.00 }]
}
```
