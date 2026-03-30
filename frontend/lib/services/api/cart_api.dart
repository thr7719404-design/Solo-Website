import '../api_client.dart';

/// Cart API service for server-side cart management
class CartApi {
  final ApiClient _client;

  CartApi(this._client);

  /// Get the current user's cart (creates one if none exists)
  Future<Map<String, dynamic>> getCart() async {
    final response = await _client.get('/cart', requiresAuth: true);
    return response.getDataOrThrow();
  }

  /// Add an item to the cart
  Future<Map<String, dynamic>> addItem({
    required String itemId,
    required int quantity,
    String type = 'PRODUCT',
    String? customization,
  }) async {
    final body = <String, dynamic>{
      'type': type,
      'itemId': itemId,
      'quantity': quantity,
    };
    if (customization != null) {
      body['customization'] = customization;
    }
    final response = await _client.post(
      '/cart/items',
      body: body,
      requiresAuth: true,
    );
    return response.getDataOrThrow();
  }

  /// Update a cart item's quantity
  Future<Map<String, dynamic>> updateItemQuantity({
    required String cartItemId,
    required int quantity,
  }) async {
    final response = await _client.patch(
      '/cart/items/$cartItemId',
      body: {'quantity': quantity},
      requiresAuth: true,
    );
    return response.getDataOrThrow();
  }

  /// Remove a cart item
  Future<Map<String, dynamic>> removeItem(String cartItemId) async {
    final response = await _client.delete(
      '/cart/items/$cartItemId',
      requiresAuth: true,
    );
    return response.getDataOrThrow();
  }

  /// Clear all items from the cart
  Future<Map<String, dynamic>> clearCart() async {
    final response = await _client.delete('/cart', requiresAuth: true);
    return response.getDataOrThrow();
  }
}
