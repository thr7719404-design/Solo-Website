# Backend (NestJS + PostgreSQL + Prisma)

Production-grade REST API for Solo Ecommerce platform.

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Setup

```bash
cp .env.example .env
```

Configure the following in `.env`:

```
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/solo_ecommerce?schema=public"

# JWT
JWT_ACCESS_SECRET="your-access-token-secret-change-in-production"
JWT_REFRESH_SECRET="your-refresh-token-secret-change-in-production"
JWT_ACCESS_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# Server
PORT=3000
NODE_ENV="development"

# Frontend URL (for CORS)
FRONTEND_URL="http://localhost:5000"

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Payment (Stripe example)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT=2525
SMTP_USER="your-smtp-user"
SMTP_PASS="your-smtp-password"
EMAIL_FROM="noreply@solo-ecommerce.com"
```

### Database Setup

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed database (optional)
npm run seed
```

### Running the Application

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

## 📁 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma       # Database schema
│   ├── migrations/         # Migration history
│   └── seed.ts            # Database seeding
├── src/
│   ├── auth/              # Authentication module
│   ├── users/             # Users management
│   ├── products/          # Products catalog
│   ├── categories/        # Categories & departments
│   ├── brands/            # Brands management
│   ├── packages/          # Product bundles
│   ├── cart/              # Shopping cart
│   ├── orders/            # Order management
│   ├── promos/            # Promo codes
│   ├── content/           # CMS (banners, blocks)
│   ├── analytics/         # Analytics & tracking
│   ├── admin/             # Admin-specific modules
│   ├── common/            # Shared utilities
│   │   ├── guards/        # Auth guards
│   │   ├── decorators/    # Custom decorators
│   │   ├── filters/       # Exception filters
│   │   ├── interceptors/  # Interceptors
│   │   └── pipes/         # Validation pipes
│   ├── config/            # Configuration
│   ├── app.module.ts      # Root module
│   └── main.ts            # Entry point
├── test/                  # E2E tests
├── .env.example           # Environment template
├── .eslintrc.js          # ESLint config
├── .prettierrc           # Prettier config
├── tsconfig.json         # TypeScript config
├── package.json
└── README.md
```

## 🔒 Security

See [SECURITY.md](../SECURITY.md) for detailed security guidelines.

Key security features:
- JWT authentication with access + refresh tokens
- Argon2id password hashing
- Rate limiting on sensitive endpoints
- RBAC with NestJS guards
- Input validation with class-validator
- HTTPS enforcement
- Security headers (helmet)
- CORS configuration
- SQL injection prevention (Prisma parameterized queries)

## 🛠️ API Documentation

### Authentication

```
POST /auth/register      - Register new user
POST /auth/login         - Login and get tokens
POST /auth/refresh       - Refresh access token
POST /auth/logout        - Logout and invalidate refresh token
POST /auth/forgot-password - Request password reset
POST /auth/reset-password  - Reset password with token
```

### Public API

```
GET  /departments         - List all departments
GET  /categories          - List categories (filter by department)
GET  /brands              - List all brands
GET  /products            - List products (with filters & pagination)
GET  /products/:slug      - Get product details
GET  /packages            - List all packages
GET  /packages/:slug      - Get package details
POST /analytics/events    - Track analytics event
```

### User API (Authenticated)

```
GET  /cart                - Get current user's cart
POST /cart/items          - Add item to cart
PATCH /cart/items/:id     - Update cart item quantity
DELETE /cart/items/:id    - Remove item from cart
POST /promos/apply        - Apply promo code to cart

POST /orders              - Create new order
GET  /orders              - Get user's orders
GET  /orders/:id          - Get order details

GET  /account/profile     - Get user profile
PATCH /account/profile    - Update profile
GET  /account/addresses   - Get saved addresses
POST /account/addresses   - Add new address
PATCH /account/addresses/:id - Update address
DELETE /account/addresses/:id - Delete address
```

### Admin API (Admin Role Required)

```
# Products
GET    /admin/products          - List all products
POST   /admin/products          - Create product
GET    /admin/products/:id      - Get product
PATCH  /admin/products/:id      - Update product
DELETE /admin/products/:id      - Delete product
POST   /admin/products/:id/images - Upload product images

# Categories & Departments
GET    /admin/categories        - List categories
POST   /admin/categories        - Create category
PATCH  /admin/categories/:id    - Update category
DELETE /admin/categories/:id    - Delete category

GET    /admin/departments       - List departments
POST   /admin/departments       - Create department
PATCH  /admin/departments/:id   - Update department

# Brands
GET    /admin/brands            - List brands
POST   /admin/brands            - Create brand
PATCH  /admin/brands/:id        - Update brand
DELETE /admin/brands/:id        - Delete brand

# Packages
GET    /admin/packages          - List packages
POST   /admin/packages          - Create package
PATCH  /admin/packages/:id      - Update package
DELETE /admin/packages/:id      - Delete package

# Orders
GET    /admin/orders            - List all orders
GET    /admin/orders/:id        - Get order details
PATCH  /admin/orders/:id/status - Update order status

# Customers
GET    /admin/customers         - List customers
GET    /admin/customers/:id     - Get customer details

# Promo Codes
GET    /admin/promos            - List promo codes
POST   /admin/promos            - Create promo code
PATCH  /admin/promos/:id        - Update promo code
DELETE /admin/promos/:id        - Delete promo code

# Content
GET    /admin/content-blocks    - List content blocks
POST   /admin/content-blocks    - Create content block
PATCH  /admin/content-blocks/:id - Update content block
DELETE /admin/content-blocks/:id - Delete content block

GET    /admin/banners           - List banners
POST   /admin/banners           - Create banner
PATCH  /admin/banners/:id       - Update banner
DELETE /admin/banners/:id       - Delete banner

# Analytics
GET    /admin/analytics/dashboard    - Dashboard metrics
GET    /admin/analytics/sales        - Sales over time
GET    /admin/analytics/funnel       - Conversion funnel
GET    /admin/analytics/top-products - Top performing products
GET    /admin/analytics/search-terms - Search analytics

# Users
GET    /admin/users             - List users
PATCH  /admin/users/:id/role    - Update user role
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## 📊 Database Management

```bash
# Open Prisma Studio (GUI)
npx prisma studio

# Create new migration
npx prisma migrate dev --name description-of-changes

# Apply migrations in production
npx prisma migrate deploy

# Reset database (development only!)
npx prisma migrate reset
```

## 🔧 Utilities

```bash
# Format code
npm run format

# Lint code
npm run lint

# Type checking
npm run build
```

## 🚀 Deployment

### Build

```bash
npm run build
```

### Environment Variables

Ensure all production environment variables are set:
- Use strong random secrets for JWT keys
- Configure production database URL
- Set NODE_ENV=production
- Configure Stripe production keys
- Set up proper SMTP credentials

### Run Production

```bash
npm run start:prod
```

### Docker (Optional)

```bash
docker build -t solo-backend .
docker run -p 3000:3000 --env-file .env solo-backend
```

## 📈 Monitoring

- Enable application logging
- Set up error tracking (Sentry, etc.)
- Monitor API performance
- Track database query performance
- Set up alerts for failed authentication attempts

## 🤝 Contributing

1. Create feature branch
2. Make changes with tests
3. Run linter and tests
4. Submit pull request

## 📄 License

Proprietary - All rights reserved
