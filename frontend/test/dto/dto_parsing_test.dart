import 'package:flutter_test/flutter_test.dart';
import 'package:solo_ecommerce/core/dto/dto.dart';

void main() {
  group('Base DTO Helpers', () {
    test('parseString handles null', () {
      expect(parseString(null), equals(''));
      expect(parseString(null, 'default'), equals('default'));
    });

    test('parseString handles various types', () {
      expect(parseString('hello'), equals('hello'));
      expect(parseString(123), equals('123'));
      expect(parseString(12.5), equals('12.5'));
      expect(parseString(true), equals('true'));
    });

    test('parseInt handles null', () {
      expect(parseInt(null), equals(0));
      expect(parseInt(null, 42), equals(42));
    });

    test('parseInt handles various types', () {
      expect(parseInt(123), equals(123));
      expect(parseInt(12.9), equals(12));
      expect(parseInt('45'), equals(45));
      expect(parseInt('invalid'), equals(0));
    });

    test('parseDouble handles null', () {
      expect(parseDouble(null), equals(0.0));
      expect(parseDouble(null, 3.14), equals(3.14));
    });

    test('parseDouble handles various types', () {
      expect(parseDouble(12.5), equals(12.5));
      expect(parseDouble(10), equals(10.0));
      expect(parseDouble('3.14'), equals(3.14));
      expect(parseDouble('invalid'), equals(0.0));
    });

    test('parseBool handles null', () {
      expect(parseBool(null), equals(false));
      expect(parseBool(null, true), equals(true));
    });

    test('parseBool handles various types', () {
      expect(parseBool(true), equals(true));
      expect(parseBool(false), equals(false));
      expect(parseBool('true'), equals(true));
      expect(parseBool('TRUE'), equals(true));
      expect(parseBool('1'), equals(true));
      expect(parseBool('false'), equals(false));
      expect(parseBool(1), equals(true));
      expect(parseBool(0), equals(false));
    });

    test('parseDateTime handles null', () {
      expect(parseDateTime(null), isNull);
      final defaultDate = DateTime(2024, 1, 1);
      expect(parseDateTime(null, defaultDate), equals(defaultDate));
    });

    test('parseDateTime handles valid strings', () {
      final result = parseDateTime('2024-12-28T10:30:00.000Z');
      expect(result, isNotNull);
      expect(result!.year, equals(2024));
      expect(result.month, equals(12));
      expect(result.day, equals(28));
    });

    test('parseDateTime handles invalid strings', () {
      expect(parseDateTime('not-a-date'), isNull);
    });

    test('parseList handles null', () {
      expect(parseList<int>(null, (e) => e as int), isEmpty);
    });

    test('parseList maps items correctly', () {
      final result = parseList<int>([1, 2, 3], (e) => (e as int) * 2);
      expect(result, equals([2, 4, 6]));
    });
  });

  group('ProductDto', () {
    test('parses complete JSON correctly', () {
      final json = {
        'id': '123',
        'sku': 'TEST-001',
        'name': 'Test Product',
        'description': 'A test product',
        'price': 99.99,
        'listPrice': 129.99,
        'currency': 'AED',
        'images': [
          {'url': 'http://example.com/image1.jpg', 'isPrimary': true},
          {'url': 'http://example.com/image2.jpg', 'isPrimary': false},
        ],
        'category': {'id': '1', 'name': 'Test Category'},
        'brand': {'id': '2', 'name': 'Test Brand'},
        'isFeatured': true,
        'isNew': false,
        'isBestSeller': true,
        'stock': 100,
        'inStock': true,
        'specifications': [
          {'key': 'Weight', 'value': '500g'},
          {'key': 'Material', 'value': 'Steel'},
        ],
        'createdAt': '2024-12-28T00:00:00.000Z',
        'updatedAt': '2024-12-28T12:00:00.000Z',
      };

      final product = ProductDto.fromJson(json);

      expect(product.id, equals('123'));
      expect(product.sku, equals('TEST-001'));
      expect(product.name, equals('Test Product'));
      expect(product.price, equals(99.99));
      expect(product.listPrice, equals(129.99));
      expect(product.images.length, equals(2));
      expect(product.images.first.url, equals('http://example.com/image1.jpg'));
      expect(product.category?.name, equals('Test Category'));
      expect(product.brand?.name, equals('Test Brand'));
      expect(product.isFeatured, isTrue);
      expect(product.isNew, isFalse);
      expect(product.isBestSeller, isTrue);
      expect(product.specifications.length, equals(2));
    });

    test('handles missing optional fields with defaults', () {
      final json = {
        'id': '123',
        'sku': 'TEST-001',
        'name': 'Test Product',
        'price': 50.0,
        'createdAt': '2024-12-28T00:00:00.000Z',
        'updatedAt': '2024-12-28T00:00:00.000Z',
      };

      final product = ProductDto.fromJson(json);

      expect(product.id, equals('123'));
      expect(product.description, isEmpty);
      expect(product.listPrice, isNull);
      expect(product.salePrice, isNull);
      expect(product.currency, equals('AED'));
      expect(product.imageUrl, isEmpty);
      expect(product.images, isEmpty);
      expect(product.category, isNull);
      expect(product.brand, isNull);
      expect(product.isFeatured, isFalse);
      expect(product.isNew, isFalse);
      expect(product.isBestSeller, isFalse);
      expect(product.stock, equals(0));
      expect(product.inStock, isTrue); // defaults to true
      expect(product.specifications, isEmpty);
    });

    test('handles images as string array', () {
      final json = {
        'id': '123',
        'sku': 'TEST-001',
        'name': 'Test Product',
        'price': 50.0,
        'images': [
          'http://example.com/img1.jpg',
          'http://example.com/img2.jpg'
        ],
        'createdAt': '2024-12-28T00:00:00.000Z',
        'updatedAt': '2024-12-28T00:00:00.000Z',
      };

      final product = ProductDto.fromJson(json);

      expect(product.images.length, equals(2));
      expect(product.images[0].url, equals('http://example.com/img1.jpg'));
      expect(product.imageUrl, equals('http://example.com/img1.jpg'));
    });

    test('handles null id gracefully', () {
      final json = {
        'sku': 'TEST-001',
        'name': 'Test Product',
        'price': 50.0,
        'createdAt': '2024-12-28T00:00:00.000Z',
        'updatedAt': '2024-12-28T00:00:00.000Z',
      };

      final product = ProductDto.fromJson(json);
      expect(product.id, isEmpty);
    });

    test('toJson produces valid JSON', () {
      final product = ProductDto(
        id: '123',
        sku: 'TEST-001',
        name: 'Test Product',
        description: 'Description',
        price: 99.99,
        imageUrl: 'http://example.com/img.jpg',
        images: [],
        stock: 50,
        inStock: true,
        isFeatured: true,
        isNew: false,
        isBestSeller: false,
        specifications: [],
        features: [],
        createdAt: DateTime(2024, 12, 28),
        updatedAt: DateTime(2024, 12, 28),
      );

      final json = product.toJson();

      expect(json['id'], equals('123'));
      expect(json['sku'], equals('TEST-001'));
      expect(json['price'], equals(99.99));
      expect(json['isFeatured'], isTrue);
    });
  });

  group('CategoryDto', () {
    test('parses complete JSON correctly', () {
      final json = {
        'id': 1,
        'name': 'Electronics',
        'slug': 'electronics',
        'description': 'Electronic devices',
        'displayOrder': 1,
        'isActive': true,
        'productCount': 150,
        'subcategories': [
          {'id': 10, 'name': 'Phones', 'categoryId': '1'},
        ],
        'createdAt': '2024-12-28T00:00:00.000Z',
        'updatedAt': '2024-12-28T00:00:00.000Z',
      };

      final category = CategoryDto.fromJson(json);

      expect(category.id, equals('1'));
      expect(category.name, equals('Electronics'));
      expect(category.slug, equals('electronics'));
      expect(category.displayOrder, equals(1));
      expect(category.isActive, isTrue);
      expect(category.productCount, equals(150));
      expect(category.subcategories.length, equals(1));
    });

    test('handles _count object for productCount', () {
      final json = {
        'id': 1,
        'name': 'Electronics',
        '_count': {'products': 42},
      };

      final category = CategoryDto.fromJson(json);
      expect(category.productCount, equals(42));
    });

    test('handles categoryName field (backend variant)', () {
      final json = {
        'id': 1,
        'categoryName': 'Tea & Coffee',
        'category_name': null,
      };

      final category = CategoryDto.fromJson(json);
      expect(category.name, equals('Tea & Coffee'));
    });

    test('uses id as slug fallback', () {
      final json = {
        'id': 5,
        'name': 'Category',
      };

      final category = CategoryDto.fromJson(json);
      expect(category.slug, equals('5'));
    });

    test('handles missing optional fields', () {
      final json = {
        'id': 1,
        'name': 'Minimal Category',
      };

      final category = CategoryDto.fromJson(json);

      expect(category.description, isNull);
      expect(category.image, isNull);
      expect(category.displayOrder, equals(0));
      expect(category.isActive, isTrue);
      expect(category.productCount, equals(0));
      expect(category.subcategories, isEmpty);
    });
  });

  group('BrandDto', () {
    test('parses complete JSON correctly', () {
      final json = {
        'id': 5,
        'name': 'Eva Solo',
        'slug': 'eva-solo',
        'description': 'Danish design',
        'logo': 'http://example.com/logo.png',
        'website': 'https://evasolo.com',
        'isActive': true,
        'productCount': 554,
      };

      final brand = BrandDto.fromJson(json);

      expect(brand.id, equals('5'));
      expect(brand.name, equals('Eva Solo'));
      expect(brand.slug, equals('eva-solo'));
      expect(brand.website, equals('https://evasolo.com'));
      expect(brand.productCount, equals(554));
    });

    test('handles brandName field', () {
      final json = {
        'id': 5,
        'brandName': 'Eva Solo',
      };

      final brand = BrandDto.fromJson(json);
      expect(brand.name, equals('Eva Solo'));
    });

    test('handles _count object', () {
      final json = {
        'id': 1,
        'name': 'Brand',
        '_count': {'products': 100},
      };

      final brand = BrandDto.fromJson(json);
      expect(brand.productCount, equals(100));
    });
  });

  group('BannerDto', () {
    test('parses complete JSON correctly', () {
      final json = {
        'id': 'banner-1',
        'placement': 'HOME_HERO',
        'title': 'Summer Sale',
        'subtitle': 'Up to 50% off',
        'ctaText': 'Shop Now',
        'ctaUrl': '/products?sale=true',
        'imageDesktopUrl': 'http://example.com/banner.jpg',
        'imageMobileUrl': 'http://example.com/banner-mobile.jpg',
        'startAt': '2024-12-01T00:00:00.000Z',
        'endAt': '2024-12-31T23:59:59.000Z',
        'displayOrder': 1,
        'isActive': true,
        'createdAt': '2024-12-01T00:00:00.000Z',
        'updatedAt': '2024-12-15T00:00:00.000Z',
      };

      final banner = BannerDto.fromJson(json);

      expect(banner.id, equals('banner-1'));
      expect(banner.placement, equals('HOME_HERO'));
      expect(banner.title, equals('Summer Sale'));
      expect(banner.subtitle, equals('Up to 50% off'));
      expect(banner.ctaText, equals('Shop Now'));
      expect(banner.imageDesktopUrl, equals('http://example.com/banner.jpg'));
      expect(banner.startAt, isNotNull);
      expect(banner.endAt, isNotNull);
      expect(banner.displayOrder, equals(1));
      expect(banner.isActive, isTrue);
    });

    test('handles missing optional fields', () {
      final json = {
        'id': 'banner-1',
        'placement': 'HOME_HERO',
        'title': 'Banner Title',
        'imageDesktopUrl': 'http://example.com/banner.jpg',
        'createdAt': '2024-12-01T00:00:00.000Z',
        'updatedAt': '2024-12-15T00:00:00.000Z',
      };

      final banner = BannerDto.fromJson(json);

      expect(banner.subtitle, isNull);
      expect(banner.ctaText, isNull);
      expect(banner.ctaUrl, isNull);
      expect(banner.imageMobileUrl, isNull);
      expect(banner.startAt, isNull);
      expect(banner.endAt, isNull);
      expect(banner.displayOrder, equals(0));
      expect(banner.isActive, isTrue);
    });

    test('isWithinDateWindow returns true when no dates set', () {
      final banner = BannerDto(
        id: '1',
        placement: 'HOME_HERO',
        title: 'Test',
        imageDesktopUrl: 'http://example.com/img.jpg',
        isActive: true,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      expect(banner.isWithinDateWindow, isTrue);
    });

    test('shouldDisplay checks both isActive and date window', () {
      final activeBanner = BannerDto(
        id: '1',
        placement: 'HOME_HERO',
        title: 'Test',
        imageDesktopUrl: 'http://example.com/img.jpg',
        isActive: true,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      final inactiveBanner = BannerDto(
        id: '2',
        placement: 'HOME_HERO',
        title: 'Test',
        imageDesktopUrl: 'http://example.com/img.jpg',
        isActive: false,
        createdAt: DateTime.now(),
        updatedAt: DateTime.now(),
      );

      expect(activeBanner.shouldDisplay, isTrue);
      expect(inactiveBanner.shouldDisplay, isFalse);
    });
  });

  group('PaginationMeta', () {
    test('parses correctly', () {
      final json = {
        'total': 100,
        'page': 2,
        'limit': 20,
        'totalPages': 5,
      };

      final meta = PaginationMeta.fromJson(json);

      expect(meta.total, equals(100));
      expect(meta.page, equals(2));
      expect(meta.limit, equals(20));
      expect(meta.totalPages, equals(5));
    });

    test('hasNextPage and hasPrevPage work correctly', () {
      final firstPage =
          PaginationMeta(total: 100, page: 1, limit: 20, totalPages: 5);
      final middlePage =
          PaginationMeta(total: 100, page: 3, limit: 20, totalPages: 5);
      final lastPage =
          PaginationMeta(total: 100, page: 5, limit: 20, totalPages: 5);

      expect(firstPage.hasPrevPage, isFalse);
      expect(firstPage.hasNextPage, isTrue);

      expect(middlePage.hasPrevPage, isTrue);
      expect(middlePage.hasNextPage, isTrue);

      expect(lastPage.hasPrevPage, isTrue);
      expect(lastPage.hasNextPage, isFalse);
    });
  });

  group('PaginatedList', () {
    test('parses product list correctly', () {
      final json = {
        'data': [
          {
            'id': '1',
            'sku': 'P1',
            'name': 'Product 1',
            'price': 10.0,
            'createdAt': '2024-12-28T00:00:00Z',
            'updatedAt': '2024-12-28T00:00:00Z'
          },
          {
            'id': '2',
            'sku': 'P2',
            'name': 'Product 2',
            'price': 20.0,
            'createdAt': '2024-12-28T00:00:00Z',
            'updatedAt': '2024-12-28T00:00:00Z'
          },
        ],
        'meta': {
          'total': 50,
          'page': 1,
          'limit': 20,
          'totalPages': 3,
        },
      };

      final list = PaginatedList<ProductDto>.fromJson(
        json,
        (j) => ProductDto.fromJson(j),
      );

      expect(list.data.length, equals(2));
      expect(list.data[0].name, equals('Product 1'));
      expect(list.meta.total, equals(50));
      expect(list.meta.page, equals(1));
    });

    test('handles flat pagination fields', () {
      final json = {
        'data': [
          {
            'id': '1',
            'sku': 'P1',
            'name': 'Product 1',
            'price': 10.0,
            'createdAt': '2024-12-28T00:00:00Z',
            'updatedAt': '2024-12-28T00:00:00Z'
          },
        ],
        'total': 25,
        'page': 2,
        'limit': 10,
        'totalPages': 3,
      };

      final list = PaginatedList<ProductDto>.fromJson(
        json,
        (j) => ProductDto.fromJson(j),
      );

      expect(list.meta.total, equals(25));
      expect(list.meta.page, equals(2));
    });
  });

  group('DashboardStatsDto', () {
    test('parses complete JSON correctly', () {
      final json = {
        'ordersToday': 10,
        'ordersThisWeek': 50,
        'ordersThisMonth': 200,
        'revenueToday': 1000.0,
        'revenueThisWeek': 5000.0,
        'revenueThisMonth': 20000.0,
        'totalCustomers': 500,
        'newCustomersToday': 5,
        'topProducts': [],
        'lowStockProducts': [],
        'activeBanners': 3,
        'totalBanners': 5,
        'recentOrders': [],
        'ordersByStatus': [],
      };

      final stats = DashboardStatsDto.fromJson(json);

      expect(stats.ordersToday, equals(10));
      expect(stats.revenueToday, equals(1000.0));
      expect(stats.totalCustomers, equals(500));
      expect(stats.activeBanners, equals(3));
    });

    test('handles missing fields with defaults', () {
      final json = <String, dynamic>{};

      final stats = DashboardStatsDto.fromJson(json);

      expect(stats.ordersToday, equals(0));
      expect(stats.revenueToday, equals(0.0));
      expect(stats.totalCustomers, equals(0));
      expect(stats.topProducts, isEmpty);
      expect(stats.recentOrders, isEmpty);
    });
  });

  group('UserDto', () {
    test('parses complete JSON correctly', () {
      final json = {
        'id': 'user-123',
        'email': 'admin@example.com',
        'firstName': 'John',
        'lastName': 'Doe',
        'phone': '+1234567890',
        'role': 'ADMIN',
        'isActive': true,
        'isEmailVerified': true,
      };

      final user = UserDto.fromJson(json);

      expect(user.id, equals('user-123'));
      expect(user.email, equals('admin@example.com'));
      expect(user.fullName, equals('John Doe'));
      expect(user.isAdmin, isTrue);
      expect(user.isSuperAdmin, isFalse);
    });

    test('isAdmin returns true for ADMIN and SUPER_ADMIN', () {
      final admin = UserDto.fromJson({
        'id': '1',
        'email': 'a@b.com',
        'firstName': 'A',
        'lastName': 'B',
        'role': 'ADMIN'
      });
      final superAdmin = UserDto.fromJson({
        'id': '2',
        'email': 'c@d.com',
        'firstName': 'C',
        'lastName': 'D',
        'role': 'SUPER_ADMIN'
      });
      final customer = UserDto.fromJson({
        'id': '3',
        'email': 'e@f.com',
        'firstName': 'E',
        'lastName': 'F',
        'role': 'CUSTOMER'
      });

      expect(admin.isAdmin, isTrue);
      expect(superAdmin.isAdmin, isTrue);
      expect(customer.isAdmin, isFalse);
    });
  });
}
