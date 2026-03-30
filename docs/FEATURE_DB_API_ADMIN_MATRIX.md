# Feature Database API Admin Matrix

**Generated:** January 1, 2026  
**Last Updated:** January 1, 2026 (Post-Schema Migration)  
**Purpose:** Track all features, their database backing, API endpoints, and admin functionality

---

## Summary of Fixes Applied

1. ✅ **Admin Dashboard Stats** - Fixed to use `InvProduct`, `InvCategory`, `InvBrand`
2. ✅ **Content API Path Alignment** - Added route aliases for banners and landing pages
3. ✅ **Cart System** - Updated to use `InvProduct` lookups (productId changed to Int)
4. ✅ **Seed Data** - Admin users created (`admin@solo-ecommerce.com`, `aiman@solo-ecommerce.com`)
5. ✅ **Prisma Schema** - Removed obsolete `Product` model, updated FK references

---

## Legend

| Status | Meaning |
|--------|---------|
| ✅ OK | Feature fully working end-to-end |
| ⚠️ Broken Wiring | Frontend/Backend path mismatch or wrong schema |
| ❌ Missing API | Backend endpoint doesn't exist |
| ❌ Missing DB | Database table/fields missing |
| 🔧 Broken UI | Frontend UI issues |
| 🔒 Broken Auth | Authentication/authorization issues |
| 📝 TODO | Intentionally not implemented |

---

## 1. STOREFRONT FEATURES

### 1.1 Home Page

| Feature | Frontend File | Provider/Service | Backend Endpoint | Controller/Service | Prisma Model | DB Table | Status | Notes |
|---------|---------------|------------------|------------------|-------------------|--------------|----------|--------|-------|
| Hero Banner Carousel | `screens/home_screen.dart` | `HomeProvider` → `ContentApi.getBanners()` | GET `/content/banners?placement=HOME_HERO` | `content.controller.ts` / `content.service.ts` | `Banner` | `public.banners` | ✅ OK | |
| Top Banner Strip | `widgets/top_banner.dart` | `ContentApi.getBanners()` | GET `/content/banners` | `content.controller.ts` | `Banner` | `public.banners` | ✅ OK | |
| Featured Products | `screens/home_screen.dart` | `HomeProvider` → `ProductsApi.getFeatured()` | GET `/products/featured` | `products.controller.ts` / `products.service.ts` | `InvProduct` | `inventory.products` | ✅ OK | |
| Best Sellers | `screens/home_screen.dart` | `HomeProvider` → `ProductsApi.getBestSellers()` | GET `/products/best-sellers` | `products.controller.ts` | `InvProduct` | `inventory.products` | ✅ OK | |
| New Arrivals | `screens/home_screen.dart` | `HomeProvider` → `ProductsApi.getNewArrivals()` | GET `/products/new-arrivals` | `products.controller.ts` | `InvProduct` | `inventory.products` | ✅ OK | |
| Category Navigation | `widgets/modern_drawer.dart` | `CatalogProvider` → `CategoriesApi.getCategories()` | GET `/categories` | `categories.controller.ts` / `categories.service.ts` | `InvCategory` | `inventory.categories` | ✅ OK | |

### 1.2 Product Browsing

| Feature | Frontend File | Provider/Service | Backend Endpoint | Controller/Service | Prisma Model | DB Table | Status | Notes |
|---------|---------------|------------------|------------------|-------------------|--------------|----------|--------|-------|
| Product List | `screens/category_screen.dart` | `ProductsApi.getProducts()` | GET `/products` | `products.controller.ts` | `InvProduct` | `inventory.products` | ✅ OK | |
| Search | `screens/search_screen.dart` | `ProductsApi.getProducts(search:)` | GET `/products?search=` | `products.controller.ts` | `InvProduct` | `inventory.products` | ✅ OK | |
| Filter by Category | `screens/category_screen.dart` | `ProductsApi.getProducts(categoryId:)` | GET `/products?categoryId=` | `products.controller.ts` | `InvProduct` | `inventory.products` | ✅ OK | |
| Filter by Brand | `screens/category_screen.dart` | `ProductsApi.getProducts(brandId:)` | GET `/products?brandId=` | `products.controller.ts` | `InvProduct` | `inventory.products` | ✅ OK | |
| Filter by Price | `screens/category_screen.dart` | `ProductsApi.getProducts(minPrice:, maxPrice:)` | GET `/products?minPrice=&maxPrice=` | `products.controller.ts` | `InvProductPricing` | `inventory.product_pricing` | ✅ OK | |
| Sorting | `screens/category_screen.dart` | `ProductsApi.getProducts(sortBy:)` | GET `/products?sortBy=` | `products.controller.ts` | `InvProduct` | `inventory.products` | ✅ OK | |

### 1.3 Product Detail

| Feature | Frontend File | Provider/Service | Backend Endpoint | Controller/Service | Prisma Model | DB Table | Status | Notes |
|---------|---------------|------------------|------------------|-------------------|--------------|----------|--------|-------|
| Product Info | `screens/product_detail_screen.dart` | `ProductsApi.getProduct(id)` | GET `/products/:id` | `products.controller.ts` | `InvProduct` | `inventory.products` | ✅ OK | |
| Images Gallery | `screens/product_detail_screen.dart` | (included in product) | GET `/products/:id` | `products.controller.ts` | `InvProductImage` | `inventory.product_images` | ✅ OK | |
| Pricing | `screens/product_detail_screen.dart` | (included in product) | GET `/products/:id` | `products.controller.ts` | `InvProductPricing` | `inventory.product_pricing` | ✅ OK | |
| Specifications | `screens/product_detail_screen.dart` | (included in product) | GET `/products/:id` | `products.controller.ts` | `InvProductSpecification` | `inventory.product_specifications` | ✅ OK | |
| Dimensions | `screens/product_detail_screen.dart` | (included in product) | GET `/products/:id` | `products.controller.ts` | `InvProductDimension` | `inventory.product_dimensions` | ✅ OK | |
| Related Products | `screens/product_detail_screen.dart` | `ProductsApi.getProducts(categoryId:)` | GET `/products?categoryId=` | `products.controller.ts` | `InvProduct` | `inventory.products` | ✅ OK | |

### 1.4 Shopping Cart

| Feature | Frontend File | Provider/Service | Backend Endpoint | Controller/Service | Prisma Model | DB Table | Status | Notes |
|---------|---------------|------------------|------------------|-------------------|--------------|----------|--------|-------|
| Get Cart | `screens/cart_screen.dart` | `CartProvider` | GET `/cart` | `cart.controller.ts` / `cart.service.ts` | `Cart`, `CartItem` | `public.carts`, `public.cart_items` | ✅ OK | FIXED: productId now Int, lookups via InvProduct |
| Add to Cart | `screens/product_detail_screen.dart` | `CartProvider.addItem()` | POST `/cart/items` | `cart.controller.ts` | `CartItem` | `public.cart_items` | ✅ OK | FIXED: Uses InvProduct.id (Int) |
| Update Quantity | `screens/cart_screen.dart` | `CartProvider.updateQuantity()` | PATCH `/cart/items/:id` | `cart.controller.ts` | `CartItem` | `public.cart_items` | ✅ OK | FIXED: InvProduct lookups |
| Remove from Cart | `screens/cart_screen.dart` | `CartProvider.removeItem()` | DELETE `/cart/items/:id` | `cart.controller.ts` | `CartItem` | `public.cart_items` | ✅ OK | |
| Apply Promo Code | `screens/cart_screen.dart` | N/A | POST `/cart/promo` | N/A | `PromoCode` | `public.promo_codes` | ❌ Missing API | Endpoint not implemented |

### 1.5 Checkout & Orders

| Feature | Frontend File | Provider/Service | Backend Endpoint | Controller/Service | Prisma Model | DB Table | Status | Notes |
|---------|---------------|------------------|------------------|-------------------|--------------|----------|--------|-------|
| Checkout Page | `screens/checkout_screen.dart` | `CartProvider` | N/A | N/A | N/A | N/A | 🔧 Broken UI | Uses local state, no order API |
| Create Order | `screens/checkout_screen.dart` | N/A | POST `/orders` | N/A | `Order` | `public.orders` | ❌ Missing API | No order creation endpoint |
| Order History | `screens/my_account_screen.dart` | N/A | GET `/account/orders` | `users.controller.ts` | `Order` | `public.orders` | ⚠️ Broken Wiring | Endpoint may not work |

### 1.6 User Account

| Feature | Frontend File | Provider/Service | Backend Endpoint | Controller/Service | Prisma Model | DB Table | Status | Notes |
|---------|---------------|------------------|------------------|-------------------|--------------|----------|--------|-------|
| Login | `screens/signup_screen.dart` | `AuthApi.login()` | POST `/auth/login` | `auth.controller.ts` | `User` | `public.users` | ✅ OK | |
| Register | `screens/signup_screen.dart` | `AuthApi.register()` | POST `/auth/register` | `auth.controller.ts` | `User` | `public.users` | ✅ OK | |
| Profile | `screens/my_account_screen.dart` | `AuthApi.getProfile()` | GET `/auth/me` | `auth.controller.ts` | `User` | `public.users` | ✅ OK | |
| Addresses | `screens/my_account_screen.dart` | N/A | GET `/account/addresses` | `users.controller.ts` | `Address` | `public.addresses` | ⚠️ Broken Wiring | May not be implemented |
| Favorites | `screens/favorites_screen.dart` | Local storage | N/A | N/A | N/A | N/A | ❌ Missing DB | No favorites table, local only |

### 1.7 CMS Pages

| Feature | Frontend File | Provider/Service | Backend Endpoint | Controller/Service | Prisma Model | DB Table | Status | Notes |
|---------|---------------|------------------|------------------|-------------------|--------------|----------|--------|-------|
| Landing Pages | `screens/landing_page_screen.dart` | `ContentApi.getLandingPage()` | GET `/content/pages/:slug` | `content.controller.ts` | `LandingPage` | `public.landing_pages` | ✅ OK | |
| About Us | `screens/about_us_screen.dart` | Hardcoded | N/A | N/A | N/A | N/A | 🔧 Broken UI | Should use ContentBlock |
| Loyalty Program | `screens/loyalty_program_screen.dart` | Hardcoded | N/A | N/A | N/A | N/A | 🔧 Broken UI | Should use ContentBlock |
| Bulk Orders | `screens/bulk_order_screen.dart` | Hardcoded | N/A | N/A | N/A | N/A | 🔧 Broken UI | Should use ContentBlock |

---

## 2. ADMIN PORTAL FEATURES

### 2.1 Dashboard

| Feature | Frontend File | Provider/Service | Backend Endpoint | Controller/Service | Prisma Model | DB Table | Status | Notes |
|---------|---------------|------------------|------------------|-------------------|--------------|----------|--------|-------|
| Dashboard Stats | `screens/admin/admin_dashboard_screen.dart` | `AdminApi.getDashboardStats()` | GET `/admin/stats` | `admin.controller.ts` / `admin.service.ts` | Multiple | Multiple | ✅ OK | FIXED: Uses InvProduct/InvCategory/InvBrand |
| Recent Orders | `screens/admin/admin_dashboard_screen.dart` | (in stats) | GET `/admin/stats` | `admin.service.ts` | `Order` | `public.orders` | ✅ OK | |
| Low Stock Alerts | `screens/admin/admin_dashboard_screen.dart` | (in stats) | GET `/admin/stats` | `admin.service.ts` | `InvProduct` | `inventory.products` | ⚠️ Limited | No stock field in InvProduct |

### 2.2 Products Admin

| Feature | Frontend File | Provider/Service | Backend Endpoint | Controller/Service | Prisma Model | DB Table | Status | Notes |
|---------|---------------|------------------|------------------|-------------------|--------------|----------|--------|-------|
| List Products | `screens/admin/admin_products_screen.dart` | `ProductsApi.getProducts()` | GET `/products` | `products.controller.ts` | `InvProduct` | `inventory.products` | ✅ OK | |
| Search Products | `screens/admin/admin_products_screen.dart` | `ProductsApi.getProducts(search:)` | GET `/products?search=` | `products.controller.ts` | `InvProduct` | `inventory.products` | ✅ OK | |
| Create Product | `screens/admin/admin_product_form_screen.dart` | `ProductsApi.createProduct()` | POST `/products` | `products.controller.ts` | `InvProduct` + related | `inventory.*` | ⚠️ Broken Wiring | DTO mismatch, no aggregate |
| Edit Product | `screens/admin/admin_product_form_screen.dart` | `ProductsApi.updateProduct()` | PATCH `/products/:id` | `products.controller.ts` | `InvProduct` + related | `inventory.*` | ⚠️ Broken Wiring | DTO mismatch, no aggregate |
| Delete Product | `screens/admin/admin_products_screen.dart` | `ProductsApi.deleteProduct()` | DELETE `/products/:id` | `products.controller.ts` | `InvProduct` | `inventory.products` | ✅ OK | |
| Toggle Featured | `screens/admin/admin_product_form_screen.dart` | (in update) | PATCH `/products/:id` | `products.controller.ts` | `InvProduct` | `inventory.products` | ⚠️ Broken Wiring | Flag not persisted |
| Image Upload | `screens/admin/admin_product_form_screen.dart` | `MediaApi.upload()` | POST `/media/upload` | `media.controller.ts` | N/A | N/A | ⚠️ Broken Wiring | May not save to product_images |

### 2.3 Categories Admin

| Feature | Frontend File | Provider/Service | Backend Endpoint | Controller/Service | Prisma Model | DB Table | Status | Notes |
|---------|---------------|------------------|------------------|-------------------|--------------|----------|--------|-------|
| List Categories | `screens/admin/admin_categories_screen.dart` | `CategoriesApi.getCategories()` | GET `/categories` | `categories.controller.ts` | `InvCategory` | `inventory.categories` | ✅ OK | |
| Create Category | `screens/admin/admin_categories_screen.dart` | `CategoriesApi.createCategory()` | POST `/categories` | `categories.controller.ts` | `InvCategory` | `inventory.categories` | ✅ OK | |
| Edit Category | `screens/admin/admin_categories_screen.dart` | `CategoriesApi.updateCategory()` | PATCH `/categories/:id` | `categories.controller.ts` | `InvCategory` | `inventory.categories` | ✅ OK | |
| Delete Category | `screens/admin/admin_categories_screen.dart` | `CategoriesApi.deleteCategory()` | DELETE `/categories/:id` | `categories.controller.ts` | `InvCategory` | `inventory.categories` | ✅ OK | |
| Reorder Categories | `screens/admin/admin_categories_screen.dart` | N/A | PATCH `/categories/reorder` | N/A | `InvCategory` | `inventory.categories` | ❌ Missing API | No reorder endpoint |

### 2.4 Brands Admin

| Feature | Frontend File | Provider/Service | Backend Endpoint | Controller/Service | Prisma Model | DB Table | Status | Notes |
|---------|---------------|------------------|------------------|-------------------|--------------|----------|--------|-------|
| List Brands | `screens/admin/admin_brands_screen.dart` | `BrandsApi.getBrands()` | GET `/brands` | `brands.controller.ts` | `InvBrand` | `inventory.brands` | ✅ OK | |
| Create Brand | `screens/admin/admin_brands_screen.dart` | `BrandsApi.createBrand()` | POST `/brands` | `brands.controller.ts` | `InvBrand` | `inventory.brands` | ✅ OK | |
| Edit Brand | `screens/admin/admin_brands_screen.dart` | `BrandsApi.updateBrand()` | PATCH `/brands/:id` | `brands.controller.ts` | `InvBrand` | `inventory.brands` | ✅ OK | |
| Delete Brand | `screens/admin/admin_brands_screen.dart` | `BrandsApi.deleteBrand()` | DELETE `/brands/:id` | `brands.controller.ts` | `InvBrand` | `inventory.brands` | ✅ OK | |

### 2.5 Departments Admin

| Feature | Frontend File | Provider/Service | Backend Endpoint | Controller/Service | Prisma Model | DB Table | Status | Notes |
|---------|---------------|------------------|------------------|-------------------|--------------|----------|--------|-------|
| List Departments | `screens/admin/admin_departments_screen.dart` | `DepartmentsApi.getDepartments()` | GET `/departments` | `departments.controller.ts` | `Department` | `public.departments` | ✅ OK | |
| Create Department | `screens/admin/admin_departments_screen.dart` | `DepartmentsApi.createDepartment()` | POST `/departments` | `departments.controller.ts` | `Department` | `public.departments` | ✅ OK | |
| Edit Department | `screens/admin/admin_departments_screen.dart` | `DepartmentsApi.updateDepartment()` | PATCH `/departments/:id` | `departments.controller.ts` | `Department` | `public.departments` | ✅ OK | |
| Delete Department | `screens/admin/admin_departments_screen.dart` | `DepartmentsApi.deleteDepartment()` | DELETE `/departments/:id` | `departments.controller.ts` | `Department` | `public.departments` | ✅ OK | |

### 2.6 Banners Admin

| Feature | Frontend File | Provider/Service | Backend Endpoint | Controller/Service | Prisma Model | DB Table | Status | Notes |
|---------|---------------|------------------|------------------|-------------------|--------------|----------|--------|-------|
| List Banners | `screens/admin/admin_banners_screen.dart` | `ContentApi.getAllBanners()` | GET `/content/banners/all` | `content.controller.ts` | `Banner` | `public.banners` | ✅ OK | FIXED: Added route alias |
| Create Banner | `screens/admin/admin_banners_screen.dart` | `ContentApi.createBanner()` | POST `/content/banners` | `content.controller.ts` | `Banner` | `public.banners` | ✅ OK | FIXED: Added route alias |
| Edit Banner | `screens/admin/admin_banners_screen.dart` | `ContentApi.updateBanner()` | PATCH `/content/banners/:id` | `content.controller.ts` | `Banner` | `public.banners` | ✅ OK | FIXED: Added route alias |
| Delete Banner | `screens/admin/admin_banners_screen.dart` | `ContentApi.deleteBanner()` | DELETE `/content/banners/:id` | `content.controller.ts` | `Banner` | `public.banners` | ✅ OK | FIXED: Added route alias |

### 2.7 Landing Pages Admin

| Feature | Frontend File | Provider/Service | Backend Endpoint | Controller/Service | Prisma Model | DB Table | Status | Notes |
|---------|---------------|------------------|------------------|-------------------|--------------|----------|--------|-------|
| List Pages | `screens/admin/admin_landing_pages_screen.dart` | `ContentApi.getLandingPages()` | GET `/content/pages` | `content.controller.ts` | `LandingPage` | `public.landing_pages` | ✅ OK | FIXED: Added route alias |
| Create Page | `screens/admin/admin_landing_pages_screen.dart` | `ContentApi.createLandingPage()` | POST `/content/pages` | N/A | `LandingPage` | `public.landing_pages` | ⚠️ Broken Wiring | Path mismatch |
| Edit Page | `screens/admin/admin_landing_pages_screen.dart` | `ContentApi.updateLandingPage()` | PATCH `/content/pages/:id` | N/A | `LandingPage` | `public.landing_pages` | ⚠️ Broken Wiring | Path mismatch |

### 2.8 Orders Admin

| Feature | Frontend File | Provider/Service | Backend Endpoint | Controller/Service | Prisma Model | DB Table | Status | Notes |
|---------|---------------|------------------|------------------|-------------------|--------------|----------|--------|-------|
| List Orders | `screens/admin/admin_generic_list_screen.dart` | `AdminApi.getOrders()` | GET `/admin/orders` | `admin.controller.ts` | `Order` | `public.orders` | ✅ OK | |
| Order Details | N/A | N/A | GET `/admin/orders/:id` | N/A | `Order` | `public.orders` | ❌ Missing API | No order detail endpoint |
| Update Status | N/A | N/A | PATCH `/admin/orders/:id/status` | N/A | `Order` | `public.orders` | ❌ Missing API | No status update endpoint |

### 2.9 Promo Codes Admin

| Feature | Frontend File | Provider/Service | Backend Endpoint | Controller/Service | Prisma Model | DB Table | Status | Notes |
|---------|---------------|------------------|------------------|-------------------|--------------|----------|--------|-------|
| List Promos | N/A | N/A | GET `/promos` | `promos.controller.ts` | `PromoCode` | `public.promo_codes` | 📝 TODO | Screen not built |
| Create Promo | N/A | N/A | POST `/promos` | N/A | `PromoCode` | `public.promo_codes` | ❌ Missing API | |
| Edit Promo | N/A | N/A | PATCH `/promos/:id` | N/A | `PromoCode` | `public.promo_codes` | ❌ Missing API | |

---

## 3. TOP 10 BROKEN FEATURES (Priority Order)

| # | Feature | Issue Type | Root Cause | Fix Required |
|---|---------|-----------|------------|--------------|
| 1 | **Admin Dashboard Stats** | ⚠️ Broken Wiring | `admin.service.ts` uses `prisma.product/category/brand` which reference deleted `public.*` tables | Change to `prisma.invProduct/invCategory/invBrand` |
| 2 | **Cart System** | ⚠️ Broken Wiring | `cart_items.productId` FK pointed to deleted `public.products` | Update Prisma schema, store inventory product ID as TEXT |
| 3 | **Admin Banners CRUD** | ⚠️ Broken Wiring | Frontend calls `/content/banners/*`, backend has `/content/admin/banners/*` | Fix frontend paths OR add backend aliases |
| 4 | **Admin Landing Pages CRUD** | ⚠️ Broken Wiring | Frontend calls `/content/pages/*`, backend has `/content/admin/pages/*` | Fix frontend paths OR add backend aliases |
| 5 | **Product Create/Edit** | ⚠️ Broken Wiring | No aggregate DTO - can't create full product with pricing/images/specs in one call | Create aggregate endpoint in admin |
| 6 | **Order Creation** | ❌ Missing API | No `POST /orders` endpoint for checkout | Implement orders controller/service |
| 7 | **Order Admin Detail/Status** | ❌ Missing API | No endpoints for viewing/updating order details | Implement in admin controller |
| 8 | **Category Reorder** | ❌ Missing API | No `PATCH /categories/reorder` endpoint | Implement reorder endpoint |
| 9 | **Favorites** | ❌ Missing DB | No favorites table - using local storage only | Add `public.favorites` table |
| 10 | **Promo Codes Admin** | ❌ Missing API | No CRUD endpoints for promo codes | Implement promos controller |

---

## 4. FIX IMPLEMENTATION PLAN

### Phase 1: Critical Fixes (Unblock Dashboard & Cart)
1. Fix `admin.service.ts` to use inventory schema models
2. Update Prisma schema for cart to reference inventory products

### Phase 2: API Path Alignment (Unblock Admin CMS)
3. Fix frontend content_api.dart paths OR add backend route aliases

### Phase 3: Complete CRUD
4. Implement product aggregate create/update endpoint
5. Implement orders CRUD
6. Implement promo codes CRUD

### Phase 4: Enhancements
7. Add category reorder endpoint
8. Add favorites table and endpoints
9. Add content blocks for static pages

---

## 5. COMMITS LOG

| Commit | Description | Status |
|--------|-------------|--------|
| (pending) | Fix admin.service.ts to use inventory schema | ⏳ |
| (pending) | Fix cart system for inventory products | ⏳ |
| (pending) | Fix content API paths alignment | ⏳ |
| (pending) | Implement product aggregate CRUD | ⏳ |
| (pending) | Implement orders endpoints | ⏳ |

---

*Last Updated: January 1, 2026*
