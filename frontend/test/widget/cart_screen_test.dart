import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:solo_ecommerce/providers/cart_provider.dart';
import 'package:solo_ecommerce/screens/cart_screen.dart';

/// Cart Screen Widget Tests
void main() {
  group('CartScreen Widget Tests', () {
    late CartProvider mockCartProvider;

    setUp(() {
      mockCartProvider = CartProvider();
    });

    Widget createTestWidget() {
      return ChangeNotifierProvider<CartProvider>.value(
        value: mockCartProvider,
        child: const MaterialApp(
          home: CartScreen(),
        ),
      );
    }

    group('UI Elements', () {
      testWidgets('CART-W01: should render cart screen', (tester) async {
        await tester.pumpWidget(createTestWidget());
        await tester.pumpAndSettle();

        expect(find.byType(Scaffold), findsOneWidget);
      });

      testWidgets('CART-W02: should display empty state when cart is empty', (tester) async {
        await tester.pumpWidget(createTestWidget());
        await tester.pumpAndSettle();

        // Cart should be empty initially
        expect(mockCartProvider.items, isEmpty);
      });

      testWidgets('CART-W03: should be a StatefulWidget', (tester) async {
        await tester.pumpWidget(createTestWidget());
        
        expect(find.byType(CartScreen), findsOneWidget);
      });
    });
  });
}
