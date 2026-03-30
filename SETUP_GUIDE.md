# 🚀 Solo Ecommerce - Complete Setup Guide

This guide will walk you through setting up the entire Solo Ecommerce platform from scratch.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Backend Requirements
- ✅ Node.js 18+ ([Download](https://nodejs.org/))
- ✅ PostgreSQL 15+ ([Download](https://www.postgresql.org/download/))
- ✅ npm or yarn package manager
- ✅ Git

### Frontend Requirements
- ✅ Flutter SDK 3.16+ ([Install Guide](https://docs.flutter.dev/get-started/install))
- ✅ Dart SDK 3.2+ (included with Flutter)
- ✅ Chrome browser (for web development)
- ✅ Android Studio / Xcode (optional, for mobile)

### Additional Tools
- ✅ VS Code or your preferred IDE
- ✅ Postman or similar API testing tool (optional)
- ✅ pgAdmin or TablePlus (optional, for database management)

---

## 🏗️ Project Structure Overview

```
Solo/
├── backend/              # NestJS + PostgreSQL + Prisma
│   ├── prisma/          # Database schema & migrations
│   ├── src/             # Source code
│   ├── package.json
│   └── .env
├── frontend/            # Flutter (Web + Mobile)
│   ├── lib/            # Dart source code
│   ├── assets/         # Images, fonts, icons
│   ├── pubspec.yaml
│   └── .env
├── SECURITY.md          # Security guidelines
└── README.md           # Main documentation
```

---

## 🔧 Part 1: Backend Setup

### Step 1: Navigate to Backend Directory

```powershell
cd c:\Users\aiman\OneDrive\Desktop\Solo\backend
```

### Step 2: Install Dependencies

```powershell
npm install
```

This will install all required packages including:
- NestJS framework
- Prisma ORM
- JWT authentication
- Argon2 password hashing
- Security packages (helmet, throttler)
- And more...

### Step 3: Configure Environment Variables

```powershell
# Copy the example environment file
cp .env.example .env
```

Open `.env` in your editor and configure:

```env
# 1. Database Connection
DATABASE_URL="postgresql://postgres:YourPassword@localhost:5432/solo_ecommerce?schema=public"

# 2. JWT Secrets (IMPORTANT: Generate strong random strings!)
# Use a password generator or run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_ACCESS_SECRET="your-generated-secret-at-least-32-characters-long-access"
JWT_REFRESH_SECRET="your-generated-secret-at-least-32-characters-long-refresh"

# 3. Server Configuration
PORT=3000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5000"

# 4. Stripe (optional for now, get from https://dashboard.stripe.com/)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# 5. Email (use Mailtrap for development: https://mailtrap.io/)
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT=2525
SMTP_USER="your-mailtrap-user"
SMTP_PASS="your-mailtrap-password"
EMAIL_FROM="noreply@solo-ecommerce.com"
```

### Step 4: Set Up PostgreSQL Database

#### Option A: Local PostgreSQL

1. Open pgAdmin or psql
2. Create a new database:
```sql
CREATE DATABASE solo_ecommerce;
```

#### Option B: Docker PostgreSQL (Easier)

```powershell
docker run --name solo-postgres -e POSTGRES_PASSWORD=password -e POSTGRES_DB=solo_ecommerce -p 5432:5432 -d postgres:15
```

### Step 5: Generate Prisma Client & Run Migrations

```powershell
# Generate Prisma Client (creates type-safe database client)
npx prisma generate

# Create and apply database migrations
npx prisma migrate dev --name initial_schema

# (Optional) Open Prisma Studio to view database
npx prisma studio
```

### Step 6: Seed the Database (Optional but Recommended)

Create `prisma/seed.ts` to populate initial data:

```typescript
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const adminPassword = await argon2.hash('AdminPassword123!', {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@solo-ecommerce.com' },
    update: {},
    create: {
      email: 'admin@solo-ecommerce.com',
      passwordHash: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'SUPER_ADMIN',
      isActive: true,
      emailVerified: true,
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // Create departments
  const departments = [
    { name: 'Accessories', slug: 'accessories', icon: '👜' },
    { name: 'Tableware', slug: 'tableware', icon: '🍽️' },
    { name: 'Kitchenware', slug: 'kitchenware', icon: '🍳' },
    { name: 'Outdoor', slug: 'outdoor', icon: '⛰️' },
    { name: 'Furniture', slug: 'furniture', icon: '🛋️' },
    { name: 'On-the-Go', slug: 'on-the-go', icon: '🎒' },
    { name: 'Packages', slug: 'packages', icon: '📦' },
  ];

  for (const [index, dept] of departments.entries()) {
    await prisma.department.upsert({
      where: { slug: dept.slug },
      update: {},
      create: {
        name: dept.name,
        slug: dept.slug,
        icon: dept.icon,
        sortOrder: index,
        isActive: true,
      },
    });
  }

  console.log('✅ Departments created');

  // Add more seed data as needed...

  console.log('🎉 Seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Then run:
```powershell
npm run seed
```

### Step 7: Start the Backend Server

```powershell
# Development mode with hot-reload
npm run start:dev
```

You should see:
```
╔════════════════════════════════════════════════════════════╗
║                                                            ║
║   🛍️  Solo Ecommerce Backend API                          ║
║                                                            ║
║   Environment: development                                 ║
║   Port: 3000                                               ║
║   API: http://localhost:3000/api                           ║
║                                                            ║
║   🔒 Security: OWASP Top 10 + ASVS Level 2                ║
║                                                            ║
╚════════════════════════════════════════════════════════════╝
```

### Step 8: Test the Backend

Open your browser or Postman and test:

```
GET http://localhost:3000/api
```

You can also test user registration:

```
POST http://localhost:3000/api/auth/register
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "SecurePassword123!",
  "firstName": "Test",
  "lastName": "User"
}
```

---

## 🎨 Part 2: Frontend Setup

### Step 1: Navigate to Frontend Directory

```powershell
cd c:\Users\aiman\OneDrive\Desktop\Solo\frontend
```

### Step 2: Install Flutter Dependencies

```powershell
flutter pub get
```

This will download all packages defined in `pubspec.yaml`.

### Step 3: Configure Environment

Create `.env` file:

```env
API_BASE_URL=http://localhost:3000/api
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
ENV=development
```

### Step 4: Generate Code (if using code generation)

```powershell
flutter pub run build_runner build --delete-conflicting-outputs
```

### Step 5: Create Main Entry Point

Create `lib/main.dart`:

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'config/theme.dart';

void main() {
  runApp(
    const ProviderScope(
      child: SoloEcommerceApp(),
    ),
  );
}

class SoloEcommerceApp extends StatelessWidget {
  const SoloEcommerceApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Solo Ecommerce',
      theme: AppTheme.lightTheme,
      debugShowCheckedModeBanner: false,
      home: const Scaffold(
        body: Center(
          child: Text(
            '🛍️ Solo Ecommerce',
            style: TextStyle(fontSize: 32, fontWeight: FontWeight.bold),
          ),
        ),
      ),
    );
  }
}
```

### Step 6: Run Flutter App

```powershell
# For web (primary platform)
flutter run -d chrome

# For Android emulator
flutter run

# For iOS simulator (Mac only)
flutter run -d ios
```

---

## 🔐 Part 3: Security Configuration

### Backend Security

1. **Generate Strong JWT Secrets**
```powershell
# In PowerShell
$secret = [System.Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
Write-Output $secret
```

2. **Enable HTTPS in Production**
- Get SSL certificate (Let's Encrypt, Cloudflare)
- Configure reverse proxy (Nginx/Apache)
- Update FRONTEND_URL in .env

3. **Configure Rate Limiting**
- Already configured in `main.ts`
- Adjust limits in `.env` if needed

### Frontend Security

1. **No Secrets in Code**
- Never commit API keys or tokens
- Use environment variables
- Backend should handle sensitive operations

2. **Configure SSL Pinning (Mobile)**
```dart
// lib/core/api/api_client.dart
import 'package:dio_http_certificate_pinning/dio_http_certificate_pinning.dart';

final dio = Dio();
if (!kIsWeb && Environment.enableSSLPinning) {
  dio.interceptors.add(
    CertificatePinningInterceptor(
      allowedSHAFingerprints: [
        'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      ],
    ),
  );
}
```

3. **Enable Code Obfuscation for Release**
```powershell
flutter build apk --release --obfuscate --split-debug-info=build/debug-info
```

---

## 📊 Part 4: Implementing Modules

### Backend Module Template

Each feature follows this structure:

```
src/products/
├── products.module.ts        # Module definition
├── products.controller.ts    # HTTP endpoints
├── products.service.ts       # Business logic
└── dto/
    ├── create-product.dto.ts
    ├── update-product.dto.ts
    └── product-filter.dto.ts
```

### Priority Order for Backend Implementation

1. ✅ **Auth Module** (Completed)
2. **Users Module** - User management
3. **Departments Module** - Simple CRUD
4. **Categories Module** - CRUD with department relation
5. **Brands Module** - Simple CRUD
6. **Products Module** - Complex with filters
7. **Cart Module** - Session management
8. **Orders Module** - With payment integration
9. **Packages Module** - Bundle management
10. **Promos Module** - Discount codes
11. **Content Module** - CMS
12. **Analytics Module** - Tracking & reporting
13. **Admin Module** - Admin dashboard

### Frontend Feature Structure

```
lib/features/products/
├── screens/
│   ├── products_list_screen.dart
│   └── product_detail_screen.dart
├── widgets/
│   ├── product_card.dart
│   └── product_filter.dart
└── providers/
    └── products_provider.dart
```

---

## 🧪 Part 5: Testing

### Backend Tests

```powershell
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

### Frontend Tests

```powershell
# Unit tests
flutter test

# Integration tests
flutter test integration_test

# Coverage
flutter test --coverage
```

---

## 🚀 Part 6: Deployment

### Backend Deployment

1. **Build for Production**
```powershell
npm run build
```

2. **Set Production Environment Variables**
3. **Deploy to:**
   - Heroku
   - AWS (EC2, ECS, Lambda)
   - Google Cloud Run
   - DigitalOcean App Platform
   - Railway

### Frontend Deployment

**Web:**
```powershell
flutter build web --release
```
Deploy to:
- Firebase Hosting
- Vercel
- Netlify
- AWS S3 + CloudFront

**Mobile:**
```powershell
# Android
flutter build appbundle --release --obfuscate --split-debug-info=build/debug-info

# iOS
flutter build ipa --release --obfuscate --split-debug-info=build/debug-info
```
Publish to:
- Google Play Store
- Apple App Store

---

## 📚 Part 7: Next Steps

### Immediate Tasks

1. ✅ Backend structure created
2. ✅ Prisma schema defined
3. ✅ Security configured
4. ⚠️ Complete remaining backend modules
5. ⚠️ Implement Flutter UI
6. ⚠️ Connect frontend to backend APIs
7. ⚠️ Add payment integration (Stripe)
8. ⚠️ Implement analytics
9. ⚠️ Testing
10. ⚠️ Deployment

### Recommended Development Order

**Week 1-2: Core Backend**
- Complete all CRUD modules
- Implement authentication flow
- Set up database with seed data

**Week 3-4: Flutter Foundation**
- Set up routing with go_router
- Create design system
- Build reusable components
- Implement state management

**Week 5-6: Storefront**
- Homepage
- Product listing & filtering
- Product detail
- Search functionality

**Week 7-8: Commerce Flow**
- Shopping cart
- Checkout process
- Payment integration
- Order confirmation

**Week 9-10: User Features**
- Account dashboard
- Order history
- Address management
- Profile settings

**Week 11-12: Admin Portal**
- Admin authentication
- Dashboard with analytics
- Product management
- Order management

**Week 13-14: Polish & Testing**
- Bug fixes
- Performance optimization
- Security audit
- Comprehensive testing

**Week 15-16: Deployment & Launch**
- Production environment setup
- Deploy backend
- Deploy frontend
- Monitor and iterate

---

## 🆘 Troubleshooting

### Common Backend Issues

**"Cannot connect to database"**
- Check PostgreSQL is running
- Verify DATABASE_URL in .env
- Check firewall settings

**"Prisma Client not found"**
```powershell
npx prisma generate
```

**"Port 3000 already in use"**
- Change PORT in .env
- Or kill process: `npx kill-port 3000`

### Common Frontend Issues

**"Package not found"**
```powershell
flutter pub get
flutter pub cache repair
```

**"Build failed"**
```powershell
flutter clean
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs
```

---

## 📞 Support & Resources

- **Documentation**: Check README files in each directory
- **Security**: Review SECURITY.md for guidelines
- **NestJS Docs**: https://docs.nestjs.com
- **Flutter Docs**: https://docs.flutter.dev
- **Prisma Docs**: https://www.prisma.io/docs

---

## ✅ Setup Checklist

### Backend
- [ ] Node.js installed
- [ ] PostgreSQL installed and running
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables configured (`.env`)
- [ ] Database created
- [ ] Migrations applied (`npx prisma migrate dev`)
- [ ] Database seeded (`npm run seed`)
- [ ] Server running (`npm run start:dev`)
- [ ] API endpoints tested

### Frontend
- [ ] Flutter SDK installed
- [ ] Dependencies installed (`flutter pub get`)
- [ ] Environment configured
- [ ] App runs on web (`flutter run -d chrome`)
- [ ] Theme configured
- [ ] Routing set up

### Security
- [ ] Strong JWT secrets generated
- [ ] No secrets in code
- [ ] HTTPS configured (production)
- [ ] SSL pinning configured (mobile)
- [ ] Code obfuscation enabled (mobile release)

---

**🎉 Congratulations! Your Solo Ecommerce platform foundation is ready for development!**

Begin implementing modules following the priority order above, and refer to this guide whenever needed.
