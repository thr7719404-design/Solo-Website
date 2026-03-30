import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/cart_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/account_provider.dart';
import '../theme/app_theme.dart';
import '../widgets/app_header.dart';
import '../widgets/modern_drawer.dart';
import '../widgets/top_banner.dart';
import '../services/api_service.dart';
import 'checkout_screen.dart';

class CartScreen extends StatefulWidget {
  const CartScreen({super.key});

  @override
  State<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends State<CartScreen> {
  bool applyLoyaltyCash = false;
  final _promoController = TextEditingController();
  bool _isValidatingPromo = false;
  String? _promoError;

  // VAT config from backend
  double _vatPercent = 5.0;
  bool _vatEnabled = true;
  String _vatLabel = 'VAT';

  @override
  void initState() {
    super.initState();
    _loadVatConfig();
  }

  Future<void> _loadVatConfig() async {
    try {
      final response = await ApiService.client.get('/settings/vat');
      if (response.success) {
        final data = response.data;
        setState(() {
          _vatPercent = (data['vatPercent'] ?? 5).toDouble();
          _vatEnabled = data['isEnabled'] ?? true;
          _vatLabel = data['label'] ?? 'VAT';
        });
      }
    } catch (_) {
      // Keep defaults
    }
  }

  double _getSubtotal(CartProvider cart) => cart.items
      .fold(0, (sum, item) => sum + item.product.price * item.quantity);
  double _getShipping(CartProvider cart) {
    // Free shipping promo overrides
    if (cart.hasPromoApplied && cart.promoDiscountType == 'FREE_SHIPPING') {
      return 0;
    }
    return _getSubtotal(cart) > 100 ? 0 : 9.99;
  }

  double _getPromoDiscount(CartProvider cart) =>
      cart.hasPromoApplied && cart.promoDiscountType != 'FREE_SHIPPING'
          ? cart.promoDiscountAmount
          : 0;
  double _getLoyaltyCashDiscount(CartProvider cart, double loyaltyBalance) =>
      applyLoyaltyCash
          ? (loyaltyBalance < _getSubtotal(cart)
              ? loyaltyBalance
              : _getSubtotal(cart))
          : 0;
  double _getVatAmount(CartProvider cart) =>
      _vatEnabled ? _getSubtotal(cart) * _vatPercent / 100 : 0;
  double _getTotal(CartProvider cart, double loyaltyBalance) =>
      (_getSubtotal(cart) +
              _getShipping(cart) +
              _getVatAmount(cart) -
              _getPromoDiscount(cart) -
              _getLoyaltyCashDiscount(cart, loyaltyBalance))
          .clamp(0, double.infinity);

  Future<void> _applyPromoCode(CartProvider cart) async {
    final code = _promoController.text.trim();
    if (code.isEmpty) return;

    final auth = context.read<AuthProvider>();
    if (!auth.isAuthenticated) {
      setState(() => _promoError = 'Please log in to use promo codes');
      return;
    }

    setState(() {
      _isValidatingPromo = true;
      _promoError = null;
    });

    try {
      final result = await ApiService.promoCodes.validate(
        code: code,
        orderAmount: _getSubtotal(cart),
      );

      cart.applyPromoCode(
        code: result['code'] ?? code,
        discountType: result['discountType'] ?? 'PERCENTAGE',
        discountValue: (result['discountValue'] as num?)?.toDouble() ?? 0,
        discountAmount: (result['discountAmount'] as num?)?.toDouble() ?? 0,
        description: result['description'] as String?,
      );

      setState(() => _promoError = null);
    } catch (e) {
      setState(() => _promoError = e.toString().replaceAll('Exception: ', ''));
    } finally {
      if (mounted) setState(() => _isValidatingPromo = false);
    }
  }

  void _removePromoCode(CartProvider cart) {
    cart.removePromoCode();
    _promoController.clear();
    setState(() => _promoError = null);
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<CartProvider>(
      builder: (context, cart, child) {
        return Scaffold(
          drawer: const ModernDrawer(),
          appBar: AppHeader(
            onCartPressed: () {}, // Already on cart page
            onSearchPressed: () => Navigator.pop(context),
            onFavoritesPressed: () =>
                Navigator.pushNamed(context, '/favorites'),
          ),
          body: Column(
            children: [
              const TopBanner(),
              Expanded(
                child: cart.items.isEmpty
                    ? _buildEmptyCart()
                    : Column(
                        children: [
                          Expanded(
                            child: ListView.builder(
                              padding: const EdgeInsets.all(20),
                              itemCount: cart.items.length,
                              itemBuilder: (context, index) {
                                return _buildCartItem(
                                    cart.items[index], index, cart);
                              },
                            ),
                          ),
                          _buildSummary(cart),
                        ],
                      ),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildEmptyCart() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.shopping_bag_outlined,
            size: 100,
            color: Colors.grey[300],
          ),
          const SizedBox(height: 24),
          const Text(
            'Your cart is empty',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Looks like you haven\'t added anything yet',
            style: TextStyle(
              color: AppTheme.textSecondary,
            ),
          ),
          const SizedBox(height: 32),
          ElevatedButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Continue Shopping'),
          ),
        ],
      ),
    );
  }

  Widget _buildCartItem(CartItem item, int index, CartProvider cart) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 10,
          ),
        ],
      ),
      child: Row(
        children: [
          // Image
          ClipRRect(
            borderRadius: BorderRadius.circular(12),
            child: Image.network(
              item.product.imageUrl,
              width: 80,
              height: 80,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) {
                return Container(
                  width: 80,
                  height: 80,
                  color: Colors.grey[200],
                  child: const Icon(Icons.image, color: Colors.grey),
                );
              },
            ),
          ),
          const SizedBox(width: 12),

          // Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  item.product.brand,
                  style: TextStyle(
                    color: AppTheme.textSecondary,
                    fontSize: 12,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  item.product.name,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 14,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
                const SizedBox(height: 8),
                Text(
                  'AED ${item.product.price.toStringAsFixed(2)}',
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.primary,
                    fontWeight: FontWeight.bold,
                    fontSize: 16,
                  ),
                ),
              ],
            ),
          ),

          // Quantity & Remove
          Column(
            children: [
              IconButton(
                icon: const Icon(Icons.delete_outline, size: 20),
                color: Colors.red[400],
                onPressed: () {
                  cart.removeFromCart(item.product.id);
                },
              ),
              Container(
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey[300]!),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    InkWell(
                      onTap: item.quantity > 1
                          ? () => cart.updateQuantity(
                              item.product.id, item.quantity - 1)
                          : null,
                      child: Padding(
                        padding: const EdgeInsets.all(8),
                        child: Icon(
                          Icons.remove,
                          size: 16,
                          color: item.quantity > 1 ? null : Colors.grey[400],
                        ),
                      ),
                    ),
                    Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      child: Text(
                        '${item.quantity}',
                        style: const TextStyle(fontWeight: FontWeight.w600),
                      ),
                    ),
                    InkWell(
                      onTap: () => cart.updateQuantity(
                          item.product.id, item.quantity + 1),
                      child: const Padding(
                        padding: EdgeInsets.all(8),
                        child: Icon(Icons.add, size: 16),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSummary(CartProvider cart) {
    final authProvider = context.watch<AuthProvider>();
    final accountProvider = context.watch<AccountProvider>();
    final isLoggedIn = authProvider.isAuthenticated;
    final loyaltyCashBalance =
        isLoggedIn ? accountProvider.loyaltyBalance : 0.0;

    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: SafeArea(
        child: Column(
          children: [
            // Promo Code
            if (cart.hasPromoApplied)
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.green[50],
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.green[200]!),
                ),
                child: Row(
                  children: [
                    Icon(Icons.local_offer, color: Colors.green[700], size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            cart.appliedPromoCode!,
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              color: Colors.green[800],
                              fontSize: 14,
                            ),
                          ),
                          if (cart.promoDescription != null)
                            Text(
                              cart.promoDescription!,
                              style: TextStyle(
                                color: Colors.green[700],
                                fontSize: 12,
                              ),
                            ),
                        ],
                      ),
                    ),
                    IconButton(
                      icon:
                          Icon(Icons.close, color: Colors.green[700], size: 18),
                      onPressed: () => _removePromoCode(cart),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                    ),
                  ],
                ),
              )
            else
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _promoController,
                            decoration: const InputDecoration(
                              hintText: 'Enter promo code',
                              border: InputBorder.none,
                              filled: false,
                            ),
                            textCapitalization: TextCapitalization.characters,
                            onSubmitted: (_) => _applyPromoCode(cart),
                          ),
                        ),
                        _isValidatingPromo
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child:
                                    CircularProgressIndicator(strokeWidth: 2),
                              )
                            : TextButton(
                                onPressed: () => _applyPromoCode(cart),
                                child: const Text('Apply'),
                              ),
                      ],
                    ),
                  ),
                  if (_promoError != null)
                    Padding(
                      padding: const EdgeInsets.only(top: 4, left: 4),
                      child: Text(
                        _promoError!,
                        style: const TextStyle(
                          color: Colors.red,
                          fontSize: 12,
                        ),
                      ),
                    ),
                ],
              ),
            const SizedBox(height: 20),

            // Loyalty Cash Section (only show if logged in and has balance)
            if (isLoggedIn && loyaltyCashBalance > 0)
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFB8860B).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(
                    color: const Color(0xFFB8860B).withOpacity(0.3),
                  ),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFB8860B),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Icon(
                        Icons.account_balance_wallet,
                        color: Colors.white,
                        size: 20,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Loyalty Cash Available',
                            style: TextStyle(
                              fontWeight: FontWeight.w500,
                              fontSize: 13,
                            ),
                          ),
                          Text(
                            'AED ${loyaltyCashBalance.toStringAsFixed(2)}',
                            style: const TextStyle(
                              color: Color(0xFFB8860B),
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                    ),
                    Switch(
                      value: applyLoyaltyCash,
                      onChanged: (value) {
                        setState(() {
                          applyLoyaltyCash = value;
                        });
                      },
                      activeThumbColor: const Color(0xFFB8860B),
                    ),
                  ],
                ),
              ),
            if (isLoggedIn && loyaltyCashBalance > 0)
              const SizedBox(height: 20),

            // Summary Lines
            _buildSummaryLine(
                'Subtotal', 'AED ${_getSubtotal(cart).toStringAsFixed(2)}'),
            const SizedBox(height: 8),
            _buildSummaryLine(
              'Shipping',
              _getShipping(cart) == 0
                  ? 'FREE'
                  : 'AED ${_getShipping(cart).toStringAsFixed(2)}',
              isHighlight: _getShipping(cart) == 0,
            ),
            if (_vatEnabled && _vatPercent > 0) ...[
              const SizedBox(height: 8),
              _buildSummaryLine(
                '$_vatLabel (${_vatPercent % 1 == 0 ? _vatPercent.toInt().toString() : _vatPercent.toStringAsFixed(1)}%)',
                'AED ${_getVatAmount(cart).toStringAsFixed(2)}',
              ),
            ],
            if (_getShipping(cart) > 0)
              Padding(
                padding: const EdgeInsets.only(top: 4),
                child: Text(
                  'Free shipping on orders over AED 100',
                  style: TextStyle(
                    color: AppTheme.textSecondary,
                    fontSize: 12,
                  ),
                ),
              ),
            if (cart.hasPromoApplied) ...[
              const SizedBox(height: 8),
              _buildSummaryLine(
                cart.promoDiscountType == 'FREE_SHIPPING'
                    ? 'Promo: Free Shipping'
                    : 'Promo Discount (${cart.appliedPromoCode})',
                cart.promoDiscountType == 'FREE_SHIPPING'
                    ? 'Applied'
                    : '-AED ${_getPromoDiscount(cart).toStringAsFixed(2)}',
                isDiscount: true,
              ),
            ],
            if (applyLoyaltyCash &&
                _getLoyaltyCashDiscount(cart, loyaltyCashBalance) > 0) ...[
              const SizedBox(height: 8),
              _buildSummaryLine(
                'Loyalty Cash Applied',
                '-AED ${_getLoyaltyCashDiscount(cart, loyaltyCashBalance).toStringAsFixed(2)}',
                isDiscount: true,
              ),
            ],
            const SizedBox(height: 12),
            const Divider(),
            const SizedBox(height: 12),
            _buildSummaryLine(
              'Total',
              'AED ${_getTotal(cart, loyaltyCashBalance).toStringAsFixed(2)}',
              isBold: true,
            ),
            const SizedBox(height: 20),

            // Checkout Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => const CheckoutScreen(),
                    ),
                  );
                },
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 16),
                ),
                child: const Text(
                  'Proceed to Checkout',
                  style: TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 16,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryLine(String label, String value,
      {bool isBold = false,
      bool isHighlight = false,
      bool isDiscount = false}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: TextStyle(
            color: isBold ? null : AppTheme.textSecondary,
            fontWeight: isBold ? FontWeight.bold : null,
            fontSize: isBold ? 18 : 14,
          ),
        ),
        Text(
          value,
          style: TextStyle(
            color: isDiscount
                ? Colors.green
                : (isHighlight ? AppTheme.successColor : null),
            fontWeight: isBold ? FontWeight.bold : FontWeight.w600,
            fontSize: isBold ? 18 : 14,
          ),
        ),
      ],
    );
  }
}
