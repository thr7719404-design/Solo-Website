import '../api_client.dart';

/// Stripe API service
class StripeApi {
  final ApiClient _client;

  StripeApi(this._client);

  /// Get public Stripe config (publishable key + enabled status)
  Future<Map<String, dynamic>> getConfig() async {
    final response = await _client.get('/stripe/config');
    return response.getDataOrThrow();
  }

  /// Create a PaymentIntent (server-side, amount only — no card data).
  /// Returns `{clientSecret, paymentIntentId, status}`.
  /// Card confirmation happens client-side via Stripe.js.
  Future<Map<String, dynamic>> createPaymentIntent({
    required double amount,
    String currency = 'aed',
    Map<String, String>? metadata,
  }) async {
    final response = await _client.post(
      '/stripe/create-payment-intent',
      body: {
        'amount': amount,
        'currency': currency,
        if (metadata != null) 'metadata': metadata,
      },
      requiresAuth: true,
    );
    return response.getDataOrThrow();
  }

  /// Verify a payment intent
  Future<Map<String, dynamic>> verifyPayment(String paymentIntentId) async {
    final response = await _client.post(
      '/stripe/verify-payment',
      body: {'paymentIntentId': paymentIntentId},
      requiresAuth: true,
    );
    return response.getDataOrThrow();
  }
}
