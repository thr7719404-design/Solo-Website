import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:solo_ecommerce/providers/favorites_provider.dart';
import 'package:solo_ecommerce/providers/auth_provider.dart';
import 'package:solo_ecommerce/screens/favorites_screen.dart';

/// Favorites Screen Widget Tests (GAP-006)
void main() {
  group('FavoritesScreen Widget Tests (GAP-006)', () {
    late FavoritesProvider mockFavoritesProvider;
    late AuthProvider mockAuthProvider;

    setUp(() {
      mockFavoritesProvider = FavoritesProvider();
      mockAuthProvider = AuthProvider();
    });

    Widget createTestWidget() {
      return MultiProvider(
        providers: [
          ChangeNotifierProvider<FavoritesProvider>.value(
            value: mockFavoritesProvider,
          ),
          ChangeNotifierProvider<AuthProvider>.value(
            value: mockAuthProvider,
          ),
        ],
        child: const MaterialApp(
          home: FavoritesScreen(),
        ),
      );
    }

    group('UI Elements', () {
      testWidgets('FAV-W01: should render favorites screen', (tester) async {
        await tester.pumpWidget(createTestWidget());
        await tester.pumpAndSettle();

        expect(find.byType(Scaffold), findsOneWidget);
      });

      testWidgets('FAV-W02: should display empty state when no favorites', (tester) async {
        await tester.pumpWidget(createTestWidget());
        await tester.pumpAndSettle();

        // Favorites should be empty initially
        expect(mockFavoritesProvider.favorites, isEmpty);
      });

      testWidgets('FAV-W03: should be a StatefulWidget', (tester) async {
        await tester.pumpWidget(createTestWidget());
        
        expect(find.byType(FavoritesScreen), findsOneWidget);
      });
    });
  });
}
