/// Stub for non-web platforms
class WebStorage {
  static String? getAccessToken() => null;
  static String? getRefreshToken() => null;
  static void saveTokens(String accessToken, String refreshToken) {}
  static void clearTokens() {}

  // General key-value storage stubs
  static String? getValue(String key) => null;
  static void setValue(String key, String value) {}
  static void removeValue(String key) {}
}
