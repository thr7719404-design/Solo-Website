/// Unified Brands API client
/// Handles both public storefront and admin brand endpoints
library;

import '../../core/dto/dto.dart';
import '../api_client.dart';

class BrandsApi {
  final ApiClient _client;

  BrandsApi(this._client);

  // ===========================================================================
  // PUBLIC ENDPOINTS (Storefront)
  // ===========================================================================

  /// Get all brands
  Future<List<BrandDto>> getBrands() async {
    final response = await _client.get('/api/brands');

    final data = response.getDataOrThrow();
    // API may return direct array or nested in 'data'
    final list = data is List ? data : (data['data'] as List<dynamic>? ?? []);
    return parseList<BrandDto>(
      list,
      (e) => BrandDto.fromJson(e as Map<String, dynamic>),
    );
  }

  /// Get single brand by ID or slug
  Future<BrandDto> getBrand(String idOrSlug) async {
    final response = await _client.get('/api/brands/$idOrSlug');
    return BrandDto.fromJson(response.getDataOrThrow());
  }

  /// Get products for a brand
  Future<PaginatedList<ProductDto>> getBrandProducts(
    String brandId, {
    int page = 1,
    int limit = 20,
    String? sortBy,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page,
      'limit': limit,
      if (sortBy != null) 'sortBy': sortBy,
    };

    final response = await _client.get(
      '/api/brands/$brandId/products',
      queryParams: queryParams,
    );

    return PaginatedList<ProductDto>.fromJson(
      response.getDataOrThrow(),
      (json) => ProductDto.fromJson(json),
    );
  }

  // ===========================================================================
  // ADMIN ENDPOINTS
  // ===========================================================================

  /// Create a new brand (Admin only)
  Future<BrandDto> createBrand(BrandRequest request) async {
    final response = await _client.post(
      '/api/brands',
      body: request.toJson(),
      requiresAuth: true,
    );

    return BrandDto.fromJson(response.getDataOrThrow());
  }

  /// Update a brand (Admin only)
  Future<BrandDto> updateBrand(String brandId, BrandRequest request) async {
    final response = await _client.patch(
      '/api/brands/$brandId',
      body: request.toJson(),
      requiresAuth: true,
    );

    return BrandDto.fromJson(response.getDataOrThrow());
  }

  /// Delete a brand (Admin only)
  /// Will fail with 409 Conflict if products exist with this brand.
  Future<void> deleteBrand(String brandId) async {
    await _client.delete(
      '/api/brands/$brandId',
      requiresAuth: true,
    );
  }

  /// Toggle brand active status (Admin only)
  Future<BrandDto> toggleBrandActive(String brandId, bool isActive) async {
    final response = await _client.patch(
      '/api/brands/$brandId',
      body: {'isActive': isActive},
      requiresAuth: true,
    );

    return BrandDto.fromJson(response.getDataOrThrow());
  }
}
