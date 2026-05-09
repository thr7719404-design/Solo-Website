# 05 — Database & ER Diagram

The canonical schema is [`backend/prisma/schema.prisma`](../backend/prisma/schema.prisma)
(~1180 lines). Migrations live in `backend/prisma/migrations`. PostgreSQL
14 on Azure Flexible Server.

> **Reading guide.** The full ER diagram below is split by domain so it
> stays legible. A consolidated diagram follows.

## 1. Domains overview

| Domain | Tables (logical names) |
|---|---|
| Identity | `users`, `refresh_tokens`, `password_reset_tokens`, `email_verification_tokens` |
| Customer data | `addresses`, `saved_payment_methods`, `favorites` |
| Loyalty | `loyalty_wallets`, `loyalty_transactions`, `loyalty_page_config` |
| Catalog core | `products`, `categories`, `subcategories`, `brands`, `designers`, `countries` |
| Catalog M:N | `product_categories`, `product_subcategories` |
| Catalog enrichment | `product_pricing`, `product_dimensions`, `product_packaging`, `product_images`, `product_specifications`, `product_overrides` |
| Variants | `product_groups`, `variant_attributes`, `product_variants` |
| Cart | `carts`, `cart_items` |
| Orders | `orders`, `order_items`, `order_status_history`, `order_status_master`, `invoices` |
| Returns | `returns`, `return_items` |
| Stock | `stock_movements` |
| Marketing | `promo_codes`, `announcements` |
| CMS storefront | `banners`, `landing_pages`, `landing_sections`, `navigation_menus`, `navigation_menu_items`, `product_collections`, `product_collection_items`, `home_page_config`, `home_page_sections`, `category_landing_page_config`, `category_landing_sections`, `site_settings` |
| Media | `media_assets` |
| B2B | `bulk_order_requests`, `bulk_order_items` |
| Webhooks | `stripe_events` |

## 2. Identity & customer

```mermaid
erDiagram
  USER ||--o{ REFRESH_TOKEN : has
  USER ||--o{ PASSWORD_RESET_TOKEN : has
  USER ||--o{ EMAIL_VERIFICATION_TOKEN : has
  USER ||--o{ ADDRESS : has
  USER ||--o{ SAVED_PAYMENT_METHOD : has
  USER ||--o{ FAVORITE : marks
  USER ||--|| LOYALTY_WALLET : has
  LOYALTY_WALLET ||--o{ LOYALTY_TRANSACTION : posts
  USER ||--o{ ORDER : places
  USER ||--o{ RETURN : files

  USER {
    string id PK
    string email UK
    string passwordHash
    enum role "CUSTOMER ADMIN SUPER_ADMIN"
    datetime emailVerifiedAt
    datetime deletedAt
  }
  REFRESH_TOKEN {
    string id PK
    string userId FK
    string tokenHash
    datetime expiresAt
    datetime revokedAt
    string replacedByTokenId
  }
  ADDRESS {
    string id PK
    string userId FK
    string line1
    string city
    string country
    bool isDefault
  }
  LOYALTY_WALLET {
    string id PK
    string userId FK,UK
    decimal balanceAed
  }
  LOYALTY_TRANSACTION {
    string id PK
    string walletId FK
    enum type "EARNED REDEEMED ADJUSTMENT EXPIRED"
    decimal amountAed
    string orderId
  }
  FAVORITE {
    string id PK
    string userId FK
    int productId FK
  }
```

## 3. Catalog

```mermaid
erDiagram
  CATEGORY ||--o{ SUBCATEGORY : groups
  CATEGORY ||--o{ PRODUCT : "primary FK"
  SUBCATEGORY ||--o{ PRODUCT : "primary FK"
  BRAND ||--o{ PRODUCT : has
  DESIGNER ||--o{ PRODUCT : has
  COUNTRY ||--o{ PRODUCT : "country of origin"

  PRODUCT ||--o{ PRODUCT_CATEGORY : "M:N"
  CATEGORY ||--o{ PRODUCT_CATEGORY : "M:N"
  PRODUCT ||--o{ PRODUCT_SUBCATEGORY : "M:N"
  SUBCATEGORY ||--o{ PRODUCT_SUBCATEGORY : "M:N"

  PRODUCT ||--|| PRODUCT_PRICING : has
  PRODUCT ||--|| PRODUCT_DIMENSION : has
  PRODUCT ||--|| PRODUCT_PACKAGING : has
  PRODUCT ||--|| PRODUCT_OVERRIDE : has
  PRODUCT ||--o{ PRODUCT_IMAGE : has
  PRODUCT ||--o{ PRODUCT_SPECIFICATION : has
  PRODUCT ||--o{ VARIANT_ATTRIBUTE : has
  PRODUCT ||--o{ PRODUCT_VARIANTS : has
  PRODUCT_GROUP ||--o{ PRODUCT : siblings

  PRODUCT {
    int id PK
    string sku UK
    string slug UK
    string productName
    int categoryId FK
    int brandId FK
    string productGroupId FK
    int stockQty
    int reservedQty
    bool isActive
    bool isFeatured
    datetime deletedAt
  }
  PRODUCT_PRICING {
    int productId FK,UK
    decimal price_excl_vat_aed
    decimal price_incl_vat_aed
    decimal vatRate "default 0.05"
    bool isCurrent
  }
  PRODUCT_GROUP {
    string id PK
    string slug UK
    json variantAxes
  }
  VARIANT_ATTRIBUTE {
    string id PK
    int productId FK
    string key
    string value
    string colorHex
  }
```

## 4. Cart & orders

```mermaid
erDiagram
  USER ||--o{ CART : owns
  CART ||--o{ CART_ITEM : contains
  PRODUCT ||--o{ CART_ITEM : referenced
  USER ||--o{ ORDER : places
  ADDRESS ||--o{ ORDER : "shipping/billing"
  ORDER_STATUS_MASTER ||--o{ ORDER : status
  ORDER ||--o{ ORDER_ITEM : has
  ORDER ||--o{ ORDER_STATUS_HISTORY : timeline
  ORDER ||--o| INVOICE : issues
  ORDER ||--o{ RETURN : may_have
  RETURN ||--o{ RETURN_ITEM : lines
  PROMO_CODE ||--o{ ORDER : applied

  CART {
    string id PK
    string userId FK
    string guestKey
  }
  CART_ITEM {
    string id PK
    string cartId FK
    enum type "PRODUCT"
    int productId FK
    int quantity
  }
  ORDER {
    string id PK
    string userId FK
    string orderNumber UK
    enum status
    enum paymentStatus
    enum paymentMethod
    enum shippingMethod
    decimal subtotalExclVat
    decimal vatAmount
    decimal vatRateSnapshot
    decimal shippingExclVat
    decimal discountExclVat
    decimal loyaltyRedeemAed
    decimal loyaltyEarnAed
    decimal totalInclVat
  }
  ORDER_ITEM {
    string id PK
    string orderId FK
    int productId
    string sku
    string name
    int quantity
    decimal unitPriceExclVat
    decimal unitVatAmount
    decimal unitPriceInclVat
    decimal lineTotalInclVat
  }
  INVOICE {
    string id PK
    string orderId FK,UK
    string invoiceNumber UK
    decimal vatRateSnapshot
    string pdfUrl
  }
```

## 5. Returns & stock

```mermaid
erDiagram
  ORDER ||--o{ RETURN : has
  RETURN ||--o{ RETURN_ITEM : lines
  USER ||--o{ RETURN : files
  PRODUCT ||--o{ STOCK_MOVEMENT : ledger

  RETURN {
    string id PK
    string returnNumber UK
    string orderId FK
    string userId FK
    enum status "REQUESTED APPROVED RECEIVED COMPLETED REJECTED"
    enum reason
    enum refundMethod "ORIGINAL_PAYMENT LOYALTY_AED STORE_CREDIT"
    decimal refundAmount
    bool stockRestored
  }
  STOCK_MOVEMENT {
    string id PK
    int productId FK
    int quantity
    enum type "IN OUT ADJUSTMENT RESERVATION RELEASE"
    string reference
  }
```

## 6. CMS / storefront

```mermaid
erDiagram
  MEDIA_ASSET ||--o{ BANNER : "image / mobile_image"
  BANNER ||--o{ LANDING_PAGE : hero
  LANDING_PAGE ||--o{ LANDING_SECTION : has
  NAVIGATION_MENU ||--o{ NAVIGATION_MENU_ITEM : has
  NAVIGATION_MENU_ITEM ||--o{ NAVIGATION_MENU_ITEM : children
  PRODUCT_COLLECTION ||--o{ PRODUCT_COLLECTION_ITEM : has
  HOME_PAGE_CONFIG ||--o{ HOME_PAGE_SECTION : has
  CATEGORY_LANDING_PAGE_CONFIG ||--o{ CATEGORY_LANDING_SECTION : has
  PROMO_CODE ||--o{ ANNOUNCEMENT : may_link

  BANNER {
    string id PK
    enum placement "HOME_HERO HOME_MID CATEGORY_HERO ..."
    string mediaAssetId FK
    string mobileMediaAssetId FK
    datetime startsAt
    datetime endsAt
  }
  HOME_PAGE_SECTION {
    string id PK
    string configId FK
    enum type "HERO BANNERS CATEGORIES COLLECTION BRANDS NEW_ARRIVALS BEST_SELLERS ..."
    int sortOrder
    json config
  }
  ANNOUNCEMENT {
    string id PK
    string text
    string promoCodeId FK
    datetime startsAt
    datetime expiresAt
  }
```

## 7. B2B & integrations

```mermaid
erDiagram
  BULK_ORDER_REQUEST ||--o{ BULK_ORDER_ITEM : lines
  STRIPE_EVENT ||--|| STRIPE_EVENT : "deduplicated by id"

  BULK_ORDER_REQUEST {
    string id PK
    int orderNumber UK
    string name
    string email
    string phone
    enum status "NEW CONTACTED QUOTED CONVERTED CLOSED"
  }
  STRIPE_EVENT {
    string id PK
    string type
    bool processed
    json payload
  }
```

## 8. Consolidated ER diagram

```mermaid
erDiagram
  USER ||--o{ ORDER : places
  USER ||--|| LOYALTY_WALLET : has
  LOYALTY_WALLET ||--o{ LOYALTY_TRANSACTION : posts
  USER ||--o{ ADDRESS : has
  USER ||--o{ FAVORITE : marks
  USER ||--o{ CART : owns
  CART ||--o{ CART_ITEM : contains
  PRODUCT ||--o{ CART_ITEM : in
  CATEGORY ||--o{ PRODUCT : primary
  BRAND ||--o{ PRODUCT : has
  DESIGNER ||--o{ PRODUCT : has
  COUNTRY ||--o{ PRODUCT : origin
  PRODUCT_GROUP ||--o{ PRODUCT : siblings
  PRODUCT ||--|| PRODUCT_PRICING : has
  PRODUCT ||--o{ PRODUCT_IMAGE : has
  PRODUCT ||--o{ STOCK_MOVEMENT : ledger
  ORDER ||--o{ ORDER_ITEM : has
  ORDER ||--o| INVOICE : issues
  ORDER ||--o{ ORDER_STATUS_HISTORY : timeline
  ORDER ||--o{ RETURN : may_have
  RETURN ||--o{ RETURN_ITEM : lines
  MEDIA_ASSET ||--o{ BANNER : image
  BANNER ||--o{ LANDING_PAGE : hero
  LANDING_PAGE ||--o{ LANDING_SECTION : has
  HOME_PAGE_CONFIG ||--o{ HOME_PAGE_SECTION : has
  PRODUCT_COLLECTION ||--o{ PRODUCT_COLLECTION_ITEM : has
  NAVIGATION_MENU ||--o{ NAVIGATION_MENU_ITEM : has
  PROMO_CODE ||--o{ ANNOUNCEMENT : may_link
  BULK_ORDER_REQUEST ||--o{ BULK_ORDER_ITEM : lines
```

## 9. Enums (selected)

| Enum | Values |
|---|---|
| `UserRole` | `CUSTOMER`, `ADMIN`, `SUPER_ADMIN` |
| `OrderStatus` | `PENDING`, `PAYMENT_PENDING`, `PAID`, `PROCESSING`, `SHIPPED`, `DELIVERED`, `CANCELLED`, `REFUNDED` |
| `PaymentStatus` | `PENDING`, `AUTHORIZED`, `PAID`, `FAILED`, `REFUNDED` |
| `PaymentMethod` | `CREDIT_CARD`, `CASH_ON_DELIVERY`, `TABBY`, `TAMARA` |
| `ShippingMethod` | `STANDARD`, `EXPRESS` |
| `LoyaltyTransactionType` | `EARNED`, `REDEEMED`, `ADJUSTMENT`, `EXPIRED` |
| `CartItemType` | `PRODUCT` |
| `ReturnStatus` | `REQUESTED`, `APPROVED`, `RECEIVED`, `COMPLETED`, `REJECTED` |
| `ReturnReason` | `DEFECTIVE`, `WRONG_ITEM`, `NOT_AS_DESCRIBED`, `CHANGE_OF_MIND`, `OTHER` |
| `RefundMethod` | `ORIGINAL_PAYMENT`, `LOYALTY_AED`, `STORE_CREDIT` |
| `StockMovementType` | `IN`, `OUT`, `ADJUSTMENT`, `RESERVATION`, `RELEASE` |
| `BannerPlacement` | `HOME_HERO`, `HOME_MID`, `CATEGORY_HERO`, `PRODUCT_BANNER`, … |
| `HomeSectionType` | `HERO`, `BANNERS`, `CATEGORIES`, `COLLECTION`, `BRANDS`, `NEW_ARRIVALS`, `BEST_SELLERS`, `FEATURED`, `ANNOUNCEMENT` |
| `LandingSectionType` | `HERO`, `IMAGE_TEXT`, `PRODUCT_GRID`, `BANNER`, `RICH_TEXT`, `VIDEO`, `COLLECTION` |
| `CategoryLandingSectionType` | `HERO`, `SUBCATEGORIES`, `BANNER`, `PRODUCT_GRID`, `RICH_TEXT` |
| `ProductCollectionStrategy` | `MANUAL`, `AUTO` |
| `BulkOrderStatus` | `NEW`, `CONTACTED`, `QUOTED`, `CONVERTED`, `CLOSED` |
| `PromoType` | `PERCENT`, `FIXED`, `FREE_SHIPPING` |

## 10. Indexing summary (high-traffic)

| Table | Index | Purpose |
|---|---|---|
| `products` | `slug`, `sku`, `categoryId`, `brandId`, `isFeatured`, `isActive`, `deletedAt`, `productGroupId`, `createdAt` | Listing/sort |
| `product_pricing` | `productId` | Join performance |
| `orders` | `userId`, `status`, `paymentStatus`, `createdAt`, `orderNumber` UK | Queue & history |
| `order_items` | `orderId`, `productId` | Reports |
| `cart_items` | `cartId`, `productId` | Cart read |
| `refresh_tokens` | `userId`, `tokenHash` UK, `expiresAt` | Auth |
| `stripe_events` | `processed,createdAt` | Reconciliation |
| `stock_movements` | `productId`, `type`, `createdAt` | Ledger |
| `announcements` | `isActive`, `startsAt`, `expiresAt`, `sortOrder` | Storefront |
| `media_assets` | `folder`, `ownerType,ownerId`, `isDeleted` | Library |

## 11. Migrations & seeding

- Generate Prisma client: `npm run prisma:generate`
- Apply migrations (dev): `npm run prisma:migrate`
- Apply migrations (prod): `prisma migrate deploy`
- Seed: `npm run db:seed` → `prisma/seed.ts`
- Backups: workspace `backups/` plus
  `solo_ecommerce_pre_cleanup_20260208.dump` (pre-cleanup snapshot).
- Azure Postgres Flexible Server has automated daily backups (7-day
  retention by default; tune in [infra/main.bicep](../infra/main.bicep)).
