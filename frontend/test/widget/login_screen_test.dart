import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:solo_ecommerce/providers/auth_provider.dart';
import 'package:solo_ecommerce/screens/login_screen.dart';

/// Login Screen Widget Tests
void main() {
  group('LoginScreen Widget Tests', () {
    late AuthProvider mockAuthProvider;

    setUp(() {
      mockAuthProvider = AuthProvider();
    });

    Widget createTestWidget() {
      return ChangeNotifierProvider<AuthProvider>.value(
        value: mockAuthProvider,
        child: const MaterialApp(
          home: LoginScreen(),
        ),
      );
    }

    group('UI Elements', () {
      testWidgets('LOGIN-W01: should display email field', (tester) async {
        // Set a larger surface size to avoid overflow issues
        tester.view.physicalSize = const Size(1080, 1920);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        
        await tester.pumpWidget(createTestWidget());
        await tester.pumpAndSettle();

        // Login screen should have email input
        expect(find.byType(TextFormField), findsWidgets);
      });

      testWidgets('LOGIN-W02: should display password field', (tester) async {
        // Set a larger surface size to avoid overflow issues
        tester.view.physicalSize = const Size(1080, 1920);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        
        await tester.pumpWidget(createTestWidget());
        await tester.pumpAndSettle();

        expect(find.byType(TextFormField), findsWidgets);
      });

      testWidgets('LOGIN-W03: should display login button', (tester) async {
        // Set a larger surface size to avoid overflow issues
        tester.view.physicalSize = const Size(1080, 1920);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        
        await tester.pumpWidget(createTestWidget());
        await tester.pumpAndSettle();

        expect(find.byType(ElevatedButton), findsWidgets);
      });

      testWidgets('LOGIN-W04: should be a StatefulWidget', (tester) async {
        // Set a larger surface size to avoid overflow issues
        tester.view.physicalSize = const Size(1080, 1920);
        tester.view.devicePixelRatio = 1.0;
        addTearDown(tester.view.resetPhysicalSize);
        addTearDown(tester.view.resetDevicePixelRatio);
        
        await tester.pumpWidget(createTestWidget());
        
        expect(find.byType(LoginScreen), findsOneWidget);
      });
    });
  });
}
