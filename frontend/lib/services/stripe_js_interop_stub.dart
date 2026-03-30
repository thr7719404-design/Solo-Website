/// Stub for non-web platforms — Stripe.js is web-only.
class StripeJsService {
  static final bool _initialized = false;

  static void init(String publishableKey) {
    throw UnsupportedError('Stripe.js only works on the web platform');
  }

  static bool get isInitialized => _initialized;

  static void mountCard(String selector, {String? styleJson}) {
    throw UnsupportedError('Stripe.js only works on the web platform');
  }

  static void unmountCard() {}

  static Future<Map<String, dynamic>> confirmPayment(
    String clientSecret, {
    String? cardholderName,
  }) async {
    throw UnsupportedError('Stripe.js only works on the web platform');
  }
}
