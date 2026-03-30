import 'dart:html' as html;

/// Simple web storage wrapper for tokens
class WebStorage {
  static const String _accessTokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';

  /// Get access token from localStorage
  static String? getAccessToken() {
    final token = html.window.localStorage[_accessTokenKey];
    return token;
  }

  /// Get refresh token from localStorage
  static String? getRefreshToken() {
    return html.window.localStorage[_refreshTokenKey];
  }

  /// Save tokens to localStorage
  static void saveTokens(String accessToken, String refreshToken) {
    html.window.localStorage[_accessTokenKey] = accessToken;
    html.window.localStorage[_refreshTokenKey] = refreshToken;
  }

  /// Clear all tokens
  static void clearTokens() {
    html.window.localStorage.remove(_accessTokenKey);
    html.window.localStorage.remove(_refreshTokenKey);
  }

  // ============================================================================
  // GENERAL KEY-VALUE STORAGE
  // ============================================================================

  /// Get a value from localStorage
  static String? getValue(String key) {
    return html.window.localStorage[key];
  }

  /// Set a value in localStorage
  static void setValue(String key, String value) {
    html.window.localStorage[key] = value;
  }

  /// Remove a value from localStorage
  static void removeValue(String key) {
    html.window.localStorage.remove(key);
  }
}
