import '../api_client.dart';
import '../../core/dto/dto.dart';
import '../../core/events/app_event_bus.dart';

/// Brands API service
class BrandsApi {
  final ApiClient _client;

  BrandsApi(this._client);

  /// Event bus for cross-component sync
  final _eventBus = AppEventBus();

  /// Get all brands
  Future<List<BrandDto>> getBrands() async {
    final response = await _client.get('/brands');

    final data = response.getDataOrThrow();
    // API returns direct array, not nested in 'data'
    final list = data is List ? data : (data['data'] as List<dynamic>? ?? data);
    return (list as List<dynamic>)
        .map((e) => BrandDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Get single brand by ID
  Future<BrandDto> getBrand(String id) async {
    final response = await _client.get('/brands/$id');
    return BrandDto.fromJson(response.getDataOrThrow());
  }

  /// Get products for a brand
  Future<ProductListDto> getBrandProducts(
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
      '/brands/$brandId/products',
      queryParams: queryParams,
    );

    return ProductListDto.fromJson(
      response.getDataOrThrow(),
      (json) => ProductDto.fromJson(json),
    );
  }

  // ========== Admin Endpoints ==========

  /// Create a new brand (Admin only)
  Future<BrandDto> createBrand(Map<String, dynamic> data) async {
    final response = await _client.post(
      '/brands',
      body: data,
      requiresAuth: true,
    );

    final brand = BrandDto.fromJson(response.getDataOrThrow());
    _eventBus.emitBrandsChanged();
    return brand;
  }

  /// Update a brand (Admin only)
  Future<BrandDto> updateBrand(
      String brandId, Map<String, dynamic> data) async {
    final response = await _client.patch(
      '/brands/$brandId',
      body: data,
      requiresAuth: true,
    );

    final brand = BrandDto.fromJson(response.getDataOrThrow());
    _eventBus.emitBrandsChanged();
    return brand;
  }

  /// Delete a brand (Admin only)
  Future<void> deleteBrand(String brandId) async {
    await _client.delete('/brands/$brandId', requiresAuth: true);
    _eventBus.emitBrandsChanged();
  }

  /// Toggle brand active status (Admin only)
  Future<BrandDto> toggleBrandActive(String brandId, bool isActive) async {
    final response = await _client.patch(
      '/brands/$brandId',
      body: {'isActive': isActive},
      requiresAuth: true,
    );

    final brand = BrandDto.fromJson(response.getDataOrThrow());
    _eventBus.emitBrandsChanged();
    return brand;
  }
}
