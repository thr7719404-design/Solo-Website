# Solo E-Commerce Platform — High Level Design (HLD)

**Document Version**: 1.0  
**Date**: 17 March 2026  
**Author**: Solo Engineering Team  
**Status**: Final  

---

## 1. Executive Summary

Solo E-Commerce is a premium kitchenware, tableware, and home goods online retail platform built for the UAE market. The platform enables customers to browse, search, and purchase curated products from brands such as Eva Solo, Eva Trio, and PWtbS, with full support for AED currency, VAT compliance (5%), and local delivery logistics.

The system is built as a **three-tier web application**: a Flutter Web frontend, a NestJS REST API backend, and a PostgreSQL relational database layer. It supports two distinct user personas — **Customers** (shopping, account management, loyalty) and **Administrators** (inventory, orders, CMS, analytics).

---

## 2. System Goals & Objectives

| Goal | Description |
|------|-------------|
| **G1 — Online Retail** | Provide a full e-commerce experience: browse → search → cart → checkout → payment → order tracking |
| **G2 — Admin Operations** | Enable business staff to manage products, orders, customers, promotions, and content without developer involvement |
| **G3 — Content Management** | Allow dynamic homepage configuration, banners, landing pages, and blog content via a built-in CMS |
| **G4 — Payment Processing** | Integrate Stripe for secure credit/debit card payments with PCI-DSS compliance |
| **G5 — Loyalty & Retention** | Implement a points-based loyalty program to encourage repeat purchases |
| **G6 — Scalability** | Design for horizontal scaling — stateless backend, managed database, CDN-served frontend |
| **G7 — Security** | Follow OWASP Top 10 guidelines for authentication, authorization, input validation, and data protection |

---

## 3. High-Level System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        INTERNET / CDN                               │
│  (Azure Static Web Apps / S3 + CloudFront)                         │
└──────────────────────────┬──────────────────────────────────────────┘
                           │  HTTPS (443)
                           ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     PRESENTATION TIER                                │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │               Flutter Web Application                       │   │
│   │                                                             │   │
│   │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐ │   │
│   │  │  Screens  │  │ Providers│  │  Widgets │  │ API Service│ │   │
│   │  │  (23+)   │  │  (11)    │  │  (40+)   │  │   Layer    │ │   │
│   │  └──────────┘  └──────────┘  └──────────┘  └─────┬──────┘ │   │
│   │                                                    │        │   │
│   └────────────────────────────────────────────────────┼────────┘   │
│                                                        │            │
└────────────────────────────────────────────────────────┼────────────┘
                                                         │  REST API
                                                         │  (JSON over HTTPS)
                                                         ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      APPLICATION TIER                                │
│                                                                     │
│   ┌─────────────────────────────────────────────────────────────┐   │
│   │                NestJS API Server (Port 3000)                │   │
│   │                                                             │   │
│   │  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │   │
│   │  │  Auth   │  │ Products │  │  Orders  │  │   Admin    │  │   │
│   │  │ Module  │  │  Module  │  │  Module  │  │  Module    │  │   │
│   │  └─────────┘  └──────────┘  └──────────┘  └────────────┘  │   │
│   │  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │   │
│   │  │  Cart   │  │  CMS /   │  │  Media   │  │  Stripe    │  │   │
│   │  │ Module  │  │ Content  │  │  Module  │  │  Module    │  │   │
│   │  └─────────┘  └──────────┘  └──────────┘  └────────────┘  │   │
│   │  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │   │
│   │  │ Promos  │  │Favorites │  │  Blog    │  │ Navigation │  │   │
│   │  │ Module  │  │  Module  │  │  Module  │  │  Module    │  │   │
│   │  └─────────┘  └──────────┘  └──────────┘  └────────────┘  │   │
│   │                                                             │   │
│   │  ┌─────────────────────────────────────────────────────┐   │   │
│   │  │  Cross-Cutting: Guards │ Interceptors │ Filters     │   │   │
│   │  │  Helmet │ CORS │ Rate Limiter │ Validation Pipe     │   │   │
│   │  └─────────────────────────────────────────────────────┘   │   │
│   │                                                             │   │
│   └──────────────────────────┬──────────────────────────────────┘   │
│                              │                                      │
└──────────────────────────────┼──────────────────────────────────────┘
                               │  Prisma ORM + Raw SQL
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA TIER                                     │
│                                                                     │
│   ┌──────────────────────────────────────────────────────────────┐  │
│   │               PostgreSQL 14+ (Port 5432/5433)                │  │
│   │                                                              │  │
│   │   ┌───────────────────┐     ┌────────────────────┐          │  │
│   │   │  Application DB   │     │   Inventory DB     │          │  │
│   │   │  (Prisma-managed) │     │  (Direct SQL)      │          │  │
│   │   │                   │     │                    │          │  │
│   │   │  • Users          │     │  • Products (805)  │          │  │
│   │   │  • Orders         │     │  • Categories      │          │  │
│   │   │  • Cart           │     │  • Brands          │          │  │
│   │   │  • Auth Tokens    │     │  • Pricing         │          │  │
│   │   │  • CMS Content    │     │  • Variants        │          │  │
│   │   │  • Loyalty        │     │  • Specifications  │          │  │
│   │   │  • Blog           │     │  • Media Assets    │          │  │
│   │   └───────────────────┘     └────────────────────┘          │  │
│   │                                                              │  │
│   └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│   ┌────────────────────┐     ┌─────────────────────┐               │
│   │   File Storage     │     │   Email (SMTP)      │               │
│   │   /uploads/        │     │   Mailhog / SES     │               │
│   │   (Local / Blob)   │     │   Port 1025         │               │
│   └────────────────────┘     └─────────────────────┘               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 4. Key Components

### 4.1 Presentation Tier — Flutter Web Application

| Aspect | Detail |
|--------|--------|
| **Framework** | Flutter 3.38+ / Dart 3.10+ |
| **Rendering** | Material Design 3, responsive breakpoints |
| **State Management** | Provider pattern (11 providers) |
| **Routing** | Named route navigation with guards |
| **API Communication** | Custom ApiClient with JWT interceptor, token refresh |
| **Build Output** | Static HTML/JS/CSS bundle served via CDN or static host |

### 4.2 Application Tier — NestJS REST API

| Aspect | Detail |
|--------|--------|
| **Framework** | NestJS 10.3 / Node.js 18+ / TypeScript 5.3+ |
| **API Style** | RESTful JSON, `/api` prefix, versioned by convention |
| **Modules** | 21+ domain modules, each self-contained |
| **Security** | Helmet, CORS, Throttler (1000 req/min), DTO validation |
| **Auth** | JWT (access 15m + refresh 7d), Argon2id password hashing |
| **Payments** | Stripe SDK (Payment Intents API) |
| **File Handling** | Multer for uploads, local storage with CDN path resolution |
| **Total Endpoints** | 170+ REST endpoints |

### 4.3 Data Tier — PostgreSQL Database

| Aspect | Detail |
|--------|--------|
| **Engine** | PostgreSQL 14+ |
| **ORM** | Prisma 5.22 for application models, raw SQL for inventory |
| **Models** | 35+ tables across dual-database architecture |
| **Products** | 805 products, 3 categories, 4 brands |
| **Migrations** | Prisma Migrate for schema evolution |
| **Backups** | Automated via cloud provider (Azure/AWS) |

---

## 5. User Personas & Roles

| Role | Access Level | Capabilities |
|------|-------------|--------------|
| **Anonymous Visitor** | Public endpoints only | Browse products, view categories, read blog, search |
| **Registered Customer** | Authenticated (JWT) | Add to cart, checkout, manage account, favorites, loyalty, order history |
| **Admin** | ADMIN role required | Manage products, orders, customers, banners, promotions, reports |
| **Super Admin** | SUPER_ADMIN role | All Admin + system settings, VAT config, Stripe config |

---

## 6. Core Business Flows

### 6.1 Customer Purchase Flow

```
Browse/Search → View Product → Add to Cart → Review Cart
     │                │              │              │
     ▼                ▼              ▼              ▼
  Products API    Product Detail   Cart API     Cart Screen
                   (images,                    (quantities,
                    pricing,                    promo code)
                    variants)                       │
                                                    ▼
                                              Checkout Flow
                                         ┌──────────────────┐
                                         │ 1. Shipping Addr  │
                                         │ 2. Billing Addr   │
                                         │ 3. Payment (Stripe)│
                                         │ 4. Order Summary   │
                                         │ 5. Confirm & Pay   │
                                         └────────┬───────────┘
                                                   │
                                                   ▼
                                             Order Created
                                         ┌──────────────────┐
                                         │ • Order number    │
                                         │ • Status tracking │
                                         │ • Invoice PDF     │
                                         │ • Loyalty points  │
                                         │ • Email confirm   │
                                         └──────────────────┘
```

### 6.2 Admin Operations Flow

```
Admin Login → Dashboard (KPIs) → Choose Module
     │
     ├── Products   → CRUD + Image Upload + Pricing + Variants
     ├── Orders     → Status Updates + Tracking + Invoices
     ├── Customers  → View + Edit + Loyalty Adjustments
     ├── Banners    → Create + Position + Schedule
     ├── Promos     → Create + Configure Discounts
     ├── Reports    → Revenue + Orders + Products + Customers + VAT
     └── Settings   → Stripe Config + VAT Config
```

---

## 7. Integration Points

| Integration | Purpose | Protocol |
|-------------|---------|----------|
| **Stripe** | Payment processing (card payments) | HTTPS REST API |
| **SMTP (Mailhog/SES)** | Transactional emails (order confirm, password reset) | SMTP (Port 1025 dev / 587 prod) |
| **File Storage** | Product images, banners, media assets | Local filesystem / Azure Blob / S3 |
| **CDN** | Static frontend delivery, image caching | HTTPS (Azure CDN / CloudFront) |

---

## 8. Non-Functional Requirements

| Requirement | Target |
|-------------|--------|
| **Availability** | 99.9% uptime SLA |
| **Response Time** | API p95 < 500ms |
| **Concurrent Users** | 100+ simultaneous sessions |
| **Data Retention** | Orders retained indefinitely; logs retained 90 days |
| **Security** | OWASP Top 10 compliance, PCI-DSS via Stripe |
| **Scalability** | Horizontal scaling via stateless API + managed DB |
| **Accessibility** | WCAG 2.1 AA target |
| **Browser Support** | Chrome, Safari, Firefox, Edge (latest 2 versions) |

---

## 9. Deployment Topology

### Development Environment

```
Developer Machine
├── Flutter DevTools      → localhost:52391
├── NestJS Dev Server     → localhost:3000
├── PostgreSQL            → localhost:5432/5433
├── Mailhog SMTP          → localhost:1025
└── Mailhog Web UI        → localhost:8025
```

### Production Environment (Cloud)

```
┌─── CDN (Azure CDN / CloudFront) ───┐
│   Flutter Web Build (static)        │
└────────────┬────────────────────────┘
             │ HTTPS
┌────────────▼────────────────────────┐
│   API Server (App Service / EC2)    │
│   NestJS + Node.js 18               │
│   Environment variables via vault   │
└────────────┬────────────────────────┘
             │ TLS
┌────────────▼────────────────────────┐
│   Managed PostgreSQL                │
│   Automated backups                 │
│   Point-in-time recovery            │
└─────────────────────────────────────┘
```

---

## 10. Technology Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend Framework | Flutter Web | 3.38+ |
| Frontend Language | Dart | 3.10+ |
| State Management | Provider | 6.1+ |
| Backend Framework | NestJS | 10.3 |
| Backend Language | TypeScript | 5.3+ |
| Runtime | Node.js | 18+ |
| Database | PostgreSQL | 14+ |
| ORM | Prisma | 5.22 |
| Authentication | JWT + Argon2id | — |
| Payments | Stripe SDK | Latest |
| Email | Nodemailer + SMTP | — |
| File Upload | Multer | — |
| API Security | Helmet, Throttler, CORS | — |
| Containerization | Docker Compose | — |
| Design System | Material Design 3 | — |

---

## 11. Data Volume Estimates

| Entity | Current Count | Growth Projection (1 Year) |
|--------|--------------|---------------------------|
| Products | 805 | 1,500–2,000 |
| Categories | 3 | 8–12 |
| Brands | 4 | 8–15 |
| Registered Users | ~50 | 500–2,000 |
| Orders/Month | ~10 | 200–500 |
| Media Assets | ~2,000 | 5,000–10,000 |
| Blog Posts | ~20 | 100–200 |

---

## 12. Risk & Mitigation

| Risk | Impact | Mitigation |
|------|--------|------------|
| Single server failure | Service downtime | Cloud-managed auto-restart, health checks |
| Database corruption | Data loss | Automated daily backups, point-in-time recovery |
| Payment breach | Financial/legal liability | Stripe handles card data (PCI-DSS), no card storage |
| DDoS attack | Service unavailable | Cloud WAF + DDoS protection + rate limiting |
| Token theft | Account compromise | Short-lived JWTs (15m), refresh token rotation |

---

*End of High Level Design Document*
