import 'package:flutter/material.dart';
import '../../models/loyalty/loyalty_page_config.dart';
import '../../services/loyalty/loyalty_page_config_service.dart';

class LoyaltyProgramScreen extends StatefulWidget {
  const LoyaltyProgramScreen({super.key});

  @override
  State<LoyaltyProgramScreen> createState() => _LoyaltyProgramScreenState();
}

class _LoyaltyProgramScreenState extends State<LoyaltyProgramScreen> {
  final _configService = LoyaltyPageConfigService();
  LoyaltyPageConfig? _config;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadConfig();
  }

  Future<void> _loadConfig() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final config = await _configService.loadConfig();
      setState(() {
        _config = config;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Loyalty Program'),
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Icon(Icons.error_outline,
                          size: 48, color: Colors.red),
                      const SizedBox(height: 16),
                      Text('Error loading loyalty program: $_error'),
                      const SizedBox(height: 16),
                      ElevatedButton(
                        onPressed: _loadConfig,
                        child: const Text('Retry'),
                      ),
                    ],
                  ),
                )
              : _config != null
                  ? _buildContent(_config!)
                  : const Center(child: Text('No configuration available')),
    );
  }

  Widget _buildContent(LoyaltyPageConfig config) {
    return SingleChildScrollView(
      child: Column(
        children: [
          _buildHeroHeader(config),
          const SizedBox(height: 60),
          _buildHowItWorks(config),
          const SizedBox(height: 60),
          _buildEarningRuleBanner(config),
          const SizedBox(height: 60),
          _buildCalculatorSection(config),
          const SizedBox(height: 60),
          _buildFaqSection(config),
          const SizedBox(height: 60),
          _buildFooterCta(config),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  Widget _buildHeroHeader(LoyaltyPageConfig config) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(60),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            const Color(0xFFFFD700).withOpacity(0.2),
            const Color(0xFFFFA500).withOpacity(0.3),
          ],
        ),
      ),
      child: Column(
        children: [
          Text(
            config.title,
            style: const TextStyle(
              fontSize: 48,
              fontWeight: FontWeight.bold,
              color: Color(0xFFFFD700),
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          Text(
            config.subtitle,
            style: const TextStyle(
              fontSize: 20,
              color: Colors.black87,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: () {
              Navigator.pushNamed(context, config.ctaUrl);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFFD700),
              foregroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(horizontal: 48, vertical: 20),
              textStyle:
                  const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            child: Text(config.ctaText),
          ),
        ],
      ),
    );
  }

  Widget _buildHowItWorks(LoyaltyPageConfig config) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          const Text(
            'How It Works',
            style: TextStyle(
              fontSize: 36,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 32),
          LayoutBuilder(
            builder: (context, constraints) {
              final isMobile = constraints.maxWidth < 768;
              if (isMobile) {
                return Column(
                  children: config.howItWorks
                      .map((item) => Padding(
                            padding: const EdgeInsets.only(bottom: 24),
                            child: _buildHowItWorksCard(item),
                          ))
                      .toList(),
                );
              } else {
                return Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: config.howItWorks
                      .map((item) => Expanded(
                            child: Padding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 12),
                              child: _buildHowItWorksCard(item),
                            ),
                          ))
                      .toList(),
                );
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _buildHowItWorksCard(LoyaltyHowItWorksItem item) {
    IconData iconData;
    switch (item.icon) {
      case 'shopping_bag':
        iconData = Icons.shopping_bag;
        break;
      case 'account_balance_wallet':
        iconData = Icons.account_balance_wallet;
        break;
      case 'redeem':
        iconData = Icons.redeem;
        break;
      default:
        iconData = Icons.star;
    }

    return Card(
      elevation: 4,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Icon(
              iconData,
              size: 64,
              color: const Color(0xFFFFD700),
            ),
            const SizedBox(height: 16),
            Text(
              item.title,
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 12),
            Text(
              item.description,
              style: const TextStyle(fontSize: 16, color: Colors.black87),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEarningRuleBanner(LoyaltyPageConfig config) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(32),
      margin: const EdgeInsets.symmetric(horizontal: 24),
      decoration: BoxDecoration(
        color: const Color(0xFFFFD700).withOpacity(0.2),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: const Color(0xFFFFD700), width: 2),
      ),
      child: Column(
        children: [
          const Icon(Icons.local_offer, size: 48, color: Color(0xFFFFD700)),
          const SizedBox(height: 16),
          const Text(
            'Earning Rule',
            style: TextStyle(
              fontSize: 28,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            'For every AED ${config.spendAedThreshold} spent, you earn AED ${config.rewardAed} in loyalty cash',
            style: const TextStyle(fontSize: 18),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildCalculatorSection(LoyaltyPageConfig config) {
    final examples = [
      {
        'spend': config.spendAedThreshold,
        'earn': config.rewardAed,
      },
      {
        'spend': config.spendAedThreshold * 5,
        'earn': config.rewardAed * 5,
      },
      {
        'spend': config.spendAedThreshold * 10,
        'earn': config.rewardAed * 10,
      },
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          const Text(
            'Reward Examples',
            style: TextStyle(
              fontSize: 36,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 32),
          LayoutBuilder(
            builder: (context, constraints) {
              final isMobile = constraints.maxWidth < 768;
              if (isMobile) {
                return Column(
                  children: examples
                      .map((example) => Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: _buildExampleCard(
                                example['spend']!, example['earn']!),
                          ))
                      .toList(),
                );
              } else {
                return Row(
                  children: examples
                      .map((example) => Expanded(
                            child: Padding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 8),
                              child: _buildExampleCard(
                                  example['spend']!, example['earn']!),
                            ),
                          ))
                      .toList(),
                );
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _buildExampleCard(int spend, int earn) {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          children: [
            Text(
              'Spend AED $spend',
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            const Icon(Icons.arrow_downward, color: Color(0xFFFFD700)),
            const SizedBox(height: 16),
            Text(
              'Earn AED $earn',
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: Color(0xFFFFD700),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildFaqSection(LoyaltyPageConfig config) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        children: [
          const Text(
            'Frequently Asked Questions',
            style: TextStyle(
              fontSize: 36,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 32),
          ...config.faqs.map((faq) => _buildFaqItem(faq)),
        ],
      ),
    );
  }

  Widget _buildFaqItem(LoyaltyFaqItem faq) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: ExpansionTile(
        title: Text(
          faq.question,
          style: const TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        children: [
          Padding(
            padding: const EdgeInsets.all(16),
            child: Text(
              faq.answer,
              style: const TextStyle(fontSize: 16, color: Colors.black87),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFooterCta(LoyaltyPageConfig config) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(48),
      margin: const EdgeInsets.symmetric(horizontal: 24),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            const Color(0xFFFFD700).withOpacity(0.3),
            const Color(0xFFFFA500).withOpacity(0.4),
          ],
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        children: [
          const Text(
            'Ready to Start Earning?',
            style: TextStyle(
              fontSize: 32,
              fontWeight: FontWeight.bold,
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 16),
          const Text(
            'Join thousands of members already saving with our loyalty program',
            style: TextStyle(fontSize: 18, color: Colors.black87),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {
              Navigator.pushNamed(context, config.ctaUrl);
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFFFD700),
              foregroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(horizontal: 48, vertical: 20),
              textStyle:
                  const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            child: Text(config.ctaText),
          ),
        ],
      ),
    );
  }
}
