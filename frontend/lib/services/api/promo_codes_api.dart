import '../api_client.dart';

/// Promo Codes API service
class PromoCodesApi {
  final ApiClient _client;

  PromoCodesApi(this._client);

  /// Validate a promo code and get discount info
  Future<Map<String, dynamic>> validate({
    required String code,
    required double orderAmount,
  }) async {
    final response = await _client.post(
      '/promo-codes/validate',
      body: {
        'code': code,
        'orderAmount': orderAmount,
      },
      requiresAuth: true,
    );
    return response.getDataOrThrow();
  }
}
