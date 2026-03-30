/// Unified API Service
/// Centralized factory for all API clients with event bus integration
library;

import '../api_client.dart';
import 'api.dart';
import '../dto/dto.dart';
import '../events/app_event_bus.dart';
import '../cache/ttl_cache.dart';
import '../../config/app_config.dart';

/// Centralized API service factory with caching and event integration
class Api {
  static ApiClient? _client;

  // API instances
  static ProductsApi? _productsApi;
  static CategoriesApi? _categoriesApi;
  static BrandsApi? _brandsApi;
  static ContentApi? _contentApi;
  static MediaApi? _mediaApi;
  static AuthApi? _authApi;
  static AdminApi? _adminApi;

  /// Initialize API services (call once at app startup)
  static void initialize({String? baseUrl}) {
    _client = ApiClient(
      baseUrl: baseUrl ?? AppConfig.apiBaseUrl,
    );
  }

  /// Get API client instance
  static ApiClient get client {
    if (_client == null) {
      throw StateError('API not initialized. Call Api.initialize() first.');
    }
    return _client!;
  }

  /// Products API
  static ProductsApi get products {
    _productsApi ??= ProductsApi(client);
    return _productsApi!;
  }

  /// Categories API
  static CategoriesApi get categories {
    _categoriesApi ??= CategoriesApi(client);
    return _categoriesApi!;
  }

  /// Brands API
  static BrandsApi get brands {
    _brandsApi ??= BrandsApi(client);
    return _brandsApi!;
  }

  /// Content/CMS API
  static ContentApi get content {
    _contentApi ??= ContentApi(client);
    return _contentApi!;
  }

  /// Media API
  static MediaApi get media {
    _mediaApi ??= MediaApi(client);
    return _mediaApi!;
  }

  /// Auth API
  static AuthApi get auth {
    _authApi ??= AuthApi(client);
    return _authApi!;
  }

  /// Admin API
  static AdminApi get admin {
    _adminApi ??= AdminApi(client);
    return _adminApi!;
  }

  /// Reset all services (useful for testing or logout)
  static void reset() {
    _client = null;
    _productsApi = null;
    _categoriesApi = null;
    _brandsApi = null;
    _contentApi = null;
    _mediaApi = null;
    _authApi = null;
    _adminApi = null;

    // Clear caches
    apiCache.invalidateAll();
  }

  // ===========================================================================
  // ADMIN MUTATION HELPERS WITH EVENT EMISSION
  // ===========================================================================

  /// Create product override and emit event
  static Future<ProductDto> createProductOverride(
      ProductOverrideRequest request) async {
    final product = await products.createProductOverride(request);
    appEventBus.emitCatalogChanged(productId: product.id, action: 'create');
    apiCache.invalidateCatalog();
    return product;
  }

  /// Update product override and emit event
  static Future<ProductDto> updateProductOverride(
      String productId, ProductOverrideRequest request) async {
    final product = await products.updateProductOverride(productId, request);
    appEventBus.emitCatalogChanged(productId: productId, action: 'update');
    apiCache.invalidateCatalog();
    return product;
  }

  /// Delete product override and emit event
  static Future<void> deleteProductOverride(String productId) async {
    await products.deleteProduct(productId);
    appEventBus.emitCatalogChanged(productId: productId, action: 'delete');
    apiCache.invalidateCatalog();
  }

  /// Create category and emit event
  static Future<CategoryDto> createCategory(CategoryRequest request) async {
    final category = await categories.createCategory(request);
    appEventBus.emitCategoriesChanged(
        categoryId: category.id, action: 'create');
    apiCache.invalidateCategories();
    return category;
  }

  /// Update category and emit event
  static Future<CategoryDto> updateCategory(
      String categoryId, CategoryRequest request) async {
    final category = await categories.updateCategory(categoryId, request);
    appEventBus.emitCategoriesChanged(categoryId: categoryId, action: 'update');
    apiCache.invalidateCategories();
    return category;
  }

  /// Delete category and emit event
  static Future<void> deleteCategory(String categoryId) async {
    await categories.deleteCategory(categoryId);
    appEventBus.emitCategoriesChanged(categoryId: categoryId, action: 'delete');
    apiCache.invalidateCategories();
  }

  /// Create brand and emit event
  static Future<BrandDto> createBrand(BrandRequest request) async {
    final brand = await brands.createBrand(request);
    appEventBus.emitBrandsChanged(brandId: brand.id, action: 'create');
    apiCache.invalidateBrands();
    return brand;
  }

  /// Update brand and emit event
  static Future<BrandDto> updateBrand(
      String brandId, BrandRequest request) async {
    final brand = await brands.updateBrand(brandId, request);
    appEventBus.emitBrandsChanged(brandId: brandId, action: 'update');
    apiCache.invalidateBrands();
    return brand;
  }

  /// Delete brand and emit event
  static Future<void> deleteBrand(String brandId) async {
    await brands.deleteBrand(brandId);
    appEventBus.emitBrandsChanged(brandId: brandId, action: 'delete');
    apiCache.invalidateBrands();
  }

  /// Create banner and emit event
  static Future<BannerDto> createBanner(BannerRequest request) async {
    final banner = await content.createBanner(request);
    appEventBus.emitBannersChanged(bannerId: banner.id, action: 'create');
    apiCache.invalidateContent();
    return banner;
  }

  /// Update banner and emit event
  static Future<BannerDto> updateBanner(
      String bannerId, BannerRequest request) async {
    final banner = await content.updateBanner(bannerId, request);
    appEventBus.emitBannersChanged(bannerId: bannerId, action: 'update');
    apiCache.invalidateContent();
    return banner;
  }

  /// Delete banner and emit event
  static Future<void> deleteBanner(String bannerId) async {
    await content.deleteBanner(bannerId);
    appEventBus.emitBannersChanged(bannerId: bannerId, action: 'delete');
    apiCache.invalidateContent();
  }

  /// Create landing page and emit event
  static Future<LandingPageDto> createLandingPage(
      LandingPageRequest request) async {
    final page = await content.createLandingPage(request);
    appEventBus.emitLandingPagesChanged(pageId: page.id, action: 'create');
    apiCache.invalidateContent();
    return page;
  }

  /// Update landing page and emit event
  static Future<LandingPageDto> updateLandingPage(
      String pageId, LandingPageRequest request) async {
    final page = await content.updateLandingPage(pageId, request);
    appEventBus.emitLandingPagesChanged(pageId: pageId, action: 'update');
    apiCache.invalidateContent();
    return page;
  }

  /// Delete landing page and emit event
  static Future<void> deleteLandingPage(String pageId) async {
    await content.deleteLandingPage(pageId);
    appEventBus.emitLandingPagesChanged(pageId: pageId, action: 'delete');
    apiCache.invalidateContent();
  }
}
