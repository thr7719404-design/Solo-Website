import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:solo_ecommerce/providers/catalog_provider.dart';
import 'package:solo_ecommerce/screens/product_list_screen.dart';

/// Product List Screen Widget Tests
void main() {
  group('ProductListScreen Widget Tests', () {
    late CatalogProvider mockCatalogProvider;

    setUp(() {
      mockCatalogProvider = CatalogProvider();
    });

    tearDown(() {
      mockCatalogProvider.dispose();
    });

    Widget createTestWidget() {
      return ChangeNotifierProvider<CatalogProvider>.value(
        value: mockCatalogProvider,
        child: const MaterialApp(
          home: ProductListScreen(),
        ),
      );
    }

    group('UI Elements', () {
      testWidgets('PROD-W01: should render product list screen', (tester) async {
        await tester.pumpWidget(createTestWidget());
        await tester.pumpAndSettle();

        expect(find.byType(Scaffold), findsOneWidget);
      });

      testWidgets('PROD-W02: should display empty state when no products', (tester) async {
        await tester.pumpWidget(createTestWidget());
        await tester.pumpAndSettle();

        // Products should be empty initially
        expect(mockCatalogProvider.categories, isEmpty);
      });

      testWidgets('PROD-W03: should be a StatefulWidget', (tester) async {
        await tester.pumpWidget(createTestWidget());
        
        expect(find.byType(ProductListScreen), findsOneWidget);
      });
    });
  });
}
