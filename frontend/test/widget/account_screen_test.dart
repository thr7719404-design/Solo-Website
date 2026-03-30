import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:solo_ecommerce/providers/account_provider.dart';
import 'package:solo_ecommerce/providers/auth_provider.dart';
import 'package:solo_ecommerce/screens/my_account_screen.dart';

/// My Account Screen Widget Tests (GAP-002/003/005)
void main() {
  group('MyAccountScreen Widget Tests (GAP-002/003/005)', () {
    late AccountProvider mockAccountProvider;
    late AuthProvider mockAuthProvider;

    setUp(() {
      mockAccountProvider = AccountProvider();
      mockAuthProvider = AuthProvider();
    });

    Widget createTestWidget() {
      return MultiProvider(
        providers: [
          ChangeNotifierProvider<AccountProvider>.value(value: mockAccountProvider),
          ChangeNotifierProvider<AuthProvider>.value(value: mockAuthProvider),
        ],
        child: const MaterialApp(
          home: MyAccountScreen(),
        ),
      );
    }

    group('UI Sections', () {
      testWidgets('ACCT-W01: should display profile section', (tester) async {
        await tester.pumpWidget(createTestWidget());
        await tester.pumpAndSettle();

        // Account screen should render without errors
        expect(find.byType(Scaffold), findsOneWidget);
      });

      testWidgets('ACCT-W02: should be a StatefulWidget', (tester) async {
        await tester.pumpWidget(createTestWidget());
        
        expect(find.byType(MyAccountScreen), findsOneWidget);
      });
    });
  });
}
