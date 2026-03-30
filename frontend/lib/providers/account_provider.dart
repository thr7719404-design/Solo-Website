import 'package:flutter/foundation.dart';
import '../services/api_service.dart';

/// Account state provider for profile, orders, addresses, loyalty, and payment methods
class AccountProvider extends ChangeNotifier {
  // Loading states
  bool _loadingProfile = false;
  bool _loadingOrders = false;
  bool _loadingAddresses = false;
  bool _loadingLoyalty = false;
  bool _loadingPayments = false;
  bool _savingProfile = false;
  bool _savingAddress = false;
  bool _savingPayment = false;

  // Data
  Map<String, dynamic>? _profile;
  List<dynamic> _orders = [];
  List<dynamic> _addresses = [];
  Map<String, dynamic>? _loyalty;
  List<dynamic> _paymentMethods = [];

  // Error states
  String? _error;

  // Getters
  bool get loadingProfile => _loadingProfile;
  bool get loadingOrders => _loadingOrders;
  bool get loadingAddresses => _loadingAddresses;
  bool get loadingLoyalty => _loadingLoyalty;
  bool get loadingPayments => _loadingPayments;
  bool get savingProfile => _savingProfile;
  bool get savingAddress => _savingAddress;
  bool get savingPayment => _savingPayment;
  bool get isLoading => _loadingProfile || _loadingOrders || _loadingAddresses || _loadingLoyalty || _loadingPayments;

  Map<String, dynamic>? get profile => _profile;
  List<dynamic> get orders => _orders;
  List<dynamic> get addresses => _addresses;
  Map<String, dynamic>? get loyalty => _loyalty;
  List<dynamic> get paymentMethods => _paymentMethods;
  String? get error => _error;

  // Convenience getters for loyalty
  double get loyaltyBalance => _loyalty != null ? _parseDecimal(_loyalty!['balanceAed']) : 0.0;
  double get loyaltyTotalEarned => _loyalty != null ? _parseDecimal(_loyalty!['totalEarnedAed']) : 0.0;
  double get loyaltyTotalRedeemed => _loyalty != null ? _parseDecimal(_loyalty!['totalRedeemedAed']) : 0.0;
  List<dynamic> get loyaltyTransactions => _loyalty?['transactions'] ?? [];

  double _parseDecimal(dynamic value) {
    if (value == null) return 0.0;
    if (value is num) return value.toDouble();
    if (value is String) return double.tryParse(value) ?? 0.0;
    return 0.0;
  }

  /// Load all account data
  Future<void> loadAll() async {
    await Future.wait([
      loadProfile(),
      loadOrders(),
      loadAddresses(),
      loadLoyalty(),
      loadPaymentMethods(),
    ]);
  }

  /// Load user profile
  Future<void> loadProfile() async {
    _loadingProfile = true;
    _error = null;
    notifyListeners();

    try {
      _profile = await ApiService.account.getProfile();
    } catch (e) {
      _error = e.toString();
    } finally {
      _loadingProfile = false;
      notifyListeners();
    }
  }

  /// Save profile changes
  Future<bool> saveProfile({
    String? firstName,
    String? lastName,
    String? phone,
  }) async {
    _savingProfile = true;
    _error = null;
    notifyListeners();

    try {
      final data = <String, dynamic>{};
      if (firstName != null) data['firstName'] = firstName;
      if (lastName != null) data['lastName'] = lastName;
      if (phone != null) data['phone'] = phone;

      _profile = await ApiService.account.updateProfile(data);
      _savingProfile = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _savingProfile = false;
      notifyListeners();
      return false;
    }
  }

  /// Load orders
  Future<void> loadOrders() async {
    _loadingOrders = true;
    notifyListeners();

    try {
      _orders = await ApiService.account.getOrders();
    } catch (e) {
      _error = e.toString();
    } finally {
      _loadingOrders = false;
      notifyListeners();
    }
  }

  /// Refresh orders
  Future<void> refreshOrders() async {
    await loadOrders();
  }

  /// Get order details
  Future<Map<String, dynamic>?> getOrderDetails(String orderId) async {
    try {
      return await ApiService.account.getOrder(orderId);
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return null;
    }
  }

  /// Load addresses
  Future<void> loadAddresses() async {
    _loadingAddresses = true;
    notifyListeners();

    try {
      _addresses = await ApiService.account.getAddresses();
    } catch (e) {
      _error = e.toString();
    } finally {
      _loadingAddresses = false;
      notifyListeners();
    }
  }

  /// Create address
  Future<bool> createAddress(Map<String, dynamic> data) async {
    _savingAddress = true;
    _error = null;
    notifyListeners();

    try {
      await ApiService.account.createAddress(data);
      await loadAddresses();
      _savingAddress = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _savingAddress = false;
      notifyListeners();
      return false;
    }
  }

  /// Update address
  Future<bool> updateAddress(String id, Map<String, dynamic> data) async {
    _savingAddress = true;
    _error = null;
    notifyListeners();

    try {
      await ApiService.account.updateAddress(id, data);
      await loadAddresses();
      _savingAddress = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _savingAddress = false;
      notifyListeners();
      return false;
    }
  }

  /// Delete address
  Future<bool> deleteAddress(String id) async {
    try {
      await ApiService.account.deleteAddress(id);
      await loadAddresses();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  /// Set address as default
  Future<bool> setDefaultAddress(String id) async {
    try {
      await ApiService.account.setDefaultAddress(id);
      await loadAddresses();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  /// Get default address
  Map<String, dynamic>? get defaultAddress {
    try {
      return _addresses.firstWhere(
        (addr) => addr['isDefault'] == true,
        orElse: () => _addresses.isNotEmpty ? _addresses.first : null,
      );
    } catch (e) {
      return null;
    }
  }

  /// Load loyalty data
  Future<void> loadLoyalty() async {
    _loadingLoyalty = true;
    notifyListeners();

    try {
      _loyalty = await ApiService.account.getLoyalty();
    } catch (e) {
      _error = e.toString();
    } finally {
      _loadingLoyalty = false;
      notifyListeners();
    }
  }

  /// Load payment methods
  Future<void> loadPaymentMethods() async {
    _loadingPayments = true;
    notifyListeners();

    try {
      _paymentMethods = await ApiService.account.getPaymentMethods();
    } catch (e) {
      _error = e.toString();
    } finally {
      _loadingPayments = false;
      notifyListeners();
    }
  }

  /// Add payment method
  Future<bool> addPaymentMethod({
    required String providerPaymentMethodId,
    required String brand,
    required String last4,
    required int expMonth,
    required int expYear,
    String? provider,
    bool isDefault = false,
  }) async {
    _savingPayment = true;
    _error = null;
    notifyListeners();

    try {
      await ApiService.account.addPaymentMethod({
        'providerPaymentMethodId': providerPaymentMethodId,
        'brand': brand,
        'last4': last4,
        'expMonth': expMonth,
        'expYear': expYear,
        if (provider != null) 'provider': provider,
        'isDefault': isDefault,
      });
      await loadPaymentMethods();
      _savingPayment = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _savingPayment = false;
      notifyListeners();
      return false;
    }
  }

  /// Set payment method as default
  Future<bool> setDefaultPaymentMethod(String id) async {
    try {
      await ApiService.account.setDefaultPaymentMethod(id);
      await loadPaymentMethods();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  /// Delete payment method
  Future<bool> deletePaymentMethod(String id) async {
    try {
      await ApiService.account.deletePaymentMethod(id);
      await loadPaymentMethods();
      return true;
    } catch (e) {
      _error = e.toString();
      notifyListeners();
      return false;
    }
  }

  /// Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }

  /// Reset all data (on logout)
  void reset() {
    _profile = null;
    _orders = [];
    _addresses = [];
    _loyalty = null;
    _paymentMethods = [];
    _error = null;
    notifyListeners();
  }
}
