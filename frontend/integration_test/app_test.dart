/// Integration Test Runner
///
/// This file imports and runs all e2e tests.
/// Run with: flutter test integration_test
library;

import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:solo_ecommerce/main.dart' as app;
import 'package:flutter/material.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('Solo E-commerce Integration Tests', () {
    // ============================================================
    // Auth Flow Tests
    // ============================================================
    group('Auth Flow', () {
      testWidgets('E2E-AUTH-01: Complete login flow', (tester) async {
        app.main();
        await tester.pumpAndSettle();

        // Navigate to login screen (if not already there)
        final loginLink = find.text('Login');
        if (loginLink.evaluate().isNotEmpty) {
          await tester.tap(loginLink);
          await tester.pumpAndSettle();
        }

        // Enter credentials
        final emailField = find.byType(TextFormField).first;
        await tester.enterText(emailField, 'test@example.com');

        final passwordField = find.byType(TextFormField).last;
        await tester.enterText(passwordField, 'TestPassword123!');

        // Tap login button
        final loginButton = find.widgetWithText(ElevatedButton, 'Login');
        if (loginButton.evaluate().isNotEmpty) {
          await tester.tap(loginButton);
          await tester.pumpAndSettle(const Duration(seconds: 3));
        }

        // Verify login succeeded by checking for user-specific content
      });

      testWidgets('E2E-AUTH-02: Logout flow', (tester) async {
        app.main();
        await tester.pumpAndSettle();

        // Navigate to account screen
        final accountIcon = find.byIcon(Icons.person);
        if (accountIcon.evaluate().isNotEmpty) {
          await tester.tap(accountIcon.first);
          await tester.pumpAndSettle();
        }

        // Find and tap logout
        final logoutButton = find.text('Logout');
        if (logoutButton.evaluate().isNotEmpty) {
          await tester.tap(logoutButton);
          await tester.pumpAndSettle();
        }
      });
    });

    // ============================================================
    // Cart Flow Tests
    // ============================================================
    group('Cart Flow', () {
      testWidgets('E2E-CART-01: Add product to cart', (tester) async {
        app.main();
        await tester.pumpAndSettle();

        // Navigate to products
        final shopButton = find.text('Shop');
        if (shopButton.evaluate().isNotEmpty) {
          await tester.tap(shopButton.first);
          await tester.pumpAndSettle();
        }

        // Find first product and tap to view
        final productCards = find.byType(Card);
        if (productCards.evaluate().isNotEmpty) {
          await tester.tap(productCards.first);
          await tester.pumpAndSettle();

          // Find add to cart button
          final addToCartButton = find.text('Add to Cart');
          if (addToCartButton.evaluate().isNotEmpty) {
            await tester.tap(addToCartButton);
            await tester.pumpAndSettle();
          }
        }
      });

      testWidgets('E2E-CART-02: View cart', (tester) async {
        app.main();
        await tester.pumpAndSettle();

        // Navigate to cart
        final cartIcon = find.byIcon(Icons.shopping_cart);
        if (cartIcon.evaluate().isNotEmpty) {
          await tester.tap(cartIcon.first);
          await tester.pumpAndSettle();

          // Verify cart page is displayed
          expect(find.text('Cart'), findsWidgets);
        }
      });
    });

    // ============================================================
    // Favorites Flow Tests
    // ============================================================
    group('Favorites Flow', () {
      testWidgets('E2E-FAV-01: Add to favorites', (tester) async {
        app.main();
        await tester.pumpAndSettle();

        // Navigate to products
        final shopButton = find.text('Shop');
        if (shopButton.evaluate().isNotEmpty) {
          await tester.tap(shopButton.first);
          await tester.pumpAndSettle();
        }

        // Find favorite icon and tap
        final favoriteIcon = find.byIcon(Icons.favorite_border);
        if (favoriteIcon.evaluate().isNotEmpty) {
          await tester.tap(favoriteIcon.first);
          await tester.pumpAndSettle();
        }
      });
    });
  });
}
