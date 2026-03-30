# Solo E-Commerce Platform — Project Scope, Features & Requirements

**Document Version**: 1.0  
**Date**: 17 March 2026  
**Author**: Solo Engineering Team  
**Status**: Final  

---

## 1. Project Overview

### 1.1 Project Name
**Solo E-Commerce** — Premium Kitchenware & Home Goods Online Store

### 1.2 Project Description
A full-featured e-commerce web application serving the UAE market for premium kitchenware, tableware, glassware, and home goods. The platform supports end-to-end retail operations including product catalog management, shopping cart, online checkout with Stripe payments, order fulfillment, customer loyalty programs, and a content management system for marketing.

### 1.3 Target Market
- **Geography**: United Arab Emirates (UAE)
- **Currency**: AED (Arab Emirates Dirham)
- **Tax**: 5% VAT (standard UAE rate)
- **Language**: English (primary)
- **Product Focus**: Premium kitchenware brands (Eva Solo, Eva Trio, PWtbS, Eva)

### 1.4 Business Objectives

| # | Objective | Success Metric |
|---|-----------|---------------|
| BO-1 | Launch online retail presence | Website live with 800+ products |
| BO-2 | Enable no-code content management | Admin can update homepage, banners, and landing pages without developer |
| BO-3 | Automate order processing | End-to-end: browse → pay → order confirmed in < 5 minutes |
| BO-4 | Build customer loyalty | Loyalty points program drives repeat purchases |
| BO-5 | Reduce manual operations | Admin dashboard replaces spreadsheet-based inventory tracking |
| BO-6 | Data-driven decisions | Reports dashboard provides revenue, product, and customer analytics |

---

## 2. Project Scope

### 2.1 In Scope

| Area | Description |
|------|-------------|
| **Product Catalog** | Browse, search, and filter 805+ products across categories, brands, and price ranges |
| **User Accounts** | Registration, login, profile management, address book, order history |
| **Shopping Cart** | Server-synced cart with quantity management, promo code application |
| **Checkout & Payment** | Multi-step checkout with Stripe payment integration (card payments) |
| **Order Management** | Order lifecycle from creation to delivery, with status tracking and invoices |
| **Admin Dashboard** | Product CRUD, order management, customer management, banner management |
| **Content Management** | Homepage sections, hero banners, landing pages, blog posts |
| **Promotions** | Promo codes (percentage, fixed, free shipping) with validation rules |
| **Loyalty Program** | Points earned per purchase, redeemable on future orders |
| **Favorites/Wishlist** | Save products for later viewing |
| **Search** | Text-based product search across name and description |
| **Reports & Analytics** | Revenue, orders, products, customers, VAT, and category reports |
| **Media Management** | Image upload, optimization, and CDN-ready serving |
| **Navigation Management** | Admin-configurable menu system |
| **VAT Configuration** | Admin-configurable VAT rate and calculation |
| **Stripe Configuration** | Admin-configurable payment gateway settings |
| **Email Notifications** | Order confirmation, password reset, email verification |
| **Security** | JWT authentication, RBAC, rate limiting, OWASP compliance |

### 2.2 Out of Scope (Current Release)

| Area | Reason |
|------|--------|
| Mobile native apps (iOS/Android) | Web-first approach; Flutter supports future mobile build |
| Multi-language (Arabic) | Phase 2 consideration |
| Multi-currency | UAE market only (AED) |
| Marketplace (multi-vendor) | Single-vendor model |
| Live chat / customer support widget | External tool integration planned |
| SMS notifications | Email-only in current release |
| Subscription/recurring orders | Not required for current product types |
| Product reviews & ratings | Phase 2 feature |
| Advanced recommendation engine | Phase 2 (ML-based) |
| Warehouse management system | External WMS integration planned |
| Accounting software integration | Manual export via reports currently |

---

## 3. Functional Requirements

### 3.1 Customer-Facing Requirements

#### FR-001: User Registration & Authentication
| ID | Requirement | Priority |
|----|------------|----------|
| FR-001.1 | Users can register with email and password | Must Have |
| FR-001.2 | Users receive email verification after registration | Must Have |
| FR-001.3 | Users can log in with email/password | Must Have |
| FR-001.4 | Users can reset forgotten passwords via email | Must Have |
| FR-001.5 | Users can change their password when logged in | Must Have |
| FR-001.6 | Session persists across browser refreshes (JWT stored securely) | Must Have |
| FR-001.7 | Tokens auto-refresh before expiration | Must Have |
| FR-001.8 | Users can log out (revokes refresh token) | Must Have |

#### FR-002: Product Browsing
| ID | Requirement | Priority |
|----|------------|----------|
| FR-002.1 | Homepage displays featured products, best sellers, and new arrivals | Must Have |
| FR-002.2 | Users can browse products by category | Must Have |
| FR-002.3 | Users can filter products by category, brand, and price range | Must Have |
| FR-002.4 | Users can search products by name and description | Must Have |
| FR-002.5 | Product listing shows image, name, brand, price | Must Have |
| FR-002.6 | Products paginate at 20 items per page | Must Have |
| FR-002.7 | Products can be sorted (price, name, newest) | Should Have |
| FR-002.8 | Category landing pages display curated content | Should Have |

#### FR-003: Product Detail
| ID | Requirement | Priority |
|----|------------|----------|
| FR-003.1 | Product page shows name, brand, images, price, description | Must Have |
| FR-003.2 | Product page shows multiple images (gallery) | Must Have |
| FR-003.3 | Product page shows specifications table | Should Have |
| FR-003.4 | Product page shows dimensions and packaging info | Should Have |
| FR-003.5 | Product page shows related products | Should Have |
| FR-003.6 | Users can add product to cart from detail page | Must Have |
| FR-003.7 | Users can add/remove product from favorites | Must Have |
| FR-003.8 | Product page shows delivery and returns information | Should Have |

#### FR-004: Shopping Cart
| ID | Requirement | Priority |
|----|------------|----------|
| FR-004.1 | Users can add products to cart with quantity | Must Have |
| FR-004.2 | Cart persists server-side (survives logout/login) | Must Have |
| FR-004.3 | Users can update item quantities in cart | Must Have |
| FR-004.4 | Users can remove items from cart | Must Have |
| FR-004.5 | Users can clear entire cart | Must Have |
| FR-004.6 | Cart shows subtotal, VAT, and total | Must Have |
| FR-004.7 | Users can apply promo codes in cart | Must Have |
| FR-004.8 | Cart shows product images and names for each item | Must Have |

#### FR-005: Checkout & Payment
| ID | Requirement | Priority |
|----|------------|----------|
| FR-005.1 | Multi-step checkout: address → payment → review → confirm | Must Have |
| FR-005.2 | Users can select existing shipping address or add new | Must Have |
| FR-005.3 | Users can select existing billing address or add new | Must Have |
| FR-005.4 | Payment via Stripe (credit/debit card) | Must Have |
| FR-005.5 | Order confirmation displayed on success | Must Have |
| FR-005.6 | Order confirmation email sent | Must Have |
| FR-005.7 | Promo code discount applied to order total | Must Have |
| FR-005.8 | VAT calculated and displayed (5%) | Must Have |
| FR-005.9 | Loyalty points awarded after order completion | Should Have |

#### FR-006: User Account
| ID | Requirement | Priority |
|----|------------|----------|
| FR-006.1 | Users can view and edit their profile (name, phone) | Must Have |
| FR-006.2 | Users can manage multiple addresses | Must Have |
| FR-006.3 | Users can set a default shipping address | Must Have |
| FR-006.4 | Users can view order history | Must Have |
| FR-006.5 | Users can view individual order details | Must Have |
| FR-006.6 | Users can download order invoices (PDF) | Should Have |
| FR-006.7 | Users can view loyalty points balance | Should Have |
| FR-006.8 | Users can save payment methods | Nice to Have |

#### FR-007: Favorites / Wishlist
| ID | Requirement | Priority |
|----|------------|----------|
| FR-007.1 | Users can add/remove products from favorites | Must Have |
| FR-007.2 | Favorites page shows all saved products | Must Have |
| FR-007.3 | Favorite status shown on product cards and detail page | Must Have |
| FR-007.4 | Toggle favorite from product card (heart icon) | Must Have |

#### FR-008: Search
| ID | Requirement | Priority |
|----|------------|----------|
| FR-008.1 | Search bar accessible from header on all pages | Must Have |
| FR-008.2 | Search queries product name and description (case-insensitive) | Must Have |
| FR-008.3 | Search results show in product grid format | Must Have |
| FR-008.4 | No results state shows helpful message | Must Have |

---

### 3.2 Admin-Facing Requirements

#### FR-100: Admin Dashboard
| ID | Requirement | Priority |
|----|------------|----------|
| FR-100.1 | Dashboard shows total revenue (current month) | Must Have |
| FR-100.2 | Dashboard shows total orders (current month) | Must Have |
| FR-100.3 | Dashboard shows new customers (current month) | Must Have |
| FR-100.4 | Dashboard shows average order value | Must Have |
| FR-100.5 | Dashboard shows top selling products | Should Have |
| FR-100.6 | Dashboard shows recent orders list | Must Have |
| FR-100.7 | Dashboard shows order status distribution | Should Have |
| FR-100.8 | Dashboard shows revenue by category | Should Have |

#### FR-101: Product Management
| ID | Requirement | Priority |
|----|------------|----------|
| FR-101.1 | Admin can view all products with pagination | Must Have |
| FR-101.2 | Admin can create new products with all fields | Must Have |
| FR-101.3 | Admin can edit existing products | Must Have |
| FR-101.4 | Admin can delete products | Must Have |
| FR-101.5 | Admin can upload product images | Must Have |
| FR-101.6 | Admin can set product flags (featured, best seller, new) | Must Have |
| FR-101.7 | Admin can set product pricing (selling, original, cost) | Must Have |
| FR-101.8 | Admin can assign products to categories and brands | Must Have |

#### FR-102: Category Management
| ID | Requirement | Priority |
|----|------------|----------|
| FR-102.1 | Admin can view, create, edit, delete categories | Must Have |
| FR-102.2 | Admin can reorder categories | Should Have |
| FR-102.3 | Admin can manage subcategories | Should Have |

#### FR-103: Brand Management
| ID | Requirement | Priority |
|----|------------|----------|
| FR-103.1 | Admin can view, create, edit, delete brands | Must Have |

#### FR-104: Order Management
| ID | Requirement | Priority |
|----|------------|----------|
| FR-104.1 | Admin can view all orders with filtering by status | Must Have |
| FR-104.2 | Admin can view order details (items, addresses, payment) | Must Have |
| FR-104.3 | Admin can update order status with tracking info | Must Have |
| FR-104.4 | Admin can generate and download invoice PDFs | Must Have |
| FR-104.5 | Order status history is recorded (audit trail) | Must Have |

#### FR-105: Customer Management
| ID | Requirement | Priority |
|----|------------|----------|
| FR-105.1 | Admin can view all customers with search/filter | Must Have |
| FR-105.2 | Admin can view customer details and order history | Must Have |
| FR-105.3 | Admin can create new customer accounts | Should Have |
| FR-105.4 | Admin can edit customer profiles | Must Have |
| FR-105.5 | Admin can soft-delete customers | Must Have |
| FR-105.6 | Admin can adjust customer loyalty point balances | Should Have |
| FR-105.7 | Admin can manage customer addresses | Should Have |

#### FR-106: Banner Management
| ID | Requirement | Priority |
|----|------------|----------|
| FR-106.1 | Admin can create banners with title, subtitle, images, CTA | Must Have |
| FR-106.2 | Admin can assign banners to placements (hero, top, mid, bottom) | Must Have |
| FR-106.3 | Admin can set banner active dates (start/end) | Should Have |
| FR-106.4 | Admin can enable/disable individual banners | Must Have |
| FR-106.5 | Admin can reorder banners within a placement | Must Have |

#### FR-107: Promo Code Management
| ID | Requirement | Priority |
|----|------------|----------|
| FR-107.1 | Admin can create promo codes (percentage, fixed, free shipping) | Must Have |
| FR-107.2 | Admin can set minimum order amount for promo | Should Have |
| FR-107.3 | Admin can set usage limits (total and per user) | Must Have |
| FR-107.4 | Admin can set validity period (start/end dates) | Must Have |
| FR-107.5 | Admin can activate/deactivate promos | Must Have |
| FR-107.6 | Admin can view orders that used each promo code | Should Have |

#### FR-108: Content Management (CMS)
| ID | Requirement | Priority |
|----|------------|----------|
| FR-108.1 | Admin can configure homepage sections and order | Must Have |
| FR-108.2 | Admin can create/edit landing pages | Should Have |
| FR-108.3 | Admin can configure category-specific landing pages | Should Have |
| FR-108.4 | Admin can manage blog posts with categories and tags | Should Have |
| FR-108.5 | Admin can configure navigation menus | Should Have |
| FR-108.6 | Admin can manage curated product collections | Should Have |

#### FR-109: Reports & Analytics
| ID | Requirement | Priority |
|----|------------|----------|
| FR-109.1 | Revenue report with date range filtering | Must Have |
| FR-109.2 | Order report (count, status breakdown, trends) | Must Have |
| FR-109.3 | Product report (top sellers, revenue by product) | Must Have |
| FR-109.4 | Customer report (new vs returning, top spenders) | Should Have |
| FR-109.5 | VAT report (taxable amount, VAT collected) | Must Have |
| FR-109.6 | Category performance report | Should Have |
| FR-109.7 | Promo code usage report | Should Have |
| FR-109.8 | Stock/inventory status report | Should Have |

#### FR-110: Settings Management
| ID | Requirement | Priority |
|----|------------|----------|
| FR-110.1 | Admin can configure VAT rate | Must Have |
| FR-110.2 | Admin can configure Stripe API keys | Must Have |
| FR-110.3 | Admin can enable/disable Stripe payments | Must Have |

#### FR-111: Media Management
| ID | Requirement | Priority |
|----|------------|----------|
| FR-111.1 | Admin can upload images (JPEG, PNG, WebP, SVG) | Must Have |
| FR-111.2 | Images auto-optimized on upload (WebP, resize) | Should Have |
| FR-111.3 | Admin can delete uploaded media | Must Have |
| FR-111.4 | Max file size: 5 MB | Must Have |

---

## 4. Non-Functional Requirements

### 4.1 Performance
| ID | Requirement | Target |
|----|------------|--------|
| NFR-001 | API response time (p95) | < 500ms |
| NFR-002 | Page load time (initial) | < 3 seconds |
| NFR-003 | Concurrent users support | 100+ |
| NFR-004 | Product listing pagination | 20 items/page |
| NFR-005 | Image load time | < 1 second (optimized + CDN) |

### 4.2 Security
| ID | Requirement | Standard |
|----|------------|----------|
| NFR-010 | Password hashing | Argon2id |
| NFR-011 | Transport encryption | TLS 1.2+ |
| NFR-012 | JWT token expiry | Access: 15min, Refresh: 7 days |
| NFR-013 | Rate limiting | 1000 req/min general, stricter on auth |
| NFR-014 | Input validation | All inputs validated via DTOs |
| NFR-015 | SQL injection prevention | Parameterized queries (Prisma) |
| NFR-016 | XSS prevention | Helmet CSP headers, no raw HTML render |
| NFR-017 | CORS | Whitelisted frontend origin only |
| NFR-018 | Payment security | PCI-DSS via Stripe (no card data storage) |

### 4.3 Reliability
| ID | Requirement | Target |
|----|------------|--------|
| NFR-020 | Uptime SLA | 99.9% |
| NFR-021 | Database backup frequency | Daily automated |
| NFR-022 | Recovery point objective (RPO) | < 1 hour |
| NFR-023 | Recovery time objective (RTO) | < 1 hour |
| NFR-024 | Error handling | Graceful degradation, user-friendly messages |

### 4.4 Usability
| ID | Requirement | Target |
|----|------------|--------|
| NFR-030 | Responsive design | Desktop, tablet, mobile viewports |
| NFR-031 | Browser support | Chrome, Safari, Firefox, Edge (last 2 versions) |
| NFR-032 | Accessibility | WCAG 2.1 AA target |
| NFR-033 | Error messages | Clear, actionable user feedback |

### 4.5 Maintainability
| ID | Requirement | Target |
|----|------------|--------|
| NFR-040 | Code structure | Modular (NestJS modules, Flutter providers) |
| NFR-041 | API documentation | All endpoints documented |
| NFR-042 | Database migrations | Version-controlled (Prisma Migrate) |
| NFR-043 | Deployment | Automated CI/CD pipeline |

---

## 5. Feature Implementation Matrix

| Feature | Design | Backend | Frontend | Testing | Status |
|---------|--------|---------|----------|---------|--------|
| User Registration | ✅ | ✅ | ✅ | ✅ | Complete |
| User Login | ✅ | ✅ | ✅ | ✅ | Complete |
| Password Reset | ✅ | ✅ | ✅ | ✅ | Complete |
| Email Verification | ✅ | ✅ | ✅ | ⬜ | Backend + Frontend Done |
| Product Listing | ✅ | ✅ | ✅ | ✅ | Complete |
| Product Filtering | ✅ | ✅ | ✅ | ✅ | Complete |
| Product Detail | ✅ | ✅ | ✅ | ✅ | Complete |
| Product Search | ✅ | ✅ | ✅ | ✅ | Complete |
| Shopping Cart | ✅ | ✅ | ✅ | ✅ | Complete |
| Checkout Flow | ✅ | ✅ | ✅ | ✅ | Complete |
| Stripe Payments | ✅ | ✅ | ✅ | ✅ | Complete |
| Order Management | ✅ | ✅ | ✅ | ✅ | Complete |
| Invoice PDF | ✅ | ✅ | ✅ | ⬜ | API Complete |
| Favorites | ✅ | ✅ | ✅ | ✅ | Complete |
| Loyalty Program | ✅ | ✅ | ✅ | ✅ | Complete |
| Promo Codes | ✅ | ✅ | ✅ | ✅ | Complete |
| Admin Dashboard | ✅ | ✅ | ✅ | ✅ | Complete |
| Admin Products | ✅ | ✅ | ✅ | ✅ | Complete |
| Admin Categories | ✅ | ✅ | ✅ | ✅ | Complete |
| Admin Brands | ✅ | ✅ | ✅ | ✅ | Complete |
| Admin Orders | ✅ | ✅ | ✅ | ✅ | Complete |
| Admin Customers | ✅ | ✅ | ✅ | ✅ | Complete |
| Banners CMS | ✅ | ✅ | ✅ | ✅ | Complete |
| Landing Pages | ✅ | ✅ | ✅ | ⬜ | Frontend In Progress |
| Blog | ✅ | ✅ | ⬜ | ⬜ | Backend Complete |
| Navigation Menus | ✅ | ✅ | ✅ | ⬜ | Functional |
| Collections | ✅ | ✅ | ⬜ | ⬜ | Backend Complete |
| Reports | ✅ | ✅ | ✅ | ⬜ | Functional |
| Media Upload | ✅ | ✅ | ✅ | ✅ | Complete |
| VAT Config | ✅ | ✅ | ✅ | ✅ | Complete |
| Stripe Config | ✅ | ✅ | ✅ | ✅ | Complete |

**Legend**: ✅ Complete | ⬜ Pending

---

## 6. User Stories Summary

### 6.1 Customer Stories

| ID | Story | Priority |
|----|-------|----------|
| US-01 | As a visitor, I want to browse products by category so I can find what I need | Must |
| US-02 | As a visitor, I want to search for products so I can find specific items quickly | Must |
| US-03 | As a visitor, I want to view product details with images and specs so I can make informed decisions | Must |
| US-04 | As a customer, I want to register an account so I can save my preferences | Must |
| US-05 | As a customer, I want to add items to cart and check out so I can purchase products | Must |
| US-06 | As a customer, I want to pay securely with my credit card so my payment info is safe | Must |
| US-07 | As a customer, I want to save my favorite products so I can buy them later | Must |
| US-08 | As a customer, I want to view my order history so I can track my purchases | Must |
| US-09 | As a customer, I want to manage my addresses so checkout is faster | Must |
| US-10 | As a customer, I want to earn loyalty points so I get rewarded for purchasing | Should |
| US-11 | As a customer, I want to use promo codes so I can get discounts | Should |
| US-12 | As a customer, I want to download invoices so I have records of my purchases | Should |

### 6.2 Admin Stories

| ID | Story | Priority |
|----|-------|----------|
| US-20 | As an admin, I want a dashboard showing key metrics so I can monitor business health | Must |
| US-21 | As an admin, I want to manage products so I can keep the catalog current | Must |
| US-22 | As an admin, I want to manage orders and update statuses so customers know their order progress | Must |
| US-23 | As an admin, I want to manage customers so I can provide support | Must |
| US-24 | As an admin, I want to create promo codes so I can run promotions | Should |
| US-25 | As an admin, I want to manage homepage banners so I can promote products | Must |
| US-26 | As an admin, I want to view reports so I can make data-driven decisions | Must |
| US-27 | As an admin, I want to configure payment settings so I can manage Stripe | Must |
| US-28 | As an admin, I want to upload product images efficiently so the catalog looks professional | Must |

---

## 7. Data Requirements

### 7.1 Product Data

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Name | String | Yes | Product display name (max 500 chars) |
| Slug | String | Yes | URL-friendly identifier |
| Description | Text | No | Full product description |
| Short Description | Text | No | Summary for listing cards |
| Brand | Reference | Yes | FK to Brand |
| Category | Reference | Yes | FK to Category |
| Subcategory | Reference | No | FK to Subcategory |
| Selling Price | Decimal | Yes | Current price in AED |
| Original Price | Decimal | No | Before-discount price |
| Cost Price | Decimal | No | Internal cost (admin only) |
| Currency | String | Yes | Default: AED |
| VAT Rate | Decimal | Yes | Default: 5% |
| Images | Array | Yes | 1+ product images with display order |
| Specifications | Array | No | Key-value specification pairs |
| Dimensions | Object | No | Width, height, depth, unit |
| Is Active | Boolean | Yes | Show in store |
| Is Featured | Boolean | No | Show in featured section |
| Is Best Seller | Boolean | No | Show in best sellers |
| Is New | Boolean | No | Show in new arrivals |
| Designer | Reference | No | FK to Designer |
| Country | Reference | No | FK to Country of origin |

### 7.2 Order Data

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| Order Number | String | Yes | Auto-generated: "SO-{timestamp}{random}" |
| Customer | Reference | Yes | FK to User |
| Status | Enum | Yes | PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED |
| Items | Array | Yes | Snapshot of ordered products |
| Subtotal | Decimal | Yes | Sum of item totals |
| Discount | Decimal | No | Applied promo discount |
| VAT Amount | Decimal | Yes | Calculated VAT |
| Shipping Amount | Decimal | No | Delivery charges |
| Total | Decimal | Yes | Final payable amount |
| Payment Intent | String | No | Stripe payment reference |
| Shipping Address | JSON | Yes | Address snapshot (immutable) |
| Billing Address | JSON | Yes | Address snapshot (immutable) |
| Promo Code | Reference | No | FK to PromoCode if applied |
| Loyalty Earned | Integer | No | Points awarded for this order |
| Loyalty Redeemed | Integer | No | Points used on this order |

---

## 8. Constraints & Assumptions

### 8.1 Constraints

| # | Constraint |
|---|-----------|
| C-1 | Single-tenant: one Solo store per deployment |
| C-2 | AED currency only (no multi-currency) |
| C-3 | English language only (current release) |
| C-4 | Maximum file upload size: 5 MB |
| C-5 | Stripe is the only payment gateway supported |
| C-6 | PostgreSQL 14+ required |
| C-7 | Node.js 18+ required for backend |
| C-8 | Flutter 3.38+ required for frontend builds |

### 8.2 Assumptions

| # | Assumption |
|---|-----------|
| A-1 | Products are physical goods with basic shipping (no digital downloads) |
| A-2 | Single warehouse fulfillment model |
| A-3 | Admin users are trusted internal staff (no audit for admin actions beyond orders) |
| A-4 | Email delivery is critical for password reset and order confirmation |
| A-5 | Product catalog is manually maintained by admin (no automated supplier feeds) |
| A-6 | Internet connectivity is required for all operations (no offline mode) |

---

## 9. Acceptance Criteria (Key Flows)

### 9.1 Customer Registration
- **Given** a visitor on the signup page
- **When** they enter valid email, password, first name, last name
- **Then** an account is created, verification email is sent, and they are redirected to verification prompt

### 9.2 Product Purchase
- **Given** a logged-in customer with items in cart
- **When** they complete checkout with valid shipping address and Stripe payment
- **Then** an order is created, cart is cleared, loyalty points are awarded, and confirmation email is sent

### 9.3 Admin Order Management
- **Given** an admin viewing order with status "CONFIRMED"
- **When** they update status to "SHIPPED" with tracking number
- **Then** order status is updated, status history entry is created, and customer can view new status

### 9.4 Promo Code Application
- **Given** a customer with a cart subtotal of AED 500
- **When** they apply a valid promo code for 10% off (min order AED 200)
- **Then** AED 50 discount is applied, new total reflects reduction

---

## 10. Release Plan

### Phase 1 — MVP (Current Release) ✅
- Full product catalog with search and filtering
- User registration, login, account management
- Shopping cart + checkout + Stripe payments
- Admin dashboard + product/order/customer management
- Banner CMS + homepage configuration
- Promo codes + loyalty program (basic)
- Reports dashboard

### Phase 2 — Enhancements (Planned)
- Product reviews and ratings
- Arabic language support (RTL)
- Advanced search (filters UI, faceted search)
- Customer email marketing integration
- Blog frontend display
- Curated collections frontend
- Stock management alerts
- Shipping integration (Aramex / Emirates Post)

### Phase 3 — Scale (Future)
- Mobile native shell (Flutter → Android/iOS)
- AI-powered product recommendations
- Multi-warehouse support
- Accounting software integration
- Advanced analytics (conversion funnels, cohort analysis)
- A/B testing framework for CMS content

---

*End of Project Scope, Features & Requirements Document*
