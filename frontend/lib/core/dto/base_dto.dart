/// Base class and utilities for all DTOs
/// Provides null-safe parsing helpers and common patterns
library;

/// Safely parse a value to String with default
String parseString(dynamic value, [String defaultValue = '']) {
  if (value == null) return defaultValue;
  return value.toString();
}

/// Safely parse a value to int with default
int parseInt(dynamic value, [int defaultValue = 0]) {
  if (value == null) return defaultValue;
  if (value is int) return value;
  if (value is double) return value.toInt();
  if (value is String) return int.tryParse(value) ?? defaultValue;
  return defaultValue;
}

/// Safely parse a value to double with default
double parseDouble(dynamic value, [double defaultValue = 0.0]) {
  if (value == null) return defaultValue;
  if (value is double) return value;
  if (value is int) return value.toDouble();
  if (value is num) return value.toDouble();
  if (value is String) return double.tryParse(value) ?? defaultValue;
  return defaultValue;
}

/// Safely parse a value to bool with default
bool parseBool(dynamic value, [bool defaultValue = false]) {
  if (value == null) return defaultValue;
  if (value is bool) return value;
  if (value is String) {
    return value.toLowerCase() == 'true' || value == '1';
  }
  if (value is int) return value != 0;
  return defaultValue;
}

/// Safely parse a value to DateTime with optional default
DateTime? parseDateTime(dynamic value, [DateTime? defaultValue]) {
  if (value == null) return defaultValue;
  if (value is DateTime) return value;
  if (value is String) {
    try {
      return DateTime.parse(value);
    } catch (_) {
      return defaultValue;
    }
  }
  return defaultValue;
}

/// Parse DateTime with fallback to current time
DateTime parseDateTimeRequired(dynamic value) {
  return parseDateTime(value) ?? DateTime.now();
}

/// Safely parse a list with item mapper
List<T> parseList<T>(
  dynamic value,
  T Function(dynamic item) mapper, [
  List<T>? defaultValue,
]) {
  if (value == null) return defaultValue ?? <T>[];
  if (value is! List) return defaultValue ?? <T>[];
  return value.map((e) => mapper(e)).toList();
}

/// Safely parse a map
Map<String, dynamic> parseMap(dynamic value,
    [Map<String, dynamic>? defaultValue]) {
  if (value == null) return defaultValue ?? {};
  if (value is Map<String, dynamic>) return value;
  if (value is Map) {
    return value.map((k, v) => MapEntry(k.toString(), v));
  }
  return defaultValue ?? {};
}

/// Extension for null-safe JSON access
extension SafeJsonAccess on Map<String, dynamic> {
  String getString(String key, [String defaultValue = '']) {
    return parseString(this[key], defaultValue);
  }

  int getInt(String key, [int defaultValue = 0]) {
    return parseInt(this[key], defaultValue);
  }

  double getDouble(String key, [double defaultValue = 0.0]) {
    return parseDouble(this[key], defaultValue);
  }

  bool getBool(String key, [bool defaultValue = false]) {
    return parseBool(this[key], defaultValue);
  }

  DateTime? getDateTime(String key, [DateTime? defaultValue]) {
    return parseDateTime(this[key], defaultValue);
  }

  DateTime getDateTimeRequired(String key) {
    return parseDateTimeRequired(this[key]);
  }

  List<T> getList<T>(String key, T Function(dynamic) mapper,
      [List<T>? defaultValue]) {
    return parseList<T>(this[key], mapper, defaultValue);
  }

  Map<String, dynamic> getMap(String key,
      [Map<String, dynamic>? defaultValue]) {
    return parseMap(this[key], defaultValue);
  }
}
