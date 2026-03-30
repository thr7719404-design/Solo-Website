import '../api_client.dart';
import '../../models/dto/product_dto.dart';
import '../../core/events/app_event_bus.dart';

/// Products API service
class ProductsApi {
  final ApiClient _client;

  ProductsApi(this._client);

  /// Event bus for cross-component sync
  final _eventBus = AppEventBus();

  // ─────────────────────────────────────────────────────────────────────────
  // Inventory Categories/Brands (for product form dropdowns)
  // ─────────────────────────────────────────────────────────────────────────

  /// Get inventory categories for product form dropdown
  /// Returns categories from the inventory schema (Int IDs)
  Future<List<Map<String, dynamic>>> getInventoryCategories() async {
    const apiUrl = '/products/inventory/categories';

    final response = await _client.get(apiUrl);
    final data = response.getDataOrThrow();
    if (data is List) {
      final categories = data.cast<Map<String, dynamic>>();

      return categories;
    }
    return [];
  }

  /// Get inventory brands for product form dropdown
  /// Returns brands from the inventory schema (Int IDs)
  Future<List<Map<String, dynamic>>> getInventoryBrands() async {
    final response = await _client.get('/products/inventory/brands');
    final data = response.getDataOrThrow();
    if (data is List) {
      return data.cast<Map<String, dynamic>>();
    }
    return [];
  }

  /// Get paginated list of products
  Future<ProductListDto> getProducts({
    int page = 1,
    int limit = 20,
    String? sortBy,
    String? categoryId,
    String? subcategoryId,
    String? brandId,
    List<String>? brandIds,
    double? minPrice,
    double? maxPrice,
    String? search,
    bool? isFeatured,
    bool? isNew,
    bool? isBestSeller,
    bool? inStock,
    String? status, // 'all', 'active', 'draft', 'out_of_stock'
  }) async {
    final queryParams = <String, dynamic>{
      'page': page,
      'limit': limit,
      if (sortBy != null) 'sortBy': sortBy,
      if (categoryId != null) 'categoryId': categoryId,
      if (subcategoryId != null) 'subcategoryId': subcategoryId,
      if (brandId != null) 'brandId': brandId,
      if (brandIds != null && brandIds.isNotEmpty) ...{
        for (int i = 0; i < brandIds.length; i++) 'brandIds[$i]': brandIds[i]
      },
      if (minPrice != null) 'minPrice': minPrice,
      if (maxPrice != null) 'maxPrice': maxPrice,
      if (search != null) 'search': search,
      if (isFeatured != null) 'isFeatured': isFeatured,
      if (isNew != null) 'isNew': isNew,
      if (isBestSeller != null) 'isBestSeller': isBestSeller,
      if (inStock != null) 'inStock': inStock,
      if (status != null && status != 'all') 'status': status,
    };

    final response = await _client.get(
      '/products',
      queryParams: queryParams,
    );

    return ProductListDto.fromJson(response.getDataOrThrow());
  }

  /// Get single product by ID
  Future<ProductDto> getProduct(String id) async {
    final response = await _client.get('/products/$id');
    return ProductDto.fromJson(response.getDataOrThrow());
  }

  /// Get featured products
  Future<List<ProductDto>> getFeatured({int limit = 8}) async {
    final response = await _client.get(
      '/products/featured',
      queryParams: {'limit': limit},
    );

    final data = response.getDataOrThrow();
    return (data['data'] as List<dynamic>)
        .map((e) => ProductDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Get best seller products
  Future<List<ProductDto>> getBestSellers({int limit = 8}) async {
    final response = await _client.get(
      '/products/best-sellers',
      queryParams: {'limit': limit},
    );

    final data = response.getDataOrThrow();
    return (data['data'] as List<dynamic>)
        .map((e) => ProductDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Get new arrival products
  Future<List<ProductDto>> getNewArrivals({int limit = 8}) async {
    final response = await _client.get(
      '/products/new-arrivals',
      queryParams: {'limit': limit},
    );

    final data = response.getDataOrThrow();
    return (data['data'] as List<dynamic>)
        .map((e) => ProductDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Get related products
  Future<List<ProductDto>> getRelatedProducts(String productId,
      {int limit = 6}) async {
    final response = await _client.get(
      '/products/$productId/related',
      queryParams: {'limit': limit},
    );

    final data = response.getDataOrThrow();
    return (data['data'] as List<dynamic>)
        .map((e) => ProductDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Create product override (Admin only)
  Future<ProductDto> createProduct(Map<String, dynamic> data) async {
    final response = await _client.post(
      '/products',
      body: data,
      requiresAuth: true,
    );

    final product = ProductDto.fromJson(response.getDataOrThrow());
    _eventBus.emitCatalogChanged();
    return product;
  }

  /// Update product override (Admin only)
  Future<ProductDto> updateProduct(
      String productId, Map<String, dynamic> data) async {
    final response = await _client.patch(
      '/products/$productId',
      body: data,
      requiresAuth: true,
    );

    final product = ProductDto.fromJson(response.getDataOrThrow());
    _eventBus.emitCatalogChanged();
    return product;
  }

  /// Delete product override (Admin only)
  Future<void> deleteProduct(String productId) async {
    await _client.delete('/products/$productId', requiresAuth: true);
    _eventBus.emitCatalogChanged();
  }
}
