# Backend Setup Instructions

## ✅ Completed

1. ✅ Project structure created
2. ✅ package.json with all dependencies
3. ✅ Comprehensive Prisma schema with all models
4. ✅ Security configuration in main.ts
5. ✅ Core modules structure
6. ✅ Prisma service setup

## 🔨 Next Steps to Complete Backend

### 1. Install Dependencies

```powershell
cd backend
npm install
```

### 2. Set up Environment

```powershell
cp .env.example .env
```

Edit `.env` and configure:
- Database connection string
- JWT secrets (use strong random strings in production)
- Stripe keys (get from Stripe dashboard)
- SMTP settings

### 3. Initialize Database

```powershell
# Generate Prisma Client
npx prisma generate

# Create and apply migrations
npx prisma migrate dev --name init

# (Optional) Seed database with sample data
npm run seed
```

### 4. Modules to Implement

The following modules need to be created. I've set up the structure - here's what each needs:

#### A. Auth Module (Priority: HIGH)
Location: `src/auth/`

Files needed:
- `auth.service.ts` - Handle login, register, token refresh
- `auth.controller.ts` - Auth endpoints
- `dto/register.dto.ts` - Registration validation
- `dto/login.dto.ts` - Login validation
- `strategies/jwt.strategy.ts` - JWT validation
- `strategies/local.strategy.ts` - Username/password validation

Key implementations:
- Use Argon2id for password hashing
- Generate JWT access (15min) + refresh tokens (7days)
- Rate limit on login/register endpoints
- Store refresh tokens in database

#### B. Users Module
Location: `src/users/`

Files needed:
- `users.service.ts`
- `users.controller.ts`
- `dto/create-user.dto.ts`
- `dto/update-user.dto.ts`

Features:
- CRUD for users
- Profile management
- Address management
- Password change

#### C. Products Module
Location: `src/products/`

Files needed:
- `products.service.ts`
- `products.controller.ts`
- `dto/create-product.dto.ts`
- `dto/update-product.dto.ts`
- `dto/product-filter.dto.ts`

Features:
- List with pagination, filters, sorting
- Search functionality
- Product detail by slug
- Image upload
- Stock management

#### D. Departments Module
Location: `src/departments/`

Simple CRUD for the 7 fixed departments:
- Accessories
- Tableware
- Kitchenware
- Outdoor
- Furniture
- On-the-Go
- Packages

#### E. Categories Module
Location: `src/categories/`

Features:
- List categories by department
- CRUD operations
- Sort order management

#### F. Brands Module
Location: `src/brands/`

Simple CRUD for brands with logo upload

#### G. Packages Module
Location: `src/packages/`

Features:
- Create bundles with multiple products
- Calculate bundle price
- Manage bundle items

#### H. Cart Module
Location: `src/cart/`

Features:
- Get/create cart for user
- Add/update/remove items
- Support both products and packages
- Calculate totals

#### I. Orders Module
Location: `src/orders/`

Features:
- Create order from cart
- Payment integration (Stripe)
- Order status management
- Order history
- Shipping info

#### J. Promos Module
Location: `src/promos/`

Features:
- Create/manage promo codes
- Validate and apply promos
- Track usage

#### K. Content Module
Location: `src/content/`

Features:
- Manage banners
- Manage content blocks
- Homepage content

#### L. Analytics Module
Location: `src/analytics/`

Features:
- Track events (views, clicks, purchases)
- Search term tracking
- Generate reports

#### M. Admin Module
Location: `src/admin/`

Features:
- Dashboard metrics
- Analytics endpoints
- Admin-only operations
- User role management

### 5. Common Utilities to Create

#### Guards
Location: `src/common/guards/`

- `jwt-auth.guard.ts` - Protect authenticated routes
- `roles.guard.ts` - Check user roles (ADMIN, SUPER_ADMIN)

#### Decorators
Location: `src/common/decorators/`

- `roles.decorator.ts` - `@Roles('admin')` decorator
- `current-user.decorator.ts` - `@CurrentUser()` to get user from request

#### Interceptors
Location: `src/common/interceptors/`

- `logging.interceptor.ts` - Log requests (without sensitive data)
- `transform.interceptor.ts` - Transform responses

### 6. Database Seeding

Create `prisma/seed.ts` to populate:
- 7 departments with proper names and slugs
- Sample categories for each department
- Sample brands
- Admin user account
- Sample products
- Sample banners and content blocks

### 7. Example Implementation Pattern

Here's a template for a typical module:

```typescript
// products.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto, ProductFilterDto } from './dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async findAll(filters: ProductFilterDto) {
    const { page = 1, limit = 20, departmentId, categoryId, minPrice, maxPrice, sort } = filters;
    
    const where = {
      isActive: true,
      ...(departmentId && { departmentId }),
      ...(categoryId && { categoryId }),
      ...(minPrice && { price: { gte: minPrice } }),
      ...(maxPrice && { price: { lte: maxPrice } }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          department: true,
          category: true,
          brand: true,
          images: { orderBy: { sortOrder: 'asc' } },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: this.getSortOrder(sort),
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      data: products,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findBySlug(slug: string) {
    return this.prisma.product.findUnique({
      where: { slug },
      include: {
        department: true,
        category: true,
        brand: true,
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });
  }

  // Additional methods...
}
```

### 8. Security Checklist

- ✅ HTTPS enforcement (helmet configured)
- ✅ Security headers (CSP, HSTS, X-Frame-Options, etc.)
- ✅ Input validation (class-validator on all DTOs)
- ✅ Rate limiting (configured globally)
- ⚠️ Implement JWT authentication
- ⚠️ Implement RBAC with guards
- ⚠️ Use Argon2id for password hashing
- ⚠️ Implement refresh token rotation
- ⚠️ Add logging (without sensitive data)
- ⚠️ SQL injection prevention (Prisma handles this)

### 9. Testing

```powershell
# Run tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

### 10. Running the Application

```powershell
# Development
npm run start:dev

# Production
npm run build
npm run start:prod
```

## 📚 Additional Resources

- NestJS Documentation: https://docs.nestjs.com
- Prisma Documentation: https://www.prisma.io/docs
- OWASP Top 10: https://owasp.org/Top10/
- OWASP ASVS: https://owasp.org/www-project-application-security-verification-standard/

## 🔐 Security Notes

1. Never commit `.env` file
2. Use strong secrets in production (32+ characters, random)
3. Regularly update dependencies
4. Enable audit logging for admin actions
5. Monitor failed authentication attempts
6. Keep Prisma and dependencies updated
7. Use HTTPS in production
8. Implement rate limiting on all public endpoints
9. Validate all inputs with class-validator
10. Don't expose detailed error messages to clients

## 🚀 Deployment Checklist

- [ ] Set all environment variables
- [ ] Use production database
- [ ] Generate strong JWT secrets
- [ ] Configure Stripe production keys
- [ ] Set up SSL certificate
- [ ] Configure CORS for production frontend URL
- [ ] Enable logging and monitoring
- [ ] Set up automated backups
- [ ] Configure error tracking (e.g., Sentry)
- [ ] Run security audit: `npm audit`
- [ ] Test all endpoints
- [ ] Load testing
- [ ] Set up CD/CI pipeline
