import '../api_client.dart';

/// Account API service for user profile, addresses, loyalty, and payment methods
class AccountApi {
  final ApiClient _client;

  AccountApi(this._client);

  // ============================================================================
  // PROFILE
  // ============================================================================

  /// Get user profile
  Future<Map<String, dynamic>> getProfile() async {
    final response = await _client.get('/account/profile', requiresAuth: true);
    return response.getDataOrThrow();
  }

  /// Update user profile
  Future<Map<String, dynamic>> updateProfile(Map<String, dynamic> data) async {
    final response = await _client.patch(
      '/account/profile',
      body: data,
      requiresAuth: true,
    );
    return response.getDataOrThrow();
  }

  // ============================================================================
  // ORDERS
  // ============================================================================

  /// Get user's orders
  Future<List<dynamic>> getOrders() async {
    final response = await _client.get('/account/orders', requiresAuth: true);
    final data = response.getDataOrThrow();
    if (data is List) {
      return data;
    }
    return [];
  }

  /// Get a specific order by ID
  Future<Map<String, dynamic>> getOrder(String orderId) async {
    final response = await _client.get('/account/orders/$orderId', requiresAuth: true);
    return response.getDataOrThrow();
  }

  // ============================================================================
  // ADDRESSES
  // ============================================================================

  /// Get user's addresses
  Future<List<dynamic>> getAddresses() async {
    final response = await _client.get('/account/addresses', requiresAuth: true);
    final data = response.getDataOrThrow();
    if (data is List) {
      return data;
    }
    return [];
  }

  /// Create a new address
  Future<Map<String, dynamic>> createAddress(Map<String, dynamic> data) async {
    final response = await _client.post(
      '/account/addresses',
      body: data,
      requiresAuth: true,
    );
    return response.getDataOrThrow();
  }

  /// Update an address
  Future<Map<String, dynamic>> updateAddress(String id, Map<String, dynamic> data) async {
    final response = await _client.patch(
      '/account/addresses/$id',
      body: data,
      requiresAuth: true,
    );
    return response.getDataOrThrow();
  }

  /// Delete an address
  Future<void> deleteAddress(String id) async {
    await _client.delete('/account/addresses/$id', requiresAuth: true);
  }

  /// Set an address as default
  Future<Map<String, dynamic>> setDefaultAddress(String id) async {
    final response = await _client.patch(
      '/account/addresses/$id/default',
      requiresAuth: true,
    );
    return response.getDataOrThrow();
  }

  // ============================================================================
  // LOYALTY
  // ============================================================================

  /// Get loyalty wallet data
  Future<Map<String, dynamic>> getLoyalty() async {
    final response = await _client.get('/account/loyalty', requiresAuth: true);
    return response.getDataOrThrow();
  }

  // ============================================================================
  // PAYMENT METHODS
  // ============================================================================

  /// Get saved payment methods
  Future<List<dynamic>> getPaymentMethods() async {
    final response = await _client.get('/account/payment-methods', requiresAuth: true);
    final data = response.getDataOrThrow();
    if (data is List) {
      return data;
    }
    return [];
  }

  /// Add a new payment method (tokenized)
  Future<Map<String, dynamic>> addPaymentMethod(Map<String, dynamic> data) async {
    final response = await _client.post(
      '/account/payment-methods',
      body: data,
      requiresAuth: true,
    );
    return response.getDataOrThrow();
  }

  /// Set a payment method as default
  Future<void> setDefaultPaymentMethod(String id) async {
    await _client.patch(
      '/account/payment-methods/$id/default',
      requiresAuth: true,
    );
  }

  /// Delete a payment method
  Future<void> deletePaymentMethod(String id) async {
    await _client.delete('/account/payment-methods/$id', requiresAuth: true);
  }
}
