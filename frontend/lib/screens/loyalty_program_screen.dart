import 'package:flutter/material.dart';
import '../widgets/app_header.dart';
import '../widgets/modern_drawer.dart';
import '../widgets/top_banner.dart';
import '../services/api_service.dart';

class LoyaltyProgramScreen extends StatefulWidget {
  const LoyaltyProgramScreen({super.key});

  @override
  State<LoyaltyProgramScreen> createState() => _LoyaltyProgramScreenState();
}

class _LoyaltyProgramScreenState extends State<LoyaltyProgramScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _mobileController = TextEditingController();
  final _passwordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  final _dobController = TextEditingController();

  bool _agreeToTerms = false;
  bool _receiveOffers = false;
  bool _showTerms = false;

  // CMS config
  Map<String, dynamic>? _loyaltyConfig;
  bool _isLoadingConfig = true;

  @override
  void initState() {
    super.initState();
    _loadLoyaltyConfig();
  }

  Future<void> _loadLoyaltyConfig() async {
    try {
      final response = await ApiService.client.get('/content/loyalty-config');
      final data = response.getDataOrThrow();
      if (mounted) {
        setState(() {
          _loyaltyConfig = data;
          _isLoadingConfig = false;
        });
      }
    } catch (e) {
      // Use defaults if config not found
      if (mounted) {
        setState(() {
          _loyaltyConfig = {
            'title': 'Join Our Loyalty Program',
            'subtitle': 'Earn rewards on every purchase',
            'spendAedThreshold': 1000,
            'rewardAed': 10,
          };
          _isLoadingConfig = false;
        });
      }
    }
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _emailController.dispose();
    _mobileController.dispose();
    _passwordController.dispose();
    _confirmPasswordController.dispose();
    _dobController.dispose();
    super.dispose();
  }

  void _submitForm() {
    if (_formKey.currentState!.validate()) {
      if (!_agreeToTerms) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Please agree to the Terms & Conditions'),
            backgroundColor: Colors.red,
          ),
        );
        return;
      }

      // Show success dialog
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.check_circle_outline,
                color: Colors.green[600],
                size: 80,
              ),
              const SizedBox(height: 20),
              const Text(
                'Welcome to Our Loyalty Program!',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                'You can now start earning loyalty credit on every online purchase.',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    Navigator.of(context).popUntil((route) => route.isFirst);
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 14),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text(
                    'Start Shopping',
                    style: TextStyle(
                      fontSize: 15,
                      fontWeight: FontWeight.w600,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 768;

    return Scaffold(
      drawer: const ModernDrawer(),
      appBar: AppHeader(
        onCartPressed: () => Navigator.pushNamed(context, '/cart'),
        onSearchPressed: () {},
        onFavoritesPressed: () => Navigator.pushNamed(context, '/favorites'),
      ),
      body: Column(
        children: [
          const TopBanner(),
          Expanded(
            child: SingleChildScrollView(
              child: Container(
                color: Colors.grey[50],
                padding: EdgeInsets.all(isMobile ? 16 : 40),
                child: Center(
                  child: Container(
                    constraints: const BoxConstraints(maxWidth: 1200),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Hero Section
                        _buildHeroSection(isMobile),
                        const SizedBox(height: 40),

                        // How It Works
                        _buildHowItWorks(isMobile),
                        const SizedBox(height: 40),

                        // Why Join
                        _buildWhyJoin(isMobile),
                        const SizedBox(height: 40),

                        // Registration Form
                        _buildRegistrationForm(isMobile),
                        const SizedBox(height: 40),

                        // Terms & Conditions
                        _buildTermsSection(isMobile),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildHeroSection(bool isMobile) {
    return Container(
      padding: EdgeInsets.all(isMobile ? 24 : 48),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [Colors.black, Colors.grey[900]!],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.3),
            blurRadius: 30,
            offset: const Offset(0, 15),
          ),
        ],
      ),
      child: Stack(
        children: [
          // Animated background circles
          Positioned(
            right: -100,
            top: -100,
            child: Container(
              width: 300,
              height: 300,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    const Color(0xFFB8860B).withOpacity(0.2),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            left: -50,
            bottom: -50,
            child: Container(
              width: 200,
              height: 200,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                gradient: RadialGradient(
                  colors: [
                    Colors.white.withOpacity(0.05),
                    Colors.transparent,
                  ],
                ),
              ),
            ),
          ),

          // Content
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: const Color(0xFFB8860B),
                      borderRadius: BorderRadius.circular(12),
                      boxShadow: [
                        BoxShadow(
                          color: const Color(0xFFB8860B).withOpacity(0.3),
                          blurRadius: 20,
                          offset: const Offset(0, 8),
                        ),
                      ],
                    ),
                    child: const Icon(
                      Icons.card_giftcard,
                      size: 40,
                      color: Colors.white,
                    ),
                  ),
                  const SizedBox(width: 20),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Join Our Loyalty Program',
                          style: TextStyle(
                            fontSize: isMobile ? 28 : 40,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Earn While You Shop Online',
                          style: TextStyle(
                            fontSize: isMobile ? 18 : 24,
                            color: const Color(0xFFB8860B),
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 30),
              Text(
                'Welcome to our Loyalty Program, created to reward you every time you shop online with us. It\'s simple: the more you spend, the more credit you earn for your next purchase.',
                style: TextStyle(
                  fontSize: isMobile ? 14 : 16,
                  color: Colors.white,
                  height: 1.8,
                ),
              ),
              const SizedBox(height: 30),

              // Stats row
              if (!isMobile)
                Row(
                  children: [
                    Expanded(
                      child: _buildStatCard(
                        '1%',
                        'Cash Back',
                        Icons.trending_up,
                      ),
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: _buildStatCard(
                        '10 AED',
                        'Per 1,000 AED',
                        Icons.wallet,
                      ),
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: _buildStatCard(
                        'Instant',
                        'Credit Added',
                        Icons.flash_on,
                      ),
                    ),
                  ],
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatCard(String value, String label, IconData icon) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: Colors.white.withOpacity(0.2),
          width: 1,
        ),
      ),
      child: Column(
        children: [
          Icon(icon, color: const Color(0xFFB8860B), size: 32),
          const SizedBox(height: 12),
          Text(
            value,
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: Colors.white,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            label,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[400],
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  Widget _buildHowItWorks(bool isMobile) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: LinearGradient(
            colors: [Colors.white, Colors.grey[50]!],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        padding: EdgeInsets.all(isMobile ? 20 : 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: Colors.black,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: const Icon(
                    Icons.lightbulb_outline,
                    color: Color(0xFFB8860B),
                    size: 32,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    'How It Works',
                    style: TextStyle(
                      fontSize: isMobile ? 24 : 32,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 40),

            // Step 1
            _buildStepCard(
              step: '1',
              icon: Icons.shopping_cart,
              title: 'Earn credit on every online order',
              description:
                  'For every 1,000 AED you spend, you earn 10 AED in loyalty credit.',
              color: Colors.green,
              isMobile: isMobile,
            ),
            const SizedBox(height: 24),

            // Examples with visual cards
            Row(
              children: [
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Colors.green[50]!, Colors.green[100]!],
                      ),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.green[300]!, width: 2),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.green.withOpacity(0.1),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        const Icon(Icons.add_shopping_cart,
                            size: 40, color: Colors.green),
                        const SizedBox(height: 16),
                        const Text(
                          '1,000 AED',
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Colors.green,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: const [
                            Icon(Icons.arrow_downward,
                                color: Colors.green, size: 20),
                            SizedBox(width: 8),
                            Text(
                              'Earn',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          '10 AED Credit',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(width: 20),
                Expanded(
                  child: Container(
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        colors: [Colors.blue[50]!, Colors.blue[100]!],
                      ),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.blue[300]!, width: 2),
                      boxShadow: [
                        BoxShadow(
                          color: Colors.blue.withOpacity(0.1),
                          blurRadius: 10,
                          offset: const Offset(0, 4),
                        ),
                      ],
                    ),
                    child: Column(
                      children: [
                        const Icon(Icons.shopping_bag,
                            size: 40, color: Colors.blue),
                        const SizedBox(height: 16),
                        const Text(
                          '2,500 AED',
                          style: TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: Colors.blue,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: const [
                            Icon(Icons.arrow_downward,
                                color: Colors.blue, size: 20),
                            SizedBox(width: 8),
                            Text(
                              'Earn',
                              style: TextStyle(
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        const Text(
                          '25 AED Credit',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 32),

            // Step 2
            _buildStepCard(
              step: '2',
              icon: Icons.redeem,
              title: 'Use your credit on your next online purchase',
              description:
                  'Your earned amount will appear as a loyalty balance in your account. When you place your next online order, you can choose to use all your available credit, or use part of it and save the rest for later.',
              color: Colors.blue,
              isMobile: isMobile,
            ),
            const SizedBox(height: 24),

            // Online Only Banner
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  colors: [const Color(0xFFB8860B), Colors.orange[700]!],
                ),
                borderRadius: BorderRadius.circular(12),
                boxShadow: [
                  BoxShadow(
                    color: const Color(0xFFB8860B).withOpacity(0.3),
                    blurRadius: 15,
                    offset: const Offset(0, 8),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Icon(
                      Icons.laptop_mac,
                      size: 40,
                      color: Color(0xFFB8860B),
                    ),
                  ),
                  const SizedBox(width: 20),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Online Only',
                          style: TextStyle(
                            fontSize: 20,
                            fontWeight: FontWeight.bold,
                            color: Colors.white,
                          ),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Loyalty credits are only earned and redeemed on online purchases made through our website.',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.white.withOpacity(0.95),
                            height: 1.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStepCard({
    required String step,
    required IconData icon,
    required String title,
    required String description,
    required Color color,
    required bool isMobile,
  }) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey[200]!, width: 2),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.1),
            blurRadius: 10,
            offset: const Offset(0, 4),
          ),
        ],
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 60,
            height: 60,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [color, color.withOpacity(0.7)],
              ),
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                  color: color.withOpacity(0.3),
                  blurRadius: 10,
                  offset: const Offset(0, 4),
                ),
              ],
            ),
            child: Stack(
              children: [
                Center(
                  child: Icon(icon, color: Colors.white, size: 28),
                ),
                Positioned(
                  top: 4,
                  right: 4,
                  child: Container(
                    width: 20,
                    height: 20,
                    decoration: BoxDecoration(
                      color: Colors.white,
                      shape: BoxShape.circle,
                      border: Border.all(color: color, width: 2),
                    ),
                    child: Center(
                      child: Text(
                        step,
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: color,
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  description,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[700],
                    height: 1.6,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildWhyJoin(bool isMobile) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(16),
          gradient: LinearGradient(
            colors: [Colors.grey[50]!, Colors.white],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
        ),
        padding: EdgeInsets.all(isMobile ? 20 : 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFFB8860B),
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [
                      BoxShadow(
                        color: const Color(0xFFB8860B).withOpacity(0.3),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.star,
                    color: Colors.white,
                    size: 32,
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: Text(
                    'Why Join?',
                    style: TextStyle(
                      fontSize: isMobile ? 24 : 32,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 40),
            isMobile
                ? Column(
                    children: [
                      _buildBenefitCard(
                        icon: Icons.attach_money,
                        title: 'Save Money',
                        description:
                            'Earn credit back on every purchase you make',
                        color: Colors.green,
                        isMobile: isMobile,
                      ),
                      const SizedBox(height: 16),
                      _buildBenefitCard(
                        icon: Icons.trending_up,
                        title: 'Stack Your Savings',
                        description:
                            'The more you shop, the more credit you accumulate',
                        color: Colors.blue,
                        isMobile: isMobile,
                      ),
                      const SizedBox(height: 16),
                      _buildBenefitCard(
                        icon: Icons.flash_on,
                        title: 'Instant Credits',
                        description:
                            'Your credits are added immediately after your purchase',
                        color: Colors.orange,
                        isMobile: isMobile,
                      ),
                      const SizedBox(height: 16),
                      _buildBenefitCard(
                        icon: Icons.card_giftcard,
                        title: 'Flexible Redemption',
                        description:
                            'Use credits whenever you want—all at once or save them for a big purchase',
                        color: Colors.purple,
                        isMobile: isMobile,
                      ),
                    ],
                  )
                : GridView.count(
                    crossAxisCount: 2,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    crossAxisSpacing: 24,
                    mainAxisSpacing: 24,
                    childAspectRatio: 1.2,
                    children: [
                      _buildBenefitCard(
                        icon: Icons.attach_money,
                        title: 'Save Money',
                        description:
                            'Earn credit back on every purchase you make',
                        color: Colors.green,
                        isMobile: isMobile,
                      ),
                      _buildBenefitCard(
                        icon: Icons.trending_up,
                        title: 'Stack Your Savings',
                        description:
                            'The more you shop, the more credit you accumulate',
                        color: Colors.blue,
                        isMobile: isMobile,
                      ),
                      _buildBenefitCard(
                        icon: Icons.flash_on,
                        title: 'Instant Credits',
                        description:
                            'Your credits are added immediately after your purchase',
                        color: Colors.orange,
                        isMobile: isMobile,
                      ),
                      _buildBenefitCard(
                        icon: Icons.card_giftcard,
                        title: 'Flexible Redemption',
                        description:
                            'Use credits whenever you want—all at once or save them for a big purchase',
                        color: Colors.purple,
                        isMobile: isMobile,
                      ),
                    ],
                  ),
          ],
        ),
      ),
    );
  }

  Widget _buildBenefitCard({
    required IconData icon,
    required String title,
    required String description,
    required Color color,
    required bool isMobile,
  }) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withOpacity(0.3), width: 2),
        boxShadow: [
          BoxShadow(
            color: color.withOpacity(0.15),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            width: 70,
            height: 70,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [color, color.withOpacity(0.7)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: color.withOpacity(0.4),
                  blurRadius: 15,
                  offset: const Offset(0, 8),
                ),
              ],
            ),
            child: Icon(icon, color: Colors.white, size: 36),
          ),
          const SizedBox(height: 20),
          Text(
            title,
            textAlign: TextAlign.center,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 12),
          Text(
            description,
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[700],
              height: 1.5,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRegistrationForm(bool isMobile) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: EdgeInsets.all(isMobile ? 20 : 32),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Join Our Loyalty Program',
                style: TextStyle(
                  fontSize: isMobile ? 24 : 32,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                'Please fill in the details below to get started:',
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
              ),
              const SizedBox(height: 24),
              _buildTextField(
                controller: _fullNameController,
                label: 'Full Name*',
                validator: (value) =>
                    value?.isEmpty ?? true ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              _buildTextField(
                controller: _emailController,
                label: 'Email Address*',
                keyboardType: TextInputType.emailAddress,
                validator: (value) {
                  if (value?.isEmpty ?? true) return 'Required';
                  if (!value!.contains('@')) return 'Invalid email';
                  return null;
                },
              ),
              const SizedBox(height: 16),
              _buildTextField(
                controller: _mobileController,
                label: 'Mobile Number*',
                keyboardType: TextInputType.phone,
                validator: (value) =>
                    value?.isEmpty ?? true ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              _buildTextField(
                controller: _passwordController,
                label: 'Create Password*',
                obscureText: true,
                validator: (value) {
                  if (value?.isEmpty ?? true) return 'Required';
                  if (value!.length < 6) {
                    return 'Password must be at least 6 characters';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              _buildTextField(
                controller: _confirmPasswordController,
                label: 'Confirm Password*',
                obscureText: true,
                validator: (value) {
                  if (value?.isEmpty ?? true) return 'Required';
                  if (value != _passwordController.text) {
                    return 'Passwords do not match';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              _buildTextField(
                controller: _dobController,
                label:
                    'Date of Birth (Optional) - to receive special birthday offers',
                keyboardType: TextInputType.datetime,
              ),
              const SizedBox(height: 24),
              CheckboxListTile(
                contentPadding: EdgeInsets.zero,
                controlAffinity: ListTileControlAffinity.leading,
                value: _agreeToTerms,
                onChanged: (value) =>
                    setState(() => _agreeToTerms = value ?? false),
                title: const Text(
                  'I agree to the Loyalty Program Terms & Conditions',
                  style: TextStyle(fontSize: 14),
                ),
              ),
              CheckboxListTile(
                contentPadding: EdgeInsets.zero,
                controlAffinity: ListTileControlAffinity.leading,
                value: _receiveOffers,
                onChanged: (value) =>
                    setState(() => _receiveOffers = value ?? false),
                title: const Text(
                  'I would like to receive news and special offers by email/SMS',
                  style: TextStyle(fontSize: 14),
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _submitForm,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                  ),
                  child: const Text(
                    'Join Now & Start Earning',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTermsSection(bool isMobile) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: EdgeInsets.all(isMobile ? 20 : 32),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    'Terms & Conditions',
                    style: TextStyle(
                      fontSize: isMobile ? 24 : 32,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                IconButton(
                  icon:
                      Icon(_showTerms ? Icons.expand_less : Icons.expand_more),
                  onPressed: () => setState(() => _showTerms = !_showTerms),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Please read these carefully before joining.',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[600],
              ),
            ),
            if (_showTerms) ...[
              const SizedBox(height: 24),
              _buildTermsContent(),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildTermsContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildTermSection(
          'Eligibility',
          '• The Loyalty Program is open to customers who create an account on our website.\n• One loyalty account per person (based on email and mobile number).',
        ),
        _buildTermSection(
          'Earning Loyalty Credit',
          '• Loyalty credit is earned only on online purchases made through our official website.\n• You earn 10 AED for every 1,000 AED spent on eligible online orders (equivalent to 1% of your online spend).\n• Loyalty credit is calculated on the net amount paid for products (after discounts or promo codes, and excluding any delivery/shipping fees or service charges, if applicable).\n• Loyalty credit for an order will be added to your account only after the order is confirmed and not cancelled.',
        ),
        _buildTermSection(
          'Redeeming Loyalty Credit',
          '• Loyalty credit can be used only for online purchases on our website.\n• Your available loyalty balance will be shown at checkout; you can choose to use all or part of it.\n• If your loyalty credit does not cover the full order amount, you must pay the remaining balance using the available payment methods.\n• Loyalty credit cannot be exchanged for cash, transferred to another person, or used outside our website.',
        ),
        _buildTermSection(
          'Returns, Cancellations & Adjustments',
          '• If you return an order or part of an order, the loyalty credit earned from that order may be adjusted or deducted from your balance.\n• If you paid using loyalty credit and then return the order, any refunded amount in loyalty credit will be returned to your loyalty balance, not as cash.',
        ),
        _buildTermSection(
          'Program Changes & Termination',
          '• We reserve the right to modify, pause, or terminate the Loyalty Program at any time, including changing the earning rate (10 AED per 1,000 AED) or redemption rules.\n• Any changes will be communicated on this page and/or through email where possible.',
        ),
        _buildTermSection(
          'Account Management',
          '• You are responsible for keeping your account details (email, password, mobile number) secure.\n• We may suspend or close accounts that show signs of misuse, fraud, or violation of these Terms & Conditions.',
        ),
        _buildTermSection(
          'Online-Only Benefit',
          '• This Loyalty Program is strictly for online purchases only.\n• Purchases made through physical stores, phone orders, or other channels are not eligible to earn or redeem loyalty credit under this program.',
        ),
      ],
    );
  }

  Widget _buildTermSection(String title, String content) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            content,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[700],
              height: 1.6,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInfoCard({
    required IconData icon,
    required String title,
    required String description,
    required bool isMobile,
  }) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.black,
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: Colors.white, size: 24),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                description,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[700],
                  height: 1.6,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildExampleRow(String text) {
    return Row(
      children: [
        Icon(Icons.check_circle, color: Colors.green[700], size: 20),
        const SizedBox(width: 8),
        Text(
          text,
          style: TextStyle(
            fontSize: 14,
            color: Colors.green[900],
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }

  Widget _buildBenefitItem(String text, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        children: [
          Icon(icon, color: Colors.black, size: 24),
          const SizedBox(width: 16),
          Expanded(
            child: Text(
              text,
              style: const TextStyle(
                fontSize: 15,
                height: 1.5,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    TextInputType? keyboardType,
    bool obscureText = false,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      obscureText: obscureText,
      validator: validator,
      decoration: InputDecoration(
        labelText: label,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.grey[300]!),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: BorderSide(color: Colors.grey[300]!),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Colors.black, width: 2),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(8),
          borderSide: const BorderSide(color: Colors.red),
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 14,
        ),
      ),
    );
  }
}
