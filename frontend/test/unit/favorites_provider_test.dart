import 'package:flutter_test/flutter_test.dart';
import 'package:solo_ecommerce/providers/favorites_provider.dart';
import 'package:solo_ecommerce/models/product.dart';

/// Favorites Provider Unit Tests (GAP-006)
/// Tests favorites state management
void main() {
  group('FavoritesProvider Unit Tests (GAP-006)', () {
    late FavoritesProvider favoritesProvider;

    setUp(() {
      favoritesProvider = FavoritesProvider();
    });

    group('Initial State', () {
      test('FAV-P01: should have empty favorites list initially', () {
        expect(favoritesProvider.favorites, isEmpty);
      });

      test('FAV-P02: should have isLoading = false initially', () {
        expect(favoritesProvider.isLoading, isFalse);
      });

      test('FAV-P03: should have error = null initially', () {
        expect(favoritesProvider.error, isNull);
      });

      test('FAV-P04: should have count = 0 initially', () {
        expect(favoritesProvider.count, equals(0));
      });

      test('FAV-P05: should have isInitialized = false initially', () {
        expect(favoritesProvider.isInitialized, isFalse);
      });

      test('FAV-P06: should have empty favoriteIds set initially', () {
        expect(favoritesProvider.favoriteIds, isEmpty);
      });
    });

    group('Favorite Check', () {
      test('FAV-P07: isFavoriteById should return false for non-favorited product', () {
        expect(favoritesProvider.isFavoriteById('product-123'), isFalse);
        expect(favoritesProvider.isFavoriteById('any-id'), isFalse);
      });

      test('FAV-P08: isFavorite should return false for any product when empty', () {
        final product = Product(
          id: 'test-123',
          name: 'Test Product',
          description: 'Test',
          price: 10.0,
          imageUrl: 'test.jpg',
          category: 'Test',
          brand: 'Test',
        );
        expect(favoritesProvider.isFavorite(product), isFalse);
      });
    });

    group('State Changes', () {
      test('FAV-P09: should notify listeners on state change', () {
        int notifyCount = 0;
        favoritesProvider.addListener(() => notifyCount++);

        favoritesProvider.notifyListeners();

        expect(notifyCount, equals(1));
      });
    });
  });
}
