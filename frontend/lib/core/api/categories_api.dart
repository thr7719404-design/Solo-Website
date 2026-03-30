/// Unified Categories API client
/// Handles both public storefront and admin category endpoints
library;

import '../../core/dto/dto.dart';
import '../../services/api_client.dart';

class CategoriesApi {
  final ApiClient _client;

  CategoriesApi(this._client);

  // ===========================================================================
  // PUBLIC ENDPOINTS (Storefront)
  // ===========================================================================

  /// Get all categories
  Future<List<CategoryDto>> getCategories({
    bool includeSubcategories = false,
    bool includeProducts = false,
  }) async {
    final queryParams = <String, dynamic>{
      if (includeSubcategories) 'includeSubcategories': true,
      if (includeProducts) 'includeProducts': true,
    };

    final response = await _client.get(
      '/categories',
      queryParams: queryParams,
    );

    final data = response.getDataOrThrow();
    // API may return direct array or nested in 'data'
    final list = data is List ? data : (data['data'] as List<dynamic>? ?? []);
    return parseList<CategoryDto>(
      list,
      (e) => CategoryDto.fromJson(e as Map<String, dynamic>),
    );
  }

  /// Get single category by ID or slug
  Future<CategoryDto> getCategory(String idOrSlug) async {
    final response = await _client.get('/categories/$idOrSlug');
    return CategoryDto.fromJson(response.getDataOrThrow());
  }

  /// Get products in a category
  Future<PaginatedList<ProductDto>> getCategoryProducts(
    String categoryId, {
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
      '/categories/$categoryId/products',
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

  /// Create a new category (Admin only)
  Future<CategoryDto> createCategory(CategoryRequest request) async {
    final response = await _client.post(
      '/categories',
      body: request.toJson(),
      requiresAuth: true,
    );

    return CategoryDto.fromJson(response.getDataOrThrow());
  }

  /// Update a category (Admin only)
  Future<CategoryDto> updateCategory(
      String categoryId, CategoryRequest request) async {
    final response = await _client.patch(
      '/categories/$categoryId',
      body: request.toJson(),
      requiresAuth: true,
    );

    return CategoryDto.fromJson(response.getDataOrThrow());
  }

  /// Delete a category (Admin only)
  /// Will fail with 409 Conflict if products exist in the category.
  Future<void> deleteCategory(String categoryId) async {
    await _client.delete(
      '/categories/$categoryId',
      requiresAuth: true,
    );
  }

  /// Toggle category active status (Admin only)
  Future<CategoryDto> toggleCategoryActive(
      String categoryId, bool isActive) async {
    final response = await _client.patch(
      '/categories/$categoryId',
      body: {'isActive': isActive},
      requiresAuth: true,
    );

    return CategoryDto.fromJson(response.getDataOrThrow());
  }

  /// Reorder categories (Admin only)
  /// @param orderedIds - List of category IDs in the desired order
  Future<void> reorderCategories(List<String> orderedIds) async {
    await _client.patch(
      '/categories/reorder',
      body: {'orderedIds': orderedIds},
      requiresAuth: true,
    );
  }
}
