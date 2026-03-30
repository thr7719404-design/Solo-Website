# Frontend API Client Implementation

## Overview
Production-grade API client for Solo Ecommerce Flutter application with automatic token refresh, secure storage, and comprehensive error handling.

## Architecture

### Core Components

1. **ApiClient** - Base HTTP client with interceptors
2. **Feature APIs** - Domain-specific service classes
3. **DTOs** - Type-safe data models matching backend
4. **ApiService** - Centralized service factory

## Dependencies

```yaml
dependencies:
  http: ^1.2.0                      # HTTP client
  flutter_secure_storage: ^9.2.2   # Secure token storage
  logger: ^2.0.2                    # Debug logging
```

## Installation

```bash
cd frontend
flutter pub get
```

## Configuration

### Environment Setup

File: `lib/config/app_config.dart`

```dart
class AppConfig {
  static String get apiBaseUrl {
    if (kDebugMode) {
      return 'http://localhost:3000';  // Development
    }
    return 'https://api.solo-ecommerce.com';  // Production
  }
}
```

### Initialization

File: `lib/main.dart`

```dart
import 'services/api_service.dart';

void main() {
  // Initialize API services
  ApiService.initialize();
  
  runApp(const MyApp());
}
```

## Usage

### 1. Products API

```dart
import 'package:solo_ecommerce/services/api_service.dart';

// Get featured products
final featured = await ApiService.products.getFeatured(limit: 8);

// Get paginated products with filters
final productList = await ApiService.products.getProducts(
  page: 1,
  limit: 20,
  sortBy: 'price_low',
  categoryId: 'uuid',
  minPrice: 10,
  maxPrice: 100,
  search: 'coffee',
  inStock: true,
);

// Get single product
final product = await ApiService.products.getProduct('product-uuid');

// Get related products
final related = await ApiService.products.getRelatedProducts(
  'product-uuid',
  limit: 6,
);
```

**Available Methods:**
- `getProducts()` - Paginated product list with filters
- `getProduct(id)` - Single product details
- `getFeatured()` - Featured products
- `getBestSellers()` - Best selling products
- `getNewArrivals()` - New arrival products
- `getRelatedProducts(id)` - Related products

---

### 2. Categories API

```dart
// Get all categories
final categories = await ApiService.categories.getCategories();

// Get single category
final category = await ApiService.categories.getCategory('category-uuid');

// Get products in category
final categoryProducts = await ApiService.categories.getCategoryProducts(
  'category-uuid',
  page: 1,
  limit: 20,
  sortBy: 'newest',
);
```

**Available Methods:**
- `getCategories()` - All categories
- `getCategory(id)` - Single category
- `getCategoryProducts(id)` - Products in category

---

### 3. Brands API

```dart
// Get all brands
final brands = await ApiService.brands.getBrands();

// Get single brand
final brand = await ApiService.brands.getBrand('brand-uuid');

// Get brand products
final brandProducts = await ApiService.brands.getBrandProducts(
  'brand-uuid',
  page: 1,
  limit: 20,
);
```

**Available Methods:**
- `getBrands()` - All brands
- `getBrand(id)` - Single brand
- `getBrandProducts(id)` - Products by brand

---

### 4. Content/CMS API

```dart
// Get banners by placement
final heroBanners = await ApiService.content.getBanners(
  placement: BannerPlacement.homeHero,
);

// Get landing page
final landingPage = await ApiService.content.getLandingPage('holiday-sale');
```

**Available Methods:**
- `getBanners()` - Active banners filtered by placement
- `getLandingPage(slug)` - Landing page with sections

**Banner Placements:**
- `BannerPlacement.homeHero`
- `BannerPlacement.homeMid`
- `BannerPlacement.categoryTop`
- `BannerPlacement.categoryMid`
- `BannerPlacement.productSidebar`
- `BannerPlacement.checkoutTop`

---

### 5. Authentication API

```dart
// Register user
final authResponse = await ApiService.auth.register(
  email: 'user@example.com',
  password: 'SecurePass123!',
  firstName: 'John',
  lastName: 'Doe',
  phone: '+971501234567',
);
// Tokens automatically saved to secure storage

// Login user
final authResponse = await ApiService.auth.login(
  email: 'user@example.com',
  password: 'SecurePass123!',
);

// Get current user
final user = await ApiService.auth.getCurrentUser();

// Change password
await ApiService.auth.changePassword(
  currentPassword: 'OldPass123!',
  newPassword: 'NewPass456!',
);

// Logout
await ApiService.auth.logout();
```

**Available Methods:**
- `register()` - Create new user account
- `login()` - Authenticate user
- `logout()` - Clear session
- `getCurrentUser()` - Get authenticated user profile
- `changePassword()` - Update user password

---

## Features

### 1. Automatic Token Refresh

The `ApiClient` automatically handles 401 Unauthorized responses by:

1. Detecting 401 status code
2. Calling `/api/auth/refresh` with refresh token
3. Saving new tokens to secure storage
4. Retrying original request with new access token
5. Clearing tokens if refresh fails

**Implementation:**
```dart
// Token refresh happens automatically
final response = await ApiService.products.getProducts(requiresAuth: true);
// If access token expired, client automatically refreshes and retries
```

### 2. Secure Token Storage

Tokens are stored using `flutter_secure_storage`:
- iOS: Keychain
- Android: EncryptedSharedPreferences (AES encryption)
- Web: Web Crypto API
- Windows: Windows Credential Store

**Access:**
```dart
// Get tokens (usually not needed - client handles this)
final accessToken = await ApiService.client.getAccessToken();
final refreshToken = await ApiService.client.getRefreshToken();

// Clear tokens
await ApiService.client.clearTokens();
```

### 3. Debug Logging

Request/response logging enabled in debug mode only:

**Example Output:**
```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
➤ REQUEST: GET http://localhost:3000/api/products?page=1&limit=20
Headers: {Content-Type: application/json, Accept: application/json}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
➤ RESPONSE ✓ 200
Body: {"data":[...],"meta":{"total":805,"page":1,"limit":20,"totalPages":41}}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 4. Error Handling

All API calls throw `ApiException` on failure:

```dart
try {
  final products = await ApiService.products.getProducts();
} on ApiException catch (e) {
  print('API Error (${e.statusCode}): ${e.message}');
  // Handle specific status codes
  switch (e.statusCode) {
    case 401:
      // Redirect to login
      break;
    case 404:
      // Show not found message
      break;
    case 500:
      // Show server error message
      break;
  }
} catch (e) {
  print('Network error: $e');
}
```

### 5. Type-Safe DTOs

All responses are parsed into type-safe data models:

**Example:**
```dart
class ProductDto {
  final String id;
  final String name;
  final double price;
  final bool inStock;
  // ... other fields

  factory ProductDto.fromJson(Map<String, dynamic> json) {
    return ProductDto(
      id: json['id'] as String,
      name: json['name'] as String,
      price: (json['price'] as num).toDouble(),
      inStock: json['inStock'] as bool,
    );
  }
}
```

## File Structure

```
lib/
├── config/
│   └── app_config.dart              # Environment configuration
├── services/
│   ├── api_client.dart              # Base HTTP client
│   ├── api_service.dart             # Service factory
│   └── api/
│       ├── auth_api.dart            # Authentication endpoints
│       ├── products_api.dart        # Products endpoints
│       ├── categories_api.dart      # Categories endpoints
│       ├── brands_api.dart          # Brands endpoints
│       ├── departments_api.dart     # Departments endpoints
│       └── content_api.dart         # CMS/Content endpoints
├── models/
│   └── dto/
│       ├── auth_dto.dart            # User, tokens DTOs
│       ├── product_dto.dart         # Product, category, brand DTOs
│       └── content_dto.dart         # Banner, landing page DTOs
└── examples/
    └── api_usage_examples.dart      # Complete usage examples
```

## Complete Example: Homepage Data

```dart
import 'package:solo_ecommerce/services/api_service.dart';

Future<Map<String, dynamic>> loadHomepageData() async {
  try {
    // Load all data in parallel for best performance
    final results = await Future.wait([
      ApiService.content.getBanners(placement: 'HOME_HERO'),
      ApiService.products.getFeatured(limit: 8),
      ApiService.products.getBestSellers(limit: 8),
      ApiService.products.getNewArrivals(limit: 8),
      ApiService.categories.getCategories(),
      ApiService.brands.getBrands(),
    ]);

    return {
      'heroBanners': results[0],
      'featuredProducts': results[1],
      'bestSellers': results[2],
      'newArrivals': results[3],
      'categories': results[4],
      'brands': results[5],
    };
  } catch (e) {
    print('Error loading homepage: $e');
    rethrow;
  }
}
```

## Testing

### Manual Testing with Backend

1. **Start backend:**
```bash
cd backend
npm run start:dev
```

2. **Run Flutter app:**
```bash
cd frontend
flutter run -d chrome
```

3. **Test API calls:**
```dart
// In your Flutter app
await ApiService.products.getFeatured();
// Check logs for request/response details
```

### Integration Testing

```dart
// test/api_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:solo_ecommerce/services/api_service.dart';

void main() {
  setUpAll(() {
    ApiService.initialize(baseUrl: 'http://localhost:3000');
  });

  group('Products API', () {
    test('should fetch featured products', () async {
      final products = await ApiService.products.getFeatured();
      expect(products, isNotEmpty);
      expect(products.first.id, isNotEmpty);
    });

    test('should fetch products with pagination', () async {
      final result = await ApiService.products.getProducts(page: 1, limit: 20);
      expect(result.data, isNotEmpty);
      expect(result.meta.total, greaterThan(0));
    });
  });

  group('Auth API', () {
    test('should handle login', () async {
      final response = await ApiService.auth.login(
        email: 'test@example.com',
        password: 'password123',
      );
      expect(response.user.email, 'test@example.com');
      expect(response.tokens.accessToken, isNotEmpty);
    });
  });
}
```

## Production Checklist

- [x] HTTP client with retry logic
- [x] Automatic token refresh on 401
- [x] Secure token storage (Keychain/EncryptedSharedPreferences)
- [x] Request/response logging (debug only)
- [x] Type-safe DTOs for all responses
- [x] Environment-based configuration
- [x] Centralized error handling
- [x] Parallel request support
- [ ] Add request timeout handling
- [ ] Add connection error retry with exponential backoff
- [ ] Add request caching for GET endpoints
- [ ] Add optimistic updates for mutations
- [ ] Add request queue for offline support

## Performance Tips

1. **Use parallel requests:**
```dart
final [products, categories] = await Future.wait([
  ApiService.products.getFeatured(),
  ApiService.categories.getCategories(),
]);
```

2. **Cache responses in provider/state management:**
```dart
class ProductsProvider extends ChangeNotifier {
  List<ProductDto>? _featuredProducts;
  
  Future<List<ProductDto>> getFeatured() async {
    if (_featuredProducts != null) return _featuredProducts!;
    _featuredProducts = await ApiService.products.getFeatured();
    notifyListeners();
    return _featuredProducts!;
  }
}
```

3. **Use pagination for large lists:**
```dart
int currentPage = 1;
final products = await ApiService.products.getProducts(
  page: currentPage,
  limit: 20,
);
```

## Troubleshooting

### Common Issues

**1. "ApiService not initialized"**
```dart
// Add to main.dart before runApp()
ApiService.initialize();
```

**2. "Connection refused"**
```dart
// Ensure backend is running on http://localhost:3000
// Check AppConfig.apiBaseUrl matches backend port
```

**3. "401 Unauthorized after login"**
```dart
// Tokens are automatically saved after login
// Check flutter_secure_storage permissions in AndroidManifest.xml
```

**4. "No logs in console"**
```dart
// Logs only appear in debug mode
// Run with: flutter run (not flutter run --release)
```

## API Documentation

Full backend API documentation: [BACKEND_API_DOCUMENTATION.md](../../backend/BACKEND_API_DOCUMENTATION.md)

CMS API documentation: [CMS_IMPLEMENTATION.md](../../backend/CMS_IMPLEMENTATION.md)

---

**Implementation Date:** December 28, 2025  
**Framework:** Flutter 3.6+  
**HTTP Client:** package:http 1.2.0
