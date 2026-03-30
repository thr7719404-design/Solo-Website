# 🚀 Quick Start - Developer Reference

Quick commands and references for Solo Ecommerce development.

## ⚡ Quick Commands

### Backend (NestJS)

```powershell
# Setup
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npm run seed

# Development
npm run start:dev          # Start with hot-reload
npm run start:debug        # Start with debugger
npx prisma studio          # Open database GUI

# Testing
npm run test               # Unit tests
npm run test:e2e          # E2E tests
npm run test:cov          # Coverage

# Database
npx prisma migrate dev     # Create & apply migration
npx prisma migrate reset   # Reset database (dev only!)
npx prisma db push         # Push schema without migration
npx prisma db pull         # Pull schema from database

# Code Quality
npm run lint               # Run linter
npm run format             # Format code

# Production
npm run build              # Build for production
npm run start:prod         # Start production server
```

### Frontend (Flutter)

```powershell
# Setup
cd frontend
flutter pub get
flutter pub run build_runner build --delete-conflicting-outputs

# Development
flutter run -d chrome      # Run on Chrome (web)
flutter run                # Run on default device
flutter run -d windows     # Run on Windows (desktop)

# Code Generation
flutter pub run build_runner build --delete-conflicting-outputs
flutter pub run build_runner watch  # Watch mode

# Testing
flutter test               # Unit tests
flutter test --coverage    # With coverage
flutter drive --target=test_driver/app.dart  # Integration tests

# Code Quality
flutter analyze            # Static analysis
dart format .              # Format code
dart fix --apply           # Apply fixes

# Build
flutter build web --release                      # Web production
flutter build apk --release --obfuscate --split-debug-info=build/debug-info  # Android
flutter build appbundle --release --obfuscate --split-debug-info=build/debug-info  # Android bundle
flutter build ios --release --obfuscate --split-debug-info=build/debug-info  # iOS

# Clean
flutter clean              # Clean build artifacts
flutter pub cache repair   # Repair package cache
```

---

## 📁 Project Structure Reference

### Backend
```
backend/
├── src/
│   ├── auth/              # JWT authentication
│   ├── users/             # User management
│   ├── products/          # Products CRUD
│   ├── categories/        # Categories CRUD
│   ├── departments/       # Departments CRUD
│   ├── brands/            # Brands CRUD
│   ├── packages/          # Package bundles
│   ├── cart/              # Shopping cart
│   ├── orders/            # Order management
│   ├── promos/            # Promo codes
│   ├── content/           # CMS
│   ├── analytics/         # Analytics
│   ├── admin/             # Admin operations
│   ├── common/            # Shared utilities
│   │   ├── guards/        # Auth guards
│   │   ├── decorators/    # Custom decorators
│   │   ├── filters/       # Exception filters
│   │   └── interceptors/  # Interceptors
│   ├── config/            # Configuration
│   └── prisma/            # Prisma service
└── prisma/
    ├── schema.prisma      # Database schema
    ├── migrations/        # Migration history
    └── seed.ts           # Seed data
```

### Frontend
```
frontend/
├── lib/
│   ├── main.dart          # Entry point
│   ├── app.dart           # App widget
│   ├── config/            # Configuration
│   │   ├── theme.dart     # Material 3 theme
│   │   ├── constants.dart # Constants
│   │   └── environment.dart # Environment
│   ├── core/
│   │   ├── api/           # API client (Dio)
│   │   ├── models/        # Data models
│   │   ├── providers/     # Global providers
│   │   ├── routes/        # Routing (go_router)
│   │   └── services/      # Services
│   ├── features/
│   │   ├── auth/          # Authentication
│   │   ├── home/          # Homepage
│   │   ├── products/      # Product screens
│   │   ├── cart/          # Cart
│   │   ├── checkout/      # Checkout
│   │   ├── account/       # User account
│   │   └── admin/         # Admin portal
│   └── shared/
│       ├── widgets/       # Reusable widgets
│       └── layouts/       # Layout components
└── assets/
    ├── images/
    ├── icons/
    └── fonts/
```

---

## 🔑 Environment Variables

### Backend `.env`
```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/solo_ecommerce"

# JWT (Generate strong secrets!)
JWT_ACCESS_SECRET="your-32-char-secret"
JWT_REFRESH_SECRET="your-32-char-secret"

# Server
PORT=3000
NODE_ENV="development"
FRONTEND_URL="http://localhost:5000"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email
SMTP_HOST="smtp.mailtrap.io"
SMTP_PORT=2525
SMTP_USER="user"
SMTP_PASS="pass"
```

### Frontend `.env`
```env
API_BASE_URL=http://localhost:3000/api
STRIPE_PUBLISHABLE_KEY=pk_test_...
ENV=development
```

---

## 🔐 Security Checklist

### Backend
- [ ] Strong JWT secrets (32+ chars)
- [ ] HTTPS in production
- [ ] CORS configured
- [ ] Rate limiting enabled
- [ ] Helmet security headers
- [ ] Input validation (class-validator)
- [ ] Argon2id password hashing
- [ ] Refresh token rotation
- [ ] No secrets in code
- [ ] Audit logging

### Frontend
- [ ] No API keys in code
- [ ] HTTPS only
- [ ] SSL pinning (mobile)
- [ ] Secure storage for tokens
- [ ] Code obfuscation (release)
- [ ] Input sanitization
- [ ] Error handling
- [ ] Session timeout

---

## 📝 Common Tasks

### Create New Backend Module

```powershell
cd backend
nest g module features/example
nest g controller features/example
nest g service features/example
```

Then create DTOs:
```typescript
// dto/create-example.dto.ts
import { IsString, MinLength } from 'class-validator';

export class CreateExampleDto {
  @IsString()
  @MinLength(3)
  name: string;
}
```

### Create New Frontend Feature

```
lib/features/example/
├── screens/
│   └── example_screen.dart
├── widgets/
│   └── example_widget.dart
└── providers/
    └── example_provider.dart
```

### Add New Prisma Model

1. Edit `prisma/schema.prisma`
2. Run `npx prisma migrate dev --name add_example_model`
3. Run `npx prisma generate`
4. Use in code: `prisma.exampleModel.findMany()`

### Add New API Endpoint

```typescript
// controller
@Get(':id')
async findOne(@Param('id') id: string) {
  return this.service.findOne(id);
}

// service
async findOne(id: string) {
  return this.prisma.model.findUnique({
    where: { id },
  });
}
```

---

## 🐛 Debugging

### Backend Debug (VS Code)

`.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug NestJS",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "start:debug"],
  "console": "integratedTerminal",
  "restart": true
}
```

### Flutter Debug

```powershell
# Run with logs
flutter run -d chrome --verbose

# Debug specific file
flutter run -d chrome --target lib/main.dart

# Profile mode
flutter run --profile
```

### Database Debugging

```powershell
# View all data in Prisma Studio
npx prisma studio

# psql command line
psql -U postgres -d solo_ecommerce

# Query logs
SELECT * FROM users ORDER BY "createdAt" DESC LIMIT 10;
```

---

## 🧪 Testing Examples

### Backend Unit Test

```typescript
describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductsService, PrismaService],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should find all products', async () => {
    const result = await service.findAll({});
    expect(result).toBeDefined();
  });
});
```

### Flutter Widget Test

```dart
testWidgets('ProductCard displays product info', (WidgetTester tester) async {
  final product = Product(
    id: '1',
    name: 'Test Product',
    price: 99.99,
  );

  await tester.pumpWidget(
    MaterialApp(
      home: Scaffold(
        body: ProductCard(product: product),
      ),
    ),
  );

  expect(find.text('Test Product'), findsOneWidget);
  expect(find.text('\$99.99'), findsOneWidget);
});
```

---

## 📚 Useful Resources

### Documentation
- [NestJS Docs](https://docs.nestjs.com)
- [Prisma Docs](https://www.prisma.io/docs)
- [Flutter Docs](https://docs.flutter.dev)
- [Riverpod Docs](https://riverpod.dev)
- [Material 3 Design](https://m3.material.io)

### Tools
- [Prisma Studio](https://www.prisma.io/studio) - Database GUI
- [Postman](https://www.postman.com) - API testing
- [DartPad](https://dartpad.dev) - Online Dart editor
- [Flutter DevTools](https://docs.flutter.dev/tools/devtools/overview) - Performance profiling

### Security
- [OWASP Top 10](https://owasp.org/Top10/)
- [OWASP ASVS](https://owasp.org/www-project-application-security-verification-standard/)
- [Snyk](https://snyk.io) - Vulnerability scanning
- [npm audit](https://docs.npmjs.com/cli/v9/commands/npm-audit) - Dependency audit

---

## 🆘 Troubleshooting

### "Cannot find module '@prisma/client'"
```powershell
npx prisma generate
```

### "Port already in use"
```powershell
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or change port in .env
```

### "Flutter command not found"
```powershell
# Add Flutter to PATH
$env:PATH += ";C:\flutter\bin"

# Or add permanently via System Environment Variables
```

### "Database connection failed"
```powershell
# Check PostgreSQL is running
Get-Service -Name postgresql*

# Start if not running
Start-Service postgresql-x64-15
```

### "Prisma migrate failed"
```powershell
# Reset database (dev only!)
npx prisma migrate reset

# Force apply
npx prisma migrate deploy --force
```

---

## 💡 Pro Tips

1. **Use Prisma Studio** for quick database inspection
2. **Enable Flutter DevTools** for performance monitoring
3. **Use VS Code Extensions**: Prisma, Flutter, ESLint
4. **Git commit often** with descriptive messages
5. **Test API endpoints** with Postman collections
6. **Use code generation** for repetitive tasks
7. **Read error messages** carefully - they're usually helpful
8. **Keep dependencies updated** but test after updating
9. **Use environment variables** for all configuration
10. **Document as you go** - future you will thank you

---

**Need help? Check SETUP_GUIDE.md for detailed instructions!**
