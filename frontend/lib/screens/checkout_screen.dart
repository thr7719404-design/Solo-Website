import 'dart:ui_web' as ui_web;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'dart:html' as html;
import '../providers/cart_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/account_provider.dart';
import '../widgets/app_header.dart';
import '../widgets/modern_drawer.dart';
import '../widgets/top_banner.dart';
import '../services/api_service.dart';
import '../services/web_storage.dart'
    if (dart.library.io) '../services/web_storage_stub.dart';
import '../services/stripe_js_interop.dart'
    if (dart.library.io) '../services/stripe_js_interop_stub.dart';

class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key});

  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

class _CheckoutScreenState extends State<CheckoutScreen> {
  final _formKey = GlobalKey<FormState>();

  // Storage key for persisting selected address
  static const String _selectedAddressStorageKey =
      'checkout_selected_shipping_address_id';
  static const String _billingSameAsShippingStorageKey =
      'checkout_billing_same_as_shipping';
  static const String _selectedBillingAddressStorageKey =
      'checkout_selected_billing_address_id';

  // Shipping Information
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _addressController = TextEditingController();
  final _addressLine2Controller = TextEditingController();
  final _cityController = TextEditingController();
  final _postalCodeController = TextEditingController();

  // Payment Information
  final _cardHolderController = TextEditingController();

  // Stripe Elements state
  bool _stripeInitialized = false;
  bool _stripeCardMounted = false;
  static bool _viewFactoryRegistered = false;

  String _selectedPaymentMethod = 'card';
  bool _saveAddress = false;
  bool _isProcessing = false;
  bool applyLoyaltyCash = false;
  String? _selectedAddressId;
  bool _useNewAddress = false;

  // Billing Address
  bool _billingSameAsShipping = true;
  String? _selectedBillingAddressId;

  // Billing Invoice (optional)
  final _billingCompanyController = TextEditingController();
  final _billingVatController = TextEditingController();

  // VAT config from backend
  double _vatPercent = 5.0;
  bool _vatEnabled = true;
  String _vatLabel = 'VAT';

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

  /// Validates if shipping address is complete
  bool get _isShippingValid {
    // If using saved address mode
    if (!_useNewAddress && _selectedAddressId != null) {
      return true;
    }
    // If using new address mode, check required fields
    final firstName = _firstNameController.text.trim();
    final lastName = _lastNameController.text.trim();
    final phone = _phoneController.text.trim();
    final addressLine1 = _addressController.text.trim();
    final city = _cityController.text.trim();

    return firstName.isNotEmpty &&
        lastName.isNotEmpty &&
        phone.isNotEmpty &&
        addressLine1.isNotEmpty &&
        city.isNotEmpty;
  }

  @override
  void initState() {
    super.initState();
    _loadAddressesAndPrefill();
    _loadVatConfig();
    _initStripeElements();
  }

  /// Initialize Stripe.js with publishable key from backend config
  Future<void> _initStripeElements() async {
    try {
      final config = await ApiService.stripe.getConfig();
      final publishableKey = config['publishableKey'] as String?;
      final isEnabled = config['isEnabled'] as bool? ?? false;

      if (publishableKey != null && publishableKey.isNotEmpty && isEnabled) {
        StripeJsService.init(publishableKey);
        // Register the platform view factory for the card element container
        if (!_viewFactoryRegistered) {
          ui_web.platformViewRegistry.registerViewFactory(
            'stripe-card-element',
            (int viewId) {
              final div = html.DivElement()
                ..id = 'card-element'
                ..style.width = '100%'
                ..style.padding = '12px 0';
              return div;
            },
          );
          _viewFactoryRegistered = true;
        }
        if (mounted) {
          setState(() {
            _stripeInitialized = true;
          });
        }
      }
    } catch (e) {
      debugPrint('Stripe init error: $e');
    }
  }

  /// Mount the Stripe Card Element after the HtmlElementView is rendered
  void _mountStripeCard() {
    if (_stripeCardMounted || !_stripeInitialized) return;
    // Delay to ensure the DOM element is ready
    Future.delayed(const Duration(milliseconds: 300), () {
      try {
        StripeJsService.mountCard('#card-element');
        _stripeCardMounted = true;
      } catch (e) {
        debugPrint('Stripe mount error: $e');
      }
    });
  }

  Future<void> _loadAddressesAndPrefill() async {
    final auth = context.read<AuthProvider>();
    if (auth.isAuthenticated) {
      final accountProvider = context.read<AccountProvider>();
      await accountProvider.loadAddresses();

      // Try to load saved address ID from storage
      final savedAddressId = WebStorage.getValue(_selectedAddressStorageKey);

      // Check if saved address still exists in user's addresses
      Map<String, dynamic>? addressToSelect;
      if (savedAddressId != null) {
        final savedAddr = accountProvider.addresses.firstWhere(
          (a) => a['id'] == savedAddressId,
          orElse: () => <String, dynamic>{},
        );
        if (savedAddr.isNotEmpty) {
          addressToSelect = savedAddr;
        }
      }

      // Fallback to default address if saved address not found
      addressToSelect ??= accountProvider.defaultAddress;

      if (addressToSelect != null && mounted) {
        setState(() {
          _selectedAddressId = addressToSelect!['id'];
        });
        _fillAddressFields(addressToSelect);
      }

      // Load billing settings from storage
      final savedBillingSame =
          WebStorage.getValue(_billingSameAsShippingStorageKey);
      final savedBillingAddressId =
          WebStorage.getValue(_selectedBillingAddressStorageKey);

      // Parse billingSame flag (default true if missing)
      bool billingSame = true;
      if (savedBillingSame != null) {
        billingSame = savedBillingSame == 'true';
      }

      // Validate billing address ID if billingSame is false
      String? billingAddressId;
      if (!billingSame && savedBillingAddressId != null) {
        final savedBillingAddr = accountProvider.addresses.firstWhere(
          (a) => a['id'] == savedBillingAddressId,
          orElse: () => <String, dynamic>{},
        );
        if (savedBillingAddr.isNotEmpty) {
          billingAddressId = savedBillingAddressId;
        } else {
          // Fallback to default address if saved billing address not found
          final defaultAddr = accountProvider.defaultAddress;
          if (defaultAddr != null) {
            billingAddressId = defaultAddr['id'];
          }
        }
      }

      if (mounted) {
        setState(() {
          _billingSameAsShipping = billingSame;
          _selectedBillingAddressId = billingAddressId;
        });
      }
    }
  }

  void _fillAddressFields(Map<String, dynamic> address) {
    _firstNameController.text = address['firstName'] ?? '';
    _lastNameController.text = address['lastName'] ?? '';
    _phoneController.text = address['phone'] ?? '';
    _addressController.text = address['addressLine1'] ?? '';
    _addressLine2Controller.text = address['addressLine2'] ?? '';
    _cityController.text = address['city'] ?? '';
    _postalCodeController.text = address['postalCode'] ?? '';
  }

  void _clearAddressFields() {
    _firstNameController.clear();
    _lastNameController.clear();
    _phoneController.clear();
    _addressController.clear();
    _addressLine2Controller.clear();
    _cityController.clear();
    _postalCodeController.clear();
  }

  /// Shows the add new address modal dialog
  /// Same form as used in AccountShell AddressesPage
  void _showAddAddressDialog() {
    final formKey = GlobalKey<FormState>();

    final labelController = TextEditingController();
    final firstNameController = TextEditingController();
    final lastNameController = TextEditingController();
    final addressLine1Controller = TextEditingController();
    final addressLine2Controller = TextEditingController();
    final cityController = TextEditingController();
    final postalCodeController = TextEditingController();
    final phoneController = TextEditingController();
    bool isDefault = false;
    bool isSaving = false;

    showDialog(
      context: context,
      builder: (ctx) => StatefulBuilder(
        builder: (ctx, setDialogState) => AlertDialog(
          title: const Text('Add New Address'),
          content: SizedBox(
            width: MediaQuery.of(context).size.width > 600
                ? 500
                : double.maxFinite,
            child: Form(
              key: formKey,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildDialogFormField(
                      controller: labelController,
                      label: 'Label (e.g., Home, Office)',
                      icon: Icons.label_outline,
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: _buildDialogFormField(
                            controller: firstNameController,
                            label: 'First Name',
                            required: true,
                            validator: (v) =>
                                v == null || v.isEmpty ? 'Required' : null,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildDialogFormField(
                            controller: lastNameController,
                            label: 'Last Name',
                            required: true,
                            validator: (v) =>
                                v == null || v.isEmpty ? 'Required' : null,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    _buildDialogFormField(
                      controller: phoneController,
                      label: 'Phone',
                      icon: Icons.phone_outlined,
                      keyboardType: TextInputType.phone,
                    ),
                    const SizedBox(height: 16),
                    _buildDialogFormField(
                      controller: addressLine1Controller,
                      label: 'Street Address',
                      icon: Icons.location_on_outlined,
                      required: true,
                      validator: (v) =>
                          v == null || v.isEmpty ? 'Required' : null,
                    ),
                    const SizedBox(height: 16),
                    _buildDialogFormField(
                      controller: addressLine2Controller,
                      label: 'Apartment, suite, etc. (optional)',
                    ),
                    const SizedBox(height: 16),
                    Row(
                      children: [
                        Expanded(
                          child: _buildDialogFormField(
                            controller: cityController,
                            label: 'City',
                            required: true,
                            validator: (v) =>
                                v == null || v.isEmpty ? 'Required' : null,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: _buildDialogFormField(
                            controller: postalCodeController,
                            label: 'Postal Code (optional)',
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    // Country - Fixed to UAE
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Country',
                          style: TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: Colors.grey[700],
                          ),
                        ),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 14, vertical: 14),
                          decoration: BoxDecoration(
                            color: Colors.grey[100],
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.grey[300]!),
                          ),
                          child: Row(
                            children: [
                              Icon(Icons.flag_outlined,
                                  size: 18, color: Colors.grey[600]),
                              const SizedBox(width: 12),
                              const Text(
                                'United Arab Emirates',
                                style: TextStyle(
                                    fontSize: 14, color: Colors.black87),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    CheckboxListTile(
                      value: isDefault,
                      onChanged: (v) =>
                          setDialogState(() => isDefault = v ?? false),
                      title: const Text('Set as default address'),
                      contentPadding: EdgeInsets.zero,
                      activeColor: const Color(0xFFB8860B),
                    ),
                  ],
                ),
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(ctx),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: isSaving
                  ? null
                  : () async {
                      if (!formKey.currentState!.validate()) return;

                      setDialogState(() => isSaving = true);

                      final accountProvider = context.read<AccountProvider>();
                      final data = {
                        'label': labelController.text.isNotEmpty
                            ? labelController.text
                            : null,
                        'firstName': firstNameController.text,
                        'lastName': lastNameController.text,
                        'addressLine1': addressLine1Controller.text,
                        'addressLine2': addressLine2Controller.text.isNotEmpty
                            ? addressLine2Controller.text
                            : null,
                        'city': cityController.text,
                        'postalCode': postalCodeController.text.isNotEmpty
                            ? postalCodeController.text
                            : null,
                        'phone': phoneController.text.isNotEmpty
                            ? phoneController.text
                            : null,
                        'isDefault': isDefault,
                      };

                      final success = await accountProvider.createAddress(data);

                      if (success && ctx.mounted) {
                        Navigator.pop(ctx);

                        // Auto-select the newly created address (it will be the last one or first if default)
                        if (mounted) {
                          final addresses = accountProvider.addresses;
                          if (addresses.isNotEmpty) {
                            // Find the new address - it will be the one matching our input data
                            final newAddr = addresses.firstWhere(
                              (a) =>
                                  a['firstName'] == data['firstName'] &&
                                  a['lastName'] == data['lastName'] &&
                                  a['addressLine1'] == data['addressLine1'],
                              orElse: () => addresses.last,
                            );
                            setState(() {
                              _selectedAddressId = newAddr['id'];
                              _useNewAddress = false;
                              _saveAddress = false;
                            });
                            _fillAddressFields(newAddr as Map<String, dynamic>);
                          }
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Address added and selected'),
                              backgroundColor: Color(0xFFB8860B),
                            ),
                          );
                        }
                      } else {
                        setDialogState(() => isSaving = false);
                      }
                    },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFB8860B),
                foregroundColor: Colors.white,
              ),
              child: isSaving
                  ? const SizedBox(
                      width: 20,
                      height: 20,
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.white),
                    )
                  : const Text('Save Address'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDialogFormField({
    required TextEditingController controller,
    required String label,
    IconData? icon,
    bool required = false,
    TextInputType? keyboardType,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          required ? '$label *' : label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: Colors.grey[700],
          ),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          validator: validator,
          decoration: InputDecoration(
            hintText: label,
            hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14),
            prefixIcon: icon != null
                ? Icon(icon, size: 20, color: Colors.grey[500])
                : null,
            filled: true,
            fillColor: Colors.white,
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
              borderSide: const BorderSide(color: Color(0xFFB8860B), width: 2),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(8),
              borderSide: const BorderSide(color: Colors.red),
            ),
            contentPadding:
                const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
          ),
        ),
      ],
    );
  }

  @override
  void dispose() {
    _firstNameController.dispose();
    _lastNameController.dispose();
    _phoneController.dispose();
    _addressController.dispose();
    _addressLine2Controller.dispose();
    _cityController.dispose();
    _postalCodeController.dispose();
    _cardHolderController.dispose();
    if (_stripeCardMounted) {
      try {
        StripeJsService.unmountCard();
      } catch (_) {}
      _stripeCardMounted = false;
    }
    super.dispose();
  }

  Future<void> _processCheckout() async {
    // Validate shipping address first
    if (!_isShippingValid) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select or enter a complete delivery address.'),
          backgroundColor: Colors.red,
        ),
      );
      return;
    }

    if (!_formKey.currentState!.validate()) return;

    final cart = context.read<CartProvider>();
    final auth = context.read<AuthProvider>();
    final accountProvider = context.read<AccountProvider>();

    // Check if user is logged in
    if (!auth.isAuthenticated) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please log in to place an order')),
      );
      return;
    }

    setState(() => _isProcessing = true);

    try {
      // Save address if requested and using new address
      String? newAddressId;
      if (_saveAddress && (_useNewAddress || _selectedAddressId == null)) {
        final success = await accountProvider.createAddress({
          'firstName': _firstNameController.text.trim(),
          'lastName': _lastNameController.text.trim(),
          'phone': _phoneController.text.trim().isNotEmpty
              ? _phoneController.text.trim()
              : null,
          'addressLine1': _addressController.text.trim(),
          'addressLine2': _addressLine2Controller.text.trim().isNotEmpty
              ? _addressLine2Controller.text.trim()
              : null,
          'city': _cityController.text.trim(),
          'postalCode': _postalCodeController.text.trim().isNotEmpty
              ? _postalCodeController.text.trim()
              : null,
          'isDefault': accountProvider
              .addresses.isEmpty, // Make default if first address
        });

        // If saved successfully, get the new address ID
        if (success && accountProvider.addresses.isNotEmpty) {
          newAddressId = accountProvider.addresses.last['id'];
        }
      }

      // Determine which address ID to use
      final addressIdToUse = newAddressId ?? _selectedAddressId;

      // Build order data
      final Map<String, dynamic> orderData = {
        'shippingMethod': 'STANDARD',
        'paymentMethod': _selectedPaymentMethod == 'cod'
            ? 'CASH_ON_DELIVERY'
            : 'CREDIT_CARD',
        'items': cart.items
            .map((item) => {
                  'productId': int.tryParse(item.product.id) ?? 0,
                  'quantity': item.quantity,
                })
            .toList(),
        'notes': null,
      };

      // If using a saved address, send the ID; otherwise send the full address object
      if (addressIdToUse != null && !_useNewAddress) {
        orderData['shippingAddressId'] = addressIdToUse;
      } else {
        // Using a new address (not saved or guest checkout equivalent)
        orderData['shippingAddress'] = {
          'firstName': _firstNameController.text.trim(),
          'lastName': _lastNameController.text.trim(),
          'phone': _phoneController.text.trim(),
          'street': _addressController.text.trim(),
          'apartment': _addressLine2Controller.text.trim(),
          'city': _cityController.text.trim(),
          'postalCode': _postalCodeController.text.trim(),
          'country': 'UAE',
        };
      }

      // Billing address logic
      // Only send billing address if different from shipping
      if (!_billingSameAsShipping && _selectedBillingAddressId != null) {
        orderData['billingAddressId'] = _selectedBillingAddressId;

        // Add billing invoice fields if non-empty
        final billingCompany = _billingCompanyController.text.trim();
        final billingVat = _billingVatController.text.trim();
        if (billingCompany.isNotEmpty) {
          orderData['billingInvoiceCompany'] = billingCompany;
        }
        if (billingVat.isNotEmpty) {
          orderData['billingInvoiceVatNumber'] = billingVat;
        }
      }
      // If billing same as shipping, backend will use shipping address as billing

      // Add loyalty cash redemption if enabled
      if (applyLoyaltyCash) {
        final loyaltyBalance = accountProvider.loyaltyBalance;
        if (loyaltyBalance > 0) {
          // Calculate applied amount: min of balance and 30% cap
          final maxByRule = cart.total * 0.30;
          final loyaltyRedeemAed =
              loyaltyBalance < maxByRule ? loyaltyBalance : maxByRule;
          if (loyaltyRedeemAed > 0) {
            orderData['loyaltyRedeemAed'] = loyaltyRedeemAed;
          }
        }
      }

      // Add promo code if applied
      if (cart.hasPromoApplied) {
        orderData['promoCode'] = cart.appliedPromoCode;
      }

      // Handle Stripe payment for credit card orders
      if (_selectedPaymentMethod == 'card') {
        if (!_stripeInitialized || !_stripeCardMounted) {
          if (mounted) {
            setState(() => _isProcessing = false);
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content:
                    Text('Stripe is not ready. Please wait and try again.'),
                backgroundColor: Colors.red,
              ),
            );
          }
          return;
        }

        // Validate card holder name
        final cardHolder = _cardHolderController.text.trim();
        if (cardHolder.isEmpty || cardHolder.length < 2) {
          if (mounted) {
            setState(() => _isProcessing = false);
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Please enter the card holder name.'),
                backgroundColor: Colors.red,
              ),
            );
          }
          return;
        }

        try {
          // Calculate total amount for payment intent
          final subtotal = cart.items.fold<double>(
            0,
            (sum, item) => sum + item.product.price * item.quantity,
          );
          final shipping = subtotal > 100 ? 0.0 : 9.99;
          final promoDiscount =
              cart.hasPromoApplied && cart.promoDiscountType != 'FREE_SHIPPING'
                  ? cart.promoDiscountAmount
                  : 0.0;
          final vatAmount = _vatEnabled ? subtotal * _vatPercent / 100 : 0.0;
          final totalAmount = (subtotal + shipping + vatAmount - promoDiscount)
              .clamp(0.5, double.infinity);

          // Step 1: Create PaymentIntent on backend (amount only — no card data)
          final intentResult = await ApiService.stripe.createPaymentIntent(
            amount: totalAmount,
            currency: 'aed',
            metadata: {'source': 'checkout'},
          );

          final clientSecret = intentResult['clientSecret'] as String?;
          if (clientSecret == null || clientSecret.isEmpty) {
            throw Exception('Failed to create payment intent.');
          }

          // Step 2: Confirm payment client-side via Stripe.js
          // Card data goes directly from browser → Stripe (never touches our server)
          final paymentResult = await StripeJsService.confirmPayment(
            clientSecret,
            cardholderName: cardHolder,
          );

          // Check payment status
          final paymentStatus = paymentResult['status'] as String?;
          if (paymentStatus != 'succeeded') {
            throw Exception(
              paymentStatus == 'requires_payment_method'
                  ? 'Card was declined. Please check your card details and try again.'
                  : paymentStatus == 'requires_action'
                      ? 'Additional authentication required. Please try a different card.'
                      : 'Payment failed (status: $paymentStatus). Please try again.',
            );
          }

          final paymentIntentId = paymentResult['paymentIntentId'] as String?;
          if (paymentIntentId != null) {
            orderData['paymentIntentId'] = paymentIntentId;
          }
        } catch (e) {
          if (mounted) {
            setState(() => _isProcessing = false);
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text(
                    'Payment processing failed: ${e.toString().replaceAll("Exception: ", "")}'),
                backgroundColor: Colors.red,
              ),
            );
          }
          return;
        }
      }

      // Call the API to create the order
      final result = await ApiService.orders.createOrder(orderData);

      if (mounted) {
        setState(() => _isProcessing = false);

        // Clear cart after successful order
        cart.clearCart();

        // Always reload loyalty balance (earned loyalty + redemption if applied)
        await accountProvider.loadLoyalty();

        // Show success dialog with order number
        final orderNumber = result['orderNumber'] ?? 'N/A';
        showDialog(
          context: context,
          barrierDismissible: false,
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
                  'Order Placed Successfully!',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  'Order #$orderNumber',
                  style: const TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  _selectedPaymentMethod == 'cod'
                      ? 'Pay when your order is delivered.'
                      : 'Your payment has been processed.',
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
                      'Continue Shopping',
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
    } catch (e) {
      if (mounted) {
        setState(() => _isProcessing = false);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error placing order: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final cart = context.watch<CartProvider>();
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 768;

    return Scaffold(
      drawer: const ModernDrawer(),
      appBar: AppHeader(
        onCartPressed: () => Navigator.pop(context),
        onSearchPressed: () {},
        onFavoritesPressed: () => Navigator.pushNamed(context, '/favorites'),
      ),
      body: Column(
        children: [
          const TopBanner(),
          Expanded(
            child: cart.items.isEmpty
                ? Center(
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.shopping_cart_outlined,
                            size: 80, color: Colors.grey[400]),
                        const SizedBox(height: 16),
                        Text(
                          'Your cart is empty',
                          style: TextStyle(
                            fontSize: 18,
                            color: Colors.grey[600],
                          ),
                        ),
                      ],
                    ),
                  )
                : SingleChildScrollView(
                    child: Container(
                      color: Colors.grey[50],
                      padding: EdgeInsets.all(isMobile ? 16 : 24),
                      child: isMobile
                          ? _buildMobileLayout(cart)
                          : _buildDesktopLayout(cart),
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildMobileLayout(CartProvider cart) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _buildOrderSummaryCard(cart, true),
        const SizedBox(height: 16),
        _buildShippingInfoCard(),
        const SizedBox(height: 16),
        _buildPaymentMethodCard(),
        const SizedBox(height: 16),
        _buildBillingSummaryCard(),
        const SizedBox(height: 24),
        _buildPlaceOrderButton(cart),
      ],
    );
  }

  Widget _buildDesktopLayout(CartProvider cart) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
          flex: 2,
          child: Column(
            children: [
              _buildShippingInfoCard(),
              const SizedBox(height: 16),
              _buildPaymentMethodCard(),
            ],
          ),
        ),
        const SizedBox(width: 24),
        Expanded(
          flex: 1,
          child: Column(
            children: [
              _buildOrderSummaryCard(cart, false),
              const SizedBox(height: 16),
              _buildBillingSummaryCard(),
              const SizedBox(height: 16),
              _buildPlaceOrderButton(cart),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildShippingInfoCard() {
    final accountProvider = context.watch<AccountProvider>();
    final addresses = accountProvider.addresses
        .map((a) => a as Map<String, dynamic>)
        .toList();
    final isLoggedIn = context.watch<AuthProvider>().isAuthenticated;

    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Shipping Information',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 20),

              // Address selection dropdown (only if logged in and has addresses)
              if (isLoggedIn && addresses.isNotEmpty && !_useNewAddress) ...[
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFB8860B).withOpacity(0.05),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(
                        color: const Color(0xFFB8860B).withOpacity(0.3)),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Row(
                            children: [
                              const Icon(Icons.location_on,
                                  color: Color(0xFFB8860B), size: 20),
                              const SizedBox(width: 8),
                              const Text(
                                'Deliver to',
                                style: TextStyle(
                                  fontSize: 15,
                                  fontWeight: FontWeight.w600,
                                  color: Colors.black87,
                                ),
                              ),
                            ],
                          ),
                          TextButton.icon(
                            onPressed: _showAddAddressDialog,
                            icon: const Icon(Icons.add, size: 18),
                            label: const Text('Add New'),
                            style: TextButton.styleFrom(
                              foregroundColor: const Color(0xFFB8860B),
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 8),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 12),
                      DropdownButtonFormField<String>(
                        initialValue: _selectedAddressId,
                        decoration: InputDecoration(
                          filled: true,
                          fillColor: Colors.white,
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                            borderSide: BorderSide(color: Colors.grey[300]!),
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                              horizontal: 12, vertical: 14),
                        ),
                        hint: const Text('Choose an address'),
                        items: [
                          ...addresses.map((addr) {
                            final label = addr['label'] ??
                                '${addr['firstName']} ${addr['lastName']}';
                            final city = addr['city'] ?? '';
                            final isDefault = addr['isDefault'] == true;
                            return DropdownMenuItem<String>(
                              value: addr['id'],
                              child: Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      '$label - $city',
                                      overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                  if (isDefault)
                                    Container(
                                      margin: const EdgeInsets.only(left: 8),
                                      padding: const EdgeInsets.symmetric(
                                          horizontal: 6, vertical: 2),
                                      decoration: BoxDecoration(
                                        color: const Color(0xFFB8860B)
                                            .withOpacity(0.1),
                                        borderRadius: BorderRadius.circular(4),
                                      ),
                                      child: const Text(
                                        'Default',
                                        style: TextStyle(
                                          fontSize: 10,
                                          color: Color(0xFFB8860B),
                                          fontWeight: FontWeight.w600,
                                        ),
                                      ),
                                    ),
                                ],
                              ),
                            );
                          }),
                        ],
                        onChanged: (value) {
                          if (value != null) {
                            setState(() {
                              _selectedAddressId = value;
                              _useNewAddress = false;
                            });
                            // Persist selection to storage
                            WebStorage.setValue(
                                _selectedAddressStorageKey, value);
                            final selected = addresses.firstWhere(
                              (a) => a['id'] == value,
                              orElse: () => <String, dynamic>{},
                            );
                            if (selected.isNotEmpty) {
                              _fillAddressFields(selected);
                            }
                          }
                        },
                      ),
                      const SizedBox(height: 12),
                      TextButton.icon(
                        onPressed: () {
                          setState(() {
                            _useNewAddress = true;
                            _selectedAddressId = null;
                          });
                          // Clear persisted selection
                          WebStorage.removeValue(_selectedAddressStorageKey);
                          _clearAddressFields();
                        },
                        icon: const Icon(Icons.edit_outlined, size: 18),
                        label: const Text('Enter a different address'),
                        style: TextButton.styleFrom(
                          foregroundColor: Colors.grey[700],
                          padding: EdgeInsets.zero,
                        ),
                      ),
                    ],
                  ),
                ),
                // Address Summary Preview for saved address
                if (_selectedAddressId != null) ...[
                  const SizedBox(height: 12),
                  _buildAddressSummaryPreview(
                    addresses.firstWhere(
                      (a) => a['id'] == _selectedAddressId,
                      orElse: () => <String, dynamic>{},
                    ),
                  ),
                ],
                const SizedBox(height: 20),
                const Divider(),
                const SizedBox(height: 20),
              ] else if (isLoggedIn && addresses.isEmpty) ...[
                // No saved addresses - show add button
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.grey[300]!),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.info_outline,
                          color: Colors.grey[600], size: 20),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Text(
                          'No saved addresses yet',
                          style: TextStyle(fontSize: 14, color: Colors.black87),
                        ),
                      ),
                      TextButton.icon(
                        onPressed: _showAddAddressDialog,
                        icon: const Icon(Icons.add, size: 18),
                        label: const Text('Add'),
                        style: TextButton.styleFrom(
                          foregroundColor: const Color(0xFFB8860B),
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
              ] else if (isLoggedIn && _useNewAddress) ...[
                // User chose to use new address - show back button
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.grey[300]!),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.edit_location_alt,
                          color: Colors.grey[600], size: 20),
                      const SizedBox(width: 12),
                      const Expanded(
                        child: Text(
                          'Using a new address',
                          style: TextStyle(fontSize: 14, color: Colors.black87),
                        ),
                      ),
                      if (addresses.isNotEmpty)
                        TextButton.icon(
                          onPressed: () {
                            final defaultAddr =
                                context.read<AccountProvider>().defaultAddress;
                            if (defaultAddr != null) {
                              setState(() {
                                _selectedAddressId = defaultAddr['id'];
                                _useNewAddress = false;
                              });
                              _fillAddressFields(defaultAddr);
                            }
                          },
                          icon: const Icon(Icons.arrow_back, size: 18),
                          label: const Text('Use saved'),
                          style: TextButton.styleFrom(
                            foregroundColor: const Color(0xFFB8860B),
                          ),
                        ),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
              ],

              Row(
                children: [
                  Expanded(
                    child: _buildTextField(
                      controller: _firstNameController,
                      label: 'First Name',
                      validator: (value) =>
                          value?.isEmpty ?? true ? 'Required' : null,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildTextField(
                      controller: _lastNameController,
                      label: 'Last Name',
                      validator: (value) =>
                          value?.isEmpty ?? true ? 'Required' : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              _buildTextField(
                controller: _phoneController,
                label: 'Phone Number',
                keyboardType: TextInputType.phone,
              ),
              const SizedBox(height: 16),
              _buildTextField(
                controller: _addressController,
                label: 'Street Address',
                validator: (value) =>
                    value?.isEmpty ?? true ? 'Required' : null,
              ),
              const SizedBox(height: 16),
              _buildTextField(
                controller: _addressLine2Controller,
                label: 'Apartment, suite, etc. (optional)',
              ),
              const SizedBox(height: 16),
              Row(
                children: [
                  Expanded(
                    child: _buildTextField(
                      controller: _cityController,
                      label: 'City',
                      validator: (value) =>
                          value?.isEmpty ?? true ? 'Required' : null,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: _buildTextField(
                      controller: _postalCodeController,
                      label: 'Postal Code (optional)',
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 16),
              // Country - Fixed to UAE
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.grey[300]!),
                ),
                child: Row(
                  children: [
                    Icon(Icons.flag_outlined,
                        size: 18, color: Colors.grey[600]),
                    const SizedBox(width: 12),
                    const Text(
                      'United Arab Emirates',
                      style: TextStyle(
                        fontSize: 15,
                        color: Colors.black87,
                      ),
                    ),
                  ],
                ),
              ),

              // Live preview for new address (when entering a different address)
              if (_useNewAddress || (!isLoggedIn) || addresses.isEmpty) ...[
                const SizedBox(height: 16),
                _buildLiveAddressPreview(),
              ],

              // Show save checkbox only when using new address or no saved addresses
              if (_useNewAddress || !isLoggedIn || addresses.isEmpty) ...[
                const SizedBox(height: 16),
                CheckboxListTile(
                  contentPadding: EdgeInsets.zero,
                  controlAffinity: ListTileControlAffinity.leading,
                  value: _saveAddress,
                  onChanged: isLoggedIn
                      ? (value) => setState(() => _saveAddress = value ?? false)
                      : null,
                  title: Text(
                    'Save this address for future orders',
                    style: TextStyle(
                      fontSize: 14,
                      color: isLoggedIn ? Colors.black87 : Colors.grey,
                    ),
                  ),
                  subtitle: !isLoggedIn
                      ? const Text(
                          'Log in to save addresses',
                          style: TextStyle(fontSize: 12),
                        )
                      : null,
                ),
              ],

              // Billing Address Toggle
              const SizedBox(height: 24),
              const Divider(),
              const SizedBox(height: 16),
              _buildBillingAddressSection(addresses, isLoggedIn),
            ],
          ),
        ),
      ),
    );
  }

  /// Builds the billing address section with toggle and address selection
  Widget _buildBillingAddressSection(
      List<Map<String, dynamic>> addresses, bool isLoggedIn) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SwitchListTile(
          contentPadding: EdgeInsets.zero,
          title: const Text(
            'Billing address same as shipping',
            style: TextStyle(fontSize: 14, fontWeight: FontWeight.w500),
          ),
          value: _billingSameAsShipping,
          onChanged: (value) {
            setState(() {
              _billingSameAsShipping = value;
              // Auto-select billing address when toggle is turned off
              if (!value &&
                  _selectedBillingAddressId == null &&
                  addresses.isNotEmpty) {
                final defaultAddr = addresses.firstWhere(
                  (a) => a['isDefault'] == true,
                  orElse: () => addresses.first,
                );
                _selectedBillingAddressId = defaultAddr['id'];
                // Save the selected billing address
                WebStorage.setValue(
                    _selectedBillingAddressStorageKey, defaultAddr['id']);
              }
            });
            // Save billing toggle state
            WebStorage.setValue(
                _billingSameAsShippingStorageKey, value.toString());
            // If turned ON, remove billing address selection
            if (value) {
              WebStorage.removeValue(_selectedBillingAddressStorageKey);
            }
          },
          activeThumbColor: const Color(0xFFB8860B),
        ),
        if (!_billingSameAsShipping) ...[
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.grey[50],
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: Colors.grey[300]!),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(Icons.receipt_long_outlined,
                        color: Colors.grey[700], size: 20),
                    const SizedBox(width: 8),
                    const Text(
                      'Billing Address',
                      style: TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w600,
                        color: Colors.black87,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                if (isLoggedIn && addresses.isNotEmpty) ...[
                  DropdownButtonFormField<String>(
                    initialValue: _selectedBillingAddressId,
                    decoration: InputDecoration(
                      filled: true,
                      fillColor: Colors.white,
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide(color: Colors.grey[300]!),
                      ),
                      contentPadding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 14),
                    ),
                    hint: const Text('Choose billing address'),
                    items: addresses.map((addr) {
                      final label = addr['label'] ??
                          '${addr['firstName']} ${addr['lastName']}';
                      final city = addr['city'] ?? '';
                      final isDefault = addr['isDefault'] == true;
                      return DropdownMenuItem<String>(
                        value: addr['id'],
                        child: Row(
                          children: [
                            Expanded(
                              child: Text(
                                '$label - $city',
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                            if (isDefault)
                              Container(
                                margin: const EdgeInsets.only(left: 8),
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                  color:
                                      const Color(0xFFB8860B).withOpacity(0.1),
                                  borderRadius: BorderRadius.circular(4),
                                ),
                                child: const Text(
                                  'Default',
                                  style: TextStyle(
                                    fontSize: 10,
                                    color: Color(0xFFB8860B),
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                          ],
                        ),
                      );
                    }).toList(),
                    onChanged: (value) {
                      if (value != null) {
                        setState(() {
                          _selectedBillingAddressId = value;
                        });
                        // Persist billing address selection to storage
                        WebStorage.setValue(
                            _selectedBillingAddressStorageKey, value);
                      }
                    },
                  ),
                  // Billing Address Preview
                  if (_selectedBillingAddressId != null) ...[
                    const SizedBox(height: 12),
                    _buildAddressSummaryPreview(
                      addresses.firstWhere(
                        (a) => a['id'] == _selectedBillingAddressId,
                        orElse: () => <String, dynamic>{},
                      ),
                    ),
                  ],
                ] else ...[
                  Text(
                    isLoggedIn
                        ? 'No saved addresses available'
                        : 'Log in to use saved addresses',
                    style: TextStyle(fontSize: 14, color: Colors.grey[600]),
                  ),
                ],
                // Billing Invoice Fields (optional)
                const SizedBox(height: 20),
                const Divider(),
                const SizedBox(height: 12),
                Row(
                  children: [
                    Icon(Icons.business_outlined,
                        color: Colors.grey[700], size: 18),
                    const SizedBox(width: 8),
                    Text(
                      'Invoice Details (Optional)',
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: Colors.grey[700],
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _billingCompanyController,
                  maxLength: 60,
                  decoration: InputDecoration(
                    labelText: 'Company Name',
                    hintText: 'Enter company name (optional)',
                    prefixIcon: const Icon(Icons.apartment_outlined),
                    counterText: '',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    filled: true,
                    fillColor: Colors.white,
                  ),
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: _billingVatController,
                  maxLength: 60,
                  decoration: InputDecoration(
                    labelText: 'VAT/TRN Number',
                    hintText: 'Enter VAT or TRN number (optional)',
                    prefixIcon: const Icon(Icons.receipt_outlined),
                    counterText: '',
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(8),
                    ),
                    filled: true,
                    fillColor: Colors.white,
                  ),
                ),
              ],
            ),
          ),
        ],
      ],
    );
  }

  Widget _buildPaymentMethodCard() {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Payment Method',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 20),
            _buildPaymentOption(
              'card',
              'Credit/Debit Card',
              Icons.credit_card,
            ),
            const SizedBox(height: 12),
            _buildPaymentOption(
              'cod',
              'Cash on Delivery',
              Icons.payments_outlined,
            ),
            if (_selectedPaymentMethod == 'card') ...[
              const SizedBox(height: 24),
              const Divider(),
              const SizedBox(height: 24),
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.blue[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.blue[200]!),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(Icons.lock_outlined,
                            color: Colors.blue[700], size: 20),
                        const SizedBox(width: 8),
                        Text(
                          'Secure Payment via Stripe',
                          style: TextStyle(
                            fontWeight: FontWeight.w600,
                            color: Colors.blue[800],
                            fontSize: 14,
                          ),
                        ),
                        const Spacer(),
                        Icon(Icons.verified_user,
                            color: Colors.green[600], size: 18),
                        const SizedBox(width: 4),
                        Text(
                          'PCI Compliant',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.green[700],
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Your card details are entered in a secure Stripe-hosted field. '
                      'Card data never touches our servers.',
                      style: TextStyle(
                        color: Colors.blue[700],
                        fontSize: 13,
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 16),
              // Card Holder Name (still a regular text field — not sensitive)
              _buildTextField(
                controller: _cardHolderController,
                label: 'Card Holder Name',
                validator: (value) {
                  if (_selectedPaymentMethod != 'card') return null;
                  if (value == null || value.trim().isEmpty) {
                    return 'Card holder name is required';
                  }
                  if (value.trim().length < 2) {
                    return 'Enter a valid name';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              // Stripe Card Element (secure iframe — card number, expiry, CVC)
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Card Details',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: Colors.grey[700],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    height: 50,
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey[300]!),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: _stripeInitialized
                        ? HtmlElementView(
                            viewType: 'stripe-card-element',
                            onPlatformViewCreated: (_) => _mountStripeCard(),
                          )
                        : Center(
                            child: Text(
                              'Loading secure payment form...',
                              style: TextStyle(
                                color: Colors.grey[500],
                                fontSize: 14,
                              ),
                            ),
                          ),
                  ),
                  const SizedBox(height: 6),
                  Row(
                    children: [
                      Icon(Icons.shield_outlined,
                          size: 14, color: Colors.grey[400]),
                      const SizedBox(width: 4),
                      Text(
                        'Powered by Stripe — 256-bit SSL encryption',
                        style: TextStyle(
                          fontSize: 11,
                          color: Colors.grey[400],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ],
            if (_selectedPaymentMethod == 'cod')
              Container(
                margin: const EdgeInsets.only(top: 16),
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.green[50],
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.green[200]!),
                ),
                child: Row(
                  children: [
                    Icon(Icons.info_outline, color: Colors.green[700]),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Pay with cash when your order is delivered. No payment details required.',
                        style:
                            TextStyle(color: Colors.green[800], fontSize: 13),
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

  Widget _buildPaymentOption(String value, String title, IconData icon) {
    final isSelected = _selectedPaymentMethod == value;

    return InkWell(
      onTap: () => setState(() => _selectedPaymentMethod = value),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(
            color: isSelected ? Colors.black : Colors.grey[300]!,
            width: isSelected ? 2 : 1,
          ),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            Icon(
              icon,
              color: isSelected ? Colors.black : Colors.grey[600],
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                title,
                style: TextStyle(
                  fontSize: 15,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.normal,
                  color: isSelected ? Colors.black : Colors.grey[800],
                ),
              ),
            ),
            Radio<String>(
              value: value,
              groupValue: _selectedPaymentMethod,
              onChanged: (val) => setState(() => _selectedPaymentMethod = val!),
              activeColor: Colors.black,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildOrderSummaryCard(CartProvider cart, bool showItems) {
    return Card(
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Order Summary',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 20),
            if (showItems) ...[
              ...cart.items.map((item) => Padding(
                    padding: const EdgeInsets.only(bottom: 16),
                    child: Row(
                      children: [
                        Container(
                          width: 60,
                          height: 60,
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.grey[300]!),
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.network(
                              item.product.imageUrl,
                              fit: BoxFit.cover,
                              errorBuilder: (context, error, stackTrace) {
                                return Container(
                                  color: Colors.grey[200],
                                  child: Icon(Icons.image,
                                      color: Colors.grey[400]),
                                );
                              },
                            ),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item.product.name,
                                style: const TextStyle(
                                  fontSize: 14,
                                  fontWeight: FontWeight.w600,
                                ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Qty: ${item.quantity}',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                        ),
                        Text(
                          'AED ${(item.product.price * item.quantity).toStringAsFixed(2)}',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  )),
              const Divider(height: 32),
            ],
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Subtotal (${cart.itemCount} items)',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[700],
                  ),
                ),
                Text(
                  'AED ${cart.total.toStringAsFixed(2)}',
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Shipping',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[700],
                  ),
                ),
                Text(
                  cart.hasPromoApplied &&
                          cart.promoDiscountType == 'FREE_SHIPPING'
                      ? 'FREE (Promo)'
                      : 'Free',
                  style: TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.green[700],
                  ),
                ),
              ],
            ),
            // VAT line
            if (_vatEnabled && _vatPercent > 0) ...[
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    '$_vatLabel (${_vatPercent % 1 == 0 ? _vatPercent.toInt().toString() : _vatPercent.toStringAsFixed(1)}%)',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[700],
                    ),
                  ),
                  Text(
                    'AED ${(cart.total * _vatPercent / 100).toStringAsFixed(2)}',
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ],
              ),
            ],
            // Promo code discount line
            if (cart.hasPromoApplied &&
                cart.promoDiscountType != 'FREE_SHIPPING') ...[
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Text(
                      'Promo (${cart.appliedPromoCode})',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.green[700],
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                  Text(
                    '-AED ${cart.promoDiscountAmount.toStringAsFixed(2)}',
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.green[700],
                    ),
                  ),
                ],
              ),
            ],
            const SizedBox(height: 16),
            // Loyalty Cash Section (from AccountProvider - DB)
            Builder(
              builder: (context) {
                final accountProvider = context.watch<AccountProvider>();
                final loyaltyCashBalance = accountProvider.loyaltyBalance;
                final isLoggedIn =
                    context.watch<AuthProvider>().isAuthenticated;

                // Don't show if not logged in or no balance
                if (!isLoggedIn || loyaltyCashBalance <= 0) {
                  return const SizedBox.shrink();
                }

                // Calculate max redeemable: min of balance and 30% of subtotal
                final maxByRule = cart.total * 0.30;
                final maxRedeemable = loyaltyCashBalance < maxByRule
                    ? loyaltyCashBalance
                    : maxByRule;

                return Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFFB8860B).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: const Color(0xFFB8860B).withOpacity(0.3),
                    ),
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
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
                              size: 18,
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
                                    fontSize: 12,
                                  ),
                                ),
                                Text(
                                  'AED ${loyaltyCashBalance.toStringAsFixed(2)}',
                                  style: const TextStyle(
                                    color: Color(0xFFB8860B),
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
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
                      if (applyLoyaltyCash) ...[
                        const SizedBox(height: 8),
                        Text(
                          'Max redeemable: AED ${maxRedeemable.toStringAsFixed(2)} (30% of subtotal)',
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.grey[600],
                            fontStyle: FontStyle.italic,
                          ),
                        ),
                      ],
                    ],
                  ),
                );
              },
            ),
            Builder(
              builder: (context) {
                final accountProvider = context.watch<AccountProvider>();
                final loyaltyCashBalance = accountProvider.loyaltyBalance;

                if (!applyLoyaltyCash || loyaltyCashBalance <= 0) {
                  return const SizedBox.shrink();
                }

                // Calculate applied amount: min of balance and 30% cap
                final maxByRule = cart.total * 0.30;
                final appliedAmount = loyaltyCashBalance < maxByRule
                    ? loyaltyCashBalance
                    : maxByRule;

                return Column(
                  children: [
                    const SizedBox(height: 12),
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'Loyalty Cash Applied',
                          style: TextStyle(
                            fontSize: 14,
                            color: Colors.grey[700],
                          ),
                        ),
                        Text(
                          '-AED ${appliedAmount.toStringAsFixed(2)}',
                          style: const TextStyle(
                            fontSize: 14,
                            fontWeight: FontWeight.w600,
                            color: Colors.green,
                          ),
                        ),
                      ],
                    ),
                  ],
                );
              },
            ),
            const Divider(height: 32),
            Builder(
              builder: (context) {
                final accountProvider = context.watch<AccountProvider>();
                final loyaltyCashBalance = accountProvider.loyaltyBalance;

                // Calculate applied amount: min of balance and 30% cap
                final maxByRule = cart.total * 0.30;
                final appliedAmount = applyLoyaltyCash && loyaltyCashBalance > 0
                    ? (loyaltyCashBalance < maxByRule
                        ? loyaltyCashBalance
                        : maxByRule)
                    : 0.0;
                final promoDiscount = cart.hasPromoApplied &&
                        cart.promoDiscountType != 'FREE_SHIPPING'
                    ? cart.promoDiscountAmount
                    : 0.0;
                final vatAmount =
                    _vatEnabled ? cart.total * _vatPercent / 100 : 0.0;
                final finalTotal =
                    (cart.total + vatAmount - promoDiscount - appliedAmount)
                        .clamp(0, double.infinity);

                return Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    const Text(
                      'Total',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    Text(
                      'AED ${finalTotal.toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                );
              },
            ),
          ],
        ),
      ),
    );
  }

  /// Builds a billing address summary card for order review
  Widget _buildBillingSummaryCard() {
    final accountProvider = context.watch<AccountProvider>();
    final addresses = accountProvider.addresses;

    // Determine the billing address to display
    Map<String, dynamic> billingAddressData = {};
    String headerText = 'Billing Address';

    if (_billingSameAsShipping) {
      headerText = 'Billing Address (Same as Shipping)';
      // Get shipping address data
      if (_selectedAddressId != null && !_useNewAddress) {
        billingAddressData = addresses.firstWhere(
          (a) => a['id'] == _selectedAddressId,
          orElse: () => <String, dynamic>{},
        );
      } else {
        // Build from form fields
        billingAddressData = {
          'firstName': _firstNameController.text.trim(),
          'lastName': _lastNameController.text.trim(),
          'phone': _phoneController.text.trim(),
          'addressLine1': _addressController.text.trim(),
          'addressLine2': _addressLine2Controller.text.trim(),
          'city': _cityController.text.trim(),
        };
      }
    } else {
      // Different billing address selected
      if (_selectedBillingAddressId != null) {
        billingAddressData = addresses.firstWhere(
          (a) => a['id'] == _selectedBillingAddressId,
          orElse: () => <String, dynamic>{},
        );
      }
    }

    // Don't show if no data
    if (billingAddressData.isEmpty &&
        !_billingSameAsShipping &&
        _selectedBillingAddressId == null) {
      return const SizedBox.shrink();
    }

    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(8),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.receipt_long_outlined,
                    size: 18, color: Colors.grey[700]),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    headerText,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Colors.black87,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (billingAddressData.isNotEmpty)
              _buildAddressSummaryPreview(billingAddressData)
            else
              Text(
                'No billing address selected',
                style: TextStyle(fontSize: 13, color: Colors.grey[600]),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildPlaceOrderButton(CartProvider cart) {
    final isValid = _isShippingValid;
    final isEnabled = !_isProcessing && isValid;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: isEnabled ? _processCheckout : null,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.black,
              padding: const EdgeInsets.symmetric(vertical: 16),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
              disabledBackgroundColor: Colors.grey[400],
            ),
            child: _isProcessing
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                    ),
                  )
                : const Text(
                    'Place Order',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: Colors.white,
                    ),
                  ),
          ),
        ),
        if (!isValid) ...[
          const SizedBox(height: 8),
          Text(
            'Please select or enter a delivery address.',
            textAlign: TextAlign.center,
            style: TextStyle(
              fontSize: 13,
              color: Colors.red[600],
            ),
          ),
        ],
      ],
    );
  }

  /// Builds a summary preview card for a saved address
  Widget _buildAddressSummaryPreview(Map<String, dynamic> address) {
    if (address.isEmpty) return const SizedBox.shrink();

    final fullName =
        '${address['firstName'] ?? ''} ${address['lastName'] ?? ''}'.trim();
    final phone = address['phone'] ?? '';
    final addressLine1 = address['addressLine1'] ?? '';
    final addressLine2 = address['addressLine2'] ?? '';
    final city = address['city'] ?? '';
    final notes = address['notes'] ?? '';
    final isDefault = address['isDefault'] == true;

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(Icons.local_shipping_outlined,
                  size: 16, color: Colors.grey[600]),
              const SizedBox(width: 8),
              Text(
                'Delivery Address',
                style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[600],
                ),
              ),
              const Spacer(),
              if (isDefault)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: const Color(0xFFB8860B).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: const Text(
                    'Default',
                    style: TextStyle(
                      fontSize: 10,
                      color: Color(0xFFB8860B),
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 8),
          if (fullName.isNotEmpty)
            Text(
              fullName,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
          if (phone.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              phone,
              style: TextStyle(fontSize: 13, color: Colors.grey[700]),
            ),
          ],
          if (addressLine1.isNotEmpty) ...[
            const SizedBox(height: 4),
            Text(
              addressLine1,
              style: TextStyle(fontSize: 13, color: Colors.grey[700]),
            ),
          ],
          if (addressLine2.isNotEmpty) ...[
            const SizedBox(height: 2),
            Text(
              addressLine2,
              style: TextStyle(fontSize: 13, color: Colors.grey[600]),
            ),
          ],
          if (city.isNotEmpty) ...[
            const SizedBox(height: 2),
            Text(
              city,
              style: TextStyle(fontSize: 13, color: Colors.grey[700]),
            ),
          ],
          if (notes.isNotEmpty) ...[
            const SizedBox(height: 6),
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(Icons.note_outlined, size: 14, color: Colors.grey[500]),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    notes,
                    style: TextStyle(
                      fontSize: 12,
                      fontStyle: FontStyle.italic,
                      color: Colors.grey[600],
                    ),
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  /// Builds a live preview of the address being entered
  Widget _buildLiveAddressPreview() {
    // Use a ListenableBuilder to update live as user types
    return ListenableBuilder(
      listenable: Listenable.merge([
        _firstNameController,
        _lastNameController,
        _phoneController,
        _addressController,
        _addressLine2Controller,
        _cityController,
      ]),
      builder: (context, _) {
        final fullName =
            '${_firstNameController.text} ${_lastNameController.text}'.trim();
        final phone = _phoneController.text.trim();
        final addressLine1 = _addressController.text.trim();
        final addressLine2 = _addressLine2Controller.text.trim();
        final city = _cityController.text.trim();

        // Don't show preview if all fields are empty
        final hasContent = fullName.isNotEmpty ||
            phone.isNotEmpty ||
            addressLine1.isNotEmpty ||
            city.isNotEmpty;

        if (!hasContent) {
          return const SizedBox.shrink();
        }

        return Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: Colors.grey[50],
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[300]!),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(Icons.preview_outlined,
                      size: 16, color: Colors.grey[600]),
                  const SizedBox(width: 8),
                  Text(
                    'Address Preview',
                    style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey[600],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              if (fullName.isNotEmpty)
                Text(
                  fullName,
                  style: const TextStyle(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.black87,
                  ),
                ),
              if (phone.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  phone,
                  style: TextStyle(fontSize: 13, color: Colors.grey[700]),
                ),
              ],
              if (addressLine1.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  addressLine1,
                  style: TextStyle(fontSize: 13, color: Colors.grey[700]),
                ),
              ],
              if (addressLine2.isNotEmpty) ...[
                const SizedBox(height: 2),
                Text(
                  addressLine2,
                  style: TextStyle(fontSize: 13, color: Colors.grey[600]),
                ),
              ],
              if (city.isNotEmpty) ...[
                const SizedBox(height: 2),
                Text(
                  '$city, UAE',
                  style: TextStyle(fontSize: 13, color: Colors.grey[700]),
                ),
              ],
            ],
          ),
        );
      },
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    TextInputType? keyboardType,
    bool obscureText = false,
    String? Function(String?)? validator,
    FocusNode? focusNode,
    List<TextInputFormatter>? inputFormatters,
    String? hintText,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: Colors.grey[700],
          ),
        ),
        const SizedBox(height: 6),
        TextFormField(
          controller: controller,
          keyboardType: keyboardType,
          obscureText: obscureText,
          validator: validator,
          focusNode: focusNode,
          inputFormatters: inputFormatters,
          decoration: InputDecoration(
            hintText: hintText ?? label,
            hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14),
            filled: true,
            fillColor: Colors.white,
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
              horizontal: 14,
              vertical: 12,
            ),
          ),
        ),
      ],
    );
  }
}
