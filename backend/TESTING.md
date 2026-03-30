# Backend Testing Documentation

## Overview

This document describes the testing infrastructure, conventions, and commands for the Solo e-commerce platform backend.

## Test Stack

- **Framework**: Jest
- **HTTP Testing**: Supertest
- **ORM**: Prisma (test database integration)
- **Mocking**: Jest built-in mocks

## Test Structure

```
backend/
├── test/
│   ├── e2e/                    # End-to-end API tests
│   │   ├── auth.e2e-spec.ts    # Authentication tests
│   │   ├── favorites.e2e-spec.ts # Favorites module tests
│   │   ├── addresses.e2e-spec.ts # Addresses module tests
│   │   ├── orders.e2e-spec.ts  # Orders module tests
│   │   ├── cart.e2e-spec.ts    # Shopping cart tests
│   │   ├── products.e2e-spec.ts # Products module tests
│   │   ├── categories.e2e-spec.ts # Categories module tests
│   │   ├── content.e2e-spec.ts # CMS/Content tests
│   │   ├── admin.e2e-spec.ts   # Admin module tests
│   │   └── media.e2e-spec.ts   # Media upload tests
│   ├── helpers/
│   │   └── test-helpers.ts     # Shared test utilities
│   ├── fixtures/               # Test fixtures (images, etc.)
│   └── jest-e2e.json           # E2E Jest configuration
├── src/
│   └── **/**.spec.ts           # Unit tests (co-located)
└── package.json                # Jest configuration
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
npm run test

# Run with coverage
npm run test:cov

# Run in watch mode
npm run test:watch

# Run specific test file
npm run test -- products.service.spec.ts
```

### E2E Tests
```bash
# Run all E2E tests
npm run test:e2e

# Run specific E2E test file
npm run test:e2e -- auth.e2e-spec.ts

# Run with verbose output
npm run test:e2e -- --verbose
```

### All Tests
```bash
# Run everything
npm run test && npm run test:e2e
```

## Test Coverage Targets

| Metric      | Unit Tests | E2E Tests |
|-------------|------------|-----------|
| Statements  | 80%        | 70%       |
| Branches    | 75%        | 65%       |
| Functions   | 80%        | 70%       |
| Lines       | 80%        | 70%       |

## Test Helpers

Located in `test/helpers/test-helpers.ts`:

### App Lifecycle
```typescript
import { setupTestApp, teardownTestApp } from '../helpers/test-helpers';

describe('My Tests', () => {
  let app: INestApplication;
  let prisma: PrismaService;

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    prisma = setup.prisma;
  });

  afterAll(async () => {
    await teardownTestApp();
  });
});
```

### Authentication Helpers
```typescript
import { 
  loginAsAdmin, 
  loginAsCustomer, 
  createTestUser 
} from '../helpers/test-helpers';

// Login as admin
const admin = await loginAsAdmin(app, prisma);

// Login as customer
const customer = await loginAsCustomer(app, prisma);

// Use tokens
const response = await request(app.getHttpServer())
  .get('/protected')
  .set('Authorization', `Bearer ${admin.token}`);
```

### Seeding Helpers
```typescript
import {
  seedCategories,
  seedLandingPage,
  seedAddress,
  seedFavorite,
  seedBanners,
} from '../helpers/test-helpers';

// Seed categories
const categories = await seedCategories(prisma, 3);

// Seed address for user
const address = await seedAddress(prisma, userId, true); // isDefault=true

// Seed favorite
await seedFavorite(prisma, userId, productId);
```

### Request Helpers
```typescript
import {
  authGet,
  authPost,
  authPatch,
  authDelete,
} from '../helpers/test-helpers';

// Authenticated requests
const response = await authGet(app, '/endpoint', token);
const response = await authPost(app, '/endpoint', token, { data });
const response = await authPatch(app, '/endpoint', token, { data });
const response = await authDelete(app, '/endpoint', token);
```

### Cleanup Helpers
```typescript
import {
  cleanupUser,
  cleanupTestUsers,
  cleanupTestCategories,
  cleanupTestLandingPages,
  cleanupAllTestData,
} from '../helpers/test-helpers';

// Cleanup after tests
afterAll(async () => {
  await cleanupTestUsers(prisma, '@test.com');
  await cleanupAllTestData(prisma);
});
```

### Assertion Helpers
```typescript
import {
  expectPaginatedResponse,
  expectUserObject,
  expectOrderObject,
  expectAddressObject,
} from '../helpers/test-helpers';

// Assert paginated response structure
expectPaginatedResponse(response.body);

// Assert user object structure
expectUserObject(response.body);
```

## Writing Tests

### E2E Test Template
```typescript
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  setupTestApp,
  teardownTestApp,
  loginAsAdmin,
  loginAsCustomer,
  cleanupTestUsers,
  authGet,
  TestUser,
} from '../helpers/test-helpers';

describe('MyModule (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let admin: TestUser;
  let customer: TestUser;

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
    prisma = setup.prisma;

    admin = await loginAsAdmin(app, prisma);
    customer = await loginAsCustomer(app, prisma);
  });

  afterAll(async () => {
    await cleanupTestUsers(prisma, '@test.com');
    await teardownTestApp();
  });

  describe('GET /my-endpoint', () => {
    it('should return data for admin (200)', async () => {
      const response = await authGet(app, '/my-endpoint', admin.token);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('id');
    });

    it('should return 401 without auth', async () => {
      const response = await request(app.getHttpServer())
        .get('/my-endpoint');

      expect(response.status).toBe(401);
    });

    it('should return 403 for non-admin', async () => {
      const response = await authGet(app, '/my-endpoint', customer.token);

      expect(response.status).toBe(403);
    });
  });
});
```

### Unit Test Template
```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { MyService } from './my.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MyService', () => {
  let service: MyService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MyService,
        {
          provide: PrismaService,
          useValue: {
            myModel: {
              findMany: jest.fn(),
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<MyService>(MyService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return array of items', async () => {
      const mockItems = [{ id: '1' }, { id: '2' }];
      jest.spyOn(prisma.myModel, 'findMany').mockResolvedValue(mockItems);

      const result = await service.findAll();
      
      expect(result).toEqual(mockItems);
      expect(prisma.myModel.findMany).toHaveBeenCalled();
    });
  });
});
```

## Test Naming Conventions

- **Files**: `*.spec.ts` for unit tests, `*.e2e-spec.ts` for E2E tests
- **Describe blocks**: Module name + `(e2e)` or `(unit)`
- **Test names**: Start with `should` + expected behavior

## GAP Fix Test Coverage

All 16 GAP items from GAP_FIX_VERIFICATION_GUIDE.md have dedicated tests:

| GAP ID | Feature | Test File |
|--------|---------|-----------|
| GAP-002 | Order creation with shipping address | orders.e2e-spec.ts |
| GAP-003 | Order history | orders.e2e-spec.ts |
| GAP-004 | Order PDF invoice | orders.e2e-spec.ts |
| GAP-005 | Addresses CRUD | addresses.e2e-spec.ts |
| GAP-006 | Favorites API | favorites.e2e-spec.ts |
| GAP-007 | About Us page | content.e2e-spec.ts |
| GAP-008 | Bulk Order page | content.e2e-spec.ts |
| GAP-009 | Loyalty config | content.e2e-spec.ts |
| GAP-010 | Admin users list | admin.e2e-spec.ts |
| GAP-011 | Admin user update | admin.e2e-spec.ts |
| GAP-012 | Admin orders management | admin.e2e-spec.ts |
| GAP-013 | Admin dashboard stats | admin.e2e-spec.ts |
| GAP-014 | Media upload | media.e2e-spec.ts |
| GAP-015 | Categories reorder | categories.e2e-spec.ts |
| GAP-016 | Admin landing pages | content.e2e-spec.ts |
| GAP-017 | Admin sections reorder | content.e2e-spec.ts |

## Database Considerations

- Tests use the same Prisma client but with test data isolation
- Test users/data are prefixed with `test-` or have `@test.com` emails
- Always clean up test data in `afterAll` hooks
- Use transactions for data isolation when possible

## CI/CD Integration

Add to your CI pipeline:

```yaml
test:
  script:
    - npm ci
    - npm run test:cov
    - npm run test:e2e
  coverage:
    report:
      - coverage/lcov.info
```

## Debugging Tests

```bash
# Run with debugger
node --inspect-brk ./node_modules/.bin/jest --runInBand

# Run single test with verbose
npm run test:e2e -- --verbose --testNamePattern "should create order"

# Show console output
npm run test -- --silent=false
```

## Best Practices

1. **Isolation**: Each test should be independent and clean up after itself
2. **Speed**: Mock external services (email, file storage) in unit tests
3. **Coverage**: Aim for high coverage on business logic, less on boilerplate
4. **Naming**: Use descriptive test names that explain the expected behavior
5. **Assertions**: Be specific with assertions, test both success and error cases
6. **Cleanup**: Always clean up test data to avoid test pollution
7. **Auth**: Test both authenticated and unauthenticated scenarios
8. **Roles**: Test admin-only endpoints with both admin and customer roles
