# Frontend Testing Documentation

## Overview

This document describes the testing infrastructure, conventions, and commands for the Solo e-commerce platform Flutter frontend.

## Test Stack

- **Framework**: flutter_test
- **Widget Testing**: flutter_test (built-in)
- **Integration Testing**: integration_test package
- **Mocking**: mockito
- **State Management**: Provider (tested via provider injection)

## Test Structure

```
frontend/
├── test/
│   ├── unit/                     # Provider unit tests
│   │   ├── auth_provider_test.dart
│   │   ├── cart_provider_test.dart
│   │   ├── favorites_provider_test.dart
│   │   ├── account_provider_test.dart
│   │   ├── catalog_provider_test.dart
│   │   └── content_provider_test.dart
│   ├── widget/                   # Screen widget tests
│   │   ├── login_screen_test.dart
│   │   ├── cart_screen_test.dart
│   │   ├── favorites_screen_test.dart
│   │   ├── account_screen_test.dart
│   │   ├── product_list_screen_test.dart
│   │   ├── checkout_screen_test.dart
│   │   └── admin_widgets_test.dart
│   ├── dto/                      # DTO parsing tests
│   │   └── dto_parsing_test.dart
│   ├── integration/              # Integration tests
│   │   └── api_sync_integration_test.dart
│   ├── e2e/                      # End-to-end flow tests
│   │   ├── auth_flow_e2e_test.dart
│   │   ├── cart_flow_e2e_test.dart
│   │   ├── order_flow_e2e_test.dart
│   │   ├── favorites_flow_e2e_test.dart
│   │   └── admin_sync_e2e_test.dart
│   └── widget_test.dart          # Main widget test
└── pubspec.yaml                  # Test dependencies
```

## Running Tests

### Unit Tests
```bash
# Run all unit tests
flutter test test/unit/

# Run specific unit test
flutter test test/unit/auth_provider_test.dart

# Run with coverage
flutter test --coverage test/unit/
```

### Widget Tests
```bash
# Run all widget tests
flutter test test/widget/

# Run specific widget test
flutter test test/widget/login_screen_test.dart
```

### Integration Tests
```bash
# Run integration tests
flutter test test/integration/
```

### E2E Tests (Integration Test Driver)
```bash
# Run E2E tests on device/emulator
flutter test integration_test/

# Run specific E2E test
flutter test integration_test/auth_flow_e2e_test.dart
```

### All Tests
```bash
# Run all tests with coverage
flutter test --coverage

# Generate coverage report
genhtml coverage/lcov.info -o coverage/html
```

## Test Coverage Targets

| Test Type   | Target  |
|-------------|---------|
| Unit Tests  | 80%     |
| Widget Tests| 70%     |
| E2E Tests   | 65%     |
| Overall     | 75%     |

## Test Patterns

### Provider Unit Test Template
```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:frontend/providers/my_provider.dart';

void main() {
  group('MyProvider Unit Tests', () {
    late MyProvider provider;

    setUp(() {
      provider = MyProvider();
    });

    test('should have correct initial state', () {
      expect(provider.items, isEmpty);
      expect(provider.isLoading, isFalse);
      expect(provider.error, isNull);
    });

    test('should notify listeners on state change', () {
      int notifyCount = 0;
      provider.addListener(() => notifyCount++);
      
      provider.notifyListeners();
      
      expect(notifyCount, equals(1));
    });
  });
}
```

### Widget Test Template
```dart
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:frontend/providers/my_provider.dart';
import 'package:frontend/screens/my_screen.dart';

void main() {
  group('MyScreen Widget Tests', () {
    late MyProvider mockProvider;

    setUp(() {
      mockProvider = MyProvider();
    });

    Widget createTestWidget() {
      return ChangeNotifierProvider<MyProvider>.value(
        value: mockProvider,
        child: const MaterialApp(
          home: MyScreen(),
        ),
      );
    }

    testWidgets('should display title', (tester) async {
      await tester.pumpWidget(createTestWidget());
      
      expect(find.text('My Screen'), findsOneWidget);
    });

    testWidgets('should show loading indicator', (tester) async {
      await tester.pumpWidget(createTestWidget());
      
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });
  });
}
```

### E2E Test Template
```dart
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:flutter/material.dart';
import 'package:frontend/main.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('My Feature E2E', () {
    testWidgets('should complete flow', (tester) async {
      app.main();
      await tester.pumpAndSettle();

      // Navigate
      await tester.tap(find.text('My Button'));
      await tester.pumpAndSettle();

      // Verify
      expect(find.text('Expected Result'), findsOneWidget);
    });
  });
}
```

## GAP Fix Test Coverage

| GAP ID | Feature | Test File |
|--------|---------|-----------|
| GAP-002 | Order with shipping address | order_flow_e2e_test.dart, checkout_screen_test.dart |
| GAP-003 | Order history | account_provider_test.dart, order_flow_e2e_test.dart |
| GAP-004 | Order PDF invoice | order_flow_e2e_test.dart |
| GAP-005 | Addresses CRUD | account_provider_test.dart, account_screen_test.dart |
| GAP-006 | Favorites | favorites_provider_test.dart, favorites_screen_test.dart, favorites_flow_e2e_test.dart |
| GAP-007 | About Us page | content_provider_test.dart |
| GAP-008 | Bulk Order page | content_provider_test.dart |
| GAP-009 | Loyalty config | content_provider_test.dart |

## Mocking Strategy

### Mock Providers
```dart
// Create mock provider
class MockAuthProvider extends ChangeNotifier implements AuthProvider {
  bool _isAuthenticated = false;
  
  @override
  bool get isAuthenticated => _isAuthenticated;
  
  void setAuthenticated(bool value) {
    _isAuthenticated = value;
    notifyListeners();
  }
}
```

### Mock API Service
```dart
import 'package:mockito/mockito.dart';
import 'package:mockito/annotations.dart';

@GenerateMocks([ApiService])
void main() {
  late MockApiService mockApiService;

  setUp(() {
    mockApiService = MockApiService();
    
    when(mockApiService.getProducts())
      .thenAnswer((_) async => []);
  });
}
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Provider Injection**: Always inject mock providers in widget tests
3. **Async Handling**: Use `pumpAndSettle()` for animations
4. **Finder Specificity**: Use specific finders (`find.byKey()`, `find.byType()`)
5. **Golden Tests**: Use for UI regression testing
6. **Accessibility**: Test with semantics enabled

## Common Patterns

### Testing Navigation
```dart
testWidgets('should navigate on tap', (tester) async {
  await tester.pumpWidget(createTestWidget());
  
  await tester.tap(find.text('Navigate'));
  await tester.pumpAndSettle();
  
  expect(find.byType(TargetScreen), findsOneWidget);
});
```

### Testing Form Validation
```dart
testWidgets('should show validation error', (tester) async {
  await tester.pumpWidget(createTestWidget());
  
  await tester.tap(find.text('Submit'));
  await tester.pumpAndSettle();
  
  expect(find.text('Field is required'), findsOneWidget);
});
```

### Testing Loading States
```dart
testWidgets('should show loading indicator', (tester) async {
  await tester.pumpWidget(createTestWidget());
  
  // Before data loads
  expect(find.byType(CircularProgressIndicator), findsOneWidget);
  
  await tester.pumpAndSettle();
  
  // After data loads
  expect(find.byType(CircularProgressIndicator), findsNothing);
});
```

## CI/CD Integration

```yaml
test:
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v3
    - uses: subosito/flutter-action@v2
    - run: flutter pub get
    - run: flutter test --coverage
    - run: flutter test integration_test/
```

## Debugging Tests

```bash
# Run with verbose output
flutter test --reporter expanded

# Run single test
flutter test --name "should display title"

# Run with debugger
flutter test --start-paused
```

## Test Dependencies

Add to `pubspec.yaml`:
```yaml
dev_dependencies:
  flutter_test:
    sdk: flutter
  integration_test:
    sdk: flutter
  mockito: ^5.4.0
  build_runner: ^2.4.0
```

Run code generation for mocks:
```bash
flutter pub run build_runner build
```
