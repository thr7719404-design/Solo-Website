import 'dart:convert';
import 'package:http/http.dart' as http;
import '../../models/loyalty/loyalty_page_config.dart';

class LoyaltyPageConfigService {
  static const String _baseUrl = 'http://localhost:3000';
  static const String _endpoint = '/api/content/loyalty-config';

  /// Load loyalty page configuration from CMS/backend
  /// Falls back to default config if CMS data is not available
  Future<LoyaltyPageConfig> loadConfig() async {
    try {
      final url = Uri.parse('$_baseUrl$_endpoint');
      final response = await http.get(url);

      if (response.statusCode == 200) {
        final jsonData = json.decode(response.body);
        return LoyaltyPageConfig.fromJson(jsonData);
      } else {
        // CMS endpoint not ready, use default
        return _getDefaultConfig();
      }
    } catch (e) {
      // TODO: Wire up CMS endpoint /api/content/loyalty-config in backend
      // For now, return hardcoded default config
      print('⚠️ Loyalty config CMS endpoint not available, using defaults: $e');
      return _getDefaultConfig();
    }
  }

  LoyaltyPageConfig _getDefaultConfig() {
    return LoyaltyPageConfig(
      title: 'Join Our Loyalty Program',
      subtitle:
          'Earn rewards with every purchase and unlock exclusive benefits',
      ctaText: 'Sign Up Now',
      ctaUrl: '/signup',
      spendAedThreshold: 1000,
      rewardAed: 10,
      howItWorks: [
        const LoyaltyHowItWorksItem(
          icon: 'shopping_bag',
          title: 'Shop & Earn',
          description:
              'Earn loyalty cash with every purchase you make on our platform',
        ),
        const LoyaltyHowItWorksItem(
          icon: 'account_balance_wallet',
          title: 'Accumulate Rewards',
          description:
              'Watch your loyalty cash grow as you continue shopping with us',
        ),
        const LoyaltyHowItWorksItem(
          icon: 'redeem',
          title: 'Redeem & Save',
          description:
              'Use your loyalty cash on future purchases to save money',
        ),
      ],
      faqs: [
        const LoyaltyFaqItem(
          question: 'How do I earn loyalty cash?',
          answer:
              'You automatically earn loyalty cash with every qualifying purchase. For every AED 1,000 spent, you receive AED 10 in loyalty cash.',
        ),
        const LoyaltyFaqItem(
          question: 'When can I use my loyalty cash?',
          answer:
              'Your loyalty cash is available for use immediately after it\'s credited to your account. You can apply it at checkout on your next purchase.',
        ),
        const LoyaltyFaqItem(
          question: 'Does loyalty cash expire?',
          answer:
              'No, your loyalty cash never expires as long as your account remains active. Keep shopping to continue earning more!',
        ),
        const LoyaltyFaqItem(
          question: 'Can I combine loyalty cash with other discounts?',
          answer:
              'Yes! You can use your loyalty cash in combination with most promotional offers and discount codes for maximum savings.',
        ),
        const LoyaltyFaqItem(
          question: 'What purchases qualify for loyalty cash?',
          answer:
              'Most regular purchases qualify for loyalty cash. Some exclusions may apply for heavily discounted items or special promotions. Check product pages for details.',
        ),
        const LoyaltyFaqItem(
          question: 'How do I check my loyalty cash balance?',
          answer:
              'You can view your current loyalty cash balance anytime in your account dashboard under the Loyalty Cash section.',
        ),
      ],
    );
  }
}
