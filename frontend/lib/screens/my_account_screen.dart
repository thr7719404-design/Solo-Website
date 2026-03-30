import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../widgets/modern_drawer.dart';
import '../providers/auth_provider.dart';
import '../providers/account_provider.dart';
import '../config/app_config.dart';
import 'signup_screen.dart';
import 'login_screen.dart';

class MyAccountScreen extends StatefulWidget {
  const MyAccountScreen({super.key});

  @override
  State<MyAccountScreen> createState() => _MyAccountScreenState();
}

class _MyAccountScreenState extends State<MyAccountScreen> {
  int _selectedIndex = 0;
  bool _dataLoaded = false;

  // Profile form controllers
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();

  final List<Map<String, dynamic>> _menuItems = [
    {'icon': Icons.person_outline, 'title': 'Profile'},
    {'icon': Icons.receipt_long_outlined, 'title': 'Orders'},
    {'icon': Icons.account_balance_wallet_outlined, 'title': 'Loyalty Cash'},
    {'icon': Icons.location_on_outlined, 'title': 'Addresses'},
    {'icon': Icons.payment_outlined, 'title': 'Payment Methods'},
    {'icon': Icons.settings_outlined, 'title': 'Settings'},
  ];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _loadAccountData();
    });
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _loadAccountData() async {
    final authProvider = context.read<AuthProvider>();
    if (authProvider.isAuthenticated && !_dataLoaded) {
      final accountProvider = context.read<AccountProvider>();
      await accountProvider.loadAll();
      _populateProfileForm();
      setState(() {
        _dataLoaded = true;
      });
    }
  }

  void _populateProfileForm() {
    final accountProvider = context.read<AccountProvider>();
    final profile = accountProvider.profile;
    if (profile != null) {
      _firstNameController.text = profile['firstName'] ?? '';
      _lastNameController.text = profile['lastName'] ?? '';
      _emailController.text = profile['email'] ?? '';
      _phoneController.text = profile['phone'] ?? '';
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();

    // Show login screen if not authenticated
    if (!authProvider.isAuthenticated) {
      return _buildLoginPromptScreen(context);
    }

    return Scaffold(
      backgroundColor: Colors.grey[50],
      drawer: const ModernDrawer(),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        title: const Text(
          'MY ACCOUNT',
          style: TextStyle(
            fontFamily: 'WorkSans',
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.black,
            letterSpacing: 2,
          ),
        ),
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: LayoutBuilder(
        builder: (context, constraints) {
          final isMobile = constraints.maxWidth < 768;

          if (isMobile) {
            return Column(
              children: [
                Container(
                  color: Colors.white,
                  child: SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    child: Row(
                      children: _menuItems.asMap().entries.map((entry) {
                        final index = entry.key;
                        final item = entry.value;
                        final isSelected = _selectedIndex == index;
                        return Padding(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 4, vertical: 8),
                          child: InkWell(
                            onTap: () => setState(() => _selectedIndex = index),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 16, vertical: 10),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? const Color(0xFFB8860B)
                                    : Colors.transparent,
                                borderRadius: BorderRadius.circular(20),
                                border: Border.all(
                                  color: isSelected
                                      ? const Color(0xFFB8860B)
                                      : Colors.grey[300]!,
                                ),
                              ),
                              child: Row(
                                mainAxisSize: MainAxisSize.min,
                                children: [
                                  Icon(item['icon'],
                                      color: isSelected
                                          ? Colors.white
                                          : Colors.black54,
                                      size: 18),
                                  const SizedBox(width: 6),
                                  Text(
                                    item['title'],
                                    style: TextStyle(
                                      fontFamily: 'WorkSans',
                                      fontSize: 12,
                                      fontWeight: FontWeight.w500,
                                      color: isSelected
                                          ? Colors.white
                                          : Colors.black87,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          ),
                        );
                      }).toList(),
                    ),
                  ),
                ),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(16),
                    child: _buildContent(),
                  ),
                ),
              ],
            );
          }

          // Desktop layout
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Container(
                width: 280,
                color: Colors.white,
                child: Column(
                  children: [
                    _buildUserInfoSection(),
                    Expanded(
                      child: ListView.builder(
                        padding: EdgeInsets.zero,
                        itemCount: _menuItems.length,
                        itemBuilder: (context, index) {
                          final item = _menuItems[index];
                          final isSelected = _selectedIndex == index;
                          return InkWell(
                            onTap: () => setState(() => _selectedIndex = index),
                            child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 25, vertical: 18),
                              decoration: BoxDecoration(
                                color: isSelected
                                    ? const Color(0xFFB8860B).withOpacity(0.1)
                                    : Colors.transparent,
                                border: Border(
                                  left: BorderSide(
                                    color: isSelected
                                        ? const Color(0xFFB8860B)
                                        : Colors.transparent,
                                    width: 3,
                                  ),
                                ),
                              ),
                              child: Row(
                                children: [
                                  Icon(item['icon'],
                                      color: isSelected
                                          ? const Color(0xFFB8860B)
                                          : Colors.black54,
                                      size: 22),
                                  const SizedBox(width: 15),
                                  Text(
                                    item['title'],
                                    style: TextStyle(
                                      fontFamily: 'WorkSans',
                                      fontSize: 14,
                                      fontWeight: isSelected
                                          ? FontWeight.w500
                                          : FontWeight.w400,
                                      color: isSelected
                                          ? const Color(0xFFB8860B)
                                          : Colors.black87,
                                      letterSpacing: 0.3,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(40),
                  child: _buildContent(),
                ),
              ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildUserInfoSection() {
    final authProvider = context.watch<AuthProvider>();
    final accountProvider = context.watch<AccountProvider>();

    return Container(
      padding: const EdgeInsets.all(30),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [const Color(0xFFB8860B).withOpacity(0.1), Colors.white],
        ),
      ),
      child: Column(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              color: const Color(0xFFB8860B).withOpacity(0.2),
              shape: BoxShape.circle,
            ),
            child: const Icon(Icons.person, size: 40, color: Color(0xFFB8860B)),
          ),
          const SizedBox(height: 15),
          Text(
            '${authProvider.user?.firstName ?? ''} ${authProvider.user?.lastName ?? ''}',
            style: const TextStyle(
              fontFamily: 'WorkSans',
              fontSize: 18,
              fontWeight: FontWeight.w500,
              color: Colors.black,
            ),
          ),
          const SizedBox(height: 5),
          Text(
            authProvider.user?.email ?? '',
            style: TextStyle(
              fontFamily: 'WorkSans',
              fontSize: 13,
              fontWeight: FontWeight.w300,
              color: Colors.black.withOpacity(0.6),
            ),
          ),
          const SizedBox(height: 20),
          // Loyalty Cash Balance
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: const Color(0xFFB8860B),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Row(
                  children: [
                    Icon(Icons.account_balance_wallet,
                        color: Colors.white, size: 18),
                    SizedBox(width: 8),
                    Text(
                      'Loyalty Cash',
                      style: TextStyle(
                        fontFamily: 'WorkSans',
                        fontSize: 12,
                        fontWeight: FontWeight.w400,
                        color: Colors.white70,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                accountProvider.loadingLoyalty
                    ? const SizedBox(
                        height: 24,
                        width: 24,
                        child: CircularProgressIndicator(
                            color: Colors.white, strokeWidth: 2),
                      )
                    : Text(
                        'AED ${accountProvider.loyaltyBalance.toStringAsFixed(2)}',
                        style: const TextStyle(
                          fontFamily: 'WorkSans',
                          fontSize: 20,
                          fontWeight: FontWeight.w700,
                          color: Colors.white,
                        ),
                      ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildContent() {
    switch (_selectedIndex) {
      case 0:
        return _buildProfileSection();
      case 1:
        return _buildOrdersSection();
      case 2:
        return _buildLoyaltyCashSection();
      case 3:
        return _buildAddressesSection();
      case 4:
        return _buildPaymentMethodsSection();
      case 5:
        return _buildSettingsSection();
      default:
        return _buildProfileSection();
    }
  }

  Widget _buildProfileSection() {
    final accountProvider = context.watch<AccountProvider>();

    return Container(
      padding: const EdgeInsets.all(30),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 2)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            'Profile Information',
            style: TextStyle(
                fontFamily: 'WorkSans',
                fontSize: 24,
                fontWeight: FontWeight.w400,
                color: Colors.black),
          ),
          const SizedBox(height: 30),
          if (accountProvider.loadingProfile)
            const Center(
                child: CircularProgressIndicator(color: Color(0xFFB8860B)))
          else ...[
            _buildEditableTextField('First Name', _firstNameController),
            const SizedBox(height: 20),
            _buildEditableTextField('Last Name', _lastNameController),
            const SizedBox(height: 20),
            _buildEditableTextField('Email', _emailController, enabled: false),
            const SizedBox(height: 20),
            _buildEditableTextField('Phone', _phoneController),
            const SizedBox(height: 30),
            ElevatedButton(
              onPressed: accountProvider.savingProfile ? null : _saveProfile,
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFB8860B),
                foregroundColor: Colors.white,
                padding:
                    const EdgeInsets.symmetric(horizontal: 40, vertical: 16),
                shape: const RoundedRectangleBorder(
                    borderRadius: BorderRadius.zero),
              ),
              child: accountProvider.savingProfile
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(
                          color: Colors.white, strokeWidth: 2))
                  : const Text(
                      'SAVE CHANGES',
                      style: TextStyle(
                          fontFamily: 'WorkSans',
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 1.5),
                    ),
            ),
          ],
        ],
      ),
    );
  }

  Future<void> _saveProfile() async {
    final accountProvider = context.read<AccountProvider>();
    final success = await accountProvider.saveProfile(
      firstName: _firstNameController.text,
      lastName: _lastNameController.text,
      phone: _phoneController.text,
    );

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(success
              ? 'Profile updated successfully'
              : 'Failed to update profile'),
          backgroundColor: success ? Colors.green : Colors.red,
        ),
      );

      // Refresh auth user data
      if (success) {
        await context.read<AuthProvider>().refreshUser();
      }
    }
  }

  Widget _buildOrdersSection() {
    final accountProvider = context.watch<AccountProvider>();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Order History',
              style: TextStyle(
                  fontFamily: 'WorkSans',
                  fontSize: 24,
                  fontWeight: FontWeight.w400,
                  color: Colors.black),
            ),
            IconButton(
              onPressed: () => accountProvider.refreshOrders(),
              icon: const Icon(Icons.refresh),
              color: const Color(0xFFB8860B),
            ),
          ],
        ),
        const SizedBox(height: 30),
        if (accountProvider.loadingOrders)
          const Center(
              child: CircularProgressIndicator(color: Color(0xFFB8860B)))
        else if (accountProvider.orders.isEmpty)
          _buildEmptyState('No orders yet',
              'Your order history will appear here once you make a purchase.')
        else
          ...accountProvider.orders
              .map((order) => _buildOrderCard(order as Map<String, dynamic>)),
      ],
    );
  }

  Widget _buildOrderCard(Map<String, dynamic> order) {
    final status = order['status'] ?? 'PENDING';
    final isDelivered = status == 'DELIVERED';
    final createdAt = order['createdAt'] != null
        ? DateFormat('MMM d, yyyy').format(DateTime.parse(order['createdAt']))
        : '';
    final total = order['total'] is num
        ? (order['total'] as num).toDouble()
        : double.tryParse(order['total']?.toString() ?? '0') ?? 0;

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(25),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 2))
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(
                      'Order #${order['orderNumber'] ?? order['id']?.toString().substring(0, 8) ?? ''}',
                      style: const TextStyle(
                          fontFamily: 'WorkSans',
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                          color: Colors.black),
                    ),
                    const SizedBox(width: 15),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 4),
                      decoration: BoxDecoration(
                        color: isDelivered
                            ? Colors.green.withOpacity(0.1)
                            : Colors.orange.withOpacity(0.1),
                      ),
                      child: Text(
                        _formatStatus(status),
                        style: TextStyle(
                          fontFamily: 'WorkSans',
                          fontSize: 11,
                          fontWeight: FontWeight.w500,
                          color: isDelivered ? Colors.green : Colors.orange,
                          letterSpacing: 0.5,
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 10),
                Text(
                  '$createdAt • ${order['itemsCount'] ?? 0} items • AED ${total.toStringAsFixed(2)}',
                  style: TextStyle(
                      fontFamily: 'WorkSans',
                      fontSize: 13,
                      fontWeight: FontWeight.w300,
                      color: Colors.black.withOpacity(0.6)),
                ),
              ],
            ),
          ),
          OutlinedButton(
            onPressed: () => _showOrderDetails(order['id']),
            style: OutlinedButton.styleFrom(
              foregroundColor: const Color(0xFFB8860B),
              side: const BorderSide(color: Color(0xFFB8860B)),
              shape:
                  const RoundedRectangleBorder(borderRadius: BorderRadius.zero),
            ),
            child: const Text('VIEW DETAILS'),
          ),
        ],
      ),
    );
  }

  String _formatStatus(String status) {
    return status.replaceAll('_', ' ');
  }

  Future<void> _showOrderDetails(String orderId) async {
    final accountProvider = context.read<AccountProvider>();
    final order = await accountProvider.getOrderDetails(orderId);

    if (order != null && mounted) {
      final loyaltyEarnAed = (order['loyaltyEarnAed'] ?? 0).toDouble();
      final loyaltyRedeemAed = (order['loyaltyRedeemAed'] ?? 0).toDouble();

      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: Text('Order #${order['orderNumber'] ?? ''}'),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Status: ${_formatStatus(order['status'] ?? '')}'),
                Text('Payment: ${_formatStatus(order['paymentStatus'] ?? '')}'),
                Text('Total: AED ${order['total']}'),
                const SizedBox(height: 16),
                const Text('Items:',
                    style: TextStyle(fontWeight: FontWeight.bold)),
                if (order['items'] != null)
                  ...(order['items'] as List).map((item) => Padding(
                        padding: const EdgeInsets.symmetric(vertical: 4),
                        child: Text(
                            '${item['quantity']}x ${item['name']} - AED ${item['subtotal']}'),
                      )),
                // Loyalty Cash Section
                if (loyaltyEarnAed > 0 || loyaltyRedeemAed > 0) ...[
                  const SizedBox(height: 16),
                  const Text('Loyalty Cash:',
                      style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  if (loyaltyEarnAed > 0)
                    Row(
                      children: [
                        const Icon(Icons.add_circle,
                            color: Color(0xFFB8860B), size: 16),
                        const SizedBox(width: 6),
                        Text(
                          'Earned: AED ${loyaltyEarnAed.toStringAsFixed(2)}',
                          style: const TextStyle(
                              color: Color(0xFFB8860B),
                              fontWeight: FontWeight.w500),
                        ),
                      ],
                    ),
                  if (loyaltyRedeemAed > 0)
                    Padding(
                      padding: EdgeInsets.only(top: loyaltyEarnAed > 0 ? 4 : 0),
                      child: Row(
                        children: [
                          const Icon(Icons.remove_circle,
                              color: Colors.red, size: 16),
                          const SizedBox(width: 6),
                          Text(
                            'Redeemed: -AED ${loyaltyRedeemAed.toStringAsFixed(2)}',
                            style: const TextStyle(
                                color: Colors.red, fontWeight: FontWeight.w500),
                          ),
                        ],
                      ),
                    ),
                ],
                // Shipping Address
                if (order['shippingAddress'] != null) ...[
                  const SizedBox(height: 16),
                  const Text('Shipping Address:',
                      style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  _buildAddressDisplay(
                      order['shippingAddress'] as Map<String, dynamic>),
                ],
                // Billing Address
                if (order['billingAddress'] != null) ...[
                  const SizedBox(height: 16),
                  const Text('Billing Address:',
                      style: TextStyle(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 4),
                  _buildAddressDisplay(
                      order['billingAddress'] as Map<String, dynamic>),
                  // Billing Invoice Fields
                  if (order['billingInvoiceCompany'] != null &&
                      (order['billingInvoiceCompany'] as String).isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 4),
                      child: Text('Company: ${order['billingInvoiceCompany']}',
                          style:
                              TextStyle(color: Colors.grey[700], fontSize: 13)),
                    ),
                  if (order['billingInvoiceVatNumber'] != null &&
                      (order['billingInvoiceVatNumber'] as String).isNotEmpty)
                    Padding(
                      padding: const EdgeInsets.only(top: 2),
                      child: Text(
                          'VAT/TRN: ${order['billingInvoiceVatNumber']}',
                          style:
                              TextStyle(color: Colors.grey[700], fontSize: 13)),
                    ),
                ],
              ],
            ),
          ),
          actions: [
            TextButton.icon(
              onPressed: () async {
                final invoiceUrl =
                    '${AppConfig.apiBaseUrl}/orders/${order['id']}/invoice/pdf';
                final uri = Uri.parse(invoiceUrl);
                if (await canLaunchUrl(uri)) {
                  await launchUrl(uri, mode: LaunchMode.externalApplication);
                } else {
                  if (context.mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                          content: Text('Could not download invoice')),
                    );
                  }
                }
              },
              icon: const Icon(Icons.download, size: 18),
              label: const Text('INVOICE'),
            ),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('CLOSE'),
            ),
          ],
        ),
      );
    }
  }

  Widget _buildAddressDisplay(Map<String, dynamic> address) {
    final fullName =
        '${address['firstName'] ?? ''} ${address['lastName'] ?? ''}'.trim();
    final line1 = address['addressLine1'] ?? '';
    final line2 = address['addressLine2'] ?? '';
    final city = address['city'] ?? '';
    final postalCode = address['postalCode'] ?? '';
    final phone = address['phone'] ?? '';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (fullName.isNotEmpty)
          Text(fullName, style: const TextStyle(fontSize: 13)),
        if (line1.isNotEmpty) Text(line1, style: const TextStyle(fontSize: 13)),
        if (line2.isNotEmpty) Text(line2, style: const TextStyle(fontSize: 13)),
        if (city.isNotEmpty || postalCode.isNotEmpty)
          Text('$city${postalCode.isNotEmpty ? ', $postalCode' : ''}',
              style: const TextStyle(fontSize: 13)),
        if (phone.isNotEmpty)
          Text('Phone: $phone',
              style: TextStyle(color: Colors.grey[600], fontSize: 12)),
      ],
    );
  }

  Widget _buildLoyaltyCashSection() {
    final accountProvider = context.watch<AccountProvider>();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Loyalty Cash Balance',
          style: TextStyle(
              fontFamily: 'WorkSans',
              fontSize: 24,
              fontWeight: FontWeight.w300,
              color: Colors.black,
              letterSpacing: 0.5),
        ),
        const SizedBox(height: 30),
        if (accountProvider.loadingLoyalty)
          const Center(
              child: CircularProgressIndicator(color: Color(0xFFB8860B)))
        else ...[
          // Balance Card
          Container(
            padding: const EdgeInsets.all(40),
            decoration: BoxDecoration(
              gradient: const LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: [Color(0xFFB8860B), Color(0xFFD4AF37)],
              ),
              boxShadow: [
                BoxShadow(
                    color: Colors.black.withOpacity(0.1),
                    blurRadius: 20,
                    offset: const Offset(0, 5))
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Available Balance',
                          style: TextStyle(
                              fontFamily: 'WorkSans',
                              fontSize: 14,
                              fontWeight: FontWeight.w300,
                              color: Colors.white70,
                              letterSpacing: 0.5),
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'AED ${accountProvider.loyaltyBalance.toStringAsFixed(2)}',
                          style: const TextStyle(
                              fontFamily: 'WorkSans',
                              fontSize: 42,
                              fontWeight: FontWeight.w600,
                              color: Colors.white),
                        ),
                      ],
                    ),
                    Container(
                      padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.2),
                          shape: BoxShape.circle),
                      child: const Icon(Icons.account_balance_wallet,
                          color: Colors.white, size: 40),
                    ),
                  ],
                ),
                const SizedBox(height: 30),
                Row(
                  children: [
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.15)),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Total Earned',
                                style: TextStyle(
                                    fontFamily: 'WorkSans',
                                    fontSize: 12,
                                    fontWeight: FontWeight.w300,
                                    color: Colors.white70)),
                            const SizedBox(height: 8),
                            Text(
                              'AED ${accountProvider.loyaltyTotalEarned.toStringAsFixed(2)}',
                              style: const TextStyle(
                                  fontFamily: 'WorkSans',
                                  fontSize: 20,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(width: 20),
                    Expanded(
                      child: Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                            color: Colors.white.withOpacity(0.15)),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text('Total Redeemed',
                                style: TextStyle(
                                    fontFamily: 'WorkSans',
                                    fontSize: 12,
                                    fontWeight: FontWeight.w300,
                                    color: Colors.white70)),
                            const SizedBox(height: 8),
                            Text(
                              'AED ${accountProvider.loyaltyTotalRedeemed.toStringAsFixed(2)}',
                              style: const TextStyle(
                                  fontFamily: 'WorkSans',
                                  fontSize: 20,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.white),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 40),
          // Transaction History
          const Text('Recent Transactions',
              style: TextStyle(
                  fontFamily: 'WorkSans',
                  fontSize: 18,
                  fontWeight: FontWeight.w400,
                  color: Colors.black)),
          const SizedBox(height: 20),
          if (accountProvider.loyaltyTransactions.isEmpty)
            _buildEmptyState(
                'No transactions yet', 'Earn loyalty cash by making purchases.')
          else
            ...accountProvider.loyaltyTransactions.map((tx) =>
                _buildLoyaltyTransactionCard(tx as Map<String, dynamic>)),
          const SizedBox(height: 20),
          _buildLoyaltyInfoCard(),
        ],
      ],
    );
  }

  Widget _buildLoyaltyTransactionCard(Map<String, dynamic> tx) {
    final isEarned = tx['type'] == 'EARNED';
    final amount = tx['amountAed'] is num
        ? (tx['amountAed'] as num).toDouble()
        : double.tryParse(tx['amountAed']?.toString() ?? '0') ?? 0;
    final date = tx['createdAt'] != null
        ? DateFormat('MMM d, yyyy').format(DateTime.parse(tx['createdAt']))
        : '';

    return Container(
      margin: const EdgeInsets.only(bottom: 15),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 2))
        ],
      ),
      child: Row(
        children: [
          Container(
            width: 50,
            height: 50,
            decoration: BoxDecoration(
              color: isEarned
                  ? Colors.green.withOpacity(0.1)
                  : Colors.red.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(isEarned ? Icons.add : Icons.remove,
                color: isEarned ? Colors.green : Colors.red, size: 24),
          ),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  tx['description'] ?? (isEarned ? 'Earned' : 'Redeemed'),
                  style: const TextStyle(
                      fontFamily: 'WorkSans',
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: Colors.black),
                ),
                const SizedBox(height: 4),
                Text(date,
                    style: TextStyle(
                        fontFamily: 'WorkSans',
                        fontSize: 12,
                        fontWeight: FontWeight.w300,
                        color: Colors.black.withOpacity(0.5))),
              ],
            ),
          ),
          Text(
            '${amount >= 0 ? '+' : ''}AED ${amount.abs().toStringAsFixed(2)}',
            style: TextStyle(
                fontFamily: 'WorkSans',
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: amount >= 0 ? Colors.green : Colors.red),
          ),
        ],
      ),
    );
  }

  Widget _buildLoyaltyInfoCard() {
    return Container(
      padding: const EdgeInsets.all(30),
      decoration: BoxDecoration(
        color: const Color(0xFFB8860B).withOpacity(0.05),
        border: Border.all(color: const Color(0xFFB8860B).withOpacity(0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Row(
            children: [
              Icon(Icons.info_outline, color: Color(0xFFB8860B), size: 24),
              SizedBox(width: 12),
              Text('How Loyalty Cash Works',
                  style: TextStyle(
                      fontFamily: 'WorkSans',
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                      color: Colors.black)),
            ],
          ),
          const SizedBox(height: 20),
          _buildInfoRow('Earn 5% loyalty cash on every purchase'),
          _buildInfoRow('Use loyalty cash on your next order'),
          _buildInfoRow('No expiry date - your balance stays forever'),
          _buildInfoRow('Combine with other offers and discounts'),
        ],
      ),
    );
  }

  Widget _buildInfoRow(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Icon(Icons.check_circle, color: Color(0xFFB8860B), size: 18),
          const SizedBox(width: 12),
          Expanded(
            child: Text(text,
                style: TextStyle(
                    fontFamily: 'WorkSans',
                    fontSize: 14,
                    fontWeight: FontWeight.w300,
                    color: Colors.black.withOpacity(0.8),
                    height: 1.5)),
          ),
        ],
      ),
    );
  }

  Widget _buildAddressesSection() {
    final accountProvider = context.watch<AccountProvider>();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Saved Addresses',
                style: TextStyle(
                    fontFamily: 'WorkSans',
                    fontSize: 24,
                    fontWeight: FontWeight.w400,
                    color: Colors.black)),
            OutlinedButton.icon(
              onPressed: () => _showAddressDialog(),
              icon: const Icon(Icons.add),
              label: const Text('ADD NEW ADDRESS'),
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFFB8860B),
                side: const BorderSide(color: Color(0xFFB8860B)),
                shape: const RoundedRectangleBorder(
                    borderRadius: BorderRadius.zero),
              ),
            ),
          ],
        ),
        const SizedBox(height: 30),
        if (accountProvider.loadingAddresses)
          const Center(
              child: CircularProgressIndicator(color: Color(0xFFB8860B)))
        else if (accountProvider.addresses.isEmpty)
          _buildEmptyState(
              'No addresses saved', 'Add an address to make checkout faster.')
        else
          ...accountProvider.addresses
              .map((addr) => _buildAddressCard(addr as Map<String, dynamic>)),
      ],
    );
  }

  Widget _buildAddressCard(Map<String, dynamic> address) {
    final isDefault = address['isDefault'] == true;
    final label = address['company'] ?? 'Address';
    final addressText = [
      address['addressLine1'],
      address['addressLine2'],
      '${address['city'] ?? ''}, ${address['country'] ?? ''}',
    ].where((s) => s != null && s.toString().isNotEmpty).join('\n');

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(25),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(
          color: isDefault ? const Color(0xFFB8860B) : Colors.grey[300]!,
          width: isDefault ? 2 : 1,
        ),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(label,
                        style: const TextStyle(
                            fontFamily: 'WorkSans',
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                            color: Colors.black)),
                    if (isDefault) ...[
                      const SizedBox(width: 10),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                            color: const Color(0xFFB8860B).withOpacity(0.1)),
                        child: const Text('DEFAULT',
                            style: TextStyle(
                                fontFamily: 'WorkSans',
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFFB8860B),
                                letterSpacing: 1)),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 10),
                Text('${address['firstName']} ${address['lastName']}',
                    style: TextStyle(
                        fontFamily: 'WorkSans',
                        fontSize: 13,
                        fontWeight: FontWeight.w400,
                        color: Colors.black.withOpacity(0.8))),
                const SizedBox(height: 4),
                Text(addressText,
                    style: TextStyle(
                        fontFamily: 'WorkSans',
                        fontSize: 13,
                        fontWeight: FontWeight.w300,
                        color: Colors.black.withOpacity(0.7),
                        height: 1.5)),
                if (address['phone'] != null) ...[
                  const SizedBox(height: 4),
                  Text(address['phone'],
                      style: TextStyle(
                          fontFamily: 'WorkSans',
                          fontSize: 13,
                          fontWeight: FontWeight.w300,
                          color: Colors.black.withOpacity(0.7))),
                ],
              ],
            ),
          ),
          Row(
            children: [
              if (!isDefault)
                IconButton(
                  onPressed: () => _setDefaultAddress(address['id']),
                  icon: const Icon(Icons.check_circle_outline),
                  color: Colors.grey,
                  tooltip: 'Set as default',
                ),
              IconButton(
                onPressed: () => _showAddressDialog(address: address),
                icon: const Icon(Icons.edit_outlined),
                color: const Color(0xFFB8860B),
              ),
              IconButton(
                onPressed: () => _deleteAddress(address['id']),
                icon: const Icon(Icons.delete_outline),
                color: Colors.red,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _showAddressDialog({Map<String, dynamic>? address}) async {
    final isEditing = address != null;
    final firstNameCtrl =
        TextEditingController(text: address?['firstName'] ?? '');
    final lastNameCtrl =
        TextEditingController(text: address?['lastName'] ?? '');
    final companyCtrl = TextEditingController(text: address?['company'] ?? '');
    final address1Ctrl =
        TextEditingController(text: address?['addressLine1'] ?? '');
    final address2Ctrl =
        TextEditingController(text: address?['addressLine2'] ?? '');
    final cityCtrl = TextEditingController(text: address?['city'] ?? '');
    final countryCtrl =
        TextEditingController(text: address?['country'] ?? 'AE');
    final phoneCtrl = TextEditingController(text: address?['phone'] ?? '');
    bool isDefault = address?['isDefault'] ?? false;

    final result = await showDialog<bool>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: Text(isEditing ? 'Edit Address' : 'Add New Address'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Row(
                  children: [
                    Expanded(
                        child: TextField(
                            controller: firstNameCtrl,
                            decoration: const InputDecoration(
                                labelText: 'First Name'))),
                    const SizedBox(width: 16),
                    Expanded(
                        child: TextField(
                            controller: lastNameCtrl,
                            decoration:
                                const InputDecoration(labelText: 'Last Name'))),
                  ],
                ),
                TextField(
                    controller: companyCtrl,
                    decoration: const InputDecoration(
                        labelText: 'Label (e.g., Home, Office)')),
                TextField(
                    controller: address1Ctrl,
                    decoration:
                        const InputDecoration(labelText: 'Address Line 1')),
                TextField(
                    controller: address2Ctrl,
                    decoration: const InputDecoration(
                        labelText: 'Address Line 2 (optional)')),
                Row(
                  children: [
                    Expanded(
                        child: TextField(
                            controller: cityCtrl,
                            decoration:
                                const InputDecoration(labelText: 'City'))),
                    const SizedBox(width: 16),
                    Expanded(
                        child: TextField(
                            controller: countryCtrl,
                            decoration:
                                const InputDecoration(labelText: 'Country'))),
                  ],
                ),
                TextField(
                    controller: phoneCtrl,
                    decoration: const InputDecoration(labelText: 'Phone')),
                const SizedBox(height: 16),
                CheckboxListTile(
                  value: isDefault,
                  onChanged: (v) => setState(() => isDefault = v ?? false),
                  title: const Text('Set as default address'),
                  controlAffinity: ListTileControlAffinity.leading,
                  contentPadding: EdgeInsets.zero,
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
                onPressed: () => Navigator.pop(context, false),
                child: const Text('CANCEL')),
            ElevatedButton(
              onPressed: () async {
                final data = {
                  'firstName': firstNameCtrl.text,
                  'lastName': lastNameCtrl.text,
                  'company': companyCtrl.text,
                  'addressLine1': address1Ctrl.text,
                  'addressLine2': address2Ctrl.text,
                  'city': cityCtrl.text,
                  'country': countryCtrl.text,
                  'phone': phoneCtrl.text,
                  'isDefault': isDefault,
                };

                final accountProvider = context.read<AccountProvider>();
                bool success;
                if (isEditing) {
                  success =
                      await accountProvider.updateAddress(address['id'], data);
                } else {
                  success = await accountProvider.createAddress(data);
                }

                if (context.mounted) {
                  Navigator.pop(context, success);
                }
              },
              style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFB8860B)),
              child: Text(isEditing ? 'SAVE' : 'ADD'),
            ),
          ],
        ),
      ),
    );

    if (result == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
            content: Text(isEditing ? 'Address updated' : 'Address added'),
            backgroundColor: Colors.green),
      );
    }
  }

  Future<void> _setDefaultAddress(String addressId) async {
    final accountProvider = context.read<AccountProvider>();
    await accountProvider.updateAddress(addressId, {'isDefault': true});
  }

  Future<void> _deleteAddress(String addressId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Address'),
        content: const Text('Are you sure you want to delete this address?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('CANCEL')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('DELETE'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final accountProvider = context.read<AccountProvider>();
      await accountProvider.deleteAddress(addressId);
    }
  }

  Widget _buildPaymentMethodsSection() {
    final accountProvider = context.watch<AccountProvider>();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text('Payment Methods',
                style: TextStyle(
                    fontFamily: 'WorkSans',
                    fontSize: 24,
                    fontWeight: FontWeight.w400,
                    color: Colors.black)),
            OutlinedButton.icon(
              onPressed: () => _showAddPaymentMethodDialog(),
              icon: const Icon(Icons.add),
              label: const Text('ADD NEW CARD'),
              style: OutlinedButton.styleFrom(
                foregroundColor: const Color(0xFFB8860B),
                side: const BorderSide(color: Color(0xFFB8860B)),
                shape: const RoundedRectangleBorder(
                    borderRadius: BorderRadius.zero),
              ),
            ),
          ],
        ),
        const SizedBox(height: 30),
        if (accountProvider.loadingPayments)
          const Center(
              child: CircularProgressIndicator(color: Color(0xFFB8860B)))
        else if (accountProvider.paymentMethods.isEmpty)
          _buildEmptyState('No payment methods saved',
              'Add a payment method for faster checkout.')
        else
          ...accountProvider.paymentMethods
              .map((pm) => _buildPaymentCard(pm as Map<String, dynamic>)),
      ],
    );
  }

  Widget _buildPaymentCard(Map<String, dynamic> pm) {
    final isDefault = pm['isDefault'] == true;
    final brand = (pm['brand'] ?? 'card').toString().toUpperCase();
    final last4 = pm['last4'] ?? '****';
    final expMonth = pm['expMonth']?.toString().padLeft(2, '0') ?? '??';
    final expYear = pm['expYear']?.toString() ?? '??';

    return Container(
      margin: const EdgeInsets.only(bottom: 20),
      padding: const EdgeInsets.all(25),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(
            color: isDefault ? const Color(0xFFB8860B) : Colors.grey[300]!,
            width: isDefault ? 2 : 1),
      ),
      child: Row(
        children: [
          const Icon(Icons.credit_card, size: 40, color: Color(0xFFB8860B)),
          const SizedBox(width: 20),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Text(brand,
                        style: const TextStyle(
                            fontFamily: 'WorkSans',
                            fontSize: 16,
                            fontWeight: FontWeight.w500,
                            color: Colors.black)),
                    if (isDefault) ...[
                      const SizedBox(width: 10),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                            color: const Color(0xFFB8860B).withOpacity(0.1)),
                        child: const Text('DEFAULT',
                            style: TextStyle(
                                fontFamily: 'WorkSans',
                                fontSize: 10,
                                fontWeight: FontWeight.w600,
                                color: Color(0xFFB8860B),
                                letterSpacing: 1)),
                      ),
                    ],
                  ],
                ),
                const SizedBox(height: 5),
                Text('**** **** **** $last4',
                    style: TextStyle(
                        fontFamily: 'WorkSans',
                        fontSize: 13,
                        fontWeight: FontWeight.w300,
                        color: Colors.black.withOpacity(0.7))),
                Text('Expires $expMonth/$expYear',
                    style: TextStyle(
                        fontFamily: 'WorkSans',
                        fontSize: 12,
                        fontWeight: FontWeight.w300,
                        color: Colors.black.withOpacity(0.5))),
              ],
            ),
          ),
          Row(
            children: [
              if (!isDefault)
                IconButton(
                  onPressed: () => _setDefaultPaymentMethod(pm['id']),
                  icon: const Icon(Icons.check_circle_outline),
                  color: Colors.grey,
                  tooltip: 'Set as default',
                ),
              IconButton(
                onPressed: () => _deletePaymentMethod(pm['id']),
                icon: const Icon(Icons.delete_outline),
                color: Colors.red,
              ),
            ],
          ),
        ],
      ),
    );
  }

  Future<void> _showAddPaymentMethodDialog() async {
    // NOTE: In production, you would integrate with a payment provider (Stripe, Tap, etc.)
    // and only store tokenized data. This dialog is for demonstration purposes.
    final tokenCtrl = TextEditingController();
    final brandCtrl = TextEditingController(text: 'visa');
    final last4Ctrl = TextEditingController();
    final expMonthCtrl = TextEditingController();
    final expYearCtrl = TextEditingController();

    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add Payment Method'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Note: In production, this would integrate with a payment provider. Enter token data for testing.',
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
              const SizedBox(height: 16),
              TextField(
                  controller: tokenCtrl,
                  decoration: const InputDecoration(
                      labelText: 'Payment Token (from provider)')),
              TextField(
                  controller: brandCtrl,
                  decoration: const InputDecoration(
                      labelText: 'Brand (visa, mastercard, amex)')),
              TextField(
                  controller: last4Ctrl,
                  decoration: const InputDecoration(labelText: 'Last 4 digits'),
                  maxLength: 4),
              Row(
                children: [
                  Expanded(
                      child: TextField(
                          controller: expMonthCtrl,
                          decoration: const InputDecoration(
                              labelText: 'Exp Month (1-12)'),
                          keyboardType: TextInputType.number)),
                  const SizedBox(width: 16),
                  Expanded(
                      child: TextField(
                          controller: expYearCtrl,
                          decoration:
                              const InputDecoration(labelText: 'Exp Year'),
                          keyboardType: TextInputType.number)),
                ],
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('CANCEL')),
          ElevatedButton(
            onPressed: () async {
              final accountProvider = context.read<AccountProvider>();
              final success = await accountProvider.addPaymentMethod(
                providerPaymentMethodId: tokenCtrl.text,
                brand: brandCtrl.text,
                last4: last4Ctrl.text,
                expMonth: int.tryParse(expMonthCtrl.text) ?? 1,
                expYear: int.tryParse(expYearCtrl.text) ?? 2030,
              );

              if (context.mounted) {
                Navigator.pop(context, success);
              }
            },
            style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFB8860B)),
            child: const Text('ADD'),
          ),
        ],
      ),
    );

    if (result == true && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
            content: Text('Payment method added'),
            backgroundColor: Colors.green),
      );
    }
  }

  Future<void> _setDefaultPaymentMethod(String pmId) async {
    final accountProvider = context.read<AccountProvider>();
    await accountProvider.setDefaultPaymentMethod(pmId);
  }

  Future<void> _deletePaymentMethod(String pmId) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Payment Method'),
        content:
            const Text('Are you sure you want to delete this payment method?'),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(context, false),
              child: const Text('CANCEL')),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('DELETE'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      final accountProvider = context.read<AccountProvider>();
      await accountProvider.deletePaymentMethod(pmId);
    }
  }

  Widget _buildSettingsSection() {
    return Container(
      padding: const EdgeInsets.all(30),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 2))
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text('Account Settings',
              style: TextStyle(
                  fontFamily: 'WorkSans',
                  fontSize: 24,
                  fontWeight: FontWeight.w400,
                  color: Colors.black)),
          const SizedBox(height: 30),
          _buildSettingTile('Email Notifications', true),
          _buildSettingTile('SMS Notifications', false),
          _buildSettingTile('Marketing Emails', true),
          _buildSettingTile('Order Updates', true),
          const SizedBox(height: 30),
          const Divider(),
          const SizedBox(height: 20),
          TextButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.lock_outline),
            label: const Text('CHANGE PASSWORD'),
            style:
                TextButton.styleFrom(foregroundColor: const Color(0xFFB8860B)),
          ),
          const SizedBox(height: 10),
          TextButton.icon(
            onPressed: () async {
              final authProvider = context.read<AuthProvider>();
              final accountProvider = context.read<AccountProvider>();
              await authProvider.logout();
              accountProvider.reset();
              if (mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                      content: Text('Logged out successfully'),
                      backgroundColor: Colors.green),
                );
              }
            },
            icon: const Icon(Icons.logout),
            label: const Text('SIGN OUT'),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
          ),
        ],
      ),
    );
  }

  Widget _buildSettingTile(String title, bool value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 12),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(title,
              style: const TextStyle(
                  fontFamily: 'WorkSans',
                  fontSize: 14,
                  fontWeight: FontWeight.w400,
                  color: Colors.black87)),
          Switch(
              value: value,
              onChanged: (val) {},
              activeThumbColor: const Color(0xFFB8860B)),
        ],
      ),
    );
  }

  Widget _buildEditableTextField(String label, TextEditingController controller,
      {bool enabled = true}) {
    return TextFormField(
      controller: controller,
      enabled: enabled,
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(fontFamily: 'WorkSans'),
        border: const OutlineInputBorder(borderRadius: BorderRadius.zero),
        enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.zero,
            borderSide: BorderSide(color: Colors.grey[300]!)),
        focusedBorder: const OutlineInputBorder(
            borderRadius: BorderRadius.zero,
            borderSide: BorderSide(color: Color(0xFFB8860B), width: 2)),
        disabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.zero,
            borderSide: BorderSide(color: Colors.grey[200]!)),
        filled: !enabled,
        fillColor: enabled ? null : Colors.grey[100],
      ),
    );
  }

  Widget _buildEmptyState(String title, String subtitle) {
    return Container(
      padding: const EdgeInsets.all(40),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 10,
              offset: const Offset(0, 2))
        ],
      ),
      child: Column(
        children: [
          Icon(Icons.inbox_outlined, size: 60, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(title,
              style: const TextStyle(
                  fontFamily: 'WorkSans',
                  fontSize: 18,
                  fontWeight: FontWeight.w500,
                  color: Colors.black)),
          const SizedBox(height: 8),
          Text(subtitle,
              style: TextStyle(
                  fontFamily: 'WorkSans',
                  fontSize: 14,
                  color: Colors.grey[600]),
              textAlign: TextAlign.center),
        ],
      ),
    );
  }

  Widget _buildLoginPromptScreen(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.grey[50],
      drawer: const ModernDrawer(),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        title: const Text(
          'MY ACCOUNT',
          style: TextStyle(
              fontFamily: 'WorkSans',
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: Colors.black,
              letterSpacing: 2),
        ),
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 400),
          padding: const EdgeInsets.all(32),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 100,
                height: 100,
                decoration: BoxDecoration(
                    color: const Color(0xFFB8860B).withOpacity(0.1),
                    shape: BoxShape.circle),
                child: const Icon(Icons.person_outline,
                    size: 50, color: Color(0xFFB8860B)),
              ),
              const SizedBox(height: 24),
              const Text('Welcome to Solo',
                  style: TextStyle(
                      fontFamily: 'WorkSans',
                      fontSize: 24,
                      fontWeight: FontWeight.w500,
                      color: Colors.black)),
              const SizedBox(height: 12),
              Text(
                'Sign in to access your account, orders, and exclusive offers.',
                textAlign: TextAlign.center,
                style: TextStyle(
                    fontFamily: 'WorkSans',
                    fontSize: 14,
                    color: Colors.grey[600]),
              ),
              const SizedBox(height: 32),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () async {
                    final result = await Navigator.push(
                        context,
                        MaterialPageRoute(
                            builder: (context) => const LoginScreen()));
                    if (result == true && mounted) {
                      setState(() => _dataLoaded = false);
                      _loadAccountData();
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFB8860B),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8)),
                  ),
                  child: const Text('LOGIN',
                      style: TextStyle(
                          fontFamily: 'WorkSans',
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 1.5)),
                ),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: OutlinedButton(
                  onPressed: () => Navigator.push(
                      context,
                      MaterialPageRoute(
                          builder: (context) => const SignUpScreen())),
                  style: OutlinedButton.styleFrom(
                    foregroundColor: const Color(0xFFB8860B),
                    side: const BorderSide(color: Color(0xFFB8860B)),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8)),
                  ),
                  child: const Text('CREATE ACCOUNT',
                      style: TextStyle(
                          fontFamily: 'WorkSans',
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          letterSpacing: 1.5)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
