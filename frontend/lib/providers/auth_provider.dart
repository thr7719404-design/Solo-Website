import 'package:flutter/foundation.dart';
import '../services/api_service.dart';
import '../models/dto/auth_dto.dart';

/// Authentication state provider
class AuthProvider extends ChangeNotifier {
  bool _isAuthenticated = false;
  UserDto? _user;
  bool _isLoading = false;
  String? _error;

  bool get isAuthenticated => _isAuthenticated;
  UserDto? get user => _user;
  bool get isLoading => _isLoading;
  String? get error => _error;

  /// Initialize auth state by checking for existing tokens
  Future<void> init() async {
    _isLoading = true;
    notifyListeners();

    try {
      final token = await ApiService.client.getAccessToken();
      if (token != null) {
        // Try to get current user
        try {
          _user = await ApiService.auth.getCurrentUser();
          _isAuthenticated = true;
        } catch (e) {
          // Token is invalid, clear it
          await ApiService.client.clearTokens();
          _isAuthenticated = false;
          _user = null;
        }
      }
    } catch (e) {
      _error = e.toString();
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Login user
  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.auth.login(
        email: email,
        password: password,
      );
      _user = response.user;
      _isAuthenticated = true;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Register user
  Future<bool> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String? phone,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await ApiService.auth.register(
        email: email,
        password: password,
        firstName: firstName,
        lastName: lastName,
        phone: phone,
      );
      _user = response.user;
      _isAuthenticated = true;
      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _error = e.toString();
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Logout user
  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();

    try {
      await ApiService.auth.logout();
    } catch (e) {
      // Ignore logout errors
    } finally {
      _isAuthenticated = false;
      _user = null;
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Refresh user data
  Future<void> refreshUser() async {
    if (!_isAuthenticated) return;

    try {
      _user = await ApiService.auth.getCurrentUser();
      notifyListeners();
    } catch (e) {
      _error = e.toString();
    }
  }

  /// Clear error
  void clearError() {
    _error = null;
    notifyListeners();
  }
}
