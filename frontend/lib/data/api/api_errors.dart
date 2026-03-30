import 'dart:convert';
import 'package:http/http.dart' as http;

class ApiException implements Exception {
  final String message;
  final int? statusCode;
  final dynamic data;

  ApiException({
    required this.message,
    this.statusCode,
    this.data,
  });

  factory ApiException.fromResponse(http.Response response) {
    String message = _getDefaultMessage(response.statusCode);
    dynamic data;

    try {
      data = json.decode(response.body);
      if (data is Map) {
        message = data['message'] ?? data['error'] ?? message;
      }
    } catch (_) {
      if (response.body.isNotEmpty) {
        message = response.body;
      }
    }

    return ApiException(
      message: message,
      statusCode: response.statusCode,
      data: data,
    );
  }

  factory ApiException.fromException(dynamic exception) {
    return ApiException(
      message: _getErrorMessage(exception),
    );
  }

  static String _getDefaultMessage(int statusCode) {
    switch (statusCode) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Please log in to continue.';
      case 403:
        return 'You don\'t have permission to perform this action.';
      case 404:
        return 'The requested resource was not found.';
      case 408:
        return 'Request timed out. Please try again.';
      case 422:
        return 'Validation failed. Please check your input.';
      case 429:
        return 'Too many requests. Please wait a moment.';
      case 500:
        return 'Server error. Please try again later.';
      case 502:
      case 503:
      case 504:
        return 'Service temporarily unavailable. Please try again.';
      default:
        return 'An error occurred. Please try again.';
    }
  }

  static String _getErrorMessage(dynamic exception) {
    if (exception is http.ClientException) {
      return 'Network error. Please check your connection.';
    }
    if (exception is FormatException) {
      return 'Invalid data received from server.';
    }
    return 'An unexpected error occurred.';
  }

  /// User-friendly message for display
  String get displayMessage => message;

  @override
  String toString() {
    return 'ApiException: $message (statusCode: $statusCode)';
  }
}

class NetworkException extends ApiException {
  NetworkException({required super.message});
}

class UnauthorizedException extends ApiException {
  UnauthorizedException({super.message = 'Unauthorized'})
      : super(statusCode: 401);
}

class NotFoundException extends ApiException {
  NotFoundException({super.message = 'Resource not found'})
      : super(statusCode: 404);
}

class ValidationException extends ApiException {
  ValidationException({required super.message, super.data})
      : super(statusCode: 422);
}
