// Flutter Media API Client
// Add this to your Flutter frontend: lib/services/api/media_api.dart

import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'dart:convert';
import '../api_client.dart';
import '../../models/dto/media_dto.dart';

class MediaApi {
  final ApiClient _client;

  MediaApi(this._client);

  /// Upload a single file
  /// 
  /// [file] - File to upload
  /// [folder] - Optional folder name (default: 'general')
  /// [optimize] - Enable image optimization (default: true)
  /// 
  /// Returns UploadResponseDto with public URL
  Future<UploadResponseDto> uploadFile(
    File file, {
    String folder = 'general',
    bool optimize = true,
  }) async {
    final uri = Uri.parse('${_client.baseUrl}/media/upload');
    
    final request = http.MultipartRequest('POST', uri);
    
    // Add authorization header
    final token = await _client.getAccessToken();
    if (token != null) {
      request.headers['Authorization'] = 'Bearer $token';
    }
    
    // Add file
    final mimeType = _getMimeType(file.path);
    request.files.add(
      await http.MultipartFile.fromPath(
        'file',
        file.path,
        contentType: MediaType.parse(mimeType),
      ),
    );
    
    // Add form fields
    request.fields['folder'] = folder;
    request.fields['optimize'] = optimize.toString();
    
    // Send request
    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    
    if (response.statusCode == 201) {
      final data = json.decode(response.body);
      return UploadResponseDto.fromJson(data);
    } else {
      final error = json.decode(response.body);
      throw Exception(error['message'] ?? 'Upload failed');
    }
  }

  /// Upload multiple files
  /// 
  /// [files] - List of files to upload (max 10)
  /// [folder] - Optional folder name
  /// [optimize] - Enable image optimization
  /// 
  /// Returns list of UploadResponseDto
  Future<List<UploadResponseDto>> uploadMultiple(
    List<File> files, {
    String folder = 'general',
    bool optimize = true,
  }) async {
    if (files.isEmpty) {
      throw Exception('No files provided');
    }
    
    if (files.length > 10) {
      throw Exception('Maximum 10 files allowed');
    }
    
    final uri = Uri.parse('${_client.baseUrl}/media/upload-multiple');
    
    final request = http.MultipartRequest('POST', uri);
    
    // Add authorization header
    final token = await _client.getAccessToken();
    if (token != null) {
      request.headers['Authorization'] = 'Bearer $token';
    }
    
    // Add files
    for (final file in files) {
      final mimeType = _getMimeType(file.path);
      request.files.add(
        await http.MultipartFile.fromPath(
          'files',
          file.path,
          contentType: MediaType.parse(mimeType),
        ),
      );
    }
    
    // Add form fields
    request.fields['folder'] = folder;
    request.fields['optimize'] = optimize.toString();
    
    // Send request
    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);
    
    if (response.statusCode == 201) {
      final List<dynamic> data = json.decode(response.body);
      return data.map((item) => UploadResponseDto.fromJson(item)).toList();
    } else {
      final error = json.decode(response.body);
      throw Exception(error['message'] ?? 'Upload failed');
    }
  }

  /// Delete a file by URL
  /// 
  /// [url] - Public URL of file to delete
  Future<void> deleteFile(String url) async {
    final response = await _client.delete(
      '/media/delete',
      body: {'url': url},
    );
    
    if (response.statusCode != 200) {
      throw Exception('Failed to delete file');
    }
  }

  /// Get MIME type from file extension
  String _getMimeType(String path) {
    final extension = path.split('.').last.toLowerCase();
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      default:
        return 'application/octet-stream';
    }
  }
}

// DTO Model
// Add this to: lib/models/dto/media_dto.dart

class UploadResponseDto {
  final String url;
  final String originalName;
  final String filename;
  final int size;
  final String mimetype;
  final DateTime uploadedAt;

  UploadResponseDto({
    required this.url,
    required this.originalName,
    required this.filename,
    required this.size,
    required this.mimetype,
    required this.uploadedAt,
  });

  factory UploadResponseDto.fromJson(Map<String, dynamic> json) {
    return UploadResponseDto(
      url: json['url'] as String,
      originalName: json['originalName'] as String,
      filename: json['filename'] as String,
      size: json['size'] as int,
      mimetype: json['mimetype'] as String,
      uploadedAt: DateTime.parse(json['uploadedAt'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'url': url,
      'originalName': originalName,
      'filename': filename,
      'size': size,
      'mimetype': mimetype,
      'uploadedAt': uploadedAt.toIso8601String(),
    };
  }
}

// Usage Example in Product Form
// lib/screens/admin/admin_product_form_screen.dart

import 'package:image_picker/image_picker.dart';
import 'dart:io';

class _AdminProductFormScreenState extends State<AdminProductFormScreen> {
  File? _selectedImage;
  String? _uploadedImageUrl;
  bool _isUploading = false;

  Future<void> _pickAndUploadImage() async {
    try {
      // Pick image
      final picker = ImagePicker();
      final pickedFile = await picker.pickImage(
        source: ImageSource.gallery,
        maxWidth: 2000,
        imageQuality: 85,
      );

      if (pickedFile == null) return;

      setState(() {
        _selectedImage = File(pickedFile.path);
        _isUploading = true;
      });

      // Upload to server
      final response = await ApiService.media.uploadFile(
        _selectedImage!,
        folder: 'products',
        optimize: true,
      );

      setState(() {
        _uploadedImageUrl = response.url;
        _isUploading = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Image uploaded successfully'),
          backgroundColor: Colors.green,
        ),
      );
    } catch (error) {
      setState(() {
        _isUploading = false;
      });

      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Upload failed: $error'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Image preview
        if (_uploadedImageUrl != null)
          Image.network(
            _uploadedImageUrl!,
            height: 200,
            width: 200,
            fit: BoxFit.cover,
          )
        else if (_selectedImage != null)
          Image.file(
            _selectedImage!,
            height: 200,
            width: 200,
            fit: BoxFit.cover,
          ),

        const SizedBox(height: 16),

        // Upload button
        ElevatedButton.icon(
          onPressed: _isUploading ? null : _pickAndUploadImage,
          icon: _isUploading
              ? const SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(strokeWidth: 2),
                )
              : const Icon(Icons.upload),
          label: Text(_isUploading ? 'Uploading...' : 'Upload Image'),
        ),
      ],
    );
  }
}

// Update ApiService to include media
// lib/services/api_service.dart

class ApiService {
  static final _client = ApiClient();
  
  static final auth = AuthApi(_client);
  static final products = ProductsApi(_client);
  static final content = ContentApi(_client);
  static final media = MediaApi(_client);  // ← Add this
}
