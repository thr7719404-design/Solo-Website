import 'dart:typed_data';
import '../api_client.dart';

/// Media API service for file uploads
class MediaApi {
  final ApiClient _client;

  MediaApi(this._client);

  /// Upload a file and return the URL
  /// [bytes] - the raw file bytes
  /// [fileName] - original filename with extension
  /// [folder] - optional subfolder (e.g., 'products', 'banners')
  Future<MediaUploadResult> uploadFile({
    required Uint8List bytes,
    required String fileName,
    String? folder,
  }) async {
    final response = await _client.uploadFile(
      '/media/upload',
      bytes: bytes,
      fileName: fileName,
      folder: folder,
      requiresAuth: true,
    );

    return MediaUploadResult.fromJson(response.getDataOrThrow());
  }

  /// Delete a file by URL or key
  Future<void> deleteFile(String fileUrl) async {
    await _client.delete(
      '/media',
      queryParams: {'url': fileUrl},
      requiresAuth: true,
    );
  }

  /// List files in a folder
  Future<List<MediaFile>> listFiles({String? folder, int limit = 50}) async {
    final response = await _client.get(
      '/media',
      queryParams: {
        if (folder != null) 'folder': folder,
        'limit': limit,
      },
      requiresAuth: true,
    );

    final data = response.getDataOrThrow();
    final list = data is List ? data : (data['files'] as List<dynamic>? ?? []);
    return (list)
        .map((e) => MediaFile.fromJson(e as Map<String, dynamic>))
        .toList();
  }
}

/// Result from a file upload
class MediaUploadResult {
  final String url;
  final String key;
  final String? thumbnailUrl;
  final int? size;
  final String? mimeType;

  MediaUploadResult({
    required this.url,
    required this.key,
    this.thumbnailUrl,
    this.size,
    this.mimeType,
  });

  factory MediaUploadResult.fromJson(Map<String, dynamic> json) {
    return MediaUploadResult(
      url: json['url'] as String? ?? '',
      key: json['key'] as String? ?? '',
      thumbnailUrl: json['thumbnailUrl'] as String?,
      size: json['size'] as int?,
      mimeType: json['mimeType'] as String?,
    );
  }
}

/// A media file from storage
class MediaFile {
  final String url;
  final String key;
  final String name;
  final int size;
  final DateTime? uploadedAt;

  MediaFile({
    required this.url,
    required this.key,
    required this.name,
    required this.size,
    this.uploadedAt,
  });

  factory MediaFile.fromJson(Map<String, dynamic> json) {
    return MediaFile(
      url: json['url'] as String? ?? '',
      key: json['key'] as String? ?? '',
      name: json['name'] as String? ?? '',
      size: json['size'] as int? ?? 0,
      uploadedAt: json['uploadedAt'] != null
          ? DateTime.tryParse(json['uploadedAt'] as String)
          : null,
    );
  }
}
