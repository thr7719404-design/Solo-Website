import 'package:flutter_test/flutter_test.dart';
import 'package:solo_ecommerce/providers/catalog_provider.dart';

/// Catalog Provider Unit Tests
/// Tests product catalog state management
void main() {
  group('CatalogProvider Unit Tests', () {
    late CatalogProvider catalogProvider;

    setUp(() {
      catalogProvider = CatalogProvider();
    });

    tearDown(() {
      catalogProvider.dispose();
    });

    group('Initial State', () {
      test('CAT-P01: should have empty categories list initially', () {
        expect(catalogProvider.categories, isEmpty);
      });

      test('CAT-P02: should have empty categoryTree list initially', () {
        expect(catalogProvider.categoryTree, isEmpty);
      });

      test('CAT-P03: should have empty brands list initially', () {
        expect(catalogProvider.brands, isEmpty);
      });

      test('CAT-P04: should have isLoading = false initially', () {
        expect(catalogProvider.isLoading, isFalse);
      });

      test('CAT-P05: should have errorMessage = null initially', () {
        expect(catalogProvider.errorMessage, isNull);
      });

      test('CAT-P06: should have hasCategories = false initially', () {
        expect(catalogProvider.hasCategories, isFalse);
      });

      test('CAT-P07: should have hasBrands = false initially', () {
        expect(catalogProvider.hasBrands, isFalse);
      });
    });

    group('State Changes', () {
      test('CAT-P08: should notify listeners on state change', () {
        int notifyCount = 0;
        catalogProvider.addListener(() => notifyCount++);

        catalogProvider.notifyListeners();

        expect(notifyCount, equals(1));
      });
    });
  });
}
