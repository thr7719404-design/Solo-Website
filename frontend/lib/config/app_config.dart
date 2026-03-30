import 'package:flutter/foundation.dart';

/// Environment configuration
class AppConfig {
  /// API base URL (includes /api prefix)
  static String get apiBaseUrl {
    // For development, use localhost with /api prefix
    // For production, set via environment variable or change here
    const envBaseUrl = String.fromEnvironment('API_BASE_URL', defaultValue: '');
    if (envBaseUrl.isNotEmpty) {
      return envBaseUrl;
    }
    return 'http://localhost:3000/api';
  }

  /// Enable API logging
  static bool get enableApiLogging => kDebugMode;

  /// API timeout duration
  static Duration get apiTimeout => const Duration(seconds: 30);
}
