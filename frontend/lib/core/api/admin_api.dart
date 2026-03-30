/// Admin API client for dashboard and admin-specific operations
library;

import '../../core/dto/dto.dart';
import '../api_client.dart';

class AdminApi {
  final ApiClient _client;

  AdminApi(this._client);

  /// Get dashboard statistics
  Future<DashboardStatsDto> getDashboardStats() async {
    final response = await _client.get(
      '/api/admin/stats',
      requiresAuth: true,
    );
    return DashboardStatsDto.fromJson(response.getDataOrThrow());
  }

  /// Get admin orders with filtering
  Future<Map<String, dynamic>> getOrders({
    String? status,
    int page = 1,
    int limit = 20,
    String? search,
  }) async {
    final queryParams = <String, dynamic>{
      'page': page,
      'limit': limit,
      if (status != null) 'status': status,
      if (search != null && search.isNotEmpty) 'search': search,
    };

    final response = await _client.get(
      '/api/admin/orders',
      queryParams: queryParams,
      requiresAuth: true,
    );

    return response.getDataOrThrow();
  }

  /// Get order details by ID
  Future<Map<String, dynamic>> getOrderById(String orderId) async {
    final response = await _client.get(
      '/api/admin/orders/$orderId',
      requiresAuth: true,
    );
    return response.getDataOrThrow();
  }

  /// Update order status
  Future<void> updateOrderStatus(String orderId, String status) async {
    await _client.patch(
      '/api/admin/orders/$orderId/status',
      body: {'status': status},
      requiresAuth: true,
    );
  }

  /// Get system health
  Future<Map<String, dynamic>> getSystemHealth() async {
    final response = await _client.get(
      '/api/admin/health',
      requiresAuth: true,
    );
    return response.getDataOrThrow();
  }
}
