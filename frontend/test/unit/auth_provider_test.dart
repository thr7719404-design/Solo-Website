import 'package:flutter_test/flutter_test.dart';
import 'package:solo_ecommerce/providers/auth_provider.dart';

/// Auth Provider Unit Tests
/// Tests authentication state management
void main() {
  group('AuthProvider Unit Tests', () {
    late AuthProvider authProvider;

    setUp(() {
      authProvider = AuthProvider();
    });

    group('Initial State', () {
      test('AUTH-P01: should have isAuthenticated = false initially', () {
        expect(authProvider.isAuthenticated, isFalse);
      });

      test('AUTH-P02: should have user = null initially', () {
        expect(authProvider.user, isNull);
      });

      test('AUTH-P03: should have isLoading = false initially', () {
        expect(authProvider.isLoading, isFalse);
      });

      test('AUTH-P04: should have error = null initially', () {
        expect(authProvider.error, isNull);
      });
    });

    group('State Changes', () {
      test('AUTH-P05: should notify listeners on state change', () {
        int notifyCount = 0;
        authProvider.addListener(() => notifyCount++);

        authProvider.notifyListeners();

        expect(notifyCount, equals(1));
      });
    });

    group('Role Checks', () {
      test('AUTH-P06: should not be authenticated when user is null', () {
        expect(authProvider.isAuthenticated, isFalse);
        expect(authProvider.user, isNull);
      });
    });
  });
}
