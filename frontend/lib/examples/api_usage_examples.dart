import 'package:flutter/material.dart';
import '../services/api_service.dart';
import '../models/dto/product_dto.dart';
import '../models/dto/content_dto.dart';

/// Example usage of API services
class ApiUsageExamples {
  // ============================================================================
  // PRODUCTS API EXAMPLES
  // ============================================================================

  /// Example: Load products with filters
  Future<void> loadProductsExample() async {
    try {
      // Get featured products
      final featured = await ApiService.products.getFeatured(limit: 8);
      debugPrint('Loaded ${featured.length} featured products');

      // Get paginated products with filters
      final productList = await ApiService.products.getProducts(
        page: 1,
        limit: 20,
        sortBy: 'price_low',
        minPrice: 10,
        maxPrice: 100,
        inStock: true,
      );
      debugPrint('Total products: ${productList.meta.total}');
      debugPrint('Loaded ${productList.data.length} products');

      // Get single product
      if (productList.data.isNotEmpty) {
        final product = await ApiService.products.getProduct(
          productList.data.first.id,
        );
        debugPrint('Product: ${product.name} - \$${product.price}');
      }

      // Get related products
      if (productList.data.isNotEmpty) {
        final related = await ApiService.products.getRelatedProducts(
          productList.data.first.id,
          limit: 6,
        );
        debugPrint('Found ${related.length} related products');
      }
    } catch (e) {
      debugPrint('Error loading products: $e');
    }
  }

  // ============================================================================
  // CATEGORIES API EXAMPLES
  // ============================================================================

  /// Example: Load categories
  Future<void> loadCategoriesExample() async {
    try {
      // Get all categories
      final categories = await ApiService.categories.getCategories();
      debugPrint('Loaded ${categories.length} categories');

      // Get single category
      if (categories.isNotEmpty) {
        final category = await ApiService.categories.getCategory(
          categories.first.id,
        );
        debugPrint('Category: ${category.name}');

        // Get products in category
        final categoryProducts =
            await ApiService.categories.getCategoryProducts(
          category.id,
          page: 1,
          limit: 20,
        );
        debugPrint('Category has ${categoryProducts.meta.total} products');
      }
    } catch (e) {
      debugPrint('Error loading categories: $e');
    }
  }

  // ============================================================================
  // BRANDS API EXAMPLES
  // ============================================================================

  /// Example: Load brands
  Future<void> loadBrandsExample() async {
    try {
      // Get all brands
      final brands = await ApiService.brands.getBrands();
      debugPrint('Loaded ${brands.length} brands');

      // Get brand products
      if (brands.isNotEmpty) {
        final brandProducts = await ApiService.brands.getBrandProducts(
          brands.first.id,
          page: 1,
          limit: 20,
        );
        debugPrint('Brand has ${brandProducts.meta.total} products');
      }
    } catch (e) {
      debugPrint('Error loading brands: $e');
    }
  }

  // ============================================================================
  // CONTENT/CMS API EXAMPLES
  // ============================================================================

  /// Example: Load CMS content
  Future<void> loadContentExample() async {
    try {
      // Get home hero banners
      final heroBanners = await ApiService.content.getBanners(
        placement: 'HOME_HERO',
      );
      debugPrint('Loaded ${heroBanners.length} hero banners');

      for (final banner in heroBanners) {
        debugPrint('Banner: ${banner.title}');
        debugPrint('  Image: ${banner.imageDesktopUrl}');
        debugPrint('  CTA: ${banner.ctaText} -> ${banner.ctaUrl}');
      }

      // Get landing page by slug
      try {
        final landingPage =
            await ApiService.content.getLandingPage('holiday-sale');
        debugPrint('Landing page: ${landingPage.title}');
        debugPrint('  Sections: ${landingPage.sections.length}');

        for (final section in landingPage.sections) {
          debugPrint('  - ${section.type}: ${section.data}');
        }
      } catch (e) {
        debugPrint('Landing page not found (expected if none created yet)');
      }
    } catch (e) {
      debugPrint('Error loading content: $e');
    }
  }

  // ============================================================================
  // AUTHENTICATION API EXAMPLES
  // ============================================================================

  /// Example: User registration
  Future<void> registerExample() async {
    try {
      final authResponse = await ApiService.auth.register(
        email: 'user@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+971501234567',
      );

      debugPrint('Registered user: ${authResponse.user.email}');
      debugPrint(
          'Access token: ${authResponse.tokens.accessToken.substring(0, 20)}...');
    } catch (e) {
      debugPrint('Registration error: $e');
    }
  }

  /// Example: User login
  Future<void> loginExample() async {
    try {
      final authResponse = await ApiService.auth.login(
        email: 'user@example.com',
        password: 'SecurePass123!',
      );

      debugPrint('Logged in user: ${authResponse.user.email}');
      debugPrint('Role: ${authResponse.user.role}');
    } catch (e) {
      debugPrint('Login error: $e');
    }
  }

  /// Example: Get current user
  Future<void> getCurrentUserExample() async {
    try {
      final user = await ApiService.auth.getCurrentUser();
      debugPrint('Current user: ${user.firstName} ${user.lastName}');
      debugPrint('Email: ${user.email}');
      debugPrint('Role: ${user.role}');
    } catch (e) {
      debugPrint('Get current user error: $e');
    }
  }

  /// Example: Logout
  Future<void> logoutExample() async {
    try {
      await ApiService.auth.logout();
      debugPrint('Logged out successfully');
    } catch (e) {
      debugPrint('Logout error: $e');
    }
  }

  // ============================================================================
  // COMPREHENSIVE EXAMPLE
  // ============================================================================

  /// Complete example: Load homepage data
  Future<Map<String, dynamic>> loadHomepageData() async {
    try {
      // Load all data in parallel for better performance
      final results = await Future.wait([
        ApiService.content.getBanners(placement: 'HOME_HERO'),
        ApiService.products.getFeatured(limit: 8),
        ApiService.products.getBestSellers(limit: 8),
        ApiService.products.getNewArrivals(limit: 8),
        ApiService.categories.getCategories(),
        ApiService.brands.getBrands(),
      ]);

      return {
        'heroBanners': results[0] as List<BannerDto>,
        'featuredProducts': results[1] as List<ProductDto>,
        'bestSellers': results[2] as List<ProductDto>,
        'newArrivals': results[3] as List<ProductDto>,
        'categories': results[4] as List<CategoryDto>,
        'brands': results[5] as List<BrandDto>,
      };
    } catch (e) {
      debugPrint('Error loading homepage data: $e');
      rethrow;
    }
  }
}
