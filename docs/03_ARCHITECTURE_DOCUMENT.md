# Solo E-Commerce Platform — Architecture Document

**Document Version**: 1.0  
**Date**: 17 March 2026  
**Author**: Solo Engineering Team  
**Status**: Final  

---

## 1. Architecture Overview

Solo E-Commerce follows a **three-tier client-server architecture** with clear separation between the presentation layer (Flutter Web), the business logic layer (NestJS API), and the data persistence layer (PostgreSQL). Communication between tiers is strictly through RESTful JSON APIs over HTTPS.

### 1.1 Architecture Style

| Characteristic | Implementation |
|---------------|----------------|
| **Pattern** | Monolithic modular (backend), SPA (frontend) |
| **API Style** | RESTful with JSON payloads |
| **State Management** | Stateless backend (JWT), stateful frontend (Provider) |
| **Data Access** | ORM (Prisma) + Raw SQL for inventory |
| **Authentication** | Token-based (JWT access + refresh) |
| **Deployment** | Static frontend + API server + managed database |

### 1.2 Design Principles

1. **Separation of Concerns** — Each NestJS module owns one business domain
2. **Single Responsibility** — Controllers handle HTTP, Services handle logic, Prisma handles data
3. **Dependency Injection** — NestJS IoC container manages all service lifecycles
4. **Fail-Fast Validation** — DTO validation at controller boundary before business logic
5. **Defence in Depth** — Multiple security layers (Helmet, CORS, Throttle, JWT, RBAC)

---

## 2. System Context Diagram

```
                    ┌──────────────────────┐
                    │     Customer         │
                    │  (Web Browser)       │
                    └──────────┬───────────┘
                               │ HTTPS
                               ▼
                    ┌──────────────────────┐
                    │   Solo E-Commerce    │
                    │     Platform         │
                    └──────────┬───────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
         ▼                     ▼                     ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│   Stripe API    │ │   SMTP Email    │ │  File Storage   │
│  (Payments)     │ │  (Notifications)│ │  (Images)       │
└─────────────────┘ └─────────────────┘ └─────────────────┘
```

---

## 3. Component Architecture

### 3.1 Frontend Component Map

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUTTER WEB APPLICATION                       │
│                                                                 │
│  ┌─── ENTRY ──────────────────────────────────────────────────┐ │
│  │  main.dart → App (MaterialApp + MultiProvider + Router)    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─── SCREENS (Views) ────────────────────────────────────────┐ │
│  │                                                             │ │
│  │  ┌─── Storefront ──────────┐  ┌─── Account ─────────────┐ │ │
│  │  │ HomeScreen              │  │ LoginScreen              │ │ │
│  │  │ HomeScreenCms           │  │ SignupScreen              │ │ │
│  │  │ CategoryScreen          │  │ ForgotPasswordScreen      │ │ │
│  │  │ CategoryLandingScreen   │  │ VerifyEmailScreen         │ │ │
│  │  │ ProductDetailScreen     │  │ MyAccountScreen           │ │ │
│  │  │ SearchScreen            │  │ MyAddressesScreen         │ │ │
│  │  │ FavoritesScreen         │  │ LoyaltyProgramScreen      │ │ │
│  │  │ CartScreen              │  └───────────────────────────┘ │ │
│  │  │ CheckoutScreen          │                                │ │
│  │  │ AboutUsScreen           │  ┌─── Admin ────────────────┐ │ │
│  │  │ BulkOrderScreen         │  │ AdminDashboardScreen     │ │ │
│  │  └─────────────────────────┘  │ AdminProductsScreen      │ │ │
│  │                               │ AdminCategoriesScreen     │ │ │
│  │                               │ AdminBrandsScreen         │ │ │
│  │                               │ AdminOrdersScreen         │ │ │
│  │                               │ AdminCustomersScreen      │ │ │
│  │                               │ AdminBannersScreen        │ │ │
│  │                               │ AdminPromoCodesScreen     │ │ │
│  │                               │ AdminLandingPagesScreen   │ │ │
│  │                               │ AdminReportsScreen        │ │ │
│  │                               │ AdminStripeConfigScreen   │ │ │
│  │                               │ AdminVatConfigScreen      │ │ │
│  │                               └───────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─── STATE (Providers) ──────────────────────────────────────┐ │
│  │ AuthProvider │ CartProvider │ ProductListProvider           │ │
│  │ ProductDetailsProvider │ CategoryProvider │ SearchProvider  │ │
│  │ FavoritesProvider │ HomeCmsProvider │ HomeProvider          │ │
│  │ AccountProvider │ ContentProvider                           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─── API LAYER ──────────────────────────────────────────────┐ │
│  │ ApiClient (HTTP + Auth Interceptor + Error Handling)        │ │
│  │ ├── AuthApi      ├── ProductsApi   ├── CartApi             │ │
│  │ ├── CategoriesApi├── BrandsApi     ├── OrdersApi           │ │
│  │ ├── FavoritesApi ├── ContentApi    ├── MediaApi            │ │
│  │ ├── AccountApi   ├── AdminApi      ├── CustomersApi        │ │
│  │ ├── StripeApi    ├── PromoCodesApi └── LoyaltyApi          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─── WIDGETS (Reusable) ─────────────────────────────────────┐ │
│  │ AppHeader │ AppDrawer │ Footer │ ProductCard │ SearchBar   │ │
│  │ HeroBanner │ TopBanner │ SectionHeader │ BrandLogo         │ │
│  │ CartDialog │ CategoryList │ MediaUploadWidget              │ │
│  │ CMS Widgets │ Porto Theme Widgets │ Home Widgets           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─── MODELS ─────────────────────────────────────────────────┐ │
│  │ Product │ Category │ CartItem │ Address │ Blog │ Loyalty   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─── CONFIG / THEME ─────────────────────────────────────────┐ │
│  │ AppConfig (API URL, env) │ AppTheme (Material 3 tokens)    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Backend Component Map

```
┌─────────────────────────────────────────────────────────────────┐
│                    NESTJS API SERVER                             │
│                                                                 │
│  ┌─── CROSS-CUTTING CONCERNS ────────────────────────────────┐ │
│  │                                                             │ │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐             │ │
│  │  │   Helmet   │ │    CORS    │ │  Throttler │             │ │
│  │  │  (Headers) │ │  (Origins) │ │ (Rate Limit│             │ │
│  │  └────────────┘ └────────────┘ └────────────┘             │ │
│  │                                                             │ │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐             │ │
│  │  │ Validation │ │ Exception  │ │  Logging   │             │ │
│  │  │   Pipe     │ │  Filter    │ │ Interceptor│             │ │
│  │  └────────────┘ └────────────┘ └────────────┘             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─── SECURITY LAYER ────────────────────────────────────────┐ │
│  │                                                             │ │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐             │ │
│  │  │ JwtAuth    │ │  Roles     │ │ @Current   │             │ │
│  │  │   Guard    │ │  Guard     │ │  User()    │             │ │
│  │  └────────────┘ └────────────┘ └────────────┘             │ │
│  │                                                             │ │
│  │  ┌────────────┐ ┌────────────┐                             │ │
│  │  │ JWT        │ │ Local      │                             │ │
│  │  │ Strategy   │ │ Strategy   │                             │ │
│  │  └────────────┘ └────────────┘                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─── DOMAIN MODULES ────────────────────────────────────────┐ │
│  │                                                             │ │
│  │  ┌─ Commerce ──────────────────────────────────────────┐   │ │
│  │  │  Products │ Categories │ Brands │ Collections       │   │ │
│  │  │  Cart │ Orders │ Packages │ Favorites               │   │ │
│  │  └────────────────────────────────────────────────────────┘  │ │
│  │                                                             │ │
│  │  ┌─ Identity ──────────────────────────────────────────┐   │ │
│  │  │  Auth │ Users (Account) │ Customers                 │   │ │
│  │  └────────────────────────────────────────────────────────┘  │ │
│  │                                                             │ │
│  │  ┌─ Content ───────────────────────────────────────────┐   │ │
│  │  │  Content (Banners/Landing) │ CMS │ Blog │ Navigation│   │ │
│  │  └────────────────────────────────────────────────────────┘  │ │
│  │                                                             │ │
│  │  ┌─ Operations ────────────────────────────────────────┐   │ │
│  │  │  Admin (Dashboard/Reports) │ Media │ Settings       │   │ │
│  │  └────────────────────────────────────────────────────────┘  │ │
│  │                                                             │ │
│  │  ┌─ Integration ──────────────────────────────────────┐    │ │
│  │  │  Stripe │ Promos │ Loyalty                          │   │ │
│  │  └────────────────────────────────────────────────────────┘  │ │
│  │                                                             │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌─── DATA ACCESS LAYER ─────────────────────────────────────┐ │
│  │                                                             │ │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐             │ │
│  │  │  Prisma    │ │   Raw SQL  │ │  Multer    │             │ │
│  │  │  Client    │ │  Queries   │ │ (File I/O) │             │ │
│  │  └──────┬─────┘ └──────┬─────┘ └──────┬─────┘             │ │
│  │         │               │               │                   │ │
│  └─────────┼───────────────┼───────────────┼───────────────────┘ │
│            │               │               │                     │
└────────────┼───────────────┼───────────────┼─────────────────────┘
             │               │               │
             ▼               ▼               ▼
      ┌────────────┐ ┌────────────┐ ┌────────────┐
      │ PostgreSQL │ │ PostgreSQL │ │ Filesystem  │
      │  App DB    │ │ Inventory  │ │  /uploads/  │
      └────────────┘ └────────────┘ └────────────┘
```

---

## 4. Data Architecture

### 4.1 Dual-Database Strategy

The platform uses a **dual-database architecture** within a single PostgreSQL instance:

```
solo_ecommerce (PostgreSQL Instance)
│
├── Application Schema (Prisma-Managed)
│   ├── Users & Authentication
│   │   └── users, refresh_tokens, password_reset_tokens, 
│   │       email_verification_tokens, addresses, saved_payment_methods
│   ├── Shopping & Orders
│   │   └── carts, cart_items, orders, order_items, 
│   │       order_status_history, invoices, favorites
│   ├── Loyalty
│   │   └── loyalty_wallets, loyalty_transactions
│   ├── Promotions
│   │   └── promo_codes
│   ├── Content
│   │   └── banners, landing_pages, landing_sections,
│   │       home_page_configs, home_page_sections,
│   │       category_landing_page_configs, category_landing_sections
│   ├── Blog
│   │   └── blog_posts, blog_categories, blog_tags, blog_post_tags
│   ├── Navigation
│   │   └── navigation_menus, navigation_menu_items
│   ├── Collections
│   │   └── product_collections, product_collection_items
│   └── Settings
│       └── site_settings
│
└── Inventory Schema (Direct SQL)
    ├── Product Catalog
    │   └── products, product_images, product_pricing,
    │       product_dimensions, product_packaging,
    │       product_specifications, product_overrides,
    │       product_variants
    ├── Taxonomy
    │   └── categories, subcategories, brands,
    │       designers, countries
    └── Media
        └── media_assets
```

### 4.2 Entity Relationship Overview

```
Users ──────┬─── 1:N ───── Addresses
            ├─── 1:N ───── Orders ──────┬── 1:N ── OrderItems
            ├─── 1:1 ───── Cart ────────┤── 1:N ── CartItems
            ├─── 1:1 ───── LoyaltyWallet┤── 1:N ── LoyaltyTransactions
            ├─── 1:N ───── Favorites    │
            ├─── 1:N ───── RefreshTokens│
            └─── 1:N ───── SavedPaymentMethods

Products ───┬─── N:1 ───── Categories ── 1:N ── Subcategories
            ├─── N:1 ───── Brands
            ├─── 1:N ───── ProductImages
            ├─── 1:1 ───── ProductPricing
            ├─── 1:1 ───── ProductDimensions
            ├─── 1:N ───── ProductSpecifications
            ├─── 1:N ───── ProductVariants
            └─── N:1 ───── Designers, Countries

PromoCode ──┬── used by ── Orders
Banner ─────┤── placed at ── HOME_HERO, etc.
BlogPost ───┼── belongs to ── BlogCategory
            └── tagged with ── BlogTags (M:N via BlogPostTag)

NavigationMenu ── 1:N ── MenuItems (self-referencing for hierarchy)
```

---

## 5. Security Architecture

### 5.1 Defence in Depth Layers

```
Layer 1: NETWORK
  ├── HTTPS/TLS 1.2+ (all traffic encrypted)
  ├── CORS whitelist (only frontend origin)
  └── Rate limiting (1000 req/min global, stricter on auth)

Layer 2: APPLICATION 
  ├── Helmet.js (security headers: HSTS, X-Frame-Options, CSP)
  ├── Input validation (class-validator DTOs, whitelist mode)
  ├── SQL injection prevention (Prisma parameterized queries)
  └── XSS prevention (no HTML rendering from user input)

Layer 3: AUTHENTICATION
  ├── Password hashing (Argon2id)
  ├── JWT tokens (short-lived access, server-stored refresh)
  ├── Token rotation on refresh
  └── Brute-force protection (rate limiting on login)

Layer 4: AUTHORIZATION
  ├── Role-Based Access Control (CUSTOMER, ADMIN, SUPER_ADMIN)
  ├── Row-level security (users access own data only)
  ├── Guard-based endpoint protection
  └── Decorator-based role requirements

Layer 5: DATA
  ├── Encrypted at rest (cloud provider)
  ├── Encrypted in transit (TLS)
  ├── Sensitive fields hashed (passwords)
  └── PCI-DSS compliance (Stripe handles card data)

Layer 6: AUDIT
  ├── Order status change history
  ├── Loyalty transaction log
  └── Application logs (errors, requests)
```

### 5.2 Authentication Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     REQUEST LIFECYCLE                             │
│                                                                  │
│  Client Request                                                  │
│      │                                                           │
│      ▼                                                           │
│  Helmet Middleware (security headers)                            │
│      │                                                           │
│      ▼                                                           │
│  CORS Check (origin validation)                                  │
│      │                                                           │
│      ▼                                                           │
│  ThrottlerGuard (rate limit check)                               │
│      │                                                           │
│      ▼                                                           │
│  ValidationPipe (DTO validation, whitelist stripping)            │
│      │                                                           │
│      ▼                                                           │
│  ┌──────────────────────────────────────────────────────┐        │
│  │  Route Handler                                       │        │
│  │                                                      │        │
│  │  Is endpoint protected? (@UseGuards)                 │        │
│  │  ├── NO → Execute controller method                  │        │
│  │  └── YES ─┐                                          │        │
│  │           ▼                                          │        │
│  │  JwtAuthGuard                                        │        │
│  │  ├── Extract Bearer token from Authorization header  │        │
│  │  ├── Verify JWT signature                            │        │
│  │  ├── Check token expiration                          │        │
│  │  ├── Load user from database                         │        │
│  │  └── Attach user to request                          │        │
│  │           │                                          │        │
│  │           ▼                                          │        │
│  │  RolesGuard (if @Roles decorator present)            │        │
│  │  ├── Get required roles from metadata                │        │
│  │  ├── Compare with user.role                          │        │
│  │  └── Allow or throw ForbiddenException               │        │
│  │           │                                          │        │
│  │           ▼                                          │        │
│  │  Controller Method (business logic via Service)      │        │
│  │                                                      │        │
│  └──────────────────────────────────────────────────────┘        │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 6. API Architecture

### 6.1 URL Namespace

```
/api
  ├── /auth            ← Authentication (public + protected)
  ├── /account         ← User account management (protected)
  ├── /products        ← Product catalog (public + admin)
  ├── /categories      ← Categories (public + admin)
  ├── /brands          ← Brands (public + admin)
  ├── /cart            ← Shopping cart (protected)
  ├── /orders          ← Order management (protected)
  ├── /favorites       ← Wishlist (protected)
  ├── /promo-codes     ← Promotions (protected + admin)
  ├── /stripe          ← Payments (public + protected + admin)
  ├── /media           ← File uploads (admin)
  ├── /content         ← CMS content (public + admin)
  ├── /cms             ← CMS pages (public + admin)
  ├── /blog            ← Blog (public + admin)
  ├── /navigation      ← Menu system (public + admin)
  ├── /collections     ← Curated lists (public + admin)
  ├── /settings        ← Site settings (public + admin)
  ├── /admin           ← Admin dashboard (admin only)
  │   ├── /stats       ← Dashboard KPIs
  │   ├── /orders      ← Order management
  │   ├── /customers   ← Customer management
  │   └── /reports     ← Analytics & reports
  └── /uploads/*       ← Static file serving (public, no /api prefix)
```

### 6.2 API Response Contract

```
Success (200/201):
{
  "data": { ... } | [ ... ],
  "meta": {                          // For paginated responses
    "total": 805,
    "page": 1,
    "limit": 20,
    "totalPages": 41
  }
}

Error (4xx/5xx):
{
  "statusCode": 400,
  "message": "Validation failed" | ["field must be string"],
  "error": "Bad Request"
}
```

### 6.3 Endpoint Summary

| Access Level | Count | Description |
|-------------|-------|-------------|
| Public | 34 | Product browsing, CMS, blog, navigation |
| Protected (Customer) | 34 | Cart, orders, favorites, account, payments |
| Admin Only | 100+ | CRUD operations, reports, settings, media |
| **Total** | **170+** | Complete API surface |

---

## 7. Frontend Architecture

### 7.1 State Management Pattern

```
                    ┌─────────────────────┐
                    │    UI Widgets       │
                    │  (Screens + Widgets)│
                    └─────────┬───────────┘
                              │ Consumer<Provider>
                              │ context.read/watch
                              ▼
                    ┌─────────────────────┐
                    │   ChangeNotifier    │
                    │   Providers (11)    │
                    │                     │
                    │ • Holds UI state    │
                    │ • Orchestrates API  │
                    │ • Notifies listeners│
                    └─────────┬───────────┘
                              │ await api.method()
                              ▼
                    ┌─────────────────────┐
                    │   API Service Layer │
                    │   (14 *_api.dart)   │
                    │                     │
                    │ • Typed API calls   │
                    │ • JSON ↔ Model      │
                    └─────────┬───────────┘
                              │ HTTP request
                              ▼
                    ┌─────────────────────┐
                    │     ApiClient       │
                    │                     │
                    │ • Base URL config   │
                    │ • Auth interceptor  │
                    │ • Error handling    │
                    │ • Token refresh     │
                    └─────────┬───────────┘
                              │ HTTPS
                              ▼
                    ┌─────────────────────┐
                    │   NestJS Backend    │
                    └─────────────────────┘
```

### 7.2 Navigation Architecture

```
MaterialApp
  │
  ├── / (home) ──────────────── HomeScreen / HomeScreenCms
  ├── /login ────────────────── LoginScreen
  ├── /signup ───────────────── SignupScreen
  ├── /forgot-password ──────── ForgotPasswordScreen
  ├── /verify-email ─────────── VerifyEmailScreen
  ├── /products ─────────────── CategoryScreen (product listing)
  ├── /product/:id ──────────── ProductDetailScreen
  ├── /category/:id ─────────── CategoryLandingScreen
  ├── /search ───────────────── SearchScreen
  ├── /cart ──────────────────── CartScreen
  ├── /checkout ─────────────── CheckoutScreen
  ├── /favorites ────────────── FavoritesScreen
  ├── /account ──────────────── MyAccountScreen (with sub-routes)
  │   ├── /addresses ────────── MyAddressesScreen
  │   └── /orders ───────────── Order History
  ├── /loyalty ──────────────── LoyaltyProgramScreen
  ├── /about ────────────────── AboutUsScreen
  ├── /bulk-order ───────────── BulkOrderScreen
  │
  └── /admin ────────────────── Admin Routes (protected by role check)
      ├── /admin/dashboard ──── AdminDashboardScreen
      ├── /admin/products ───── AdminProductsScreen
      ├── /admin/categories ─── AdminCategoriesScreen
      ├── /admin/brands ─────── AdminBrandsScreen
      ├── /admin/orders ─────── AdminOrdersScreen
      ├── /admin/customers ──── AdminCustomersScreen
      ├── /admin/banners ────── AdminBannersScreen
      ├── /admin/promos ─────── AdminPromoCodesScreen
      ├── /admin/landing ────── AdminLandingPagesScreen
      ├── /admin/reports ────── AdminReportsScreen
      ├── /admin/stripe ─────── AdminStripeConfigScreen
      └── /admin/vat ────────── AdminVatConfigScreen
```

---

## 8. Infrastructure Architecture

### 8.1 Development Environment

```
┌─────────────────────────────────────────────────────────┐
│                 Developer Workstation                     │
│                                                         │
│  ┌─────────────────┐  ┌──────────────────────────────┐ │
│  │ Flutter DevTools │  │ VS Code                      │ │
│  │ Chrome :52391    │  │ + Dart/Flutter extensions     │ │
│  └────────┬────────┘  │ + NestJS extensions           │ │
│           │           │ + PostgreSQL extension         │ │
│           │ HTTP      └──────────────────────────────┘ │
│           ▼                                             │
│  ┌─────────────────┐                                   │
│  │ NestJS Dev      │  npm run start:dev                │
│  │ localhost:3000   │  (hot reload via ts-node)         │
│  └────────┬────────┘                                   │
│           │ Prisma                                      │
│           ▼                                             │
│  ┌─────────────────┐  ┌──────────────────────────────┐ │
│  │ PostgreSQL      │  │ Mailhog                      │ │
│  │ localhost:5433   │  │ SMTP :1025 │ Web UI :8025    │ │
│  └─────────────────┘  └──────────────────────────────┘ │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │ Docker Compose (optional services)                │  │
│  │ └── mailhog                                       │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 8.2 Production Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                        INTERNET                                    │
└────────────────────────────┬──────────────────────────────────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
     ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
     │ CDN Edge    │ │ CDN Edge    │ │ CDN Edge    │
     │ (Region A)  │ │ (Region B)  │ │ (Region C)  │
     └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
            │                │                │
            └────────────────┼────────────────┘
                             │
                             ▼
     ┌───────────────────────────────────────────────┐
     │         Static Web App (Flutter Build)         │
     │         *.html, *.js, *.css, assets            │
     │         Custom domain + managed SSL            │
     └───────────────────────┬───────────────────────┘
                             │ /api/* proxy
                             ▼
     ┌───────────────────────────────────────────────┐
     │         API Server (App Service / EC2)         │
     │         NestJS + Node.js 18                    │
     │         Environment: env vars from vault       │
     │         Health check: /api/health              │
     │         Auto-restart on failure                │
     └───────────┬───────────────────┬───────────────┘
                 │                   │
                 ▼                   ▼
     ┌──────────────────┐    ┌──────────────┐
     │ Managed PostgreSQL│    │ Blob / S3    │
     │ Automated backups │    │ (Images)     │
     │ Point-in-time     │    │ CDN-fronted  │
     │ SSL connections   │    └──────────────┘
     └──────────────────┘
```

---

## 9. Build & Deployment Pipeline

### 9.1 CI/CD Flow

```
Developer Push to GitHub
         │
         ▼
  GitHub Actions Trigger
         │
         ├── Backend Pipeline:
         │   ├── Install dependencies (npm ci)
         │   ├── Lint (ESLint)
         │   ├── Build (tsc → dist/)
         │   ├── Unit tests (Jest)
         │   ├── E2E tests (Supertest)
         │   └── Deploy to App Service / EC2
         │
         └── Frontend Pipeline:
             ├── Install dependencies (flutter pub get)
             ├── Analyze (flutter analyze)
             ├── Build (flutter build web --release)
             └── Deploy to Static Web Apps / S3
```

### 9.2 Environment Configuration

| Variable | Development | Production |
|----------|------------|------------|
| DATABASE_URL | localhost:5433 | Managed DB connection string |
| NODE_ENV | development | production |
| JWT_ACCESS_SECRET | dev-secret | 32+ char random |
| JWT_REFRESH_SECRET | dev-secret | 32+ char random |
| FRONTEND_URL | http://localhost:5000 | https://solo-ecommerce.com |
| STRIPE_SECRET_KEY | sk_test_xxx | sk_live_xxx |
| SMTP_HOST | localhost | smtp.sendgrid.net |
| UPLOAD_PATH | ./uploads | /app/uploads or cloud storage |

---

## 10. Performance Architecture

### 10.1 Optimization Strategies

| Layer | Strategy | Implementation |
|-------|----------|----------------|
| **CDN** | Cache static assets | Flutter build output served from edge |
| **API** | Response caching headers | Cache-Control for product lists |
| **Database** | Strategic indexing | Indexes on FK columns, email, slug |
| **Images** | Optimized uploads | WebP conversion, max 1920px width |
| **Frontend** | Lazy loading | Provider-based on-demand data loading |
| **Queries** | Batch operations | resolveProductImageUrls batches DB lookups |
| **Pagination** | Cursor/offset | 20 items per page default |

### 10.2 Scalability Path

```
Phase 1 (Current): Single Server
  └── App Service B1 + Flexible Server B1ms

Phase 2 (Growth): Vertical Scaling
  └── App Service S1 + Flexible Server B2s + Redis Cache

Phase 3 (Scale): Horizontal Scaling
  └── Multiple API instances + Load Balancer
      + Read Replicas + CDN + Background Workers
```

---

## 11. Monitoring & Observability

| Concern | Tool | What's Monitored |
|---------|------|-----------------|
| **Health Check** | /api/health endpoint | Server alive, DB connected |
| **Error Tracking** | Application Insights / CloudWatch | Unhandled exceptions, 5xx rates |
| **Performance** | APM metrics | Response times, throughput, p95 latency |
| **Availability** | Uptime monitoring | HTTP 200 checks every 60s |
| **Logs** | Structured logging | Request/response, auth events, order events |
| **Alerts** | Threshold-based | Error rate > 1%, latency > 2s, disk > 90% |

---

## 12. Disaster Recovery

| Scenario | RTO | RPO | Recovery Strategy |
|----------|-----|-----|-------------------|
| API server crash | < 5 min | 0 | Auto-restart via health check |
| Database corruption | < 1 hour | < 1 hour | Point-in-time restore from backup |
| Region outage | < 4 hours | < 1 hour | Redeploy to alternate region |
| Data breach | < 1 hour | — | Rotate secrets, revoke tokens, notify users |

---

*End of Architecture Document*
