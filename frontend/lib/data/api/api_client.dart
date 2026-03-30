import 'dart:convert';
import 'package:http/http.dart' as http;
import 'api_errors.dart';

class ApiClient {
  final String baseUrl;
  final http.Client _client;
  final String? Function()? _tokenProvider;

  ApiClient({
    this.baseUrl = 'http://localhost:3000/api',
    http.Client? client,
    String? Function()? tokenProvider,
  })  : _client = client ?? http.Client(),
        _tokenProvider = tokenProvider;

  Map<String, String> get _headers {
    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    // Get token dynamically from provider
    final token = _tokenProvider?.call();
    if (token != null && token.isNotEmpty) {
      headers['Authorization'] = 'Bearer $token';
    }
    
    return headers;
  }

  Future<T> get<T>(
    String endpoint, {
    Map<String, String>? queryParams,
    T Function(dynamic)? parser,
  }) async {
    try {
      final uri = _buildUri(endpoint, queryParams);
      final response = await _client.get(uri, headers: _headers);
      return _handleResponse<T>(response, parser);
    } catch (e) {
      throw ApiException.fromException(e);
    }
  }

  Future<T> post<T>(
    String endpoint, {
    Map<String, dynamic>? body,
    T Function(dynamic)? parser,
  }) async {
    try {
      final uri = _buildUri(endpoint);
      final response = await _client.post(
        uri,
        headers: _headers,
        body: body != null ? json.encode(body) : null,
      );
      return _handleResponse<T>(response, parser);
    } catch (e) {
      throw ApiException.fromException(e);
    }
  }

  Future<T> put<T>(
    String endpoint, {
    Map<String, dynamic>? body,
    T Function(dynamic)? parser,
  }) async {
    try {
      final uri = _buildUri(endpoint);
      final response = await _client.put(
        uri,
        headers: _headers,
        body: body != null ? json.encode(body) : null,
      );
      return _handleResponse<T>(response, parser);
    } catch (e) {
      throw ApiException.fromException(e);
    }
  }

  Future<T> patch<T>(
    String endpoint, {
    Map<String, dynamic>? body,
    T Function(dynamic)? parser,
  }) async {
    try {
      final uri = _buildUri(endpoint);
      final response = await _client.patch(
        uri,
        headers: _headers,
        body: body != null ? json.encode(body) : null,
      );
      return _handleResponse<T>(response, parser);
    } catch (e) {
      throw ApiException.fromException(e);
    }
  }

  Future<void> delete(String endpoint) async {
    try {
      final uri = _buildUri(endpoint);
      final response = await _client.delete(uri, headers: _headers);
      _handleResponse(response, null);
    } catch (e) {
      throw ApiException.fromException(e);
    }
  }

  Uri _buildUri(String endpoint, [Map<String, String>? queryParams]) {
    final path = endpoint.startsWith('/') ? endpoint : '/$endpoint';
    return Uri.parse('$baseUrl$path').replace(queryParameters: queryParams);
  }

  T _handleResponse<T>(http.Response response, T Function(dynamic)? parser) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (parser == null) {
        return response.body as T;
      }
      
      if (response.body.isEmpty) {
        return parser(null);
      }
      
      final data = json.decode(response.body);
      return parser(data);
    } else {
      throw ApiException.fromResponse(response);
    }
  }

  void dispose() {
    _client.close();
  }
}
