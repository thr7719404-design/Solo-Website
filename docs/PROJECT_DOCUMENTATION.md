# Solo E-Commerce Platform - Complete Project Documentation

## Table of Contents
1. [Project Overview](#1-project-overview)
2. [Technology Stack](#2-technology-stack)
3. [Architecture Overview](#3-architecture-overview)
4. [Database Schema & ER Diagram](#4-database-schema--er-diagram)
5. [Backend API Documentation](#5-backend-api-documentation)
6. [Frontend Documentation](#6-frontend-documentation)
7. [Features & Functionalities](#7-features--functionalities)
8. [Security Implementation](#8-security-implementation)
9. [Deployment & Configuration](#9-deployment--configuration)

---

## 1. Project Overview

### 1.1 Description
Solo is a full-featured B2C e-commerce platform designed for a premium home and lifestyle products retail business. The platform provides a complete online shopping experience with a modern storefront, comprehensive admin dashboard, content management system (CMS), and inventory management.

### 1.2 Scope
- **Customer Portal**: Product browsing, search, cart, checkout, order management, account management
- **Admin Dashboard**: Product management, order management, customer management, CMS, analytics
- **CMS**: Landing pages, banners, blog, navigation menus, homepage configuration
- **Loyalty Program**: Customer rewards system with cashback
- **Multi-Schema Database**: Separation of concerns between public app data and inventory catalog

### 1.3 Repository
- **GitHub**: https://github.com/anydevice1234123-netizen/Solo-Jan-13
- **Current Branch**: main

---

## 2. Technology Stack

### 2.1 Backend
| Technology | Purpose | Version |
|------------|---------|---------|
| **NestJS** | Backend Framework | ^10.x |
| **TypeScript** | Programming Language | ^5.x |
| **Prisma** | ORM (Object-Relational Mapping) | ^5.x |
| **PostgreSQL** | Database | 15+ |
| **JWT** | Authentication | - |
| **Argon2id** | Password Hashing | - |
| **@nestjs/throttler** | Rate Limiting | - |
| **Sharp** | Image Processing | - |
| **PDFKit** | Invoice Generation | - |

### 2.2 Frontend
| Technology | Purpose | Version |
|------------|---------|---------|
| **Flutter** | UI Framework | ^3.x |
| **Dart** | Programming Language | ^3.x |
| **Provider** | State Management | - |
| **HTTP** | API Communication | - |
| **url_launcher** | External Links | - |
| **flutter_svg** | SVG Support | - |

### 2.3 Infrastructure
| Technology | Purpose |
|------------|---------|
| **Node.js** | Runtime Environment |
| **npm/yarn** | Package Management |
| **Local File System** | Media Storage |

---

## 3. Architecture Overview

### 3.1 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER                                │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                  Flutter Web App                          │   │
│  │  ├── Screens (26 screens)                                │   │
│  │  ├── Providers (11 state managers)                       │   │
│  │  ├── Widgets (reusable components)                       │   │
│  │  └── Services (API clients)                              │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/REST
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      API LAYER                                   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                   NestJS Backend                          │   │
│  │  ├── Controllers (route handlers)                        │   │
│  │  ├── Services (business logic)                           │   │
│  │  ├── Guards (authentication/authorization)               │   │
│  │  ├── DTOs (data transfer objects)                        │   │
│  │  └── Modules (feature modules)                           │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Prisma ORM
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      DATA LAYER                                  │
│  ┌──────────────────────┐   ┌──────────────────────┐           │
│  │   public schema      │   │   inventory schema   │           │
│  │  ├── Users          │   │  ├── Products        │           │
│  │  ├── Orders         │   │  ├── Categories      │           │
│  │  ├── Cart           │   │  ├── Brands          │           │
│  │  ├── CMS            │   │  ├── Pricing         │           │
│  │  └── Analytics      │   │  └── Images          │           │
│  └──────────────────────┘   └──────────────────────┘           │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Backend Module Structure

```
backend/src/
├── admin/           # Admin dashboard APIs
├── analytics/       # Analytics tracking
├── auth/            # Authentication & authorization
├── blog/            # Blog management
├── brands/          # Brand management
├── cart/            # Shopping cart
├── catalog/         # Product catalog (inventory integration)
├── categories/      # Category management
├── cms/             # CMS home/category landing pages
├── collections/     # Product collections
├── common/          # Shared utilities, guards, decorators
├── content/         # Banners, landing pages
├── customers/       # Customer management
├── debug/           # Debug utilities
├── departments/     # Department management
├── email/           # Email services
├── media/           # File upload & management
├── navigation/      # Navigation menus
├── orders/          # Order processing & invoices
├── packages/        # Product bundles
├── prisma/          # Prisma service
├── products/        # Product management
├── promos/          # Promo codes
└── users/           # User management
```

### 3.3 Frontend Structure

```
frontend/lib/
├── config/          # App configuration
├── core/            # Core utilities
│   ├── api/         # API clients
│   ├── cache/       # Caching
│   ├── dto/         # Data transfer objects
│   └── events/      # Event bus
├── guards/          # Route guards
├── layouts/         # Layout components
├── models/          # Data models
│   └── dto/         # DTO models
├── providers/       # State management (11 providers)
├── screens/         # UI screens (26 screens)
│   └── admin/       # Admin screens (16 screens)
├── services/        # Business services
├── theme/           # App theming
└── widgets/         # Reusable widgets
    ├── admin/       # Admin widgets
    ├── app_drawer/  # Drawer components
    ├── app_header/  # Header components
    ├── cms/         # CMS widgets
    ├── home/        # Home page widgets
    └── porto/       # Porto-style widgets
```

---

## 4. Database Schema & ER Diagram

### 4.1 Schema Overview
The database uses PostgreSQL with Prisma's multi-schema feature, separating data into two schemas:

1. **`public` schema**: Application data (users, orders, CMS, analytics)
2. **`inventory` schema**: Product catalog data (products, pricing, inventory)

### 4.2 Entity Relationship Diagram (Text Representation)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              PUBLIC SCHEMA                                   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│    User     │────<│   Address    │     │    Cart     │
│─────────────│     └──────────────┘     │─────────────│
│ id          │                          │ id          │
│ email       │─────────────────────────>│ userId      │
│ passwordHash│     ┌──────────────┐     │             │
│ role        │────<│ RefreshToken │     └──────┬──────┘
│ ...         │     └──────────────┘            │
└──────┬──────┘                                 │
       │                                        │
       │            ┌──────────────┐     ┌──────▼──────┐
       │           <│ CartItem     │────<│             │
       │            └──────────────┘     └─────────────┘
       │
       │     ┌───────────────┐     ┌─────────────────┐
       └────>│    Order      │────<│   OrderItem     │
             │───────────────│     └─────────────────┘
             │ id            │
             │ orderNumber   │     ┌─────────────────┐
             │ status        │────<│OrderStatusHistory│
             │ total         │     └─────────────────┘
             │ ...           │
             └───────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Department    │────<│    Category     │────<│   (children)    │
│─────────────────│     │─────────────────│     │   Category      │
│ id              │     │ departmentId    │     │   (self-ref)    │
│ name            │     │ parentId        │     └─────────────────┘
│ slug            │     │ name            │
└─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Banner       │     │  LandingPage    │────<│ LandingSection  │
│─────────────────│────>│─────────────────│     └─────────────────┘
│ id              │     │ slug            │
│ placement       │     │ heroBannerId    │
│ title           │     └─────────────────┘
└─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│NavigationMenu   │────<│NavigationMenuItem│
│─────────────────│     │─────────────────│
│ key             │     │ label           │
│ name            │     │ url             │
└─────────────────┘     └────────┬────────┘
                                 │ (self-ref: children)
                                 ▼

┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  BlogCategory   │────<│    BlogPost     │────<│   BlogPostTag   │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                                                ┌────────▼────────┐
                                                │     BlogTag     │
                                                └─────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                             INVENTORY SCHEMA                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────┐     ┌─────────────────┐
│   InvCategory   │────<│ InvSubcategory  │
└─────────────────┘     └────────┬────────┘
                                 │
┌─────────────────┐              │
│    InvBrand     │──────────────┤
└─────────────────┘              │
                                 │
┌─────────────────┐              │
│   InvDesigner   │──────────────┤
└─────────────────┘              │
                                 ▼
                        ┌─────────────────┐
                        │   InvProduct    │
                        │─────────────────│
                        │ id              │
                        │ sku             │
                        │ productName     │
                        │ categoryId      │
                        │ brandId         │
                        └────────┬────────┘
                                 │
       ┌─────────────────────────┼─────────────────────────┐
       ▼                         ▼                         ▼
┌──────────────┐    ┌───────────────────┐    ┌──────────────────┐
│InvProductDim │    │InvProductPricing  │    │ InvProductImage  │
└──────────────┘    └───────────────────┘    └──────────────────┘
```

### 4.3 Model Count Summary

| Schema | Model Count | Key Models |
|--------|-------------|------------|
| **public** | ~35 models | User, Order, Cart, Category, Brand, Banner, LandingPage, BlogPost, NavigationMenu, PromoCode, AnalyticsEvent |
| **inventory** | ~10 models | InvProduct, InvCategory, InvSubcategory, InvBrand, InvProductPricing, InvProductImage |

### 4.4 Key Relationships

1. **User → Order**: One-to-Many (user can have multiple orders)
2. **User → Cart**: One-to-One (user has one active cart)
3. **User → Address**: One-to-Many (user can have multiple addresses)
4. **User → LoyaltyWallet**: One-to-One (user has one loyalty wallet)
5. **Department → Category**: One-to-Many
6. **Category → Category**: Self-referential (parent-child hierarchy)
7. **InvCategory → InvSubcategory**: One-to-Many
8. **InvProduct → InvProductPricing**: One-to-One
9. **InvProduct → InvProductImage**: One-to-Many
10. **Order → OrderItem**: One-to-Many
11. **LandingPage → LandingSection**: One-to-Many
12. **NavigationMenu → NavigationMenuItem**: One-to-Many (hierarchical)

---

## 5. Backend API Documentation

### 5.1 Authentication APIs (`/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login with email/password | No |
| POST | `/auth/refresh` | Refresh access token | No |
| POST | `/auth/logout` | Logout (revoke refresh token) | Yes |
| GET | `/auth/me` | Get current user profile | Yes |
| POST | `/auth/change-password` | Change password | Yes |
| POST | `/auth/forgot-password` | Request password reset | No |
| POST | `/auth/reset-password` | Reset password with token | No |
| POST | `/auth/verify-email` | Verify email address | No |
| POST | `/auth/resend-verification` | Resend verification email | No |

### 5.2 Products APIs (`/products`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/products` | List all products with filters | No |
| GET | `/products/featured` | Get featured products | No |
| GET | `/products/best-sellers` | Get best-selling products | No |
| GET | `/products/new-arrivals` | Get new arrivals | No |
| GET | `/products/:id/related` | Get related products | No |
| GET | `/products/:slugOrId` | Get single product | No |
| GET | `/products/inventory/categories` | Get inventory categories | No |
| GET | `/products/inventory/brands` | Get inventory brands | No |
| POST | `/products` | Create product override | Admin |
| PATCH | `/products/:id` | Update product override | Admin |
| DELETE | `/products/:id` | Delete product override | Admin |

### 5.3 Categories APIs (`/categories`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/categories` | List all categories | No |
| GET | `/categories/:id` | Get single category | No |
| POST | `/categories` | Create category | Admin |
| PATCH | `/categories/:id` | Update category | Admin |
| DELETE | `/categories/:id` | Delete category | Admin |

### 5.4 Cart APIs (`/cart`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/cart` | Get user's cart | Yes |
| POST | `/cart/items` | Add item to cart | Yes |
| PATCH | `/cart/items/:id` | Update cart item quantity | Yes |
| DELETE | `/cart/items/:id` | Remove item from cart | Yes |
| DELETE | `/cart` | Clear entire cart | Yes |

### 5.5 Orders APIs (`/orders`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/orders` | Create new order | Yes |
| GET | `/orders` | Get user's orders | Yes |
| GET | `/orders/:id` | Get order details | Yes |
| GET | `/orders/:id/invoice/pdf` | Download invoice PDF | Yes |

### 5.6 Content/CMS APIs (`/content`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/content/home` | Get homepage layout | No |
| GET | `/content/banners` | Get active banners | No |
| GET | `/content/pages/:slug` | Get landing page by slug | No |
| GET | `/content/loyalty-config` | Get loyalty page config | No |
| GET | `/content/admin/banners` | List all banners | Admin |
| POST | `/content/admin/banners` | Create banner | Admin |
| PATCH | `/content/admin/banners/:id` | Update banner | Admin |
| DELETE | `/content/admin/banners/:id` | Delete banner | Admin |
| GET | `/content/admin/pages` | List all landing pages | Admin |
| POST | `/content/admin/pages` | Create landing page | Admin |
| PATCH | `/content/admin/pages/:id` | Update landing page | Admin |
| DELETE | `/content/admin/pages/:id` | Delete landing page | Admin |

### 5.7 CMS Home/Category APIs (`/cms`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/cms/home-page` | Get home page CMS | No |
| GET | `/cms/category/:categoryId` | Get category landing | No |
| GET | `/cms/admin/home` | Get home page admin | Admin |
| POST | `/cms/admin/home/sections` | Create home section | Admin |
| PATCH | `/cms/admin/home/sections/:id` | Update home section | Admin |
| DELETE | `/cms/admin/home/sections/:id` | Delete home section | Admin |
| POST | `/cms/admin/home/sections/reorder` | Reorder sections | Admin |

### 5.8 Blog APIs (`/blog`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/blog` | List blog posts | No |
| GET | `/blog/sidebar` | Get sidebar data | No |
| GET | `/blog/recent` | Get recent posts | No |
| GET | `/blog/post/:slug` | Get post by slug | No |
| GET | `/blog/categories` | List categories | No |
| GET | `/blog/tags` | List tags | No |
| GET | `/blog/admin/posts` | Admin list posts | Admin |
| POST | `/blog/admin/posts` | Create post | Admin |
| PATCH | `/blog/admin/posts/:id` | Update post | Admin |
| DELETE | `/blog/admin/posts/:id` | Delete post | Admin |

### 5.9 Navigation APIs (`/navigation`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/navigation/menu/:key` | Get menu by key | No |
| GET | `/navigation/admin/menus` | List all menus | Admin |
| POST | `/navigation/admin/menus` | Create menu | Admin |
| PATCH | `/navigation/admin/menus/:id` | Update menu | Admin |
| DELETE | `/navigation/admin/menus/:id` | Delete menu | Admin |
| POST | `/navigation/admin/items` | Create menu item | Admin |
| PATCH | `/navigation/admin/items/:id` | Update menu item | Admin |
| DELETE | `/navigation/admin/items/:id` | Delete menu item | Admin |

### 5.10 Admin APIs (`/admin`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/admin/stats` | Get dashboard stats | Admin |
| GET | `/admin/orders` | List all orders | Admin |
| GET | `/admin/orders/:id` | Get order details | Admin |
| GET | `/admin/orders/:id/invoice/pdf` | Download invoice | Admin |

### 5.11 Media APIs (`/media`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/media/upload` | Upload single file | Admin |
| POST | `/media/upload-multiple` | Upload multiple files | Admin |
| DELETE | `/media/delete` | Delete file | Admin |

---

## 6. Frontend Documentation

### 6.1 Screen Inventory (26 Screens)

#### Customer-Facing Screens

| Screen | File | Description |
|--------|------|-------------|
| Home | `home_screen.dart` | Main landing page with CMS sections |
| Product List | `product_list_screen.dart` | Product listing with filters |
| Product Detail | `product_detail_screen.dart` | Individual product view |
| Category | `category_screen.dart` | Category browse page |
| Category Landing | `category_landing_screen.dart` | Category CMS page |
| Search | `search_screen.dart` | Product search |
| Cart | `cart_screen.dart` | Shopping cart |
| Checkout | `checkout_screen.dart` | Checkout flow |
| Order Confirmation | `order_confirmation_screen.dart` | Post-order success |
| Favorites | `favorites_screen.dart` | Wishlist |
| Login | `login_screen.dart` | User login |
| Signup | `signup_screen.dart` | User registration |
| Account Shell | `account/account_shell.dart` | Account management |
| About Us | `about_us_screen.dart` | About page |
| Loyalty Program | `loyalty_program_screen.dart` | Rewards program |
| Blog | `blog_screen.dart` | Blog listing |
| Blog Post | `blog_post_screen.dart` | Individual blog post |
| Bulk Order | `bulk_order_screen.dart` | Bulk ordering |

#### Admin Screens (16 Screens)

| Screen | File | Description |
|--------|------|-------------|
| Admin Dashboard | `admin_dashboard_screen.dart` | Dashboard with stats |
| Admin Login | `admin_login_screen.dart` | Admin authentication |
| Products Management | `admin_products_screen.dart` | Product listing |
| Product Form | `admin_product_form_screen.dart` | Create/edit product |
| Categories Management | `admin_categories_screen.dart` | Category listing |
| Category Form | `admin_category_form_screen.dart` | Create/edit category |
| Brands Management | `admin_brands_screen.dart` | Brand listing |
| Departments | `admin_departments_screen.dart` | Department management |
| Orders Management | `admin_orders_screen.dart` | Order listing |
| Order Details | `admin_order_details_screen.dart` | Order view |
| Customers | `admin_customers_screen.dart` | Customer listing |
| Customer Details | `admin_customer_details_screen.dart` | Customer view |
| Banners | `admin_banners_screen.dart` | Banner management |
| Landing Pages | `admin_landing_pages_screen.dart` | CMS pages |
| Section Editor | `section_editor_shell.dart` | Section editing |
| Generic List | `admin_generic_list_screen.dart` | Reusable list |

### 6.2 State Management (Providers)

| Provider | File | Purpose |
|----------|------|---------|
| AuthProvider | `auth_provider.dart` | Authentication state |
| AccountProvider | `account_provider.dart` | User account data |
| CartProvider | `cart_provider.dart` | Shopping cart state |
| CatalogProvider | `catalog_provider.dart` | Categories & brands |
| ContentProvider | `content_provider.dart` | CMS content |
| FavoritesProvider | `favorites_provider.dart` | Wishlist |
| HomeProvider | `home_provider.dart` | Home page sections |
| HomeCmsProvider | `home_cms_provider.dart` | CMS home data |
| ProductDetailsProvider | `product_details_provider.dart` | Product details |
| ProductListProvider | `product_list_provider.dart` | Product listing |
| SearchProvider | `search_provider.dart` | Search functionality |

### 6.3 API Client Architecture

```dart
// Centralized API Service Factory
class Api {
  static ApiClient client;
  
  // API instances
  static ProductsApi products;
  static CategoriesApi categories;
  static BrandsApi brands;
  static DepartmentsApi departments;
  static ContentApi content;
  static MediaApi media;
  static AuthApi auth;
  static AdminApi admin;
}
```

### 6.4 Key Widgets

| Widget | Purpose |
|--------|---------|
| `ModernDrawer` | Navigation drawer |
| `AppHeader` | App header with cart/search |
| `TopBanner` | Promotional banner |
| `HeroBanner` | Hero carousel |
| `ProductCard` | Product display card |
| `PortoProductCard` | Porto-style product card |
| `CmsSectionsBuilder` | Dynamic CMS renderer |
| `LoyaltyProgramBanner` | Loyalty promotion |
| `AdminLayout` | Admin panel layout |

---

## 7. Features & Functionalities

### 7.1 Customer Features

#### Shopping Experience
- **Product Browsing**: Browse by category, brand, or collection
- **Product Search**: Full-text search with filters
- **Product Details**: Images, descriptions, specs, pricing
- **Related Products**: Cross-selling suggestions
- **Wishlist/Favorites**: Save products for later

#### Cart & Checkout
- **Shopping Cart**: Add, update, remove items
- **Quantity Management**: Adjust quantities
- **Cart Persistence**: Synced with server for logged-in users
- **Checkout Flow**: Multi-step checkout
- **Address Management**: Save multiple addresses
- **Payment Methods**: Credit card, COD
- **Promo Codes**: Discount application
- **Loyalty Cash**: Redeem rewards at checkout

#### Account Management
- **Registration/Login**: Email-based authentication
- **Password Management**: Change, reset, forgot
- **Email Verification**: Verify email address
- **Profile Management**: Update personal info
- **Address Book**: Manage addresses
- **Order History**: View past orders
- **Invoice Download**: PDF invoices

#### Loyalty Program
- **Cashback Rewards**: Earn % on purchases
- **Wallet Balance**: View & track rewards
- **Redemption**: Apply at checkout
- **Transaction History**: View earning/spending

### 7.2 Admin Features

#### Dashboard
- **Stats Overview**: Revenue, orders, customers
- **Recent Orders**: Quick order view
- **Real-time Clock**: Current time display
- **Quick Actions**: Common admin tasks

#### Product Management
- **Product Listing**: Paginated product list
- **Search & Filter**: Find products
- **Product Override**: Customize inventory products
- **Featured/New/Best Seller**: Merchandising flags
- **Custom Pricing**: Override inventory prices
- **Image Management**: Upload product images

#### Order Management
- **Order Listing**: All orders with status
- **Order Details**: Full order view
- **Status Updates**: Change order status
- **Invoice Generation**: PDF invoices

#### Customer Management
- **Customer List**: All registered users
- **Customer Details**: Profile & order history
- **Address View**: Customer addresses

#### CMS Management
- **Banners**: Hero, promo, category banners
- **Landing Pages**: Custom page builder
- **Page Sections**: Flexible content blocks
- **Navigation Menus**: Header/footer menus
- **Blog**: Posts, categories, tags

#### Category/Brand Management
- **Categories**: Hierarchical categories
- **Brands**: Brand listing & logos
- **Departments**: Top-level organization

### 7.3 Content Management

#### Banner Types
- `HOME_HERO` - Main hero slider
- `HOME_SECONDARY` - Secondary home banners
- `HOME_MID` - Mid-page promotions
- `CATEGORY_TOP` - Category header
- `PROMOTION` - Promotional banners

#### Landing Page Section Types
- `HERO` / `HERO_SLIDER` - Hero area
- `CATEGORY_TILES` - Category grid
- `PRODUCT_CAROUSEL` - Product slider
- `BRAND_STRIP` - Brand logos
- `PROMO_BANNER` - Promotional
- `PRODUCT_GRID` - Product grid
- `RICH_TEXT` - HTML content
- `TESTIMONIALS` - Reviews
- `NEWSLETTER_BLOCK` - Email signup

---

## 8. Security Implementation

### 8.1 Authentication
- **JWT Tokens**: Access & refresh token pair
- **Token Refresh**: Automatic token renewal
- **Password Hashing**: Argon2id algorithm
- **Email Verification**: Token-based verification

### 8.2 Authorization
- **Role-Based Access**: CUSTOMER, ADMIN, SUPER_ADMIN
- **Route Guards**: JWT validation
- **Role Guards**: Permission checking
- **Admin Routes**: Protected endpoints

### 8.3 Rate Limiting
- **Global Throttling**: 1000 requests/minute
- **Login Throttling**: 5 attempts/15 minutes
- **Registration Throttling**: 3 attempts/hour

### 8.4 Input Validation
- **DTOs**: Class-validator decorators
- **File Upload**: Type & size validation
- **SQL Injection**: Prisma ORM protection
- **XSS Prevention**: Input sanitization

---

## 9. Deployment & Configuration

### 9.1 Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/db?schema=public

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d

# App
PORT=3000
NODE_ENV=development

# Media
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760
```

### 9.2 Running the Application

**Backend:**
```bash
cd backend
npm install
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run start:dev
```

**Frontend:**
```bash
cd frontend
flutter pub get
flutter run -d chrome --web-port=5000
```

### 9.3 Database Migrations
```bash
# Generate migration
npx prisma migrate dev --name migration_name

# Apply migrations
npx prisma migrate deploy

# Seed database
npx prisma db seed
```

### 9.4 Ports
- **Backend API**: http://localhost:3000
- **Frontend Web**: http://localhost:5000

---

## Appendix A: Enum Reference

### User Roles
- `CUSTOMER` - Regular customer
- `ADMIN` - Admin access
- `SUPER_ADMIN` - Full access

### Order Status
- `PENDING` - Order created
- `PAYMENT_PENDING` - Awaiting payment
- `PAID` - Payment received
- `PROCESSING` - Being processed
- `SHIPPED` - In transit
- `DELIVERED` - Delivered
- `CANCELLED` - Cancelled
- `REFUNDED` - Refunded

### Payment Status
- `PENDING` - Awaiting payment
- `AUTHORIZED` - Payment authorized
- `PAID` - Payment complete
- `FAILED` - Payment failed
- `REFUNDED` - Payment refunded

### Payment Methods
- `CREDIT_CARD` - Card payment
- `CASH_ON_DELIVERY` - COD

### Shipping Methods
- `STANDARD` - Standard delivery
- `EXPRESS` - Express delivery
- `OVERNIGHT` - Next-day delivery
- `PICKUP` - Store pickup

---

## Appendix B: Model Count

| Category | Count |
|----------|-------|
| Backend Modules | 20+ |
| API Endpoints | 80+ |
| Database Models | 45+ |
| Frontend Screens | 26 |
| Frontend Providers | 11 |
| Admin Screens | 16 |

---

*Documentation generated for Solo E-Commerce Platform*
*Last Updated: January 2025*
