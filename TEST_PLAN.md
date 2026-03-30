# Solo E-Commerce - Comprehensive Test Plan

## Overview

This document outlines the complete test strategy and test cases for the Solo E-Commerce platform.
Tests are organized by feature module with specific test cases for both backend (NestJS) and frontend (Flutter).

---

## 1. Test Strategy

### 1.1 Test Pyramid

```
                    ┌─────────────────┐
                    │  E2E/Integration │  ← Few, slow, high confidence
                    │     Tests        │
                    ├─────────────────┤
                    │   Widget/API    │  ← Medium, controller tests
                    │   Integration   │
                    ├─────────────────┤
                    │    Unit Tests   │  ← Many, fast, isolated
                    └─────────────────┘
```

### 1.2 Coverage Targets

| Layer | Target | Minimum |
|-------|--------|---------|
| Backend Unit (Services) | 85% | 70% |
| Backend API Integration | 80% | 65% |
| Frontend Unit (Providers) | 80% | 65% |
| Frontend Widget | 70% | 50% |
| E2E Critical Flows | 100% of critical paths | - |

### 1.3 Test Environment

- **Backend**: Dedicated test database (PostgreSQL) with `DATABASE_URL_TEST`
- **Frontend**: Mock HTTP client for unit/widget tests, real backend for E2E
- **Data Isolation**: Each test suite uses transactions or truncates data between runs
- **Seed Data**: Deterministic factories for reproducible tests

---

## 2. Backend Test Cases

### 2.1 Auth Module

#### Unit Tests (auth.service.spec.ts)
| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| AUTH-U01 | Register user with valid data creates user with CUSTOMER role | Unit | High |
| AUTH-U02 | Register with existing email throws ConflictException | Unit | High |
| AUTH-U03 | Register hashes password with argon2id | Unit | High |
| AUTH-U04 | Login with valid credentials returns tokens | Unit | High |
| AUTH-U05 | Login with invalid password throws UnauthorizedException | Unit | High |
| AUTH-U06 | Login with non-existent email throws UnauthorizedException | Unit | High |
| AUTH-U07 | Validate JWT token returns user payload | Unit | Medium |
| AUTH-U08 | Refresh token with valid token returns new access token | Unit | Medium |
| AUTH-U09 | Forgot password generates reset token | Unit | Medium |
| AUTH-U10 | Reset password with valid token updates password | Unit | Medium |
| AUTH-U11 | Reset password with expired token throws error | Unit | Medium |

#### API Integration Tests (auth.e2e-spec.ts)
| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| AUTH-E01 | POST /auth/register - success 201 with tokens | E2E | High |
| AUTH-E02 | POST /auth/register - 409 for duplicate email | E2E | High |
| AUTH-E03 | POST /auth/register - 400 for invalid email format | E2E | Medium |
| AUTH-E04 | POST /auth/login - success 200 with tokens and user | E2E | High |
| AUTH-E05 | POST /auth/login - 401 for wrong password | E2E | High |
| AUTH-E06 | POST /auth/login - 401 for non-existent user | E2E | High |
| AUTH-E07 | GET /auth/me - 200 with user profile (authenticated) | E2E | High |
| AUTH-E08 | GET /auth/me - 401 without token | E2E | High |
| AUTH-E09 | POST /auth/refresh - 200 with new tokens | E2E | Medium |
| AUTH-E10 | POST /auth/forgot-password - 200 (email sent) | E2E | Medium |
| AUTH-E11 | POST /auth/reset-password - 200 with valid token | E2E | Medium |
| AUTH-E12 | POST /auth/change-password - 200 for authenticated user | E2E | Medium |

### 2.2 Products Module (Catalog)

#### Unit Tests (products.service.spec.ts)
| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| PROD-U01 | findAll returns paginated products from inventory | Unit | High |
| PROD-U02 | findAll applies category filter correctly | Unit | High |
| PROD-U03 | findAll applies brand filter correctly | Unit | Medium |
| PROD-U04 | findAll applies price range filter | Unit | Medium |
| PROD-U05 | findAll applies search query (name, sku) | Unit | High |
| PROD-U06 | findAll sorts by price_asc correctly | Unit | Medium |
| PROD-U07 | findAll sorts by price_desc correctly | Unit | Medium |
| PROD-U08 | findAll sorts by newest correctly | Unit | Medium |
| PROD-U09 | findOne returns product by ID with full details | Unit | High |
| PROD-U10 | findOne returns product by slug | Unit | High |
| PROD-U11 | findOne throws NotFoundException for invalid ID | Unit | High |
| PROD-U12 | getFeatured returns only featured products | Unit | High |
| PROD-U13 | getBestSellers returns only bestseller products | Unit | High |
| PROD-U14 | getNewArrivals returns only new arrival products | Unit | High |
| PROD-U15 | getRelated returns products in same category | Unit | Medium |

#### API Integration Tests (products.e2e-spec.ts)
| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| PROD-E01 | GET /products - 200 with paginated list | E2E | High |
| PROD-E02 | GET /products?categoryId=X - filtered results | E2E | High |
| PROD-E03 | GET /products?search=X - search results | E2E | High |
| PROD-E04 | GET /products?minPrice=X&maxPrice=Y - price filtered | E2E | Medium |
| PROD-E05 | GET /products/:id - 200 with product details | E2E | High |
| PROD-E06 | GET /products/:id - 404 for non-existent | E2E | High |
| PROD-E07 | GET /products/featured - 200 with featured list | E2E | High |
| PROD-E08 | GET /products/best-sellers - 200 with bestsellers | E2E | High |
| PROD-E09 | GET /products/new-arrivals - 200 with new arrivals | E2E | High |
| PROD-E10 | GET /products/:id/related - 200 with related products | E2E | Medium |

### 2.3 Categories Module

#### Unit Tests (categories.service.spec.ts)
| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| CAT-U01 | findAll returns hierarchical category tree | Unit | High |
| CAT-U02 | findOne returns category by ID | Unit | High |
| CAT-U03 | findOne throws NotFoundException for invalid ID | Unit | High |
| CAT-U04 | create creates category with valid data | Unit | High |
| CAT-U05 | create sets parent relationship correctly | Unit | Medium |
| CAT-U06 | update modifies category fields | Unit | High |
| CAT-U07 | delete removes category | Unit | High |
| CAT-U08 | reorder updates sortOrder for multiple categories | Unit | High |
| CAT-U09 | reorder validates all IDs exist | Unit | Medium |

#### API Integration Tests (categories.e2e-spec.ts)
| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| CAT-E01 | GET /categories - 200 with hierarchy | E2E | High |
| CAT-E02 | GET /categories/:id - 200 with category | E2E | High |
| CAT-E03 | POST /categories - 201 for admin | E2E | High |
| CAT-E04 | POST /categories - 401 without auth | E2E | High |
| CAT-E05 | POST /categories - 403 for non-admin | E2E | High |
| CAT-E06 | PATCH /categories/:id - 200 for admin | E2E | High |
| CAT-E07 | DELETE /categories/:id - 200 for admin | E2E | High |
| CAT-E08 | PATCH /categories/reorder - 200 updates order (GAP-015) | E2E | High |
| CAT-E09 | PATCH /categories/reorder - 400 for invalid IDs | E2E | Medium |

### 2.4 Cart Module

#### Unit Tests (cart.service.spec.ts)
| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| CART-U01 | getCart returns user's cart with items | Unit | High |
| CART-U02 | getCart creates cart if none exists | Unit | High |
| CART-U03 | addItem adds new product to cart | Unit | High |
| CART-U04 | addItem increments quantity for existing product | Unit | High |
| CART-U05 | addItem validates product exists | Unit | High |
| CART-U06 | updateItem changes quantity | Unit | High |
| CART-U07 | updateItem removes item when quantity is 0 | Unit | Medium |
| CART-U08 | removeItem deletes cart item | Unit | High |
| CART-U09 | clearCart removes all items | Unit | High |
| CART-U10 | calculateTotals returns correct subtotal | Unit | High |

#### API Integration Tests (cart.e2e-spec.ts)
| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| CART-E01 | GET /cart - 200 with cart (authenticated) | E2E | High |
| CART-E02 | GET /cart - 401 without auth | E2E | High |
| CART-E03 | POST /cart/items - 201 adds item | E2E | High |
| CART-E04 | POST /cart/items - 404 for invalid product | E2E | High |
| CART-E05 | PATCH /cart/items/:id - 200 updates quantity | E2E | High |
| CART-E06 | PATCH /cart/items/:id - 404 for invalid item | E2E | High |
| CART-E07 | DELETE /cart/items/:id - 200 removes item | E2E | High |
| CART-E08 | DELETE /cart - 200 clears cart | E2E | High |

### 2.5 Orders Module (GAP-002/003/004)

#### Unit Tests (orders.service.spec.ts)
| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| ORD-U01 | createOrder creates order from items | Unit | High |
| ORD-U02 | createOrder generates unique orderNumber | Unit | High |
| ORD-U03 | createOrder creates shipping address | Unit | High |
| ORD-U04 | createOrder calculates totals correctly | Unit | High |
| ORD-U05 | createOrder sets status to PENDING | Unit | High |
| ORD-U06 | getOrders returns user's orders | Unit | High |
| ORD-U07 | getOrderById returns order for owner | Unit | High |
| ORD-U08 | getOrderById throws for non-owner | Unit | High |

#### API Integration Tests (orders.e2e-spec.ts)
| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| ORD-E01 | POST /orders - 201 creates order (GAP-002/003) | E2E | High |
| ORD-E02 | POST /orders - validates shipping address | E2E | High |
| ORD-E03 | POST /orders - 401 without auth | E2E | High |
| ORD-E04 | GET /account/orders - 200 with order list (GAP-004) | E2E | High |
| ORD-E05 | GET /account/orders/:id - 200 with order details | E2E | High |
| ORD-E06 | GET /account/orders/:id - 404 for non-existent | E2E | High |
| ORD-E07 | GET /orders/:id/invoice/pdf - 200 returns PDF | E2E | Medium |

### 2.6 Addresses Module (GAP-005)

#### Unit Tests (users.service.spec.ts - addresses)
| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| ADDR-U01 | getAddresses returns user's addresses | Unit | High |
| ADDR-U02 | createAddress creates new address | Unit | High |
| ADDR-U03 | createAddress sets first address as default | Unit | High |
| ADDR-U04 | updateAddress modifies address fields | Unit | High |
| ADDR-U05 | deleteAddress removes address | Unit | High |
| ADDR-U06 | deleteAddress reassigns default if deleted | Unit | Medium |
| ADDR-U07 | setDefaultAddress updates default flag | Unit | High |
| ADDR-U08 | setDefaultAddress unsets other defaults | Unit | High |

#### API Integration Tests (addresses.e2e-spec.ts)
| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| ADDR-E01 | GET /account/addresses - 200 with list | E2E | High |
| ADDR-E02 | POST /account/addresses - 201 creates address | E2E | High |
| ADDR-E03 | PATCH /account/addresses/:id - 200 updates | E2E | High |
| ADDR-E04 | DELETE /account/addresses/:id - 200 deletes | E2E | High |
| ADDR-E05 | PATCH /account/addresses/:id/default - 200 sets default | E2E | High |
| ADDR-E06 | All endpoints - 401 without auth | E2E | High |

### 2.7 Favorites Module (GAP-006)

#### Unit Tests (favorites.service.spec.ts)
| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| FAV-U01 | getFavorites returns user's favorites with products | Unit | High |
| FAV-U02 | addFavorite creates favorite record | Unit | High |
| FAV-U03 | addFavorite enforces unique userId+productId | Unit | High |
| FAV-U04 | removeFavorite deletes favorite | Unit | High |
| FAV-U05 | toggleFavorite adds if not exists | Unit | High |
| FAV-U06 | toggleFavorite removes if exists | Unit | High |
| FAV-U07 | isFavorite returns true for favorited product | Unit | High |
| FAV-U08 | isFavorite returns false for non-favorited | Unit | High |

#### API Integration Tests (favorites.e2e-spec.ts)
| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| FAV-E01 | GET /favorites - 200 with list | E2E | High |
| FAV-E02 | POST /favorites - 201 adds favorite | E2E | High |
| FAV-E03 | POST /favorites/toggle - 200 toggles state | E2E | High |
| FAV-E04 | GET /favorites/check/:productId - 200 with status | E2E | High |
| FAV-E05 | DELETE /favorites/:productId - 200 removes | E2E | High |
| FAV-E06 | All endpoints - 401 without auth | E2E | High |

### 2.8 Content/CMS Module (GAP-007/008/009/016/017)

#### Unit Tests (content.service.spec.ts)
| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| CMS-U01 | getHomePage returns page with sections | Unit | High |
| CMS-U02 | getLandingPageBySlug returns page or 404 | Unit | High |
| CMS-U03 | getActiveBanners returns active banners only | Unit | High |
| CMS-U04 | getLoyaltyConfig returns config | Unit | High |
| CMS-U05 | createLandingPage creates page | Unit | High |
| CMS-U06 | updateLandingPage modifies fields | Unit | High |
| CMS-U07 | deleteLandingPage removes page | Unit | High |
| CMS-U08 | createSection creates with correct pageId | Unit | High |
| CMS-U09 | reorderSections updates displayOrder | Unit | High |

#### API Integration Tests (content.e2e-spec.ts)
| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| CMS-E01 | GET /content/pages/about-us - 200 or 404 (GAP-007) | E2E | High |
| CMS-E02 | GET /content/pages/bulk-order - 200 or 404 (GAP-008) | E2E | High |
| CMS-E03 | GET /content/loyalty-config - 200 (GAP-009) | E2E | High |
| CMS-E04 | GET /content/admin/pages - 200 for admin (GAP-016) | E2E | High |
| CMS-E05 | POST /content/admin/pages - 201 creates (GAP-017) | E2E | High |
| CMS-E06 | PATCH /content/admin/pages/:id - 200 updates | E2E | High |
| CMS-E07 | DELETE /content/admin/pages/:id - 200 deletes | E2E | High |
| CMS-E08 | POST /content/admin/sections - 201 creates section | E2E | High |
| CMS-E09 | POST /content/pages/:id/sections/reorder - 200 reorders | E2E | Medium |

### 2.9 Admin Module (GAP-010/011/012/013)

#### Unit Tests (admin.service.spec.ts)
| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| ADMIN-U01 | getDashboardStats returns correct counts | Unit | High |
| ADMIN-U02 | getLowStockProducts returns products with stock < threshold | Unit | High |
| ADMIN-U03 | getLowStockProducts uses inventory_transactions | Unit | High |
| ADMIN-U04 | getCatalogSummary returns correct counts | Unit | Medium |

#### API Integration Tests (admin.e2e-spec.ts)
| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| ADMIN-E01 | GET /admin/dashboard - 200 with stats (GAP-010) | E2E | High |
| ADMIN-E02 | GET /admin/dashboard - lowStockCount is deterministic | E2E | High |
| ADMIN-E03 | PATCH /products/:id - toggles isFeatured (GAP-011) | E2E | High |
| ADMIN-E04 | PATCH /products/:id - toggles isNewArrival (GAP-012) | E2E | High |
| ADMIN-E05 | PATCH /products/:id - toggles isBestseller (GAP-013) | E2E | High |
| ADMIN-E06 | All admin endpoints - 401 without auth | E2E | High |
| ADMIN-E07 | All admin endpoints - 403 for CUSTOMER role | E2E | High |

### 2.10 Media Module (GAP-014)

#### API Integration Tests (media.e2e-spec.ts)
| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| MEDIA-E01 | POST /media/upload - 201 uploads file | E2E | High |
| MEDIA-E02 | POST /media/upload - returns URL | E2E | High |
| MEDIA-E03 | POST /media/upload-multiple - 201 uploads multiple | E2E | Medium |
| MEDIA-E04 | POST /media/upload - 401 without auth | E2E | High |
| MEDIA-E05 | POST /media/upload - 403 for non-admin | E2E | High |
| MEDIA-E06 | DELETE /media/delete - 200 removes file | E2E | Medium |

---

## 3. Frontend Test Cases

### 3.1 Auth Provider

#### Unit Tests (auth_provider_test.dart)
| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| FE-AUTH-01 | login success updates isAuthenticated | Unit | High |
| FE-AUTH-02 | login success stores tokens | Unit | High |
| FE-AUTH-03 | login failure sets error message | Unit | High |
| FE-AUTH-04 | logout clears tokens and state | Unit | High |
| FE-AUTH-05 | register success sets user | Unit | High |
| FE-AUTH-06 | checkAuth restores session from storage | Unit | High |
| FE-AUTH-07 | isAdmin returns true for ADMIN role | Unit | Medium |

### 3.2 Cart Provider

#### Unit Tests (cart_provider_test.dart)
| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| FE-CART-01 | loadCart populates items from API | Unit | High |
| FE-CART-02 | addItem calls API and updates state | Unit | High |
| FE-CART-03 | removeItem calls API and removes from state | Unit | High |
| FE-CART-04 | updateQuantity calls API and updates | Unit | High |
| FE-CART-05 | clearCart empties items | Unit | High |
| FE-CART-06 | itemCount returns correct count | Unit | High |
| FE-CART-07 | subtotal calculates correctly | Unit | High |

### 3.3 Favorites Provider (GAP-006)

#### Unit Tests (favorites_provider_test.dart)
| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| FE-FAV-01 | loadFavorites populates from API | Unit | High |
| FE-FAV-02 | toggleFavorite adds when not favorited | Unit | High |
| FE-FAV-03 | toggleFavorite removes when favorited | Unit | High |
| FE-FAV-04 | isFavorite returns correct state | Unit | High |
| FE-FAV-05 | optimistic update reverts on API failure | Unit | Medium |

### 3.4 Account Provider

#### Unit Tests (account_provider_test.dart)
| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| FE-ACC-01 | loadProfile fetches user data | Unit | High |
| FE-ACC-02 | loadOrders fetches order history (GAP-004) | Unit | High |
| FE-ACC-03 | loadAddresses fetches addresses (GAP-005) | Unit | High |
| FE-ACC-04 | createAddress calls API | Unit | High |
| FE-ACC-05 | updateAddress calls API | Unit | High |
| FE-ACC-06 | deleteAddress calls API | Unit | High |
| FE-ACC-07 | setDefaultAddress updates state | Unit | High |

### 3.5 Widget Tests

#### Checkout Screen (checkout_screen_test.dart)
| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| FE-CHK-W01 | renders cart items summary | Widget | High |
| FE-CHK-W02 | renders shipping form | Widget | High |
| FE-CHK-W03 | validates required fields | Widget | High |
| FE-CHK-W04 | Place Order button triggers API | Widget | High |
| FE-CHK-W05 | shows success dialog on success | Widget | High |
| FE-CHK-W06 | shows error on API failure | Widget | Medium |

#### Favorites Screen (favorites_screen_test.dart)
| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| FE-FAV-W01 | renders loading state | Widget | Medium |
| FE-FAV-W02 | renders favorites list | Widget | High |
| FE-FAV-W03 | renders empty state when no favorites | Widget | High |
| FE-FAV-W04 | remove button triggers toggle | Widget | High |

#### Account Screens (account_screens_test.dart)
| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| FE-ACC-W01 | Orders tab renders order cards | Widget | High |
| FE-ACC-W02 | Addresses tab renders address cards | Widget | High |
| FE-ACC-W03 | Add address dialog opens | Widget | High |
| FE-ACC-W04 | Edit address dialog populates fields | Widget | Medium |

#### Admin Screens
| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| FE-ADM-W01 | Dashboard shows low stock count (GAP-010) | Widget | High |
| FE-ADM-W02 | Products screen shows toggle menu | Widget | High |
| FE-ADM-W03 | Categories screen supports drag reorder | Widget | Medium |
| FE-ADM-W04 | Landing pages screen shows page list | Widget | High |

### 3.6 Integration Tests (E2E)

#### Checkout Flow (checkout_flow_test.dart)
| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| FE-INT-01 | Full checkout: browse → cart → checkout → success | E2E | Critical |
| FE-INT-02 | Order appears in order history after checkout | E2E | High |

#### Favorites Flow (favorites_flow_test.dart)
| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| FE-INT-03 | Add to favorites persists after relogin | E2E | High |
| FE-INT-04 | Remove from favorites updates list | E2E | High |

#### Address Management Flow (address_flow_test.dart)
| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| FE-INT-05 | Add address → appears in list | E2E | High |
| FE-INT-06 | Edit address → updates in list | E2E | High |
| FE-INT-07 | Set default → badge updates | E2E | Medium |
| FE-INT-08 | Delete address → removed from list | E2E | High |

#### Admin Flows (admin_flow_test.dart)
| ID | Test Case | Type | Priority |
|----|-----------|------|----------|
| FE-INT-09 | Toggle product featured updates badge | E2E | High |
| FE-INT-10 | Reorder categories persists order | E2E | High |
| FE-INT-11 | Create landing page appears in list | E2E | High |

---

## 4. Test Data & Factories

### 4.1 Backend Test Factories

```typescript
// test/factories/user.factory.ts
export const createTestUser = (overrides?: Partial<User>) => ({
  email: `test-${Date.now()}@test.com`,
  password: 'TestPass123!',
  firstName: 'Test',
  lastName: 'User',
  role: 'CUSTOMER',
  ...overrides,
});

// test/factories/product.factory.ts
export const createTestProduct = (overrides?: Partial<Product>) => ({
  sku: `TEST-${Date.now()}`,
  name: 'Test Product',
  price: 99.00,
  ...overrides,
});

// test/factories/address.factory.ts
export const createTestAddress = (overrides?: Partial<Address>) => ({
  firstName: 'John',
  lastName: 'Doe',
  addressLine1: '123 Test Street',
  city: 'Dubai',
  country: 'UAE',
  ...overrides,
});
```

### 4.2 Frontend Test Mocks

```dart
// test/mocks/mock_api_client.dart
class MockApiClient extends Mock implements ApiClient {}

// test/mocks/mock_auth_api.dart
class MockAuthApi extends Mock implements AuthApi {}
```

---

## 5. CI/CD Commands

### 5.1 Backend

```bash
# Run all tests
npm test

# Run with coverage
npm run test:cov

# Run E2E tests
npm run test:e2e

# Run specific suite
npm test -- --testPathPattern=auth
```

### 5.2 Frontend

```bash
# Run unit/widget tests
flutter test

# Run with coverage
flutter test --coverage

# Run integration tests
flutter test integration_test -d chrome
```

### 5.3 Full Suite

```bash
# CI command
npm run test:ci && cd frontend && flutter test --coverage
```

---

## 6. Test Environment Setup

### 6.1 Backend Database

```env
# .env.test
DATABASE_URL_TEST=postgresql://postgres:postgres@localhost:5433/solo_test
EMAIL_MODE=console
JWT_SECRET=test-secret-key
```

### 6.2 Docker Compose for Tests

```yaml
# docker-compose.test.yml
version: '3.8'
services:
  postgres-test:
    image: postgres:15
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: solo_test
    ports:
      - "5433:5432"
```

---

## 7. Execution Order

1. **Phase 1**: Backend unit tests (services)
2. **Phase 2**: Backend API integration tests (controllers)
3. **Phase 3**: Frontend unit tests (providers)
4. **Phase 4**: Frontend widget tests (screens)
5. **Phase 5**: E2E integration tests (full flows)

Each phase must pass before proceeding to the next.

---

## 8. Acceptance Criteria

- [ ] All tests pass consistently (no flaky tests)
- [ ] Backend coverage ≥ 70%
- [ ] Frontend coverage ≥ 60%
- [ ] All GAP items (002-017) have explicit test coverage
- [ ] CI pipeline runs tests automatically
- [ ] Test documentation is complete
