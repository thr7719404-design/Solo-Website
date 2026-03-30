import '../api_client.dart';

/// Orders API service
class OrdersApi {
  final ApiClient _client;

  OrdersApi(this._client);

  /// Create a new order
  Future<Map<String, dynamic>> createOrder(Map<String, dynamic> data) async {
    final response = await _client.post(
      '/orders',
      body: data,
      requiresAuth: true,
    );
    return response.getDataOrThrow();
  }

  /// Get user's orders
  Future<List<Map<String, dynamic>>> getOrders() async {
    final response = await _client.get('/orders', requiresAuth: true);
    final data = response.getDataOrThrow();
    if (data is List) {
      return data.cast<Map<String, dynamic>>();
    }
    return [];
  }

  /// Get a specific order by ID
  Future<Map<String, dynamic>> getOrder(String orderId) async {
    final response = await _client.get('/orders/$orderId', requiresAuth: true);
    return response.getDataOrThrow();
  }
}
