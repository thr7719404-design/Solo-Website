import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../../layouts/admin_layout.dart';
import '../../guards/admin_route_guard.dart';
import '../../services/api_service.dart';
import '../../services/api_client.dart' show ApiException;
import '../../models/dto/product_dto.dart' hide CategoryDto;
import '../../core/dto/catalog_dto.dart' show CategoryDto, SubcategoryDto;

/// Admin Product Create/Edit Form
class AdminProductFormScreen extends StatefulWidget {
  final String? productId;

  const AdminProductFormScreen({
    super.key,
    this.productId,
  });

  @override
  State<AdminProductFormScreen> createState() => _AdminProductFormScreenState();
}

class _AdminProductFormScreenState extends State<AdminProductFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;
  bool _isSaving = false;
  bool _isDirty = false;

  // Form fields
  final TextEditingController _skuController = TextEditingController();
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _slugController = TextEditingController();
  final TextEditingController _priceController = TextEditingController();
  final TextEditingController _compareAtPriceController =
      TextEditingController();
  final TextEditingController _stockController =
      TextEditingController(text: '0');
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _imageUrlController = TextEditingController();

  // ==== NEW: Product Page Fields v1 Controllers/State ====
  final TextEditingController _shortDescriptionController =
      TextEditingController();
  final TextEditingController _fullDescriptionController =
      TextEditingController();
  final TextEditingController _deliveryNoteController = TextEditingController();
  final TextEditingController _returnsNoteController = TextEditingController();
  final TextEditingController _urlSlugController = TextEditingController();
  final TextEditingController _metaTitleController = TextEditingController();
  final TextEditingController _metaDescriptionController =
      TextEditingController();

  List<String> _highlights = []; // e.g. ["Dishwasher Safe", "BPA Free"]
  List<String> _galleryImageUrls = []; // Gallery image URLs
  List<Map<String, String>> _specs = []; // [{key, value}]
  // ==== END: Product Page Fields v1 ====

  bool _isFeatured = false;
  bool _isNew = false;
  bool _isBestSeller = false;
  bool _isActive = true;

  // Category tree from DB (using same API as storefront drawer)
  List<CategoryDto> _categoryTree = [];
  String _selectedCategoryPath =
      ''; // Breadcrumb path e.g. "Kitchen > Tea & Coffee > Mugs"

  // Dropdown data - using inventory schema (Int IDs as Strings)
  List<Map<String, dynamic>> _inventoryBrands = [];

  // Dropdown loading/error states
  bool _isCategoriesLoading = false;
  bool _isBrandsLoading = false;
  String? _categoriesError;
  String? _brandsError;

  // DEBUG - Track category source
  String _categorySource = 'Unknown'; // DEBUG

  // Selected IDs (String representation of Int IDs from inventory schema)
  String? _selectedCategoryId;
  String? _selectedSubcategoryId;
  String? _selectedBrandId;

  ProductDto? _product;

  @override
  void initState() {
    super.initState();
    _loadDropdownData();
    if (widget.productId != null) {
      _loadProduct();
    }

    // Add listeners to track unsaved changes
    _skuController.addListener(_markDirty);
    _nameController.addListener(_markDirty);
    _slugController.addListener(_markDirty);
    _priceController.addListener(_markDirty);
    _compareAtPriceController.addListener(_markDirty);
    _stockController.addListener(_markDirty);
    _descriptionController.addListener(_markDirty);
    _imageUrlController.addListener(_markDirty);
    // ==== NEW: Product Page Fields v1 listeners ====
    _shortDescriptionController.addListener(_markDirty);
    _fullDescriptionController.addListener(_markDirty);
    _deliveryNoteController.addListener(_markDirty);
    _returnsNoteController.addListener(_markDirty);
    _urlSlugController.addListener(_markDirty);
    _metaTitleController.addListener(_markDirty);
    _metaDescriptionController.addListener(_markDirty);
    // ==== END ====
  }

  void _markDirty() {
    if (!_isDirty && !_isLoading) {
      setState(() => _isDirty = true);
    }
  }

  Future<void> _loadDropdownData() async {
    await Future.wait([
      _loadInventoryCategories(),
      _loadInventoryBrands(),
    ]);
  }

  Future<void> _loadInventoryCategories() async {
    setState(() {
      _isCategoriesLoading = true;
      _categoriesError = null;
    });

    try {
      // Use the same API as the storefront drawer
      final categories = await ApiService.categories.getCategories();

      setState(() {
        _categoryTree = categories;
        _isCategoriesLoading = false;
        _categorySource = 'DB (API)'; // DEBUG - Categories from database

        // If editing and have a categoryId, compute the breadcrumb path
        if (_selectedCategoryId != null) {
          _selectedCategoryPath = _computeCategorySubcategoryPath(
              _selectedCategoryId!, _selectedSubcategoryId, categories);
        }
      });
    } catch (e) {
      setState(() {
        _isCategoriesLoading = false;
        _categoriesError = 'Failed to load categories';
        _categorySource = 'Error'; // DEBUG
      });
      debugPrint('Error loading categories: $e');
    }
  }

  /// Compute breadcrumb path for a given category ID
  String _computeBreadcrumb(String categoryId, List<CategoryDto> categories) {
    // Search recursively for the category and build its path
    List<String> path = [];
    if (_findCategoryPath(categoryId, categories, path)) {
      return path.join(' > ');
    }
    return '';
  }

  /// Compute breadcrumb for category + optional subcategory
  String _computeCategorySubcategoryPath(
      String categoryId, String? subcategoryId, List<CategoryDto> categories) {
    final cat = categories
        .cast<CategoryDto?>()
        .firstWhere((c) => c!.id == categoryId, orElse: () => null);
    if (cat == null) return '';
    if (subcategoryId != null && cat.subcategories.isNotEmpty) {
      final sub = cat.subcategories
          .cast<SubcategoryDto?>()
          .firstWhere((s) => s!.id == subcategoryId, orElse: () => null);
      if (sub != null) return '${cat.name} > ${sub.name}';
    }
    return cat.name;
  }

  /// Recursively find a category and build its path
  bool _findCategoryPath(
      String id, List<CategoryDto> categories, List<String> path) {
    for (final cat in categories) {
      if (cat.id == id) {
        path.add(cat.name);
        return true;
      }
      if (cat.children.isNotEmpty) {
        path.add(cat.name);
        if (_findCategoryPath(id, cat.children, path)) {
          return true;
        }
        path.removeLast(); // backtrack
      }
    }
    return false;
  }

  /// Open category tree picker dialog
  Future<void> _openCategoryPicker() async {
    final result = await showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) => _CategoryTreePickerDialog(
        categories: _categoryTree,
        selectedCategoryId: _selectedCategoryId,
        selectedSubcategoryId: _selectedSubcategoryId,
      ),
    );

    if (result != null) {
      _markDirty();
      setState(() {
        _selectedCategoryId = result['categoryId'] as String?;
        _selectedSubcategoryId = result['subcategoryId'] as String?;
        _selectedCategoryPath = result['path'] as String? ?? '';
      });
    }
  }

  Future<void> _loadInventoryBrands() async {
    setState(() {
      _isBrandsLoading = true;
      _brandsError = null;
    });

    try {
      final brands = await ApiService.products.getInventoryBrands();
      setState(() {
        _inventoryBrands = brands;
        _isBrandsLoading = false;

        // Set default brand if creating new product
        if (widget.productId == null &&
            _inventoryBrands.isNotEmpty &&
            _selectedBrandId == null) {
          _selectedBrandId = _inventoryBrands.first['id']?.toString();
        }
      });
    } catch (e) {
      setState(() {
        _isBrandsLoading = false;
        _brandsError = 'Failed to load brands';
      });
      debugPrint('Error loading inventory brands: $e');
    }
  }

  @override
  void dispose() {
    // Remove listeners before disposing
    _skuController.removeListener(_markDirty);
    _nameController.removeListener(_markDirty);
    _slugController.removeListener(_markDirty);
    _priceController.removeListener(_markDirty);
    _compareAtPriceController.removeListener(_markDirty);
    _stockController.removeListener(_markDirty);
    _descriptionController.removeListener(_markDirty);
    _imageUrlController.removeListener(_markDirty);
    _shortDescriptionController.removeListener(_markDirty);
    _fullDescriptionController.removeListener(_markDirty);
    _deliveryNoteController.removeListener(_markDirty);
    _returnsNoteController.removeListener(_markDirty);
    _urlSlugController.removeListener(_markDirty);
    _metaTitleController.removeListener(_markDirty);
    _metaDescriptionController.removeListener(_markDirty);

    _skuController.dispose();
    _nameController.dispose();
    _slugController.dispose();
    _priceController.dispose();
    _compareAtPriceController.dispose();
    _stockController.dispose();
    _descriptionController.dispose();
    _imageUrlController.dispose();
    _shortDescriptionController.dispose();
    _fullDescriptionController.dispose();
    _deliveryNoteController.dispose();
    _returnsNoteController.dispose();
    _urlSlugController.dispose();
    _metaTitleController.dispose();
    _metaDescriptionController.dispose();
    super.dispose();
  }

  Future<bool> _confirmDiscard() async {
    if (!_isDirty) return true;

    final result = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Discard changes?'),
        content: const Text(
            'You have unsaved changes. Are you sure you want to discard them?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Stay'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Discard'),
          ),
        ],
      ),
    );
    return result ?? false;
  }

  Future<void> _handleCancel() async {
    if (await _confirmDiscard()) {
      Navigator.pop(context);
    }
  }

  Future<void> _loadProduct() async {
    setState(() => _isLoading = true);

    try {
      final product = await ApiService.products.getProduct(widget.productId!);
      setState(() {
        _product = product;
        _skuController.text = product.sku;
        _nameController.text = product.name;
        _slugController.text = product.slug ?? '';
        _priceController.text = product.price.toString();
        _compareAtPriceController.text =
            product.compareAtPrice?.toString() ?? '';
        _stockController.text = product.stock.toString();
        _descriptionController.text = product.description;
        _imageUrlController.text = product.imageUrl;
        _isFeatured = product.isFeatured;
        _isNew = product.isNew;
        _isBestSeller = product.isBestSeller;
        _isActive = product.isActive;

        // Load new Product Page Fields
        _shortDescriptionController.text = product.shortDescription ?? '';
        _fullDescriptionController.text = product.fullDescription ?? '';
        _deliveryNoteController.text = product.deliveryNote ?? '';
        _returnsNoteController.text = product.returnsNote ?? '';
        _urlSlugController.text = product.urlSlug ?? '';
        _metaTitleController.text = product.metaTitle ?? '';
        _metaDescriptionController.text = product.metaDescription ?? '';
        _highlights = List<String>.from(product.highlights);
        _galleryImageUrls = List<String>.from(product.galleryImageUrls);
        _specs = product.specs
            .map((m) => <String, String>{
                  'key': m['key']?.toString() ?? '',
                  'value': m['value']?.toString() ?? ''
                })
            .toList();

        // Set category/brand from the product's inventory references
        // These IDs are Int IDs (stored as String) from InvCategory/InvBrand
        if (product.category != null) {
          _selectedCategoryId = product.category!.id;
        }
        if (product.subcategory != null) {
          _selectedSubcategoryId = product.subcategory!.id;
        }
        // Compute breadcrumb path
        if (_categoryTree.isNotEmpty && _selectedCategoryId != null) {
          _selectedCategoryPath = _computeCategorySubcategoryPath(
              _selectedCategoryId!, _selectedSubcategoryId, _categoryTree);
        }
        if (product.brand != null) {
          _selectedBrandId = product.brand!.id;
        }

        _isLoading = false;
      });
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading product: $e')),
      );
      Navigator.pop(context);
    }
  }

  void _generateSlug() {
    final name = _nameController.text;
    if (name.isNotEmpty) {
      final slug = name
          .toLowerCase()
          .replaceAll(RegExp(r'[^a-z0-9\s-]'), '')
          .replaceAll(RegExp(r'\s+'), '-')
          .replaceAll(RegExp(r'-+'), '-');
      _slugController.text = slug;
    }
  }

  Future<void> _saveProduct() async {
    if (!_formKey.currentState!.validate()) return;
    if (_isSaving) return; // Prevent double submit

    setState(() => _isSaving = true);

    try {
      // Build payload with inventory schema IDs (Int as String)
      final data = <String, dynamic>{
        'sku': _skuController.text.trim(),
        'name': _nameController.text.trim(),
        'slug': _slugController.text.trim(),
        'description': _descriptionController.text.trim().isEmpty
            ? 'No description'
            : _descriptionController.text.trim(),
        // categoryId and brandId are Int IDs from inventory schema
        'categoryId': _selectedCategoryId,
        'subcategoryId': _selectedSubcategoryId,
        'brandId': _selectedBrandId,
        'price': double.tryParse(_priceController.text) ?? 0,
        'stock': int.tryParse(_stockController.text) ?? 0,
        'isFeatured': _isFeatured,
        'isNew': _isNew,
        'isBestSeller': _isBestSeller,
        'isActive': _isActive,
        // Product Page Fields
        'shortDescription': _shortDescriptionController.text.trim().isEmpty
            ? null
            : _shortDescriptionController.text.trim(),
        'fullDescription': _fullDescriptionController.text.trim().isEmpty
            ? null
            : _fullDescriptionController.text.trim(),
        'deliveryNote': _deliveryNoteController.text.trim().isEmpty
            ? null
            : _deliveryNoteController.text.trim(),
        'returnsNote': _returnsNoteController.text.trim().isEmpty
            ? null
            : _returnsNoteController.text.trim(),
        'urlSlug': _urlSlugController.text.trim().isEmpty
            ? null
            : _urlSlugController.text.trim(),
        'metaTitle': _metaTitleController.text.trim().isEmpty
            ? null
            : _metaTitleController.text.trim(),
        'metaDescription': _metaDescriptionController.text.trim().isEmpty
            ? null
            : _metaDescriptionController.text.trim(),
        'highlights': _highlights.isEmpty ? null : _highlights,
        'galleryImageUrls':
            _galleryImageUrls.isEmpty ? null : _galleryImageUrls,
        'specs': _specs.isEmpty
            ? null
            : _specs
                .map((s) => {'key': s['key'], 'value': s['value']})
                .toList(),
      };

      // Add optional fields
      if (_compareAtPriceController.text.isNotEmpty) {
        data['compareAtPrice'] =
            double.tryParse(_compareAtPriceController.text);
      }

      if (_imageUrlController.text.isNotEmpty) {
        data['images'] = [_imageUrlController.text.trim()];
      }

      if (widget.productId == null) {
        await ApiService.products.createProduct(data);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Product created successfully')),
        );
      } else {
        await ApiService.products.updateProduct(widget.productId!, data);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Product updated successfully')),
        );
      }

      Navigator.pop(context);
    } catch (e) {
      _handleSaveError(e);
    } finally {
      setState(() => _isSaving = false);
    }
  }

  /// Parses and displays a user-friendly error message from API exceptions
  void _handleSaveError(dynamic error) {
    String title = 'Save failed';
    String message = 'An unexpected error occurred';
    String? code;
    String? field;
    String? details;

    // Log full error in debug mode
    if (kDebugMode) {
      debugPrint('─────────────────────────────────────────────────');
      debugPrint('PRODUCT SAVE ERROR:');
      debugPrint('  Type: ${error.runtimeType}');
      debugPrint('  Error: $error');
    }

    if (error is ApiException) {
      final statusCode = error.statusCode;

      // Log additional details in debug mode
      if (kDebugMode) {
        debugPrint('  Status Code: $statusCode');
        debugPrint('  Data: ${error.data}');
        debugPrint('─────────────────────────────────────────────────');
      }

      // Handle authentication errors
      if (statusCode == 401 || statusCode == 403) {
        _showErrorDialog(
          title: 'Session Expired',
          message: 'Your session has expired. Please login again.',
          code: statusCode == 401 ? 'UNAUTHORIZED' : 'FORBIDDEN',
        );
        return;
      }

      // Try to parse the response body for structured error
      try {
        dynamic errorData = error.data;

        // If data is a string, try to parse as JSON
        if (errorData is String && errorData.isNotEmpty) {
          try {
            errorData = jsonDecode(errorData);
          } catch (_) {
            // Not valid JSON, use string as message
            message = errorData;
          }
        }

        // Extract structured error fields
        if (errorData is Map<String, dynamic>) {
          message = errorData['message']?.toString() ?? error.message;
          code = errorData['code']?.toString();
          field = errorData['field']?.toString();

          // Handle details - could be string or object
          if (errorData['details'] != null) {
            if (errorData['details'] is String) {
              details = errorData['details'];
            } else {
              details = jsonEncode(errorData['details']);
            }
          }
        } else {
          message = error.message;
        }
      } catch (parseError) {
        if (kDebugMode) {
          debugPrint('  Error parsing response: $parseError');
        }
        message = error.message;
      }

      // Set title based on status code
      if (statusCode >= 400 && statusCode < 500) {
        title = 'Validation Error';
      } else if (statusCode >= 500) {
        title = 'Server Error';
      }
    } else {
      // Non-API exception
      message = error.toString();
      if (kDebugMode) {
        debugPrint('─────────────────────────────────────────────────');
      }
    }

    _showErrorDialog(
      title: title,
      message: message,
      code: code,
      field: field,
      details: details,
    );
  }

  /// Shows an error dialog with structured error information
  void _showErrorDialog({
    required String title,
    required String message,
    String? code,
    String? field,
    String? details,
  }) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.error_outline, color: Colors.red, size: 28),
            const SizedBox(width: 12),
            Text(title, style: const TextStyle(fontSize: 18)),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(message, style: const TextStyle(fontSize: 15)),
            if (field != null) ...[
              const SizedBox(height: 12),
              _buildErrorDetailRow('Field', field),
            ],
            if (code != null) ...[
              const SizedBox(height: 8),
              _buildErrorDetailRow('Error Code', code),
            ],
            if (details != null && kDebugMode) ...[
              const SizedBox(height: 8),
              _buildErrorDetailRow('Details', details),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('OK'),
          ),
        ],
      ),
    );
  }

  /// Builds a styled row for error detail display
  Widget _buildErrorDetailRow(String label, String value) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '$label: ',
          style: TextStyle(
            fontWeight: FontWeight.w600,
            color: Colors.grey.shade700,
            fontSize: 13,
          ),
        ),
        Expanded(
          child: Text(
            value,
            style: TextStyle(
              color: Colors.grey.shade800,
              fontSize: 13,
              fontFamily: 'monospace',
            ),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDesktop = MediaQuery.of(context).size.width >= 1100;

    return AdminRouteGuard(
      child: AdminLayout(
        currentRoute: '/admin/products',
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(color: Colors.black))
            : Stack(
                children: [
                  Form(
                    key: _formKey,
                    autovalidateMode: AutovalidateMode.onUserInteraction,
                    child: Column(
                      children: [
                        // Top Header Bar
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 24, vertical: 16),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            border: Border(
                                bottom:
                                    BorderSide(color: Colors.grey.shade200)),
                          ),
                          child: Row(
                            children: [
                              Text(
                                widget.productId == null
                                    ? 'New Product'
                                    : 'Edit Product',
                                style: const TextStyle(
                                  fontSize: 24,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                              if (_isDirty) ...[
                                const SizedBox(width: 12),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: Colors.orange.shade50,
                                    borderRadius: BorderRadius.circular(4),
                                  ),
                                  child: Text(
                                    'Unsaved',
                                    style: TextStyle(
                                      fontSize: 12,
                                      color: Colors.orange.shade700,
                                      fontWeight: FontWeight.w500,
                                    ),
                                  ),
                                ),
                              ],
                              const Spacer(),
                              TextButton(
                                onPressed: _isSaving ? null : _handleCancel,
                                child: const Text('Cancel'),
                              ),
                              const SizedBox(width: 12),
                              FilledButton.icon(
                                onPressed: _isSaving ? null : _saveProduct,
                                style: FilledButton.styleFrom(
                                  backgroundColor: Colors.black,
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: 24,
                                    vertical: 16,
                                  ),
                                ),
                                icon: _isSaving
                                    ? const SizedBox(
                                        width: 16,
                                        height: 16,
                                        child: CircularProgressIndicator(
                                          color: Colors.white,
                                          strokeWidth: 2,
                                        ),
                                      )
                                    : const Icon(Icons.save, size: 20),
                                label: Text(_isSaving ? 'Saving...' : 'Save'),
                              ),
                            ],
                          ),
                        ),

                        // DEBUG - Category Source Label
                        Container(
                          width: double.infinity,
                          padding: const EdgeInsets.symmetric(
                              horizontal: 24, vertical: 8),
                          color: _categorySource == 'DB (API)'
                              ? Colors.green.shade100
                              : _categorySource == 'Error'
                                  ? Colors.red.shade100
                                  : Colors.yellow.shade100,
                          child: Text(
                            '// DEBUG - Category Source: $_categorySource | Count: ${_categoryTree.length}',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: _categorySource == 'DB (API)'
                                  ? Colors.green.shade800
                                  : _categorySource == 'Error'
                                      ? Colors.red.shade800
                                      : Colors.orange.shade800,
                            ),
                          ),
                        ),
                        // END DEBUG

                        // Content Area
                        Expanded(
                          child: SingleChildScrollView(
                            padding: const EdgeInsets.all(24),
                            child: isDesktop
                                ? Row(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      // Left Column
                                      Expanded(
                                        flex: 2,
                                        child: Column(
                                          children: [
                                            _BasicInfoCard(
                                              skuController: _skuController,
                                              nameController: _nameController,
                                              slugController: _slugController,
                                              descriptionController:
                                                  _descriptionController,
                                              onNameChanged: _generateSlug,
                                              onRegenerateSlug: _generateSlug,
                                            ),
                                            const SizedBox(height: 16),
                                            _CategorizationCard(
                                              selectedCategoryPath:
                                                  _selectedCategoryPath,
                                              brands: _inventoryBrands,
                                              selectedCategoryId:
                                                  _selectedCategoryId,
                                              selectedBrandId: _selectedBrandId,
                                              isCategoriesLoading:
                                                  _isCategoriesLoading,
                                              isBrandsLoading: _isBrandsLoading,
                                              categoriesError: _categoriesError,
                                              brandsError: _brandsError,
                                              categorySource: _categorySource,
                                              onCategoryTap:
                                                  _openCategoryPicker,
                                              onBrandChanged: (value) {
                                                _markDirty();
                                                setState(() =>
                                                    _selectedBrandId = value);
                                              },
                                              onRetryCategories:
                                                  _loadInventoryCategories,
                                              onRetryBrands:
                                                  _loadInventoryBrands,
                                            ),
                                            const SizedBox(height: 16),
                                            _ProductPageFieldsCard(
                                              shortDescriptionController:
                                                  _shortDescriptionController,
                                              fullDescriptionController:
                                                  _fullDescriptionController,
                                              deliveryNoteController:
                                                  _deliveryNoteController,
                                              returnsNoteController:
                                                  _returnsNoteController,
                                            ),
                                            const SizedBox(height: 16),
                                            _HighlightsCard(
                                              highlights: _highlights,
                                              onChanged: (updated) {
                                                _markDirty();
                                                setState(() =>
                                                    _highlights = updated);
                                              },
                                            ),
                                            const SizedBox(height: 16),
                                            _SpecsCard(
                                              specs: _specs,
                                              onChanged: (updated) {
                                                _markDirty();
                                                setState(
                                                    () => _specs = updated);
                                              },
                                            ),
                                            const SizedBox(height: 16),
                                            _GalleryCard(
                                              galleryUrls: _galleryImageUrls,
                                              onChanged: (updated) {
                                                _markDirty();
                                                setState(() =>
                                                    _galleryImageUrls =
                                                        updated);
                                              },
                                            ),
                                            const SizedBox(height: 16),
                                            _SeoCard(
                                              urlSlugController:
                                                  _urlSlugController,
                                              metaTitleController:
                                                  _metaTitleController,
                                              metaDescriptionController:
                                                  _metaDescriptionController,
                                            ),
                                          ],
                                        ),
                                      ),
                                      const SizedBox(width: 24),

                                      // Right Column
                                      Expanded(
                                        flex: 1,
                                        child: Column(
                                          children: [
                                            _PricingInventoryCard(
                                              priceController: _priceController,
                                              compareAtPriceController:
                                                  _compareAtPriceController,
                                              stockController: _stockController,
                                            ),
                                            const SizedBox(height: 16),
                                            _MediaCard(
                                              imageUrlController:
                                                  _imageUrlController,
                                            ),
                                            const SizedBox(height: 16),
                                            _StatusFlagsCard(
                                              isActive: _isActive,
                                              isFeatured: _isFeatured,
                                              isNew: _isNew,
                                              isBestSeller: _isBestSeller,
                                              onActiveChanged: (value) {
                                                _markDirty();
                                                setState(
                                                    () => _isActive = value);
                                              },
                                              onFeaturedChanged: (value) {
                                                _markDirty();
                                                setState(
                                                    () => _isFeatured = value);
                                              },
                                              onNewChanged: (value) {
                                                _markDirty();
                                                setState(() => _isNew = value);
                                              },
                                              onBestSellerChanged: (value) {
                                                _markDirty();
                                                setState(() =>
                                                    _isBestSeller = value);
                                              },
                                            ),
                                          ],
                                        ),
                                      ),
                                    ],
                                  )
                                : Column(
                                    children: [
                                      _BasicInfoCard(
                                        skuController: _skuController,
                                        nameController: _nameController,
                                        slugController: _slugController,
                                        descriptionController:
                                            _descriptionController,
                                        onNameChanged: _generateSlug,
                                        onRegenerateSlug: _generateSlug,
                                      ),
                                      const SizedBox(height: 16),
                                      _CategorizationCard(
                                        selectedCategoryPath:
                                            _selectedCategoryPath,
                                        brands: _inventoryBrands,
                                        selectedCategoryId: _selectedCategoryId,
                                        selectedBrandId: _selectedBrandId,
                                        isCategoriesLoading:
                                            _isCategoriesLoading,
                                        isBrandsLoading: _isBrandsLoading,
                                        categoriesError: _categoriesError,
                                        brandsError: _brandsError,
                                        categorySource: _categorySource,
                                        onCategoryTap: _openCategoryPicker,
                                        onBrandChanged: (value) {
                                          _markDirty();
                                          setState(
                                              () => _selectedBrandId = value);
                                        },
                                        onRetryCategories:
                                            _loadInventoryCategories,
                                        onRetryBrands: _loadInventoryBrands,
                                      ),
                                      const SizedBox(height: 16),
                                      _ProductPageFieldsCard(
                                        shortDescriptionController:
                                            _shortDescriptionController,
                                        fullDescriptionController:
                                            _fullDescriptionController,
                                        deliveryNoteController:
                                            _deliveryNoteController,
                                        returnsNoteController:
                                            _returnsNoteController,
                                      ),
                                      const SizedBox(height: 16),
                                      _HighlightsCard(
                                        highlights: _highlights,
                                        onChanged: (updated) {
                                          _markDirty();
                                          setState(() => _highlights = updated);
                                        },
                                      ),
                                      const SizedBox(height: 16),
                                      _SpecsCard(
                                        specs: _specs,
                                        onChanged: (updated) {
                                          _markDirty();
                                          setState(() => _specs = updated);
                                        },
                                      ),
                                      const SizedBox(height: 16),
                                      _GalleryCard(
                                        galleryUrls: _galleryImageUrls,
                                        onChanged: (updated) {
                                          _markDirty();
                                          setState(() =>
                                              _galleryImageUrls = updated);
                                        },
                                      ),
                                      const SizedBox(height: 16),
                                      _SeoCard(
                                        urlSlugController: _urlSlugController,
                                        metaTitleController:
                                            _metaTitleController,
                                        metaDescriptionController:
                                            _metaDescriptionController,
                                      ),
                                      const SizedBox(height: 16),
                                      _PricingInventoryCard(
                                        priceController: _priceController,
                                        compareAtPriceController:
                                            _compareAtPriceController,
                                        stockController: _stockController,
                                      ),
                                      const SizedBox(height: 16),
                                      _MediaCard(
                                        imageUrlController: _imageUrlController,
                                      ),
                                      const SizedBox(height: 16),
                                      _StatusFlagsCard(
                                        isActive: _isActive,
                                        isFeatured: _isFeatured,
                                        isNew: _isNew,
                                        isBestSeller: _isBestSeller,
                                        onActiveChanged: (value) {
                                          _markDirty();
                                          setState(() => _isActive = value);
                                        },
                                        onFeaturedChanged: (value) {
                                          _markDirty();
                                          setState(() => _isFeatured = value);
                                        },
                                        onNewChanged: (value) {
                                          _markDirty();
                                          setState(() => _isNew = value);
                                        },
                                        onBestSellerChanged: (value) {
                                          _markDirty();
                                          setState(() => _isBestSeller = value);
                                        },
                                      ),
                                    ],
                                  ),
                          ),
                        ),
                      ],
                    ),
                  ),

                  // Saving overlay
                  if (_isSaving)
                    Container(
                      color: Colors.black.withOpacity(0.3),
                      child: const Center(
                        child: Card(
                          child: Padding(
                            padding: EdgeInsets.all(24),
                            child: Column(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                CircularProgressIndicator(),
                                SizedBox(height: 16),
                                Text('Saving product...'),
                              ],
                            ),
                          ),
                        ),
                      ),
                    ),
                ],
              ),
      ),
    );
  }
}

// ============================================================================
// PRIVATE CARD WIDGETS
// ============================================================================

class _BasicInfoCard extends StatelessWidget {
  final TextEditingController skuController;
  final TextEditingController nameController;
  final TextEditingController slugController;
  final TextEditingController descriptionController;
  final VoidCallback onNameChanged;
  final VoidCallback onRegenerateSlug;

  const _BasicInfoCard({
    required this.skuController,
    required this.nameController,
    required this.slugController,
    required this.descriptionController,
    required this.onNameChanged,
    required this.onRegenerateSlug,
  });

  @override
  Widget build(BuildContext context) {
    final isDesktop = MediaQuery.of(context).size.width >= 1100;

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Basic Information',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 20),

            // SKU & Name Row (responsive)
            if (isDesktop)
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: skuController,
                      decoration: const InputDecoration(
                        labelText: 'SKU *',
                        hintText: 'e.g., BOWL-001',
                        border: OutlineInputBorder(),
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'SKU is required';
                        }
                        return null;
                      },
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    flex: 2,
                    child: TextFormField(
                      controller: nameController,
                      decoration: const InputDecoration(
                        labelText: 'Product Name *',
                        hintText: 'e.g., Ceramic Salad Bowl',
                        border: OutlineInputBorder(),
                      ),
                      onChanged: (_) => onNameChanged(),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Name is required';
                        }
                        if (value.length > 200) {
                          return 'Name must be 200 characters or less';
                        }
                        return null;
                      },
                    ),
                  ),
                ],
              )
            else ...[
              TextFormField(
                controller: skuController,
                decoration: const InputDecoration(
                  labelText: 'SKU *',
                  hintText: 'e.g., BOWL-001',
                  border: OutlineInputBorder(),
                ),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'SKU is required';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: nameController,
                decoration: const InputDecoration(
                  labelText: 'Product Name *',
                  hintText: 'e.g., Ceramic Salad Bowl',
                  border: OutlineInputBorder(),
                ),
                onChanged: (_) => onNameChanged(),
                validator: (value) {
                  if (value == null || value.isEmpty) {
                    return 'Name is required';
                  }
                  if (value.length > 200) {
                    return 'Name must be 200 characters or less';
                  }
                  return null;
                },
              ),
            ],
            const SizedBox(height: 16),

            // Slug with prefix and regenerate button
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: slugController,
                    decoration: InputDecoration(
                      labelText: 'URL Slug *',
                      hintText: 'e.g., ceramic-salad-bowl',
                      prefixText: '/p/',
                      border: const OutlineInputBorder(),
                      helperText: 'Auto-generated from name',
                      suffixIcon: IconButton(
                        icon: const Icon(Icons.refresh, size: 20),
                        onPressed: onRegenerateSlug,
                        tooltip: 'Regenerate slug',
                      ),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Slug is required';
                      }
                      return null;
                    },
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Description with character counter
            TextFormField(
              controller: descriptionController,
              decoration: InputDecoration(
                labelText: 'Description',
                hintText: 'Product description...',
                border: const OutlineInputBorder(),
                helperText: '${descriptionController.text.length} characters',
              ),
              maxLines: 4,
              onChanged: (_) {
                // Trigger rebuild for character counter (handled by parent state)
              },
            ),
          ],
        ),
      ),
    );
  }
}

class _CategorizationCard extends StatelessWidget {
  // Category tree picker props
  final String selectedCategoryPath;
  final String? selectedCategoryId;
  final bool isCategoriesLoading;
  final String? categoriesError;
  final String categorySource; // DEBUG
  final VoidCallback onCategoryTap;
  final VoidCallback onRetryCategories;

  // Brand dropdown props
  final List<Map<String, dynamic>> brands;
  final String? selectedBrandId;
  final bool isBrandsLoading;
  final String? brandsError;
  final ValueChanged<String?> onBrandChanged;
  final VoidCallback onRetryBrands;

  const _CategorizationCard({
    required this.selectedCategoryPath,
    required this.selectedCategoryId,
    required this.isCategoriesLoading,
    this.categoriesError,
    required this.categorySource,
    required this.onCategoryTap,
    required this.onRetryCategories,
    required this.brands,
    required this.selectedBrandId,
    required this.isBrandsLoading,
    this.brandsError,
    required this.onBrandChanged,
    required this.onRetryBrands,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Text(
                  'Categorization',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const SizedBox(width: 8),
                // DEBUG - Source label
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  decoration: BoxDecoration(
                    color: categorySource == 'DB (API)'
                        ? Colors.green.shade100
                        : Colors.orange.shade100,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text(
                    '// DEBUG: $categorySource',
                    style: TextStyle(
                      fontSize: 9,
                      fontWeight: FontWeight.bold,
                      color: categorySource == 'DB (API)'
                          ? Colors.green.shade800
                          : Colors.orange.shade800,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // Category tree picker (read-only field that opens dialog)
            _buildCategoryPickerField(context),
            const SizedBox(height: 16),

            // Brand dropdown (inventory brands)
            _buildDropdownWithState(
              context: context,
              label: 'Brand *',
              value: selectedBrandId,
              items: brands
                  .map((b) => DropdownMenuItem<String>(
                        value: b['id']?.toString(),
                        child: Text(b['name']?.toString() ?? ''),
                      ))
                  .toList(),
              isLoading: isBrandsLoading,
              error: brandsError,
              onChanged: onBrandChanged,
              onRetry: onRetryBrands,
              validator: (value) => value == null ? 'Required' : null,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryPickerField(BuildContext context) {
    if (isCategoriesLoading) {
      return InputDecorator(
        decoration: const InputDecoration(
          labelText: 'Category *',
          border: OutlineInputBorder(),
          helperText: 'Loading categories...',
        ),
        child: const SizedBox(
          height: 20,
          child: Center(
            child: SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          ),
        ),
      );
    }

    if (categoriesError != null) {
      return InputDecorator(
        decoration: InputDecoration(
          labelText: 'Category *',
          border: const OutlineInputBorder(),
          errorText: categoriesError,
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                categoriesError!,
                style: TextStyle(color: Colors.red.shade700, fontSize: 13),
              ),
            ),
            TextButton.icon(
              onPressed: onRetryCategories,
              icon: const Icon(Icons.refresh, size: 16),
              label: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    // Read-only field that opens category picker dialog
    return InkWell(
      onTap: onCategoryTap,
      borderRadius: BorderRadius.circular(4),
      child: InputDecorator(
        decoration: InputDecoration(
          labelText: 'Category *',
          border: const OutlineInputBorder(),
          suffixIcon: const Icon(Icons.chevron_right),
          errorText: selectedCategoryId == null ? 'Required' : null,
        ),
        child: Text(
          selectedCategoryPath.isNotEmpty
              ? selectedCategoryPath
              : 'Select category',
          style: TextStyle(
            fontSize: 16,
            color: selectedCategoryPath.isNotEmpty
                ? Colors.black87
                : Colors.grey.shade600,
          ),
        ),
      ),
    );
  }

  Widget _buildDropdownWithState({
    required BuildContext context,
    required String label,
    required String? value,
    required List<DropdownMenuItem<String>> items,
    required bool isLoading,
    required String? error,
    required ValueChanged<String?> onChanged,
    required VoidCallback onRetry,
    required String? Function(String?)? validator,
    bool enabled = true,
    String? helperText,
  }) {
    if (isLoading) {
      return InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          border: const OutlineInputBorder(),
          helperText: 'Loading...',
        ),
        child: const SizedBox(
          height: 20,
          child: Center(
            child: SizedBox(
              width: 16,
              height: 16,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
          ),
        ),
      );
    }

    if (error != null) {
      return InputDecorator(
        decoration: InputDecoration(
          labelText: label,
          border: const OutlineInputBorder(),
          errorText: error,
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                error,
                style: TextStyle(color: Colors.red.shade700, fontSize: 13),
              ),
            ),
            TextButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh, size: 16),
              label: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    // Ensure value is valid
    final validValue = items.any((item) => item.value == value) ? value : null;

    return DropdownButtonFormField<String>(
      decoration: InputDecoration(
        labelText: label,
        border: const OutlineInputBorder(),
        helperText: helperText,
      ),
      initialValue: validValue,
      items: items,
      onChanged: enabled ? onChanged : null,
      validator: validator,
      disabledHint: items.isEmpty
          ? Text(helperText ?? 'No options available')
          : (validValue != null
              ? Text(items
                  .firstWhere((i) => i.value == validValue)
                  .child
                  .toString())
              : null),
    );
  }
}

/// Dialog for picking a category and optional subcategory
class _CategoryTreePickerDialog extends StatefulWidget {
  final List<CategoryDto> categories;
  final String? selectedCategoryId;
  final String? selectedSubcategoryId;

  const _CategoryTreePickerDialog({
    required this.categories,
    this.selectedCategoryId,
    this.selectedSubcategoryId,
  });

  @override
  State<_CategoryTreePickerDialog> createState() =>
      _CategoryTreePickerDialogState();
}

class _CategoryTreePickerDialogState extends State<_CategoryTreePickerDialog> {
  String _searchQuery = '';
  String? _selectedCategoryId;
  String? _selectedSubcategoryId;
  final Set<String> _expandedNodes = {};

  @override
  void initState() {
    super.initState();
    _selectedCategoryId = widget.selectedCategoryId;
    _selectedSubcategoryId = widget.selectedSubcategoryId;
    // Auto-expand the selected category
    if (_selectedCategoryId != null) {
      _expandedNodes.add(_selectedCategoryId!);
    }
  }

  String _computePath() {
    if (_selectedCategoryId == null) return '';
    final cat = widget.categories
        .cast<CategoryDto?>()
        .firstWhere((c) => c!.id == _selectedCategoryId, orElse: () => null);
    if (cat == null) return '';
    if (_selectedSubcategoryId != null && cat.subcategories.isNotEmpty) {
      final sub = cat.subcategories.cast<SubcategoryDto?>().firstWhere(
          (s) => s!.id == _selectedSubcategoryId,
          orElse: () => null);
      if (sub != null) return '${cat.name} > ${sub.name}';
    }
    return cat.name;
  }

  List<CategoryDto> _filterCategories(List<CategoryDto> categories) {
    if (_searchQuery.isEmpty) return categories;
    final q = _searchQuery.toLowerCase();
    return categories.where((cat) {
      final nameMatch = cat.name.toLowerCase().contains(q);
      final subMatch =
          cat.subcategories.any((s) => s.name.toLowerCase().contains(q));
      return nameMatch || subMatch;
    }).toList();
  }

  void _selectCategory(CategoryDto category) {
    setState(() {
      _selectedCategoryId = category.id;
      _selectedSubcategoryId = null; // reset subcategory when category changes
      // Auto-expand to show subcategories
      _expandedNodes.add(category.id);
    });
  }

  void _selectSubcategory(CategoryDto category, SubcategoryDto sub) {
    setState(() {
      _selectedCategoryId = category.id;
      _selectedSubcategoryId = sub.id;
    });
  }

  @override
  Widget build(BuildContext context) {
    final filteredCategories = _filterCategories(widget.categories);
    final path = _computePath();

    return Dialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: Container(
        width: 500,
        height: 600,
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Header
            Row(
              children: [
                const Text(
                  'Select Category',
                  style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                ),
                const Spacer(),
                IconButton(
                  onPressed: () => Navigator.pop(context),
                  icon: const Icon(Icons.close),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // Search input
            TextField(
              decoration: InputDecoration(
                hintText: 'Search categories...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              ),
              onChanged: (value) => setState(() {
                _searchQuery = value;
                // Auto-expand all categories when searching
                if (value.isNotEmpty) {
                  for (final cat in widget.categories) {
                    _expandedNodes.add(cat.id);
                  }
                }
              }),
            ),
            const SizedBox(height: 16),

            // Category + subcategory list
            Expanded(
              child: filteredCategories.isEmpty
                  ? const Center(child: Text('No categories found'))
                  : SingleChildScrollView(
                      child: Column(
                        children: filteredCategories
                            .map((cat) => _buildCategoryRow(cat))
                            .toList(),
                      ),
                    ),
            ),

            // Selected path preview
            if (path.isNotEmpty) ...[
              const Divider(),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.blue.shade50,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Row(
                  children: [
                    Icon(Icons.folder_outlined,
                        color: Colors.blue.shade700, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        path,
                        style: TextStyle(
                          color: Colors.blue.shade700,
                          fontWeight: FontWeight.w500,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ],
            const SizedBox(height: 16),

            // Actions
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton(
                  onPressed: () => Navigator.pop(context),
                  child: const Text('Cancel'),
                ),
                const SizedBox(width: 12),
                FilledButton(
                  onPressed: _selectedCategoryId == null
                      ? null
                      : () => Navigator.pop(context, {
                            'categoryId': _selectedCategoryId,
                            'subcategoryId': _selectedSubcategoryId,
                            'path': path,
                          }),
                  style: FilledButton.styleFrom(backgroundColor: Colors.black),
                  child: const Text('Confirm'),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryRow(CategoryDto category) {
    final isCategorySelected = _selectedCategoryId == category.id;
    final hasSubcategories = category.subcategories.isNotEmpty;
    final isExpanded = _expandedNodes.contains(category.id);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        // Category row
        InkWell(
          onTap: () => _selectCategory(category),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            decoration: BoxDecoration(
              color: isCategorySelected && _selectedSubcategoryId == null
                  ? Colors.blue.shade100
                  : Colors.transparent,
              border: Border(
                left: isCategorySelected && _selectedSubcategoryId == null
                    ? BorderSide(color: Colors.blue.shade700, width: 3)
                    : BorderSide.none,
              ),
            ),
            child: Row(
              children: [
                // Expand/collapse icon
                if (hasSubcategories)
                  GestureDetector(
                    onTap: () {
                      setState(() {
                        if (isExpanded) {
                          _expandedNodes.remove(category.id);
                        } else {
                          _expandedNodes.add(category.id);
                        }
                      });
                    },
                    child: Padding(
                      padding: const EdgeInsets.only(right: 8),
                      child: Icon(
                        isExpanded ? Icons.expand_more : Icons.chevron_right,
                        size: 20,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  )
                else
                  const SizedBox(width: 28),

                // Category icon
                Icon(
                  hasSubcategories ? Icons.folder : Icons.folder_outlined,
                  size: 18,
                  color: isCategorySelected
                      ? Colors.blue.shade700
                      : Colors.grey.shade600,
                ),
                const SizedBox(width: 8),

                // Category name
                Expanded(
                  child: Text(
                    category.name,
                    style: TextStyle(
                      fontSize: 14,
                      fontWeight: isCategorySelected
                          ? FontWeight.w600
                          : FontWeight.normal,
                      color: isCategorySelected
                          ? Colors.blue.shade700
                          : Colors.black87,
                    ),
                  ),
                ),

                // Product count badge
                if (category.productCount > 0)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.grey.shade200,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      '${category.productCount}',
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.grey.shade700,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),

                // Selected checkmark (only if no subcategory selected)
                if (isCategorySelected && _selectedSubcategoryId == null)
                  Padding(
                    padding: const EdgeInsets.only(left: 8),
                    child: Icon(Icons.check,
                        size: 18, color: Colors.blue.shade700),
                  ),
              ],
            ),
          ),
        ),

        // Subcategories (if expanded)
        if (hasSubcategories && isExpanded)
          ...category.subcategories.map((sub) {
            final isSubSelected = _selectedSubcategoryId == sub.id &&
                _selectedCategoryId == category.id;
            return InkWell(
              onTap: () => _selectSubcategory(category, sub),
              child: Container(
                padding: const EdgeInsets.only(
                    left: 68, right: 16, top: 8, bottom: 8),
                decoration: BoxDecoration(
                  color:
                      isSubSelected ? Colors.blue.shade100 : Colors.transparent,
                  border: Border(
                    left: isSubSelected
                        ? BorderSide(color: Colors.blue.shade700, width: 3)
                        : BorderSide.none,
                  ),
                ),
                child: Row(
                  children: [
                    Icon(
                      Icons.subdirectory_arrow_right,
                      size: 16,
                      color: isSubSelected
                          ? Colors.blue.shade700
                          : Colors.grey.shade400,
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        sub.name,
                        style: TextStyle(
                          fontSize: 13,
                          fontWeight: isSubSelected
                              ? FontWeight.w600
                              : FontWeight.normal,
                          color: isSubSelected
                              ? Colors.blue.shade700
                              : Colors.black54,
                        ),
                      ),
                    ),
                    if (sub.productCount > 0)
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 5, vertical: 1),
                        decoration: BoxDecoration(
                          color: Colors.grey.shade200,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '${sub.productCount}',
                          style: TextStyle(
                            fontSize: 10,
                            color: Colors.grey.shade600,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    if (isSubSelected)
                      Padding(
                        padding: const EdgeInsets.only(left: 8),
                        child: Icon(Icons.check,
                            size: 16, color: Colors.blue.shade700),
                      ),
                  ],
                ),
              ),
            );
          }),
      ],
    );
  }
}

class _PricingInventoryCard extends StatelessWidget {
  final TextEditingController priceController;
  final TextEditingController compareAtPriceController;
  final TextEditingController stockController;

  const _PricingInventoryCard({
    required this.priceController,
    required this.compareAtPriceController,
    required this.stockController,
  });

  @override
  Widget build(BuildContext context) {
    final isDesktop = MediaQuery.of(context).size.width >= 1100;

    // Calculate discount percentage if applicable
    final price = double.tryParse(priceController.text) ?? 0;
    final compareAtPrice = double.tryParse(compareAtPriceController.text) ?? 0;
    final hasDiscount = compareAtPrice > price && price > 0;
    final discountPercent = hasDiscount
        ? ((compareAtPrice - price) / compareAtPrice * 100).toStringAsFixed(0)
        : null;

    final stock = int.tryParse(stockController.text) ?? 0;
    final inStock = stock > 0;

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Text(
                  'Pricing & Inventory',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                const Spacer(),
                if (hasDiscount)
                  Chip(
                    label: Text('$discountPercent% OFF'),
                    backgroundColor: Colors.green.shade50,
                    labelStyle: TextStyle(
                      color: Colors.green.shade700,
                      fontSize: 11,
                      fontWeight: FontWeight.bold,
                    ),
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                  ),
                const SizedBox(width: 8),
                Chip(
                  label: Text(inStock ? 'In Stock' : 'Out of Stock'),
                  backgroundColor:
                      inStock ? Colors.blue.shade50 : Colors.red.shade50,
                  labelStyle: TextStyle(
                    color: inStock ? Colors.blue.shade700 : Colors.red.shade700,
                    fontSize: 11,
                    fontWeight: FontWeight.bold,
                  ),
                  padding: const EdgeInsets.symmetric(horizontal: 8),
                  materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                ),
              ],
            ),
            const SizedBox(height: 20),
            if (isDesktop)
              Column(
                children: [
                  TextFormField(
                    controller: priceController,
                    decoration: const InputDecoration(
                      labelText: 'Price *',
                      hintText: '0.00',
                      border: OutlineInputBorder(),
                      prefixText: 'AED ',
                    ),
                    keyboardType: TextInputType.number,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Price is required';
                      }
                      if (double.tryParse(value) == null) {
                        return 'Invalid price';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: compareAtPriceController,
                    decoration: const InputDecoration(
                      labelText: 'Compare at Price',
                      hintText: '0.00',
                      border: OutlineInputBorder(),
                      prefixText: 'AED ',
                      helperText: 'Original price for discount display',
                    ),
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: stockController,
                    decoration: const InputDecoration(
                      labelText: 'Stock *',
                      hintText: '0',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Stock is required';
                      }
                      final stock = int.tryParse(value);
                      if (stock == null || stock < 0) {
                        return 'Invalid stock';
                      }
                      return null;
                    },
                  ),
                ],
              )
            else
              Column(
                children: [
                  TextFormField(
                    controller: priceController,
                    decoration: const InputDecoration(
                      labelText: 'Price *',
                      hintText: '0.00',
                      border: OutlineInputBorder(),
                      prefixText: 'AED ',
                    ),
                    keyboardType: TextInputType.number,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Price is required';
                      }
                      if (double.tryParse(value) == null) {
                        return 'Invalid price';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: compareAtPriceController,
                    decoration: const InputDecoration(
                      labelText: 'Compare at Price',
                      hintText: '0.00',
                      border: OutlineInputBorder(),
                      prefixText: 'AED ',
                      helperText: 'Original price for discount display',
                    ),
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: stockController,
                    decoration: const InputDecoration(
                      labelText: 'Stock *',
                      hintText: '0',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return 'Stock is required';
                      }
                      final stock = int.tryParse(value);
                      if (stock == null || stock < 0) {
                        return 'Invalid stock';
                      }
                      return null;
                    },
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}

class _MediaCard extends StatelessWidget {
  final TextEditingController imageUrlController;

  const _MediaCard({
    required this.imageUrlController,
  });

  @override
  Widget build(BuildContext context) {
    final hasUrl = imageUrlController.text.isNotEmpty;

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Media',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 20),
            TextFormField(
              controller: imageUrlController,
              decoration: const InputDecoration(
                labelText: 'Image URL',
                hintText: 'https://example.com/image.jpg',
                border: OutlineInputBorder(),
                helperText: 'Enter a valid image URL',
              ),
            ),
            if (hasUrl) ...[
              const SizedBox(height: 16),
              ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Image.network(
                  imageUrlController.text,
                  height: 200,
                  width: double.infinity,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) {
                    return Container(
                      height: 200,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.broken_image,
                              size: 48, color: Colors.grey.shade400),
                          const SizedBox(height: 8),
                          Text(
                            'Failed to load image',
                            style: TextStyle(
                                color: Colors.grey.shade600, fontSize: 12),
                          ),
                        ],
                      ),
                    );
                  },
                  loadingBuilder: (context, child, loadingProgress) {
                    if (loadingProgress == null) return child;
                    return Container(
                      height: 200,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Center(
                        child: CircularProgressIndicator(),
                      ),
                    );
                  },
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

class _StatusFlagsCard extends StatelessWidget {
  final bool isActive;
  final bool isFeatured;
  final bool isNew;
  final bool isBestSeller;
  final ValueChanged<bool> onActiveChanged;
  final ValueChanged<bool> onFeaturedChanged;
  final ValueChanged<bool> onNewChanged;
  final ValueChanged<bool> onBestSellerChanged;

  const _StatusFlagsCard({
    required this.isActive,
    required this.isFeatured,
    required this.isNew,
    required this.isBestSeller,
    required this.onActiveChanged,
    required this.onFeaturedChanged,
    required this.onNewChanged,
    required this.onBestSellerChanged,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Product Status & Flags',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),

            // Active badges preview
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                if (isActive) _buildBadge('Active', Colors.green),
                if (isFeatured) _buildBadge('Featured', Colors.orange),
                if (isNew) _buildBadge('New', Colors.blue),
                if (isBestSeller) _buildBadge('Best Seller', Colors.purple),
              ],
            ),
            const SizedBox(height: 16),

            SwitchListTile(
              title: const Text('Active'),
              subtitle: const Text('Product is visible to customers'),
              value: isActive,
              onChanged: onActiveChanged,
              contentPadding: EdgeInsets.zero,
            ),
            const Divider(height: 1),
            SwitchListTile(
              title: const Text('Featured'),
              subtitle: const Text('Show in featured section'),
              value: isFeatured,
              onChanged: onFeaturedChanged,
              contentPadding: EdgeInsets.zero,
            ),
            const Divider(height: 1),
            SwitchListTile(
              title: const Text('New'),
              subtitle: const Text('Mark as new arrival'),
              value: isNew,
              onChanged: onNewChanged,
              contentPadding: EdgeInsets.zero,
            ),
            const Divider(height: 1),
            SwitchListTile(
              title: const Text('Best Seller'),
              subtitle: const Text('Show in best sellers'),
              value: isBestSeller,
              onChanged: onBestSellerChanged,
              contentPadding: EdgeInsets.zero,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildBadge(String label, Color color) {
    return Chip(
      label: Text(label),
      backgroundColor: color.withOpacity(0.1),
      labelStyle: TextStyle(
        color: color.withOpacity(0.8),
        fontSize: 11,
        fontWeight: FontWeight.bold,
      ),
      padding: const EdgeInsets.symmetric(horizontal: 8),
      materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
    );
  }
}

// ============================================================================
// PRODUCT PAGE FIELDS CARD
// ============================================================================

class _ProductPageFieldsCard extends StatelessWidget {
  final TextEditingController shortDescriptionController;
  final TextEditingController fullDescriptionController;
  final TextEditingController deliveryNoteController;
  final TextEditingController returnsNoteController;

  const _ProductPageFieldsCard({
    required this.shortDescriptionController,
    required this.fullDescriptionController,
    required this.deliveryNoteController,
    required this.returnsNoteController,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Product Page Content',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'These fields control what appears on the storefront product detail page.',
              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
            ),
            const SizedBox(height: 20),
            TextFormField(
              controller: shortDescriptionController,
              decoration: const InputDecoration(
                labelText: 'Short Description',
                hintText: 'Brief product summary (1-2 sentences)',
                border: OutlineInputBorder(),
                helperText: 'Shown in product cards and search results',
              ),
              maxLines: 2,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: fullDescriptionController,
              decoration: const InputDecoration(
                labelText: 'Full Description',
                hintText: 'Detailed product description...',
                border: OutlineInputBorder(),
                helperText: 'Shown on product detail page',
              ),
              maxLines: 5,
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: deliveryNoteController,
                    decoration: const InputDecoration(
                      labelText: 'Delivery Note',
                      hintText: 'e.g., Free shipping on orders over \$50',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                Expanded(
                  child: TextFormField(
                    controller: returnsNoteController,
                    decoration: const InputDecoration(
                      labelText: 'Returns Note',
                      hintText: 'e.g., 30-day money back guarantee',
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

// ============================================================================
// HIGHLIGHTS CARD (Chips Editor)
// ============================================================================

class _HighlightsCard extends StatefulWidget {
  final List<String> highlights;
  final ValueChanged<List<String>> onChanged;

  const _HighlightsCard({
    required this.highlights,
    required this.onChanged,
  });

  @override
  State<_HighlightsCard> createState() => _HighlightsCardState();
}

class _HighlightsCardState extends State<_HighlightsCard> {
  final TextEditingController _inputController = TextEditingController();

  void _addHighlight() {
    final text = _inputController.text.trim();
    if (text.isNotEmpty && !widget.highlights.contains(text)) {
      final updated = [...widget.highlights, text];
      widget.onChanged(updated);
      _inputController.clear();
    }
  }

  void _removeHighlight(String highlight) {
    final updated = widget.highlights.where((h) => h != highlight).toList();
    widget.onChanged(updated);
  }

  @override
  void dispose() {
    _inputController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Product Highlights',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Add badges/chips like "Dishwasher Safe", "BPA Free", etc.',
              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _inputController,
                    decoration: const InputDecoration(
                      hintText: 'Type a highlight and press Add',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    onSubmitted: (_) => _addHighlight(),
                  ),
                ),
                const SizedBox(width: 8),
                FilledButton.icon(
                  onPressed: _addHighlight,
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('Add'),
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 14),
                  ),
                ),
              ],
            ),
            if (widget.highlights.isNotEmpty) ...[
              const SizedBox(height: 16),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: widget.highlights.map((highlight) {
                  return Chip(
                    label: Text(highlight),
                    deleteIcon: const Icon(Icons.close, size: 16),
                    onDeleted: () => _removeHighlight(highlight),
                    backgroundColor: Colors.blue.shade50,
                    labelStyle: TextStyle(color: Colors.blue.shade700),
                  );
                }).toList(),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ============================================================================
// SPECS CARD (Table Editor)
// ============================================================================

class _SpecsCard extends StatefulWidget {
  final List<Map<String, String>> specs;
  final ValueChanged<List<Map<String, String>>> onChanged;

  const _SpecsCard({
    required this.specs,
    required this.onChanged,
  });

  @override
  State<_SpecsCard> createState() => _SpecsCardState();
}

class _SpecsCardState extends State<_SpecsCard> {
  void _addSpec() {
    final updated = [
      ...widget.specs,
      {'key': '', 'value': ''}
    ];
    widget.onChanged(updated);
  }

  void _removeSpec(int index) {
    final updated = [...widget.specs]..removeAt(index);
    widget.onChanged(updated);
  }

  void _updateSpec(int index, String key, String value) {
    final updated = [...widget.specs];
    updated[index] = {'key': key, 'value': value};
    widget.onChanged(updated);
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Product Specifications',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                ),
                TextButton.icon(
                  onPressed: _addSpec,
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('Add Row'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Text(
              'Add key-value pairs like "Material: Ceramic", "Capacity: 500ml".',
              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
            ),
            if (widget.specs.isNotEmpty) ...[
              const SizedBox(height: 16),
              ...widget.specs.asMap().entries.map((entry) {
                final index = entry.key;
                final spec = entry.value;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      Expanded(
                        child: TextField(
                          decoration: const InputDecoration(
                            labelText: 'Key',
                            hintText: 'e.g., Material',
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                          controller: TextEditingController(text: spec['key']),
                          onChanged: (v) =>
                              _updateSpec(index, v, spec['value'] ?? ''),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: TextField(
                          decoration: const InputDecoration(
                            labelText: 'Value',
                            hintText: 'e.g., Ceramic',
                            border: OutlineInputBorder(),
                            isDense: true,
                          ),
                          controller:
                              TextEditingController(text: spec['value']),
                          onChanged: (v) =>
                              _updateSpec(index, spec['key'] ?? '', v),
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton(
                        icon:
                            const Icon(Icons.delete_outline, color: Colors.red),
                        onPressed: () => _removeSpec(index),
                        tooltip: 'Remove',
                      ),
                    ],
                  ),
                );
              }),
            ] else ...[
              const SizedBox(height: 16),
              Center(
                child: Text(
                  'No specifications added yet.',
                  style: TextStyle(
                      color: Colors.grey.shade500, fontStyle: FontStyle.italic),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }
}

// ============================================================================
// GALLERY CARD (URL List Editor with Reorder)
// ============================================================================

class _GalleryCard extends StatefulWidget {
  final List<String> galleryUrls;
  final ValueChanged<List<String>> onChanged;

  const _GalleryCard({
    required this.galleryUrls,
    required this.onChanged,
  });

  @override
  State<_GalleryCard> createState() => _GalleryCardState();
}

class _GalleryCardState extends State<_GalleryCard> {
  final TextEditingController _urlController = TextEditingController();

  void _addUrl() {
    final url = _urlController.text.trim();
    if (url.isNotEmpty && !widget.galleryUrls.contains(url)) {
      final updated = [...widget.galleryUrls, url];
      widget.onChanged(updated);
      _urlController.clear();
    }
  }

  void _removeUrl(int index) {
    final updated = [...widget.galleryUrls]..removeAt(index);
    widget.onChanged(updated);
  }

  void _moveUp(int index) {
    if (index > 0) {
      final updated = [...widget.galleryUrls];
      final item = updated.removeAt(index);
      updated.insert(index - 1, item);
      widget.onChanged(updated);
    }
  }

  void _moveDown(int index) {
    if (index < widget.galleryUrls.length - 1) {
      final updated = [...widget.galleryUrls];
      final item = updated.removeAt(index);
      updated.insert(index + 1, item);
      widget.onChanged(updated);
    }
  }

  @override
  void dispose() {
    _urlController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'Image Gallery',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Add additional images for the product gallery carousel.',
              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _urlController,
                    decoration: const InputDecoration(
                      hintText: 'Enter image URL',
                      border: OutlineInputBorder(),
                      isDense: true,
                    ),
                    onSubmitted: (_) => _addUrl(),
                  ),
                ),
                const SizedBox(width: 8),
                FilledButton.icon(
                  onPressed: _addUrl,
                  icon: const Icon(Icons.add, size: 18),
                  label: const Text('Add'),
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.black,
                    padding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 14),
                  ),
                ),
              ],
            ),
            if (widget.galleryUrls.isNotEmpty) ...[
              const SizedBox(height: 16),
              ...widget.galleryUrls.asMap().entries.map((entry) {
                final index = entry.key;
                final url = entry.value;
                return Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: Row(
                    children: [
                      ClipRRect(
                        borderRadius: BorderRadius.circular(4),
                        child: Image.network(
                          url,
                          width: 48,
                          height: 48,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Container(
                            width: 48,
                            height: 48,
                            color: Colors.grey.shade200,
                            child: const Icon(Icons.broken_image, size: 20),
                          ),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          url,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 12),
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.arrow_upward, size: 18),
                        onPressed: index > 0 ? () => _moveUp(index) : null,
                        tooltip: 'Move up',
                      ),
                      IconButton(
                        icon: const Icon(Icons.arrow_downward, size: 18),
                        onPressed: index < widget.galleryUrls.length - 1
                            ? () => _moveDown(index)
                            : null,
                        tooltip: 'Move down',
                      ),
                      IconButton(
                        icon: const Icon(Icons.delete_outline,
                            color: Colors.red, size: 18),
                        onPressed: () => _removeUrl(index),
                        tooltip: 'Remove',
                      ),
                    ],
                  ),
                );
              }),
            ],
          ],
        ),
      ),
    );
  }
}

// ============================================================================
// SEO CARD
// ============================================================================

class _SeoCard extends StatelessWidget {
  final TextEditingController urlSlugController;
  final TextEditingController metaTitleController;
  final TextEditingController metaDescriptionController;

  const _SeoCard({
    required this.urlSlugController,
    required this.metaTitleController,
    required this.metaDescriptionController,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'SEO Settings',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              'Optimize how this product appears in search engines.',
              style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
            ),
            const SizedBox(height: 20),
            TextFormField(
              controller: urlSlugController,
              decoration: const InputDecoration(
                labelText: 'SEO URL Slug',
                hintText: 'e.g., ceramic-salad-bowl-large',
                prefixText: '/products/',
                border: OutlineInputBorder(),
                helperText: 'Custom URL for SEO (optional)',
              ),
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: metaTitleController,
              decoration: const InputDecoration(
                labelText: 'Meta Title',
                hintText: 'e.g., Large Ceramic Salad Bowl | Kitchen Essentials',
                border: OutlineInputBorder(),
                helperText: 'Title shown in search results (max 60 chars)',
              ),
              maxLength: 60,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: metaDescriptionController,
              decoration: const InputDecoration(
                labelText: 'Meta Description',
                hintText: 'A brief description for search engine results...',
                border: OutlineInputBorder(),
                helperText:
                    'Description shown in search results (max 160 chars)',
              ),
              maxLength: 160,
              maxLines: 3,
            ),
          ],
        ),
      ),
    );
  }
}
