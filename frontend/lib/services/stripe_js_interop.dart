import 'dart:convert';
import 'dart:js_interop';

/// Thin Dart wrapper over the Stripe.js helper functions defined in index.html.
/// Card data flows directly from the browser to Stripe — never touches our server.
/// This satisfies PCI SAQ A-EP requirements.

@JS('initStripe')
external void _initStripe(JSString publishableKey);

@JS('mountCardElement')
external void _mountCardElement(JSString selector, JSString? styleJson);

@JS('unmountCardElement')
external void _unmountCardElement();

@JS('confirmStripePayment')
external JSPromise<JSString> _confirmStripePayment(
    JSString clientSecret, JSString? cardholderName);

class StripeJsService {
  static bool _initialized = false;

  /// Call once with your Stripe **publishable** key (pk_test_xxx / pk_live_xxx).
  static void init(String publishableKey) {
    if (_initialized) return;
    _initStripe(publishableKey.toJS);
    _initialized = true;
  }

  static bool get isInitialized => _initialized;

  /// Mount the Stripe Card Element into the DOM node matching [selector].
  /// Typically `'#card-element'`.
  static void mountCard(String selector, {String? styleJson}) {
    _mountCardElement(selector.toJS, styleJson?.toJS);
  }

  /// Unmount and destroy the card element.
  static void unmountCard() {
    _unmountCardElement();
  }

  /// Confirm the payment using the mounted Card Element.
  /// Returns `{'paymentIntentId': '...', 'status': 'succeeded'}` on success.
  /// Throws an [Exception] with the Stripe error message on failure.
  static Future<Map<String, dynamic>> confirmPayment(
    String clientSecret, {
    String? cardholderName,
  }) async {
    final resultJs = await _confirmStripePayment(
      clientSecret.toJS,
      cardholderName?.toJS,
    ).toDart;

    final result = jsonDecode(resultJs.toDart) as Map<String, dynamic>;

    if (result.containsKey('error')) {
      throw Exception(result['error']);
    }

    return result;
  }
}
