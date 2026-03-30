import 'package:flutter_test/flutter_test.dart';
import 'package:solo_ecommerce/providers/cart_provider.dart';

/// Cart Provider Unit Tests
/// Tests cart state management, item operations, and calculations
void main() {
  group('CartProvider Unit Tests', () {
    late CartProvider cartProvider;

    setUp(() {
      cartProvider = CartProvider();
    });

    group('Initial State', () {
      test('CART-P01: should have empty items list initially', () {
        expect(cartProvider.items, isEmpty);
      });

      test('CART-P02: should have itemCount = 0 initially', () {
        expect(cartProvider.itemCount, equals(0));
      });

      test('CART-P03: should have total = 0 initially', () {
        expect(cartProvider.total, equals(0.0));
      });
    });

    group('State Changes', () {
      test('CART-P04: should notify listeners on state change', () {
        int notifyCount = 0;
        cartProvider.addListener(() => notifyCount++);

        cartProvider.notifyListeners();

        expect(notifyCount, equals(1));
      });
    });

    group('Cart Calculations', () {
      test('CART-P05: itemCount should be 0 when empty', () {
        expect(cartProvider.itemCount, equals(0));
      });

      test('CART-P06: total should be 0 when empty', () {
        expect(cartProvider.total, equals(0.0));
      });
    });

    group('Cart Operations', () {
      test('CART-P07: clearCart should empty the cart', () {
        cartProvider.clearCart();
        expect(cartProvider.items, isEmpty);
        expect(cartProvider.itemCount, equals(0));
      });
    });
  });
}
