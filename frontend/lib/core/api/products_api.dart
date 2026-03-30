/// Unified Products API client
/// Handles both public storefront and admin product endpoints
library;

import '../../core/dto/dto.dart';
import '../api_client.dart';

class ProductsApi {
  final ApiClient _client;

  ProductsApi(this._client);

  // ===========================================================================
  // PUBLIC ENDPOINTS (Storefront)
  // ===========================================================================

  /// Get paginated list of products
  Future<PaginatedList<ProductDto>> getProducts({
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
    bool? isOnSale,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page,
      'limit': limit,
      if (sortBy != null) 'sortBy': sortBy,
      if (categoryId != null) 'categoryId': categoryId,
      if (subcategoryId != null) 'subcategoryId': subcategoryId,
      if (brandId != null) 'brandId': brandId,
      if (brandIds != null && brandIds.isNotEmpty)
        for (int i = 0; i < brandIds.length; i++) 'brandIds[$i]': brandIds[i],
      if (minPrice != null) 'minPrice': minPrice,
      if (maxPrice != null) 'maxPrice': maxPrice,
      if (search != null) 'search': search,
      if (isFeatured != null) 'isFeatured': isFeatured,
      if (isNew != null) 'isNew': isNew,
      if (isBestSeller != null) 'isBestSeller': isBestSeller,
      if (inStock != null) 'inStock': inStock,
      if (isOnSale != null) 'isOnSale': isOnSale,
    };

    final response = await _client.get(
      '/api/products',
      queryParams: queryParams,
    );

    return PaginatedList<ProductDto>.fromJson(
      response.getDataOrThrow(),
      (json) => ProductDto.fromJson(json),
    );
  }

  /// Get single product by ID
  Future<ProductDto> getProduct(String id) async {
    final response = await _client.get('/api/products/$id');
    return ProductDto.fromJson(response.getDataOrThrow());
  }

  /// Get featured products
  Future<List<ProductDto>> getFeatured({int limit = 8}) async {
    final response = await _client.get(
      '/api/products/featured',
      queryParams: {'limit': limit},
    );

    final data = response.getDataOrThrow();
    final list = data is Map ? (data['data'] as List<dynamic>?) ?? [] : data;
    return parseList<ProductDto>(
      list,
      (e) => ProductDto.fromJson(e as Map<String, dynamic>),
    );
  }

  /// Get best seller products
  Future<List<ProductDto>> getBestSellers({int limit = 8}) async {
    final response = await _client.get(
      '/api/products/best-sellers',
      queryParams: {'limit': limit},
    );

    final data = response.getDataOrThrow();
    final list = data is Map ? (data['data'] as List<dynamic>?) ?? [] : data;
    return parseList<ProductDto>(
      list,
      (e) => ProductDto.fromJson(e as Map<String, dynamic>),
    );
  }

  /// Get new arrival products
  Future<List<ProductDto>> getNewArrivals({int limit = 8}) async {
    final response = await _client.get(
      '/api/products/new-arrivals',
      queryParams: {'limit': limit},
    );

    final data = response.getDataOrThrow();
    final list = data is Map ? (data['data'] as List<dynamic>?) ?? [] : data;
    return parseList<ProductDto>(
      list,
      (e) => ProductDto.fromJson(e as Map<String, dynamic>),
    );
  }

  /// Get related products
  Future<List<ProductDto>> getRelatedProducts(String productId,
      {int limit = 6}) async {
    final response = await _client.get(
      '/api/products/$productId/related',
      queryParams: {'limit': limit},
    );

    final data = response.getDataOrThrow();
    final list = data is Map ? (data['data'] as List<dynamic>?) ?? [] : data;
    return parseList<ProductDto>(
      list,
      (e) => ProductDto.fromJson(e as Map<String, dynamic>),
    );
  }

  // ===========================================================================
  // ADMIN ENDPOINTS (Product Overrides)
  // ===========================================================================

  /// Create product override (Admin only)
  /// Note: The inventory product must exist. This creates an override layer.
  Future<ProductDto> createProduct(Map<String, dynamic> data) async {
    final response = await _client.post(
      '/api/products',
      body: data,
      requiresAuth: true,
    );

    return ProductDto.fromJson(response.getDataOrThrow());
  }

  /// Create product override from request object
  Future<ProductDto> createProductOverride(
      ProductOverrideRequest request) async {
    return createProduct(request.toJson());
  }

  /// Update product override (Admin only)
  /// Pass null values to remove specific overrides and revert to inventory defaults.
  Future<ProductDto> updateProduct(
      String productId, Map<String, dynamic> data) async {
    final response = await _client.patch(
      '/api/products/$productId',
      body: data,
      requiresAuth: true,
    );

    return ProductDto.fromJson(response.getDataOrThrow());
  }

  /// Update product override from request object
  Future<ProductDto> updateProductOverride(
      String productId, ProductOverrideRequest request) async {
    return updateProduct(productId, request.toJson());
  }

  /// Delete product override (Admin only)
  /// This removes the override - the product reverts to inventory defaults.
  Future<void> deleteProduct(String productId) async {
    await _client.delete(
      '/api/products/$productId',
      requiresAuth: true,
    );
  }

  /// Bulk update product flags (Admin only)
  Future<void> bulkUpdateProducts(
      List<String> productIds, Map<String, dynamic> updates) async {
    await _client.patch(
      '/api/products/bulk',
      body: {
        'productIds': productIds,
        ...updates,
      },
      requiresAuth: true,
    );
  }
}
