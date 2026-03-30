/// Media Upload API client
/// Handles admin media upload operations
library;

import 'dart:typed_data';
import '../../core/dto/dto.dart';
import '../api_client.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

/// Supported media folders
class MediaFolder {
  static const String products = 'products';
  static const String banners = 'banners';
  static const String categories = 'categories';
  static const String brands = 'brands';
  static const String general = 'general';

  static const List<String> all = [
    products,
    banners,
    categories,
    brands,
    general,
  ];
}

class MediaApi {
  final ApiClient _client;

  MediaApi(this._client);

  /// Upload a media file (Admin only)
  /// Returns the uploaded media info including URL
  Future<MediaUploadDto> uploadFile({
    required Uint8List fileBytes,
    required String filename,
    required String folder,
    String? mimeType,
    void Function(double progress)? onProgress,
  }) async {
    final token = await _client.getAccessToken();
    if (token == null) {
      throw ApiException(
        message: 'Authentication required',
        statusCode: 401,
      );
    }

    // Determine mime type from filename if not provided
    final effectiveMimeType = mimeType ?? _getMimeType(filename);

    // Create multipart request
    final uri = Uri.parse('${_client.baseUrl}/api/media/upload');
    final request = http.MultipartRequest('POST', uri);

    // Add authorization header
    request.headers['Authorization'] = 'Bearer $token';

    // Add file
    request.files.add(http.MultipartFile.fromBytes(
      'file',
      fileBytes,
      filename: filename,
    ));

    // Add folder field
    request.fields['folder'] = folder;

    try {
      // Send request
      final streamedResponse = await request.send();

      // Read response
      final response = await http.Response.fromStream(streamedResponse);

      if (response.statusCode >= 200 && response.statusCode < 300) {
        final data = json.decode(response.body);
        return MediaUploadDto.fromJson(data);
      } else {
        final errorData = response.body.isNotEmpty
            ? json.decode(response.body)
            : {'message': 'Upload failed'};
        throw ApiException(
          message: errorData['message']?.toString() ?? 'Upload failed',
          statusCode: response.statusCode,
          data: errorData,
        );
      }
    } catch (e) {
      if (e is ApiException) rethrow;
      throw ApiException(
        message: 'Upload failed: $e',
        statusCode: 500,
      );
    }
  }

  /// Delete a media file (Admin only)
  Future<void> deleteFile(String url) async {
    await _client.delete(
      '/api/media',
      requiresAuth: true,
    );
  }

  /// Get list of media files in a folder (Admin only)
  Future<List<String>> listFiles(String folder) async {
    final response = await _client.get(
      '/api/media',
      queryParams: {'folder': folder},
      requiresAuth: true,
    );

    final data = response.getDataOrThrow();
    final list = data is List ? data : (data['files'] as List<dynamic>? ?? []);
    return list.map((e) => e.toString()).toList();
  }

  /// Get mime type from filename
  String _getMimeType(String filename) {
    final ext = filename.split('.').last.toLowerCase();
    switch (ext) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'gif':
        return 'image/gif';
      case 'webp':
        return 'image/webp';
      case 'svg':
        return 'image/svg+xml';
      default:
        return 'application/octet-stream';
    }
  }
}
