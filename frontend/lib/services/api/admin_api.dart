import 'dart:typed_data';
import 'package:http/http.dart' as http;
import '../api_client.dart';
import '../../models/dto/admin_dto.dart';

class AdminApi {
  final ApiClient _client;

  AdminApi(this._client);

  /// Get dashboard statistics
  Future<DashboardStatsDto> getDashboardStats() async {
    final response = await _client.get('/admin/stats', requiresAuth: true);
    return DashboardStatsDto.fromJson(response.getDataOrThrow());
  }

  /// Get admin orders with filtering
  Future<Map<String, dynamic>> getOrders({
    String? status,
    int page = 1,
    int limit = 20,
    String? search,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };

    if (status != null) queryParams['status'] = status;
    if (search != null && search.isNotEmpty) queryParams['search'] = search;

    final response = await _client.get(
      '/admin/orders',
      queryParams: queryParams,
      requiresAuth: true,
    );

    return response.getDataOrThrow();
  }

  /// Get a single order by ID
  Future<Map<String, dynamic>> getOrderById(String orderId) async {
    final response = await _client.get(
      '/admin/orders/$orderId',
      requiresAuth: true,
    );
    return response.getDataOrThrow();
  }

  /// Update order status
  Future<Map<String, dynamic>> updateOrderStatus(
    String orderId, {
    required String status,
    String? notes,
    String? trackingNumber,
  }) async {
    final body = <String, dynamic>{'status': status};
    if (notes != null && notes.isNotEmpty) body['notes'] = notes;
    if (trackingNumber != null && trackingNumber.isNotEmpty)
      body['trackingNumber'] = trackingNumber;

    final response = await _client.patch(
      '/admin/orders/$orderId/status',
      body: body,
      requiresAuth: true,
    );
    return response.getDataOrThrow();
  }

  /// Download invoice PDF with authentication
  Future<Uint8List> downloadInvoicePdf(String orderId) async {
    final token = await _client.getAccessToken();
    final uri =
        Uri.parse('${_client.baseUrl}/admin/orders/$orderId/invoice/pdf');
    final response = await http.get(uri, headers: {
      'Authorization': 'Bearer $token',
    });
    if (response.statusCode != 200) {
      throw Exception('Failed to download invoice: ${response.statusCode}');
    }
    return response.bodyBytes;
  }

  /// Get full BI reports
  Future<Map<String, dynamic>> getReports({int days = 30}) async {
    final response = await _client.get(
      '/admin/reports',
      queryParams: {'days': days.toString()},
      requiresAuth: true,
    );
    return response.getDataOrThrow();
  }
}
