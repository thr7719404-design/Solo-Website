import 'package:flutter/material.dart';
import '../../layouts/admin_layout.dart';
import '../../guards/admin_route_guard.dart';
import '../../services/api_service.dart';
import '../../core/dto/dto.dart' show BrandDto;
import '../../core/events/app_event_bus.dart';
import 'dart:async';

/// Admin Brands CRUD Screen
class AdminBrandsScreen extends StatefulWidget {
  const AdminBrandsScreen({super.key});

  @override
  State<AdminBrandsScreen> createState() => _AdminBrandsScreenState();
}

class _AdminBrandsScreenState extends State<AdminBrandsScreen> {
  bool _isLoading = true;
  List<BrandDto> _brands = [];
  String? _error;
  StreamSubscription<AppEventData>? _eventSubscription;

  @override
  void initState() {
    super.initState();
    _loadBrands();
    _subscribeToEvents();
  }

  @override
  void dispose() {
    _eventSubscription?.cancel();
    super.dispose();
  }

  void _subscribeToEvents() {
    _eventSubscription = AppEventBus().on(AppEvent.brandsChanged, (_) {
      _loadBrands();
    });
  }

  Future<void> _loadBrands() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final brands = await ApiService.brands.getBrands();

      setState(() {
        _brands = brands;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  Future<void> _createBrand() async {
    final result = await _showBrandDialog();
    if (result == null) return;

    try {
      await ApiService.brands.createBrand(result);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Brand created successfully')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _editBrand(BrandDto brand) async {
    final result = await _showBrandDialog(brand: brand);
    if (result == null) return;

    try {
      await ApiService.brands.updateBrand(brand.id, result);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Brand updated successfully')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _deleteBrand(BrandDto brand) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Brand'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Are you sure you want to delete "${brand.name}"?'),
            if ((brand.productCount ?? 0) > 0) ...[
              const SizedBox(height: 16),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: Colors.orange.shade50,
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: Colors.orange.shade200),
                ),
                child: Row(
                  children: [
                    Icon(Icons.warning, color: Colors.orange.shade700),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'This brand has ${brand.productCount ?? 0} products.',
                        style: TextStyle(color: Colors.orange.shade900),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.red,
              foregroundColor: Colors.white,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      await ApiService.brands.deleteBrand(brand.id);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Brand deleted successfully')),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _toggleActive(BrandDto brand) async {
    try {
      await ApiService.brands.toggleBrandActive(brand.id, !brand.isActive);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            brand.isActive ? 'Brand deactivated' : 'Brand activated',
          ),
        ),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<Map<String, dynamic>?> _showBrandDialog({BrandDto? brand}) {
    final nameController = TextEditingController(text: brand?.name ?? '');
    final slugController = TextEditingController(text: brand?.slug ?? '');
    final descriptionController = TextEditingController(
      text: brand?.description ?? '',
    );
    final logoController = TextEditingController(text: brand?.logo ?? '');
    final websiteController = TextEditingController(text: brand?.website ?? '');
    bool isActive = brand?.isActive ?? true;
    final formKey = GlobalKey<FormState>();

    return showDialog<Map<String, dynamic>>(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          title: Text(brand == null ? 'New Brand' : 'Edit Brand'),
          content: SizedBox(
            width: 500,
            child: Form(
              key: formKey,
              child: SingleChildScrollView(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    TextFormField(
                      controller: nameController,
                      decoration: const InputDecoration(
                        labelText: 'Name *',
                        border: OutlineInputBorder(),
                      ),
                      validator: (v) =>
                          v == null || v.isEmpty ? 'Name is required' : null,
                      onChanged: (value) {
                        if (brand == null) {
                          slugController.text = value
                              .toLowerCase()
                              .replaceAll(RegExp(r'[^a-z0-9]+'), '-')
                              .replaceAll(RegExp(r'^-|-$'), '');
                        }
                      },
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: slugController,
                      decoration: const InputDecoration(
                        labelText: 'Slug *',
                        helperText: 'URL-friendly identifier',
                        border: OutlineInputBorder(),
                      ),
                      validator: (v) =>
                          v == null || v.isEmpty ? 'Slug is required' : null,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: descriptionController,
                      decoration: const InputDecoration(
                        labelText: 'Description',
                        border: OutlineInputBorder(),
                      ),
                      maxLines: 3,
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: logoController,
                      decoration: const InputDecoration(
                        labelText: 'Logo URL',
                        hintText: 'https://...',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextFormField(
                      controller: websiteController,
                      decoration: const InputDecoration(
                        labelText: 'Website',
                        hintText: 'https://...',
                        border: OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 16),
                    SwitchListTile(
                      title: const Text('Active'),
                      value: isActive,
                      onChanged: (v) {
                        setDialogState(() => isActive = v);
                      },
                    ),
                  ],
                ),
              ),
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                if (!formKey.currentState!.validate()) return;

                Navigator.pop(context, {
                  'name': nameController.text,
                  'slug': slugController.text,
                  if (descriptionController.text.isNotEmpty)
                    'description': descriptionController.text,
                  if (logoController.text.isNotEmpty)
                    'logo': logoController.text,
                  if (websiteController.text.isNotEmpty)
                    'website': websiteController.text,
                  'isActive': isActive,
                });
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.black,
                foregroundColor: Colors.white,
              ),
              child: Text(brand == null ? 'Create' : 'Save'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return AdminRouteGuard(
      child: AdminLayout(
        currentRoute: '/admin/brands',
        child: Column(
          children: [
            _buildHeader(),
            Expanded(child: _buildBody()),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader() {
    return Container(
      padding: const EdgeInsets.all(24),
      color: Colors.white,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Brands',
                style: TextStyle(
                  fontSize: 28,
                  fontWeight: FontWeight.bold,
                ),
              ),
              Text(
                '${_brands.length} brands',
                style: TextStyle(color: Colors.grey[600]),
              ),
            ],
          ),
          ElevatedButton.icon(
            onPressed: _createBrand,
            icon: const Icon(Icons.add),
            label: const Text('New Brand'),
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.black,
              foregroundColor: Colors.white,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(color: Colors.black),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text('Error: $_error'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadBrands,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_brands.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.branding_watermark, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            const Text('No brands yet'),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _createBrand,
              icon: const Icon(Icons.add),
              label: const Text('Create First Brand'),
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadBrands,
      child: GridView.builder(
        padding: const EdgeInsets.all(24),
        gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
          maxCrossAxisExtent: 400,
          childAspectRatio: 1.5,
          crossAxisSpacing: 16,
          mainAxisSpacing: 16,
        ),
        itemCount: _brands.length,
        itemBuilder: (context, index) => _buildBrandCard(_brands[index]),
      ),
    );
  }

  Widget _buildBrandCard(BrandDto brand) {
    return Card(
      clipBehavior: Clip.antiAlias,
      child: Stack(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Container(
                  width: double.infinity,
                  color: Colors.grey[100],
                  child: brand.logo != null && brand.logo!.isNotEmpty
                      ? Image.network(
                          brand.logo!,
                          fit: BoxFit.contain,
                          errorBuilder: (_, __, ___) => const Center(
                            child: Icon(Icons.branding_watermark, size: 48),
                          ),
                        )
                      : const Center(
                          child: Icon(Icons.branding_watermark, size: 48),
                        ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            brand.name,
                            style: const TextStyle(
                              fontWeight: FontWeight.bold,
                              fontSize: 16,
                            ),
                          ),
                        ),
                        if (!brand.isActive)
                          Container(
                            padding: const EdgeInsets.symmetric(
                              horizontal: 8,
                              vertical: 2,
                            ),
                            decoration: BoxDecoration(
                              color: Colors.grey[300],
                              borderRadius: BorderRadius.circular(4),
                            ),
                            child: const Text(
                              'Inactive',
                              style: TextStyle(fontSize: 10),
                            ),
                          ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${brand.productCount} products',
                      style: TextStyle(
                        color: Colors.grey[600],
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
          Positioned(
            top: 8,
            right: 8,
            child: PopupMenuButton<String>(
              onSelected: (value) {
                if (value == 'edit') {
                  _editBrand(brand);
                } else if (value == 'toggle') {
                  _toggleActive(brand);
                } else if (value == 'delete') {
                  _deleteBrand(brand);
                }
              },
              itemBuilder: (context) => [
                const PopupMenuItem(
                  value: 'edit',
                  child: Row(
                    children: [
                      Icon(Icons.edit, size: 20),
                      SizedBox(width: 12),
                      Text('Edit'),
                    ],
                  ),
                ),
                PopupMenuItem(
                  value: 'toggle',
                  child: Row(
                    children: [
                      Icon(
                        brand.isActive
                            ? Icons.visibility_off
                            : Icons.visibility,
                        size: 20,
                      ),
                      const SizedBox(width: 12),
                      Text(brand.isActive ? 'Deactivate' : 'Activate'),
                    ],
                  ),
                ),
                const PopupMenuItem(
                  value: 'delete',
                  child: Row(
                    children: [
                      Icon(Icons.delete, size: 20, color: Colors.red),
                      SizedBox(width: 12),
                      Text('Delete', style: TextStyle(color: Colors.red)),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
