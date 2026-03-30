import '../api_client.dart';
import '../../models/dto/product_dto.dart';
import '../../core/events/app_event_bus.dart';

/// Categories API service
class CategoriesApi {
  final ApiClient _client;

  CategoriesApi(this._client);

  /// Event bus for cross-component sync
  final _eventBus = AppEventBus();

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
    // API returns direct array, not nested in 'data'
    final list = data is List ? data : (data['data'] as List<dynamic>? ?? data);
    final categories = (list as List<dynamic>)
        .map((e) => CategoryDto.fromJson(e as Map<String, dynamic>))
        .toList();

    return categories;
  }

  /// Get single category by ID
  Future<CategoryDto> getCategory(String id) async {
    final response = await _client.get('/categories/$id');
    return CategoryDto.fromJson(response.getDataOrThrow());
  }

  /// Get products in a category
  Future<ProductListDto> getCategoryProducts(
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

    return ProductListDto.fromJson(response.getDataOrThrow());
  }

  // ========== Admin Endpoints ==========

  /// Create a new category (Admin only)
  Future<CategoryDto> createCategory(Map<String, dynamic> data) async {
    final response = await _client.post(
      '/categories',
      body: data,
      requiresAuth: true,
    );

    final category = CategoryDto.fromJson(response.getDataOrThrow());
    _eventBus.emitCategoriesChanged();
    return category;
  }

  /// Update a category (Admin only)
  Future<CategoryDto> updateCategory(
      String categoryId, Map<String, dynamic> data) async {
    final response = await _client.patch(
      '/categories/$categoryId',
      body: data,
      requiresAuth: true,
    );

    final category = CategoryDto.fromJson(response.getDataOrThrow());
    _eventBus.emitCategoriesChanged();
    return category;
  }

  /// Delete a category (Admin only)
  /// Returns error 409 if category has products
  Future<void> deleteCategory(String categoryId) async {
    await _client.delete('/categories/$categoryId', requiresAuth: true);
    _eventBus.emitCategoriesChanged();
  }

  /// Toggle category active status (Admin only)
  Future<CategoryDto> toggleCategoryActive(
      String categoryId, bool isActive) async {
    final response = await _client.patch(
      '/categories/$categoryId',
      body: {'isActive': isActive},
      requiresAuth: true,
    );

    final category = CategoryDto.fromJson(response.getDataOrThrow());
    _eventBus.emitCategoriesChanged();
    return category;
  }

  /// Reorder categories (Admin only)
  Future<void> reorderCategories(List<Map<String, dynamic>> orders) async {
    await _client.post(
      '/categories/reorder',
      body: {'orders': orders},
      requiresAuth: true,
    );
    _eventBus.emitCategoriesChanged();
  }
}
