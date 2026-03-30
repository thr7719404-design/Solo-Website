import '../api_client.dart';

/// Favorites API service for wishlist functionality
class FavoritesApi {
  final ApiClient _client;

  FavoritesApi(this._client);

  /// Get user's favorites list with product details
  Future<List<Map<String, dynamic>>> getFavorites() async {
    final response = await _client.get('/favorites', requiresAuth: true);
    final data = response.getDataOrThrow();
    if (data is List) {
      return data.cast<Map<String, dynamic>>();
    }
    return [];
  }

  /// Get just the favorite product IDs for quick lookup
  Future<List<String>> getFavoriteIds() async {
    final response = await _client.get('/favorites/ids', requiresAuth: true);
    final data = response.getDataOrThrow();
    if (data is Map && data['productIds'] is List) {
      return (data['productIds'] as List).cast<String>();
    }
    return [];
  }

  /// Add a product to favorites
  Future<Map<String, dynamic>> addFavorite(String productId) async {
    final response = await _client.post(
      '/favorites/$productId',
      requiresAuth: true,
    );
    return response.getDataOrThrow();
  }

  /// Remove a product from favorites
  Future<void> removeFavorite(String productId) async {
    await _client.delete('/favorites/$productId', requiresAuth: true);
  }

  /// Toggle favorite status (add if not favorited, remove if favorited)
  Future<Map<String, dynamic>> toggleFavorite(String productId) async {
    final response = await _client.post(
      '/favorites/$productId/toggle',
      requiresAuth: true,
    );
    return response.getDataOrThrow();
  }

  /// Check if a product is in favorites
  Future<bool> isFavorite(String productId) async {
    final response = await _client.get(
      '/favorites/$productId/check',
      requiresAuth: true,
    );
    final data = response.getDataOrThrow();
    return data['isFavorite'] == true;
  }
}
