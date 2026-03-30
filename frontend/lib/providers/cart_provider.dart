import 'package:flutter/material.dart';
import '../models/product.dart';
import '../services/api_service.dart';

class CartItem {
  final Product product;
  int quantity;
  String? serverCartItemId; // Backend cart_item UUID for update/delete

  CartItem({required this.product, this.quantity = 1, this.serverCartItemId});
}

/// Cart provider with server sync.
///
/// When the user is authenticated, all mutations sync to the backend.
/// When unauthenticated, operates in local-only mode.
class CartProvider extends ChangeNotifier {
  final List<CartItem> _items = [];
  bool _syncing = false;
  bool _initialized = false;

  // Promo code state
  String? _appliedPromoCode;
  String? _promoDiscountType;
  double _promoDiscountValue = 0;
  double _promoDiscountAmount = 0;
  String? _promoDescription;

  List<CartItem> get items => _items;
  bool get isSyncing => _syncing;

  int get itemCount => _items.fold(0, (sum, item) => sum + item.quantity);

  double get total =>
      _items.fold(0, (sum, item) => sum + (item.product.price * item.quantity));

  // Promo code getters
  String? get appliedPromoCode => _appliedPromoCode;
  String? get promoDiscountType => _promoDiscountType;
  double get promoDiscountValue => _promoDiscountValue;
  double get promoDiscountAmount => _promoDiscountAmount;
  String? get promoDescription => _promoDescription;
  bool get hasPromoApplied => _appliedPromoCode != null;

  /// Check if user is authenticated (has token)
  Future<bool> _isAuthenticated() async {
    try {
      final token = await ApiService.client.getAccessToken();
      return token != null;
    } catch (_) {
      return false;
    }
  }

  /// Load cart from the server (call after login)
  Future<void> loadCart() async {
    if (!await _isAuthenticated()) return;

    _syncing = true;
    notifyListeners();

    try {
      final data = await ApiService.cart.getCart();
      _applyServerCart(data);
      _initialized = true;
    } catch (e) {
      debugPrint('CartProvider: Error loading cart from server: $e');
    } finally {
      _syncing = false;
      notifyListeners();
    }
  }

  /// Apply a validated promo code
  void applyPromoCode({
    required String code,
    required String discountType,
    required double discountValue,
    required double discountAmount,
    String? description,
  }) {
    _appliedPromoCode = code;
    _promoDiscountType = discountType;
    _promoDiscountValue = discountValue;
    _promoDiscountAmount = discountAmount;
    _promoDescription = description;
    notifyListeners();
  }

  /// Remove applied promo code
  void removePromoCode() {
    _appliedPromoCode = null;
    _promoDiscountType = null;
    _promoDiscountValue = 0;
    _promoDiscountAmount = 0;
    _promoDescription = null;
    notifyListeners();
  }

  void addToCart(Product product, {int quantity = 1}) {
    // Optimistic local update
    final existingIndex =
        _items.indexWhere((item) => item.product.id == product.id);

    if (existingIndex >= 0) {
      _items[existingIndex].quantity += quantity;
    } else {
      _items.add(CartItem(product: product, quantity: quantity));
    }
    notifyListeners();

    // Server sync (fire and forget)
    _syncAddToCart(product.id, quantity);
  }

  void updateQuantity(String productId, int quantity) {
    final index = _items.indexWhere((item) => item.product.id == productId);
    if (index < 0) return;

    if (quantity <= 0) {
      final cartItemId = _items[index].serverCartItemId;
      _items.removeAt(index);
      notifyListeners();
      if (cartItemId != null) {
        _syncRemoveItem(cartItemId);
      }
    } else {
      _items[index].quantity = quantity;
      notifyListeners();
      final cartItemId = _items[index].serverCartItemId;
      if (cartItemId != null) {
        _syncUpdateQuantity(cartItemId, quantity);
      }
    }
  }

  void removeFromCart(String productId) {
    final index = _items.indexWhere((item) => item.product.id == productId);
    if (index < 0) return;

    final cartItemId = _items[index].serverCartItemId;
    _items.removeAt(index);
    notifyListeners();

    if (cartItemId != null) {
      _syncRemoveItem(cartItemId);
    }
  }

  void clearCart() {
    _items.clear();
    removePromoCode();
    notifyListeners();

    _syncClearCart();
  }

  CartItem? getItem(String productId) {
    try {
      return _items.firstWhere((item) => item.product.id == productId);
    } catch (e) {
      return null;
    }
  }

  /// Clear local cart state (for logout)
  void clearLocal() {
    _items.clear();
    _initialized = false;
    removePromoCode();
    notifyListeners();
  }

  // ── Server sync helpers ──

  Future<void> _syncAddToCart(String productId, int quantity) async {
    if (!await _isAuthenticated()) return;
    try {
      final data = await ApiService.cart.addItem(
        itemId: productId,
        quantity: quantity,
      );
      _applyServerCart(data);
      notifyListeners();
    } catch (e) {
      debugPrint('CartProvider: Error syncing add to cart: $e');
    }
  }

  Future<void> _syncUpdateQuantity(String cartItemId, int quantity) async {
    if (!await _isAuthenticated()) return;
    try {
      final data = await ApiService.cart.updateItemQuantity(
        cartItemId: cartItemId,
        quantity: quantity,
      );
      _applyServerCart(data);
      notifyListeners();
    } catch (e) {
      debugPrint('CartProvider: Error syncing update quantity: $e');
    }
  }

  Future<void> _syncRemoveItem(String cartItemId) async {
    if (!await _isAuthenticated()) return;
    try {
      final data = await ApiService.cart.removeItem(cartItemId);
      _applyServerCart(data);
      notifyListeners();
    } catch (e) {
      debugPrint('CartProvider: Error syncing remove item: $e');
    }
  }

  Future<void> _syncClearCart() async {
    if (!await _isAuthenticated()) return;
    try {
      await ApiService.cart.clearCart();
    } catch (e) {
      debugPrint('CartProvider: Error syncing clear cart: $e');
    }
  }

  /// Parse server cart response and apply to local state
  void _applyServerCart(Map<String, dynamic> data) {
    _items.clear();

    final serverItems = data['items'] as List<dynamic>? ?? [];
    for (final item in serverItems) {
      final productData = item['product'] as Map<String, dynamic>?;
      if (productData == null) continue;

      final images = productData['images'] as List<dynamic>? ?? [];
      final firstImage =
          images.isNotEmpty ? (images[0]['url'] ?? '') as String : '';
      final brand = productData['brand'] as Map<String, dynamic>?;

      _items.add(CartItem(
        product: Product(
          id: productData['id']?.toString() ?? '',
          name: productData['name']?.toString() ?? '',
          description: productData['description']?.toString() ?? '',
          price: (productData['price'] as num?)?.toDouble() ?? 0.0,
          imageUrl: firstImage,
          category: '',
          brand: brand?['name']?.toString() ?? '',
        ),
        quantity: (item['quantity'] as num?)?.toInt() ?? 1,
        serverCartItemId: item['id']?.toString(),
      ));
    }

    // Apply promo from server if present
    if (data['promoCode'] != null) {
      _appliedPromoCode = data['promoCode'] as String?;
    }
  }
}
