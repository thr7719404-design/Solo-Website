/// Auth API client
library;

import '../../core/dto/dto.dart';
import '../api_client.dart';

class AuthApi {
  final ApiClient _client;

  AuthApi(this._client);

  /// Login with email and password
  Future<AuthResponse> login(LoginRequest request) async {
    final response = await _client.post(
      '/api/auth/login',
      body: request.toJson(),
    );

    final authResponse = AuthResponse.fromJson(response.getDataOrThrow());

    // Save tokens
    await _client.saveTokens(
      authResponse.accessToken,
      authResponse.refreshToken,
    );

    return authResponse;
  }

  /// Register a new user
  Future<AuthResponse> register(RegisterRequest request) async {
    final response = await _client.post(
      '/api/auth/register',
      body: request.toJson(),
    );

    final authResponse = AuthResponse.fromJson(response.getDataOrThrow());

    // Save tokens
    await _client.saveTokens(
      authResponse.accessToken,
      authResponse.refreshToken,
    );

    return authResponse;
  }

  /// Logout (clear tokens)
  Future<void> logout() async {
    await _client.clearTokens();
  }

  /// Get current user profile
  Future<UserDto> getProfile() async {
    final response = await _client.get(
      '/api/account/profile',
      requiresAuth: true,
    );

    return UserDto.fromJson(response.getDataOrThrow());
  }

  /// Update user profile
  Future<UserDto> updateProfile(UpdateProfileRequest request) async {
    final response = await _client.patch(
      '/api/account/profile',
      body: request.toJson(),
      requiresAuth: true,
    );

    return UserDto.fromJson(response.getDataOrThrow());
  }

  /// Change password
  Future<void> changePassword(ChangePasswordRequest request) async {
    await _client.post(
      '/api/account/change-password',
      body: request.toJson(),
      requiresAuth: true,
    );
  }

  /// Check if user is authenticated
  Future<bool> isAuthenticated() async {
    final token = await _client.getAccessToken();
    return token != null;
  }

  /// Check if current user is admin
  Future<bool> isAdmin() async {
    try {
      final profile = await getProfile();
      return profile.isAdmin;
    } catch (_) {
      return false;
    }
  }
}
