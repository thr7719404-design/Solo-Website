import '../api_client.dart';
import '../../models/dto/auth_dto.dart';

/// Authentication API service
class AuthApi {
  final ApiClient _client;

  AuthApi(this._client);

  /// Register new user
  Future<AuthResponseDto> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    String? phone,
  }) async {
    final response = await _client.post(
      '/auth/register',
      body: {
        'email': email,
        'password': password,
        'firstName': firstName,
        'lastName': lastName,
        if (phone != null) 'phone': phone,
      },
    );

    final data = response.getDataOrThrow();
    final authResponse = AuthResponseDto.fromJson(data);

    // Save tokens
    await _client.saveTokens(
      authResponse.tokens.accessToken,
      authResponse.tokens.refreshToken,
    );

    return authResponse;
  }

  /// Login user
  Future<AuthResponseDto> login({
    required String email,
    required String password,
  }) async {
    final response = await _client.post(
      '/auth/login',
      body: {
        'email': email,
        'password': password,
      },
    );

    final data = response.getDataOrThrow();
    final authResponse = AuthResponseDto.fromJson(data);

    // Save tokens
    await _client.saveTokens(
      authResponse.tokens.accessToken,
      authResponse.tokens.refreshToken,
    );

    return authResponse;
  }

  /// Logout user
  Future<void> logout() async {
    final refreshToken = await _client.getRefreshToken();

    if (refreshToken != null) {
      try {
        await _client.post(
          '/auth/logout',
          body: {'refreshToken': refreshToken},
          requiresAuth: true,
        );
      } catch (e) {
        // Ignore logout errors
      }
    }

    // Clear local tokens regardless
    await _client.clearTokens();
  }

  /// Get current user profile
  Future<UserDto> getCurrentUser() async {
    final response = await _client.get(
      '/auth/me',
      requiresAuth: true,
    );

    return UserDto.fromJson(response.getDataOrThrow());
  }

  /// Change password
  Future<void> changePassword({
    required String currentPassword,
    required String newPassword,
  }) async {
    await _client.post(
      '/auth/change-password',
      body: {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      },
      requiresAuth: true,
    );
  }

  /// Request password reset
  Future<Map<String, dynamic>> forgotPassword(String email) async {
    final response = await _client.post(
      '/auth/forgot-password',
      body: {'email': email},
    );
    return response.getDataOrThrow();
  }

  /// Reset password with token
  Future<void> resetPassword({
    required String token,
    required String newPassword,
  }) async {
    await _client.post(
      '/auth/reset-password',
      body: {
        'token': token,
        'newPassword': newPassword,
      },
    );
  }

  /// Verify email with token
  Future<Map<String, dynamic>> verifyEmail(String token) async {
    final response = await _client.post(
      '/auth/verify-email',
      body: {'token': token},
    );
    return response.getDataOrThrow();
  }

  /// Resend verification email
  Future<Map<String, dynamic>> resendVerificationEmail(String email) async {
    final response = await _client.post(
      '/auth/resend-verification',
      body: {'email': email},
    );
    return response.getDataOrThrow();
  }
}
