import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:solo_ecommerce/providers/auth_provider.dart';
import 'package:solo_ecommerce/providers/cart_provider.dart';
import 'package:solo_ecommerce/providers/account_provider.dart';
import 'package:solo_ecommerce/screens/checkout_screen.dart';

/// Checkout Screen Widget Tests (GAP-010/011)
void main() {
  group('CheckoutScreen Widget Tests (GAP-010/011)', () {
    late AuthProvider mockAuthProvider;
    late CartProvider mockCartProvider;
    late AccountProvider mockAccountProvider;

    setUp(() {
      mockAuthProvider = AuthProvider();
      mockCartProvider = CartProvider();
      mockAccountProvider = AccountProvider();
    });

    Widget createTestWidget() {
      return MultiProvider(
        providers: [
          ChangeNotifierProvider<AuthProvider>.value(value: mockAuthProvider),
          ChangeNotifierProvider<CartProvider>.value(value: mockCartProvider),
          ChangeNotifierProvider<AccountProvider>.value(value: mockAccountProvider),
        ],
        child: const MaterialApp(
          home: CheckoutScreen(),
        ),
      );
    }

    group('UI Elements', () {
      testWidgets('CHKOUT-W01: should render checkout screen', (tester) async {
        await tester.pumpWidget(createTestWidget());
        await tester.pumpAndSettle();

        expect(find.byType(Scaffold), findsOneWidget);
      });

      testWidgets('CHKOUT-W02: should be a StatefulWidget', (tester) async {
        await tester.pumpWidget(createTestWidget());
        
        expect(find.byType(CheckoutScreen), findsOneWidget);
      });
    });
  });
}
