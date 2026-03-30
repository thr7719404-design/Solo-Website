import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:file_picker/file_picker.dart';
import '../../services/api_service.dart';
import '../../services/api/media_api.dart';

/// A reusable media upload widget for admin forms.
/// Supports drag & drop, click to browse, and image preview.
class MediaUploadWidget extends StatefulWidget {
  /// Current image URL (if editing existing item)
  final String? initialUrl;
  
  /// Callback when a file is uploaded successfully
  final void Function(MediaUploadResult result)? onUpload;
  
  /// Callback when an error occurs
  final void Function(String error)? onError;
  
  /// Label to display
  final String label;
  
  /// Folder to upload to (e.g., 'products', 'banners')
  final String? folder;
  
  /// Whether the field is required
  final bool required;
  
  /// Allowed file types
  final List<String> allowedExtensions;
  
  /// Max file size in bytes (default: 5MB)
  final int maxSize;

  const MediaUploadWidget({
    super.key,
    this.initialUrl,
    this.onUpload,
    this.onError,
    this.label = 'Image',
    this.folder,
    this.required = false,
    this.allowedExtensions = const ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    this.maxSize = 5 * 1024 * 1024, // 5MB
  });

  @override
  State<MediaUploadWidget> createState() => _MediaUploadWidgetState();
}

class _MediaUploadWidgetState extends State<MediaUploadWidget> {
  String? _imageUrl;
  bool _isUploading = false;
  bool _isDragOver = false;
  String? _error;
  double _uploadProgress = 0;

  @override
  void initState() {
    super.initState();
    _imageUrl = widget.initialUrl;
  }

  @override
  void didUpdateWidget(MediaUploadWidget oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (widget.initialUrl != oldWidget.initialUrl) {
      _imageUrl = widget.initialUrl;
    }
  }

  Future<void> _pickAndUpload() async {
    try {
      final result = await FilePicker.platform.pickFiles(
        type: FileType.custom,
        allowedExtensions: widget.allowedExtensions,
        withData: true,
      );

      if (result == null || result.files.isEmpty) return;

      final file = result.files.first;
      
      if (file.bytes == null) {
        _showError('Could not read file data');
        return;
      }

      if (file.bytes!.length > widget.maxSize) {
        _showError('File is too large. Maximum size is ${(widget.maxSize / 1024 / 1024).toStringAsFixed(1)}MB');
        return;
      }

      await _uploadFile(file.bytes!, file.name);
    } catch (e) {
      _showError('Error picking file: $e');
    }
  }

  Future<void> _uploadFile(Uint8List bytes, String fileName) async {
    setState(() {
      _isUploading = true;
      _error = null;
      _uploadProgress = 0;
    });

    try {
      // Simulate progress (actual progress would require streaming)
      for (int i = 1; i <= 3; i++) {
        await Future.delayed(const Duration(milliseconds: 200));
        if (mounted) {
          setState(() => _uploadProgress = i * 0.25);
        }
      }

      final result = await ApiService.media.uploadFile(
        bytes: bytes,
        fileName: fileName,
        folder: widget.folder,
      );

      if (mounted) {
        setState(() {
          _imageUrl = result.url;
          _isUploading = false;
          _uploadProgress = 1;
        });

        widget.onUpload?.call(result);

        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Image uploaded successfully')),
        );
      }
    } catch (e) {
      _showError('Upload failed: $e');
      setState(() => _isUploading = false);
    }
  }

  void _showError(String message) {
    setState(() => _error = message);
    widget.onError?.call(message);
    
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        backgroundColor: Colors.red,
      ),
    );
  }

  void _clearImage() {
    setState(() {
      _imageUrl = null;
      _error = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Text(
              widget.label,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
            if (widget.required)
              const Text(
                ' *',
                style: TextStyle(color: Colors.red),
              ),
          ],
        ),
        const SizedBox(height: 8),
        
        if (_imageUrl != null && _imageUrl!.isNotEmpty)
          _buildPreview()
        else
          _buildUploadArea(),
        
        if (_error != null)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              _error!,
              style: const TextStyle(
                color: Colors.red,
                fontSize: 12,
              ),
            ),
          ),
      ],
    );
  }

  Widget _buildPreview() {
    return Container(
      decoration: BoxDecoration(
        border: Border.all(color: Colors.grey.shade300),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(8)),
            child: Image.network(
              _imageUrl!,
              height: 200,
              width: double.infinity,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(
                height: 200,
                color: Colors.grey[200],
                child: const Center(
                  child: Icon(Icons.broken_image, size: 64, color: Colors.grey),
                ),
              ),
            ),
          ),
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: Colors.grey[100],
              borderRadius: const BorderRadius.vertical(bottom: Radius.circular(8)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Expanded(
                  child: Text(
                    _imageUrl!.split('/').last,
                    style: const TextStyle(fontSize: 12),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                Row(
                  children: [
                    TextButton.icon(
                      onPressed: _pickAndUpload,
                      icon: const Icon(Icons.refresh, size: 18),
                      label: const Text('Replace'),
                    ),
                    TextButton.icon(
                      onPressed: _clearImage,
                      icon: const Icon(Icons.delete, size: 18, color: Colors.red),
                      label: const Text('Remove', style: TextStyle(color: Colors.red)),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildUploadArea() {
    return DragTarget<Object>(
      onWillAcceptWithDetails: (_) {
        setState(() => _isDragOver = true);
        return true;
      },
      onLeave: (_) {
        setState(() => _isDragOver = false);
      },
      onAcceptWithDetails: (_) {
        setState(() => _isDragOver = false);
        // Note: Web drag & drop with file data requires additional handling
        _pickAndUpload();
      },
      builder: (context, candidateData, rejectedData) {
        return GestureDetector(
          onTap: _isUploading ? null : _pickAndUpload,
          child: AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            height: 150,
            decoration: BoxDecoration(
              border: Border.all(
                color: _isDragOver
                    ? Theme.of(context).primaryColor
                    : Colors.grey.shade300,
                width: _isDragOver ? 2 : 1,
                style: BorderStyle.solid,
              ),
              borderRadius: BorderRadius.circular(8),
              color: _isDragOver
                  ? Theme.of(context).primaryColor.withOpacity(0.05)
                  : Colors.grey[50],
            ),
            child: Center(
              child: _isUploading
                  ? Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        SizedBox(
                          width: 48,
                          height: 48,
                          child: CircularProgressIndicator(
                            value: _uploadProgress > 0 ? _uploadProgress : null,
                            strokeWidth: 3,
                          ),
                        ),
                        const SizedBox(height: 12),
                        Text(
                          'Uploading... ${(_uploadProgress * 100).toInt()}%',
                          style: TextStyle(color: Colors.grey[600]),
                        ),
                      ],
                    )
                  : Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(
                          Icons.cloud_upload_outlined,
                          size: 48,
                          color: Colors.grey[400],
                        ),
                        const SizedBox(height: 8),
                        Text(
                          'Drag & drop or click to upload',
                          style: TextStyle(
                            color: Colors.grey[600],
                            fontWeight: FontWeight.w500,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'Supports: ${widget.allowedExtensions.join(', ').toUpperCase()}',
                          style: TextStyle(
                            color: Colors.grey[400],
                            fontSize: 12,
                          ),
                        ),
                        Text(
                          'Max size: ${(widget.maxSize / 1024 / 1024).toStringAsFixed(0)}MB',
                          style: TextStyle(
                            color: Colors.grey[400],
                            fontSize: 12,
                          ),
                        ),
                      ],
                    ),
            ),
          ),
        );
      },
    );
  }
}

/// A variant that just shows an input field with URL
/// for simple image URL entry without upload
class ImageUrlField extends StatelessWidget {
  final TextEditingController controller;
  final String label;
  final bool required;

  const ImageUrlField({
    super.key,
    required this.controller,
    this.label = 'Image URL',
    this.required = false,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        TextFormField(
          controller: controller,
          decoration: InputDecoration(
            labelText: '$label${required ? ' *' : ''}',
            hintText: 'https://...',
            border: const OutlineInputBorder(),
            suffixIcon: controller.text.isNotEmpty
                ? IconButton(
                    icon: const Icon(Icons.preview),
                    onPressed: () {
                      showDialog(
                        context: context,
                        builder: (context) => Dialog(
                          child: Container(
                            constraints: const BoxConstraints(maxWidth: 500),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                AppBar(
                                  title: const Text('Image Preview'),
                                  automaticallyImplyLeading: false,
                                  actions: [
                                    IconButton(
                                      icon: const Icon(Icons.close),
                                      onPressed: () => Navigator.pop(context),
                                    ),
                                  ],
                                ),
                                Image.network(
                                  controller.text,
                                  height: 300,
                                  fit: BoxFit.contain,
                                  errorBuilder: (_, __, ___) => const SizedBox(
                                    height: 200,
                                    child: Center(
                                      child: Column(
                                        mainAxisAlignment: MainAxisAlignment.center,
                                        children: [
                                          Icon(Icons.broken_image, size: 64),
                                          SizedBox(height: 8),
                                          Text('Could not load image'),
                                        ],
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    },
                  )
                : null,
          ),
          validator: required
              ? (value) {
                  if (value == null || value.isEmpty) {
                    return '$label is required';
                  }
                  return null;
                }
              : null,
        ),
      ],
    );
  }
}
