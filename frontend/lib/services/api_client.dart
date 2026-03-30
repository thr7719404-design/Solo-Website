import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;
import 'package:logger/logger.dart';
import 'dart:convert';
import 'web_storage.dart' if (dart.library.io) 'web_storage_stub.dart';

/// Production-grade API client with automatic token refresh
class ApiClient {
  final String baseUrl;
  final FlutterSecureStorage _storage;
  final Logger _logger;
  bool _isRefreshing = false;
  final List<Function> _refreshQueue = [];

  // Storage keys
  static const String _accessTokenKey = 'access_token';
  static const String _refreshTokenKey = 'refresh_token';

  ApiClient({
    required this.baseUrl,
    FlutterSecureStorage? storage,
    Logger? logger,
  })  : _storage = storage ?? const FlutterSecureStorage(),
        _logger = logger ??
            Logger(
              printer: PrettyPrinter(
                methodCount: 0,
                errorMethodCount: 5,
                lineLength: 120,
                colors: true,
                printEmojis: true,
                printTime: false,
              ),
              level: Level.info, // Changed to info to see logs in release
            );

  // ============================================================================
  // TOKEN MANAGEMENT
  // ============================================================================

  /// Get access token from secure storage
  Future<String?> getAccessToken() async {
    if (kIsWeb) {
      return WebStorage.getAccessToken();
    }
    final token = await _storage.read(key: _accessTokenKey);
    _log(
        'Getting access token: ${token != null ? "Found (${token.substring(0, 20)}...)" : "Not found"}',
        level: Level.debug);
    return token;
  }

  /// Get refresh token from secure storage
  Future<String?> getRefreshToken() async {
    if (kIsWeb) {
      return WebStorage.getRefreshToken();
    }
    return await _storage.read(key: _refreshTokenKey);
  }

  /// Save tokens to secure storage
  Future<void> saveTokens(String accessToken, String refreshToken) async {
    if (kIsWeb) {
      WebStorage.saveTokens(accessToken, refreshToken);
      return;
    }
    _log('Saving tokens...', level: Level.info);
    await _storage.write(key: _accessTokenKey, value: accessToken);
    await _storage.write(key: _refreshTokenKey, value: refreshToken);
    // Verify tokens were saved
    final savedToken = await _storage.read(key: _accessTokenKey);
    _log('Tokens saved successfully. Verified: ${savedToken != null}',
        level: Level.info);
  }

  /// Clear all tokens
  Future<void> clearTokens() async {
    if (kIsWeb) {
      WebStorage.clearTokens();
      return;
    }
    await _storage.delete(key: _accessTokenKey);
    await _storage.delete(key: _refreshTokenKey);
    _log('Tokens cleared', level: Level.debug);
  }

  // ============================================================================
  // HTTP METHODS
  // ============================================================================

  /// GET request
  Future<ApiResponse> get(
    String endpoint, {
    Map<String, String>? headers,
    Map<String, dynamic>? queryParams,
    bool requiresAuth = false,
  }) async {
    final uri = _buildUri(endpoint, queryParams);
    final requestHeaders = await _buildHeaders(headers, requiresAuth);

    _logRequest('GET', uri, headers: requestHeaders);

    try {
      final response = await http.get(uri, headers: requestHeaders);
      return await _handleResponse(
        response,
        () => get(
          endpoint,
          headers: headers,
          queryParams: queryParams,
          requiresAuth: requiresAuth,
        ),
        requiresAuth: requiresAuth,
      );
    } catch (e, stackTrace) {
      _logError('GET $endpoint failed', e, stackTrace);
      rethrow;
    }
  }

  /// POST request
  Future<ApiResponse> post(
    String endpoint, {
    Map<String, String>? headers,
    Map<String, dynamic>? body,
    bool requiresAuth = false,
  }) async {
    final uri = _buildUri(endpoint);
    final requestHeaders = await _buildHeaders(headers, requiresAuth);
    final jsonBody = body != null ? json.encode(body) : null;

    _logRequest('POST', uri, headers: requestHeaders, body: body);

    try {
      final response = await http.post(
        uri,
        headers: requestHeaders,
        body: jsonBody,
      );
      return await _handleResponse(
        response,
        () => post(
          endpoint,
          headers: headers,
          body: body,
          requiresAuth: requiresAuth,
        ),
        requiresAuth: requiresAuth,
      );
    } catch (e, stackTrace) {
      _logError('POST $endpoint failed', e, stackTrace);
      rethrow;
    }
  }

  /// PATCH request
  Future<ApiResponse> patch(
    String endpoint, {
    Map<String, String>? headers,
    Map<String, dynamic>? body,
    bool requiresAuth = false,
  }) async {
    final uri = _buildUri(endpoint);
    final requestHeaders = await _buildHeaders(headers, requiresAuth);
    final jsonBody = body != null ? json.encode(body) : null;

    _logRequest('PATCH', uri, headers: requestHeaders, body: body);

    try {
      final response = await http.patch(
        uri,
        headers: requestHeaders,
        body: jsonBody,
      );
      return await _handleResponse(
        response,
        () => patch(
          endpoint,
          headers: headers,
          body: body,
          requiresAuth: requiresAuth,
        ),
        requiresAuth: requiresAuth,
      );
    } catch (e, stackTrace) {
      _logError('PATCH $endpoint failed', e, stackTrace);
      rethrow;
    }
  }

  /// PUT request
  Future<ApiResponse> put(
    String endpoint, {
    Map<String, String>? headers,
    Map<String, dynamic>? body,
    bool requiresAuth = false,
  }) async {
    final uri = _buildUri(endpoint);
    final requestHeaders = await _buildHeaders(headers, requiresAuth);
    final jsonBody = body != null ? json.encode(body) : null;

    _logRequest('PUT', uri, headers: requestHeaders, body: body);

    try {
      final response = await http.put(
        uri,
        headers: requestHeaders,
        body: jsonBody,
      );
      return await _handleResponse(
        response,
        () => put(
          endpoint,
          headers: headers,
          body: body,
          requiresAuth: requiresAuth,
        ),
        requiresAuth: requiresAuth,
      );
    } catch (e, stackTrace) {
      _logError('PUT $endpoint failed', e, stackTrace);
      rethrow;
    }
  }

  /// DELETE request
  Future<ApiResponse> delete(
    String endpoint, {
    Map<String, String>? headers,
    Map<String, dynamic>? queryParams,
    bool requiresAuth = false,
  }) async {
    final uri = _buildUri(endpoint, queryParams);
    final requestHeaders = await _buildHeaders(headers, requiresAuth);

    _logRequest('DELETE', uri, headers: requestHeaders);

    try {
      final response = await http.delete(uri, headers: requestHeaders);
      return await _handleResponse(
        response,
        () => delete(
          endpoint,
          headers: headers,
          queryParams: queryParams,
          requiresAuth: requiresAuth,
        ),
        requiresAuth: requiresAuth,
      );
    } catch (e, stackTrace) {
      _logError('DELETE $endpoint failed', e, stackTrace);
      rethrow;
    }
  }

  /// Upload file (multipart request)
  Future<ApiResponse> uploadFile(
    String endpoint, {
    required Uint8List bytes,
    required String fileName,
    String? folder,
    Map<String, String>? headers,
    bool requiresAuth = true,
  }) async {
    final uri = _buildUri(endpoint);
    final requestHeaders = await _buildHeaders(headers, requiresAuth);

    // Remove content-type header, multipart request sets its own
    requestHeaders.remove('Content-Type');

    _logRequest('UPLOAD', uri, headers: requestHeaders);

    try {
      final request = http.MultipartRequest('POST', uri);
      request.headers.addAll(requestHeaders);

      request.files.add(http.MultipartFile.fromBytes(
        'file',
        bytes,
        filename: fileName,
      ));

      if (folder != null) {
        request.fields['folder'] = folder;
      }

      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      return await _handleResponse(
        response,
        () => uploadFile(
          endpoint,
          bytes: bytes,
          fileName: fileName,
          folder: folder,
          headers: headers,
          requiresAuth: requiresAuth,
        ),
        requiresAuth: requiresAuth,
      );
    } catch (e, stackTrace) {
      _logError('UPLOAD $endpoint failed', e, stackTrace);
      rethrow;
    }
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  /// Build URI with base URL and query parameters
  Uri _buildUri(String endpoint, [Map<String, dynamic>? queryParams]) {
    final url = endpoint.startsWith('http') ? endpoint : '$baseUrl$endpoint';
    final uri = Uri.parse(url);

    if (queryParams != null && queryParams.isNotEmpty) {
      return uri.replace(
          queryParameters: queryParams.map(
        (key, value) => MapEntry(key, value.toString()),
      ));
    }

    return uri;
  }

  /// Build request headers with authentication
  Future<Map<String, String>> _buildHeaders(
    Map<String, String>? customHeaders,
    bool requiresAuth,
  ) async {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...?customHeaders,
    };

    if (requiresAuth) {
      final token = await getAccessToken();
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
        _log('Added Authorization header to request', level: Level.info);
      } else {
        _log('WARNING: Request requires auth but no token found!',
            level: Level.warning);
      }
    }

    return headers;
  }

  /// Handle HTTP response with auto-refresh on 401
  Future<ApiResponse> _handleResponse(
    http.Response response,
    Future<ApiResponse> Function() retryRequest, {
    bool requiresAuth = false,
  }) async {
    _logResponse(response);

    // Success responses (200-299)
    if (response.statusCode >= 200 && response.statusCode < 300) {
      final data = response.body.isNotEmpty ? json.decode(response.body) : null;
      return ApiResponse(
        statusCode: response.statusCode,
        data: data,
        success: true,
      );
    }

    // Unauthorized - attempt token refresh ONLY if this was an authenticated request
    if (response.statusCode == 401 && requiresAuth) {
      return await _handleUnauthorized(retryRequest);
    }

    // Other error responses (including 401 for login/register failures)
    final errorData = response.body.isNotEmpty
        ? json.decode(response.body)
        : {'message': 'Unknown error'};

    return ApiResponse(
      statusCode: response.statusCode,
      data: errorData,
      success: false,
      errorMessage: errorData['message']?.toString() ?? 'Request failed',
    );
  }

  /// Handle 401 by refreshing token and retrying
  Future<ApiResponse> _handleUnauthorized(
    Future<ApiResponse> Function() retryRequest,
  ) async {
    // If already refreshing, queue this request
    if (_isRefreshing) {
      _log('Queueing request - token refresh in progress', level: Level.debug);
      return await Future.delayed(
        const Duration(milliseconds: 100),
        () => _handleUnauthorized(retryRequest),
      );
    }

    _isRefreshing = true;

    try {
      final refreshToken = await getRefreshToken();
      if (refreshToken == null) {
        _log('No refresh token available - clearing auth',
            level: Level.warning);
        await clearTokens();
        return ApiResponse(
          statusCode: 401,
          success: false,
          errorMessage: 'Authentication required',
        );
      }

      _log('Attempting token refresh...', level: Level.debug);

      // Call refresh endpoint
      final response = await http.post(
        Uri.parse('$baseUrl/auth/refresh'),
        headers: {'Content-Type': 'application/json'},
        body: json.encode({'refreshToken': refreshToken}),
      );

      if (response.statusCode == 200) {
        final data = json.decode(response.body);
        final newAccessToken = data['accessToken'] as String;
        final newRefreshToken = data['refreshToken'] as String;

        await saveTokens(newAccessToken, newRefreshToken);
        _log('Token refresh successful', level: Level.info);

        // Retry original request with new token
        return await retryRequest();
      } else {
        _log('Token refresh failed - clearing auth', level: Level.warning);
        await clearTokens();
        return ApiResponse(
          statusCode: 401,
          success: false,
          errorMessage: 'Session expired - please login again',
        );
      }
    } catch (e, stackTrace) {
      _logError('Token refresh error', e, stackTrace);
      await clearTokens();
      return ApiResponse(
        statusCode: 401,
        success: false,
        errorMessage: 'Authentication failed',
      );
    } finally {
      _isRefreshing = false;
    }
  }

  // ============================================================================
  // LOGGING
  // ============================================================================

  void _logRequest(
    String method,
    Uri uri, {
    Map<String, String>? headers,
    Map<String, dynamic>? body,
  }) {
    if (!kDebugMode) return;

    _logger.d('''
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
➤ REQUEST: $method ${uri.toString()}
Headers: ${headers ?? 'None'}
${body != null ? 'Body: ${json.encode(body)}' : ''}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
''');
  }

  void _logResponse(http.Response response) {
    final statusEmoji = response.statusCode < 300 ? '✓' : '✗';
    final bodyPreview = response.body.length > 500
        ? '${response.body.substring(0, 500)}...'
        : response.body;

    // Always log non-2xx responses for debugging
    if (response.statusCode >= 300) {
      _logger.w('''
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
➤ ERROR RESPONSE $statusEmoji ${response.statusCode}
URL: ${response.request?.url}
Body: $bodyPreview
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
''');
      return;
    }

    if (!kDebugMode) return;

    _logger.d('''
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
➤ RESPONSE $statusEmoji ${response.statusCode}
Body: $bodyPreview
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
''');
  }

  void _log(String message, {Level level = Level.info}) {
    if (!kDebugMode) return;
    _logger.log(level, message);
  }

  void _logError(String message, Object error, StackTrace stackTrace) {
    if (!kDebugMode) return;
    _logger.e(message, error: error, stackTrace: stackTrace);
  }
}

/// API Response wrapper
class ApiResponse {
  final int statusCode;
  final dynamic data;
  final bool success;
  final String? errorMessage;

  ApiResponse({
    required this.statusCode,
    this.data,
    required this.success,
    this.errorMessage,
  });

  /// Check if response is successful
  bool get isSuccess => success && statusCode >= 200 && statusCode < 300;

  /// Get data or throw error
  T getDataOrThrow<T>() {
    if (!isSuccess) {
      throw ApiException(
        message: errorMessage ?? 'Request failed',
        statusCode: statusCode,
        data: data,
      );
    }
    return data as T;
  }
}

/// API Exception
class ApiException implements Exception {
  final String message;
  final int statusCode;
  final dynamic data;

  ApiException({
    required this.message,
    required this.statusCode,
    this.data,
  });

  @override
  String toString() => 'ApiException($statusCode): $message';
}
