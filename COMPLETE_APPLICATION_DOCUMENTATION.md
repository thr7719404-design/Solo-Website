# Complete Application Documentation
## Solo E-Commerce Platform

**Version:** 1.0.0  
**Last Updated:** December 27, 2025  
**Application Type:** Full-Stack E-Commerce Web Application

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Overview](#architecture-overview)
4. [Application Links & URLs](#application-links--urls)
5. [Quick Start Guide](#quick-start-guide)
6. [Documentation Index](#documentation-index)

---

## Project Overview

**Solo** is a modern, full-stack e-commerce platform specializing in premium kitchenware, tableware, and home goods. The application features a Flutter-based web frontend with a NestJS backend API, integrated with PostgreSQL databases for both application data and inventory management.

### Key Features

- **Product Catalog**: Browse 805+ premium products across 3 main categories
- **User Authentication**: Secure JWT-based authentication with role-based access
- **Shopping Cart**: Real-time cart management with persistent storage
- **Order Management**: Complete order lifecycle from placement to fulfillment
- **Inventory System**: Comprehensive inventory tracking with master data management
- **Responsive Design**: Modern, mobile-first UI with elegant design language
- **Search & Filtering**: Advanced product search and category filtering
- **User Accounts**: Personal account management with order history
- **Favorites/Wishlist**: Save products for later purchase
- **Loyalty Program**: Customer rewards and benefits system
- **Bulk Orders**: Special handling for wholesale/business customers

### Business Domain

**Primary Categories:**
1. **Tea & Coffee** (252 products)
   - Teapots, coffee makers, brewing accessories
   
2. **Table** (288 products)
   - Dinnerware, serving pieces, utensils
   
3. **Glass & Stemware** (265 products)
   - Glassware, wine glasses, tumblers

**Brands Available:**
- Eva Solo (554 products)
- Eva Trio (231 products)
- PWtbS (18 products)
- Eva (1 product)

---

## Technology Stack

### Frontend
- **Framework**: Flutter 3.38.4 (Web)
- **Language**: Dart
- **State Management**: Provider pattern
- **UI Components**: Material Design 3
- **Fonts**: Google Fonts (Work Sans)
- **Icons**: Flutter Icons + SVG support
- **Build Tool**: Flutter Web Compiler
- **Server**: Python HTTP Server (Development)

### Backend
- **Framework**: NestJS (Node.js/TypeScript)
- **Language**: TypeScript
- **Runtime**: Node.js
- **API Architecture**: RESTful API
- **Authentication**: JWT (Access + Refresh Tokens)
- **ORM**: Prisma
- **Validation**: class-validator, class-transformer
- **Security**: 
  - Helmet.js (HTTP headers)
  - CORS enabled
  - Rate limiting (Throttler)
  - bcrypt password hashing
  - Input sanitization

### Databases
1. **Application Database** (Prisma)
   - **Type**: PostgreSQL
   - **Purpose**: Users, auth, orders, cart
   - **Port**: 5432 (default)
   
2. **Inventory Database** (Direct SQL)
   - **Type**: PostgreSQL
   - **Name**: inventory_db
   - **Purpose**: Product catalog, pricing, inventory
   - **Port**: 5432
   - **Records**: 805 products + master data

### Development Tools
- **Version Control**: Git
- **Package Managers**: 
  - npm/yarn (Backend)
  - pub (Flutter)
- **Database Tools**: psql CLI, pgAdmin compatible
- **Automation**: PowerShell scripts
- **API Testing**: Postman/Thunder Client compatible

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     PRESENTATION LAYER                       │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │         Flutter Web Application                     │     │
│  │  (Dart 3.x, Material Design 3)                     │     │
│  │                                                     │     │
│  │  • Home Screen         • Product Detail            │     │
│  │  • Category Screens    • Cart Screen               │     │
│  │  • Search              • Checkout                  │     │
│  │  • My Account          • Orders History            │     │
│  │  • Favorites           • Loyalty Program           │     │
│  │                                                     │     │
│  │  Served: http://localhost:5000                     │     │
│  └────────────────────────────────────────────────────┘     │
│                           │                                   │
└───────────────────────────┼───────────────────────────────────┘
                            │ HTTP/REST
                            │ JSON
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                         │
│                                                               │
│  ┌────────────────────────────────────────────────────┐     │
│  │            NestJS Backend API                       │     │
│  │  (Node.js, TypeScript, Express)                    │     │
│  │                                                     │     │
│  │  Modules:                                          │     │
│  │  • AuthModule       • ProductsModule               │     │
│  │  • UsersModule      • CategoriesModule             │     │
│  │  • CartModule       • OrdersModule                 │     │
│  │  • BrandsModule     • DepartmentsModule            │     │
│  │  • PackagesModule   • PromosModule                 │     │
│  │  • ContentModule    • AnalyticsModule              │     │
│  │  • AdminModule      • PrismaModule                 │     │
│  │                                                     │     │
│  │  Port: 3000                                         │     │
│  └────────────────────────────────────────────────────┘     │
│                           │                                   │
└───────────────────────────┼───────────────────────────────────┘
                            │ SQL/Prisma
                            │ PostgreSQL Protocol
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       DATA LAYER                              │
│                                                               │
│  ┌─────────────────────┐      ┌──────────────────────┐      │
│  │  Application DB     │      │   Inventory DB       │      │
│  │  (Prisma Schema)    │      │   (inventory_db)     │      │
│  │                     │      │                      │      │
│  │  • users            │      │  • products          │      │
│  │  • refresh_tokens   │      │  • categories        │      │
│  │  • addresses        │      │  • brands            │      │
│  │  • carts            │      │  • designers         │      │
│  │  • cart_items       │      │  • countries         │      │
│  │  • orders           │      │  • product_pricing   │      │
│  │  • order_items      │      │  • product_dimensions│      │
│  │  • products         │      │  • product_packaging │      │
│  │  • categories       │      │  • product_images    │      │
│  │  • departments      │      │  • inventory_trans   │      │
│  │  • brands           │      │                      │      │
│  │  • packages         │      │  805 Products        │      │
│  │  • promos           │      │  10 Countries        │      │
│  │  • analytics        │      │  4 Brands            │      │
│  │                     │      │  6 Designers         │      │
│  │  PostgreSQL:5432    │      │  PostgreSQL:5432     │      │
│  └─────────────────────┘      └──────────────────────┘      │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **User Request**: Browser → Flutter Web App
2. **State Management**: Provider updates local state
3. **API Call**: HTTP request to NestJS backend
4. **Authentication**: JWT validation in guards
5. **Business Logic**: Service layer processes request
6. **Data Access**: Prisma queries PostgreSQL
7. **Response**: JSON data returned through layers
8. **UI Update**: Flutter rebuilds affected widgets

---

## Application Links & URLs

### Development Environment

| Service | URL | Port | Status |
|---------|-----|------|--------|
| **Frontend** | http://localhost:5000 | 5000 | Active |
| **Backend API** | http://localhost:3000 | 3000 | Active |
| **PostgreSQL** | localhost | 5432 | Active |
| **API Docs** | http://localhost:3000/api | 3000 | Planned |

### Database Connections

```bash
# Application Database
postgresql://postgres:postgres@localhost:5432/postgres

# Inventory Database
postgresql://postgres:postgres@localhost:5432/inventory_db
```

### Key Endpoints

**Authentication:**
- POST `/auth/register` - Register new user
- POST `/auth/login` - User login
- POST `/auth/refresh` - Refresh access token
- POST `/auth/logout` - User logout
- GET `/auth/me` - Get current user

**Products:**
- GET `/products` - List all products (with filters)
- GET `/products/:id` - Get product details
- GET `/products/featured` - Featured products
- GET `/products/best-sellers` - Best selling products
- GET `/products/new-arrivals` - New arrivals
- GET `/products/:id/related` - Related products
- POST `/products` - Create product (Admin)
- PATCH `/products/:id` - Update product (Admin)
- DELETE `/products/:id` - Delete product (Admin)

**Cart:**
- GET `/cart` - Get user's cart
- POST `/cart/items` - Add item to cart
- PATCH `/cart/items/:id` - Update cart item
- DELETE `/cart/items/:id` - Remove cart item
- DELETE `/cart` - Clear cart

**Orders:**
- POST `/orders` - Create new order
- GET `/orders` - Get user's orders
- GET `/orders/:id` - Get order details
- PATCH `/orders/:id/status` - Update order status (Admin)

**Categories:**
- GET `/categories` - List categories
- GET `/categories/:id/products` - Products by category

**Users:**
- GET `/users/profile` - Get user profile
- PATCH `/users/profile` - Update profile
- GET `/users/orders` - User order history
- GET `/users/addresses` - User addresses
- POST `/users/addresses` - Add address

---

## Quick Start Guide

### Prerequisites
```bash
# Check installations
node --version    # v18+ required
npm --version     # v9+ required
flutter --version # 3.38+ required
psql --version    # PostgreSQL 14+
```

### 1. Start Backend
```powershell
cd backend
npm install
npm run start:dev
# Backend runs on http://localhost:3000
```

### 2. Start Frontend
```powershell
cd frontend
flutter build web --release
cd build\web
python -m http.server 5000
# Frontend runs on http://localhost:5000
```

### 3. Database Setup
```powershell
cd backend
# Application database (Prisma)
npx prisma migrate dev
npx prisma generate

# Inventory database (already set up)
# Connection: inventory_db on localhost:5432
```

### 4. Access Application
- Open browser: http://localhost:5000
- Test API: http://localhost:3000

---

## Documentation Index

This documentation suite includes the following detailed documents:

### 📱 **Frontend Documentation**
- **FRONTEND_ARCHITECTURE.md** - Flutter structure, screens, widgets, state management
- **DESIGN_SYSTEM.md** - UI/UX, colors, typography, components, design patterns
- **SITEMAP_USER_FLOW.md** - Navigation structure, user journeys, screen flows

### 🔧 **Backend Documentation**
- **BACKEND_API.md** - Complete API reference, endpoints, request/response formats
- **DATABASE_SCHEMA.md** - Database structure, tables, relationships, queries

### 🎯 **Additional Resources**
- **FEATURES_FUNCTIONALITY.md** - Detailed feature descriptions and implementations
- **CODE_EXAMPLES.md** - Key code snippets and implementation patterns
- **DEPLOYMENT_GUIDE.md** - Production deployment instructions

### 📚 **Existing Documentation**
- `DATABASE_README.md` - Inventory database comprehensive guide
- `DATABASE_DIAGRAM.md` - Visual ERD diagrams
- `QUICKSTART_DATABASE.md` - Quick database reference
- `SECURITY.md` - Security implementation and best practices

---

## System Requirements

### Development
- **OS**: Windows 10/11, macOS, Linux
- **RAM**: 8GB minimum, 16GB recommended
- **Disk**: 5GB free space
- **CPU**: Multi-core processor recommended

### Browser Support (Frontend)
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Network Requirements
- Internet connection for package downloads
- Ports 3000, 5000, 5432 available

---

## Project Structure

```
Test-website/
├── frontend/                    # Flutter Web Application
│   ├── lib/
│   │   ├── main.dart           # App entry point
│   │   ├── app.dart            # Root app widget
│   │   ├── screens/            # All screen widgets
│   │   ├── widgets/            # Reusable UI components
│   │   ├── models/             # Data models
│   │   ├── providers/          # State management
│   │   ├── theme/              # App theming
│   │   ├── data/               # Mock data
│   │   └── services/           # API services (planned)
│   ├── assets/                 # Images, fonts, SVGs
│   ├── build/web/              # Compiled web output
│   └── pubspec.yaml            # Flutter dependencies
│
├── backend/                     # NestJS Backend API
│   ├── src/
│   │   ├── main.ts             # API entry point
│   │   ├── app.module.ts       # Root module
│   │   ├── auth/               # Authentication module
│   │   ├── users/              # Users module
│   │   ├── products/           # Products module
│   │   ├── cart/               # Cart module
│   │   ├── orders/             # Orders module
│   │   ├── categories/         # Categories module
│   │   ├── brands/             # Brands module
│   │   ├── departments/        # Departments module
│   │   ├── packages/           # Packages module
│   │   ├── promos/             # Promotions module
│   │   ├── content/            # Content module
│   │   ├── analytics/          # Analytics module
│   │   ├── admin/              # Admin module
│   │   ├── prisma/             # Prisma service
│   │   └── common/             # Shared utilities
│   ├── prisma/
│   │   ├── schema.prisma       # Database schema
│   │   └── migrations/         # Database migrations
│   ├── database_schema.sql     # Inventory DB schema
│   ├── import_excel_to_db.py   # Data import script
│   ├── package.json            # Node dependencies
│   └── tsconfig.json           # TypeScript config
│
├── start-both.ps1              # Start both servers
├── start-dev.ps1               # Development startup
└── Documentation Files         # This and related docs
```

---

## Contact & Support

**Project Location:** `C:\Users\thr49\Test-website`

**Key Files:**
- Frontend: `frontend/lib/main.dart`
- Backend: `backend/src/main.ts`
- Database Schema: `backend/database_schema.sql`
- Prisma Schema: `backend/prisma/schema.prisma`

---

## Next Steps

1. **Read Frontend Architecture** - Understand screens, widgets, and navigation
2. **Review API Documentation** - Explore available endpoints and data formats
3. **Study Database Schema** - Learn data models and relationships
4. **Explore Design System** - Understand UI/UX patterns and components
5. **Follow User Flows** - See how users navigate the application

---

**Document:** COMPLETE_APPLICATION_DOCUMENTATION.md  
**Generated:** December 27, 2025  
**Framework Versions:** Flutter 3.38.4, NestJS 10.x, PostgreSQL 14+
