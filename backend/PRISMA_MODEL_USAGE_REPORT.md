# Solo Website Backend - Prisma Model Usage Report

**Generated:** January 13, 2026  
**Scope:** Analysis of all `.service.ts` files in `backend/src/`

---

## 📊 Executive Summary

This report identifies which Prisma models (database tables) are actively used by each service in the Solo Website backend, including the specific operations performed on each model.

### Quick Stats
- **Total Models in Schema:** 41 (across `public` and `inventory` schemas)
- **Models Actively Used:** 32
- **Models Potentially Unused:** 9

---

## 🟢 TABLES ACTIVELY USED

### 1. User & Auth Models (public schema)

| Model | Table Name | Services Using It | Operations |
|-------|------------|-------------------|------------|
| **User** | `users` | `auth.service.ts`, `users.service.ts`, `admin.service.ts` | findUnique, create, update, count |
| **RefreshToken** | `refresh_tokens` | `auth.service.ts` | findUnique, create, update, updateMany |
| **PasswordResetToken** | `password_reset_tokens` | `auth.service.ts` | findUnique, create, update, updateMany |
| **EmailVerificationToken** | `email_verification_tokens` | `auth.service.ts` | findUnique, create, update, updateMany |
| **Address** | `addresses` | `users.service.ts`, `orders.service.ts` | findMany, findFirst, create, update, updateMany, delete, count |
| **LoyaltyWallet** | `loyalty_wallets` | `loyalty.service.ts` | findUnique, create, update |
| **LoyaltyTransaction** | `loyalty_transactions` | `loyalty.service.ts` | findMany, create |
| **SavedPaymentMethod** | `saved_payment_methods` | `payment-methods.service.ts` | findMany, findFirst, create, update, updateMany, delete, count |

### 2. Catalog Models (public schema)

| Model | Table Name | Services Using It | Operations |
|-------|------------|-------------------|------------|
| **Department** | `departments` | `departments.service.ts`, `admin.service.ts` | findMany, findUnique, create, update, delete, count |
| **Category** | `categories` | `categories.service.ts` | findMany (for hierarchical categories with departments) |

### 3. Cart & Order Models (public schema)

| Model | Table Name | Services Using It | Operations |
|-------|------------|-------------------|------------|
| **Cart** | `carts` | `cart.service.ts`, `auth.service.ts` | findUnique, create |
| **CartItem** | `cart_items` | `cart.service.ts` | findFirst, create, update, delete, deleteMany |
| **Order** | `orders` | `orders.service.ts`, `users.service.ts`, `admin.service.ts` | findMany, findFirst, create, count, aggregate, groupBy |
| **OrderItem** | `order_items` | `orders.service.ts`, `admin.service.ts` | create (via nested), groupBy |
| **OrderStatusHistory** | `order_status_history` | `orders.service.ts` | create (via nested Order creation) |
| **Package** | `packages` | `cart.service.ts` | findUnique |

### 4. Content Management (public schema)

| Model | Table Name | Services Using It | Operations |
|-------|------------|-------------------|------------|
| **Banner** | `banners` | `content.service.ts`, `admin.service.ts` | findMany, findUnique, create, update, delete, count |
| **LandingPage** | `landing_pages` | `content.service.ts` | findMany, findUnique, create, update, delete |
| **LandingSection** | `landing_sections` | `content.service.ts` | findMany, findFirst, findUnique, create, update, delete |
| **LoyaltyPageConfig** | `loyalty_page_config` | `content.service.ts` | findUnique, create, update |
| **NavigationMenu** | `navigation_menus` | `navigation.service.ts` | findMany, findUnique, create, update, delete |
| **NavigationMenuItem** | `navigation_menu_items` | `navigation.service.ts` | findUnique, create, update, delete, updateMany |

### 5. Collections (public schema)

| Model | Table Name | Services Using It | Operations |
|-------|------------|-------------------|------------|
| **ProductCollection** | `product_collections` | `collections.service.ts` | findMany, findUnique, create, update, delete |
| **ProductCollectionItem** | `product_collection_items` | `collections.service.ts` | findMany, findUnique, create, delete, updateMany, count |

### 6. Blog (public schema)

| Model | Table Name | Services Using It | Operations |
|-------|------------|-------------------|------------|
| **BlogPost** | `blog_posts` | `blog.service.ts` | findMany, findUnique, create, update, delete, count |
| **BlogCategory** | `blog_categories` | `blog.service.ts` | findMany, findUnique, create, update, delete |
| **BlogTag** | `blog_tags` | `blog.service.ts` | findMany, findUnique, create, delete |
| **BlogPostTag** | `blog_post_tags` | `blog.service.ts` | createMany, deleteMany |

### 7. Inventory Schema Models

| Model | Table Name | Services Using It | Operations |
|-------|------------|-------------------|------------|
| **InvProduct** | `inventory.products` | `products.service.ts`, `cart.service.ts`, `orders.service.ts`, `admin.service.ts`, `collections.service.ts` | findMany, findUnique, findFirst, count |
| **InvBrand** | `inventory.brands` | `brands.service.ts`, `admin.service.ts` | findMany, findUnique, findFirst, create, update, delete, count |
| **InvCategory** | `inventory.categories` | `categories.service.ts`, `admin.service.ts` | findMany, findUnique, findFirst, create, update, delete, count |

---

## 🔴 TABLES POTENTIALLY UNUSED

The following models exist in the Prisma schema but have **no direct service references** found in any `.service.ts` file:

### Public Schema

| Model | Table Name | Notes |
|-------|------------|-------|
| **Brand** | `brands` | **UNUSED** - The inventory schema `InvBrand` is used instead. This appears to be a duplicate/legacy model. |
| **PromoCode** | `promo_codes` | **UNUSED** - Referenced in Order DTO as a string field, but no PromoCode service/CRUD operations exist. Discount logic not implemented. |
| **ContentBlock** | `content_blocks` | **UNUSED** - Defined but no service references it. May have been replaced by LandingSection. |
| **SiteSetting** | `site_settings` | **UNUSED** - No service implements site settings management. |
| **AnalyticsEvent** | `analytics_events` | **UNUSED** - No analytics tracking service implemented. |
| **SavedSearchTerm** | `saved_search_terms` | **UNUSED** - No search term tracking implemented. |
| **ProductOverride** | `product_overrides` | **Defined but not used in production code** - Only referenced in test files (`.spec.ts`). May be a planned feature. |
| **PackageItem** | `package_items` | **UNUSED** - Referenced in schema but Package bundling feature appears incomplete. |

### Inventory Schema

| Model | Table Name | Notes |
|-------|------------|-------|
| **InvCountry** | `inventory.countries` | **UNUSED** - Defined but no service queries it. |
| **InvDesigner** | `inventory.designers` | **UNUSED** - Defined but no service queries it. |
| **InvSubcategory** | `inventory.subcategories` | **Partially used** - Included via relations when fetching InvProduct, but no direct CRUD. |
| **InvProductDimension** | `inventory.product_dimensions` | **Partially used** - Included via relations on InvProduct, no direct CRUD. |
| **InvProductPackaging** | `inventory.product_packaging` | **Partially used** - Included via relations on InvProduct, no direct CRUD. |
| **InvProductPricing** | `inventory.product_pricing` | **Partially used** - Included via relations, referenced in filter conditions. |
| **InvProductImage** | `inventory.product_images` | **Partially used** - Included via relations on InvProduct, no direct CRUD. |
| **InvProductSpecification** | `inventory.product_specifications` | **Partially used** - Included via relations on InvProduct, no direct CRUD. |
| **InvInventoryTransaction** | `inventory.inventory_transactions` | **UNUSED** - Only mentioned in TODO comments. Stock tracking not implemented. |

---

## 📋 Detailed Service-by-Service Breakdown

### `auth.service.ts`
- **User**: findUnique, create, update
- **RefreshToken**: findUnique, create, update, updateMany
- **PasswordResetToken**: findUnique, create, update, updateMany
- **EmailVerificationToken**: findUnique, create, update, updateMany
- **Cart**: create (on user registration)

### `users.service.ts`
- **User**: findUnique, update
- **Order**: findMany, findFirst
- **Address**: findMany, findFirst, create, update, updateMany, delete, count

### `payment-methods.service.ts`
- **SavedPaymentMethod**: findMany, findFirst, create, update, updateMany, delete, count

### `loyalty.service.ts`
- **LoyaltyWallet**: findUnique, create, update
- **LoyaltyTransaction**: findMany, create

### `products.service.ts`
- **InvProduct**: findMany, findUnique, findFirst, count
- (Includes relations: brand, category, subcategory, pricing, images, dimensions, packaging, specifications)

### `orders.service.ts`
- **InvProduct**: findMany (for price lookup)
- **Order**: findMany, findFirst, create, count
- **OrderItem**: create (via nested)
- **OrderStatusHistory**: create (via nested)
- **Address**: create (for shipping/billing)

### `cart.service.ts`
- **Cart**: findUnique, create
- **CartItem**: findFirst, create, update, delete, deleteMany
- **Package**: findUnique
- **InvProduct**: findMany

### `admin.service.ts`
- **Order**: count, aggregate, findMany, groupBy
- **OrderItem**: groupBy
- **User**: count, findMany
- **Banner**: count
- **InvCategory**: count
- **InvBrand**: count
- **Department**: count
- **InvProduct**: count, findMany

### `departments.service.ts`
- **Department**: findMany, findUnique, create, update, delete

### `categories.service.ts`
- **Category**: findMany (public schema, with children & department)
- **InvCategory**: findFirst, findUnique, create, update, delete

### `brands.service.ts`
- **InvBrand**: findFirst, findUnique, findMany, create, update, delete

### `content.service.ts`
- **Banner**: findMany, findUnique, create, update, delete
- **LandingPage**: findMany, findUnique, create, update, delete
- **LandingSection**: findMany, findFirst, findUnique, create, update, delete
- **LoyaltyPageConfig**: findUnique, create, update

### `navigation.service.ts`
- **NavigationMenu**: findMany, findUnique, create, update, delete
- **NavigationMenuItem**: findUnique, create, update, delete

### `collections.service.ts`
- **ProductCollection**: findMany, findUnique, create, update, delete
- **ProductCollectionItem**: findMany, findUnique, create, delete, updateMany, count
- **InvProduct**: findMany

### `blog.service.ts`
- **BlogPost**: findMany, findUnique, create, update, delete, count
- **BlogCategory**: findMany, findUnique, create, update, delete
- **BlogTag**: findMany, findUnique, create, delete
- **BlogPostTag**: createMany, deleteMany

### `catalog.service.ts`
- *No direct Prisma model usage* (only manages in-memory version tracking)

### `media.service.ts`
- *No Prisma model usage* (file upload/storage only)

### `email.service.ts`
- *No Prisma model usage* (email sending only)

---

## 🎯 Recommendations

### High Priority
1. **Remove `Brand` model** - Duplicate of `InvBrand`. Only `InvBrand` is used.
2. **Implement or remove `PromoCode`** - Currently no promo code validation logic.
3. **Implement or remove `AnalyticsEvent`** - Table exists but tracking not implemented.
4. **Implement `InvInventoryTransaction`** - Stock tracking is incomplete (only TODO comments).

### Medium Priority
5. **Implement `ContentBlock`** - Or remove if replaced by `LandingSection`.
6. **Implement `SiteSetting`** - Site configuration management not available.
7. **Implement `ProductOverride`** - Code in tests suggests planned feature.
8. **Complete `Package`/`PackageItem`** - Bundle feature appears partially implemented.

### Low Priority
9. **Consider `InvCountry`/`InvDesigner`** - May be needed for future product metadata.
10. **Consider `SavedSearchTerm`** - Search analytics feature.

---

## 📈 Model Usage Matrix

| Model | Auth | Users | Products | Orders | Cart | Content | Blog | Nav | Collections | Admin | Brands | Categories | Depts |
|-------|------|-------|----------|--------|------|---------|------|-----|-------------|-------|--------|------------|-------|
| User | ✅ | ✅ | | | | | | | | ✅ | | | |
| RefreshToken | ✅ | | | | | | | | | | | | |
| PasswordResetToken | ✅ | | | | | | | | | | | | |
| EmailVerificationToken | ✅ | | | | | | | | | | | | |
| Address | | ✅ | | ✅ | | | | | | | | | |
| LoyaltyWallet | | ✅ | | | | | | | | | | | |
| LoyaltyTransaction | | ✅ | | | | | | | | | | | |
| SavedPaymentMethod | | ✅ | | | | | | | | | | | |
| Cart | ✅ | | | | ✅ | | | | | | | | |
| CartItem | | | | | ✅ | | | | | | | | |
| Order | | ✅ | | ✅ | | | | | | ✅ | | | |
| OrderItem | | | | ✅ | | | | | | ✅ | | | |
| Package | | | | | ✅ | | | | | | | | |
| Department | | | | | | | | | | ✅ | | | ✅ |
| Category | | | | | | | | | | | | ✅ | |
| Banner | | | | | | ✅ | | | | ✅ | | | |
| LandingPage | | | | | | ✅ | | | | | | | |
| LandingSection | | | | | | ✅ | | | | | | | |
| LoyaltyPageConfig | | | | | | ✅ | | | | | | | |
| NavigationMenu | | | | | | | | ✅ | | | | | |
| NavigationMenuItem | | | | | | | | ✅ | | | | | |
| ProductCollection | | | | | | | | | ✅ | | | | |
| ProductCollectionItem | | | | | | | | | ✅ | | | | |
| BlogPost | | | | | | | ✅ | | | | | | |
| BlogCategory | | | | | | | ✅ | | | | | | |
| BlogTag | | | | | | | ✅ | | | | | | |
| BlogPostTag | | | | | | | ✅ | | | | | | |
| InvProduct | | | ✅ | ✅ | ✅ | | | | ✅ | ✅ | | | |
| InvBrand | | | | | | | | | | ✅ | ✅ | | |
| InvCategory | | | | | | | | | | ✅ | | ✅ | |

---

*Report generated by analyzing all service files in `d:\Solo Website\backend\src\`*
