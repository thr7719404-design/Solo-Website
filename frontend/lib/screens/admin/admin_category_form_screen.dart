import 'package:flutter/material.dart';
import '../../layouts/admin_layout.dart';
import '../../guards/admin_route_guard.dart';
import '../../services/api_service.dart';
import '../../core/dto/catalog_dto.dart';
import '../../core/dto/admin_dto.dart';

/// Admin Category Create/Edit Form
class AdminCategoryFormScreen extends StatefulWidget {
  final String? categoryId;

  const AdminCategoryFormScreen({
    super.key,
    this.categoryId,
  });

  @override
  State<AdminCategoryFormScreen> createState() =>
      _AdminCategoryFormScreenState();
}

class _AdminCategoryFormScreenState extends State<AdminCategoryFormScreen> {
  final _formKey = GlobalKey<FormState>();
  bool _isLoading = false;
  bool _isSaving = false;

  // Form fields
  final TextEditingController _nameController = TextEditingController();
  final TextEditingController _slugController = TextEditingController();
  final TextEditingController _descriptionController = TextEditingController();
  final TextEditingController _imageController = TextEditingController();
  final TextEditingController _displayOrderController =
      TextEditingController(text: '0');

  bool _isActive = true;

  // Dropdown data
  String? _selectedParentId; // null = parent category

  CategoryDto? _category;

  @override
  void initState() {
    super.initState();
    if (widget.categoryId != null) {
      _loadCategory();
    }
  }

  @override
  void dispose() {
    _nameController.dispose();
    _slugController.dispose();
    _descriptionController.dispose();
    _imageController.dispose();
    _displayOrderController.dispose();
    super.dispose();
  }

  Future<void> _loadCategory() async {
    setState(() => _isLoading = true);

    try {
      final category =
          await ApiService.categories.getCategory(widget.categoryId!);
      setState(() {
        _category = category;
        _nameController.text = category.name;
        _slugController.text = category.slug ?? '';
        _descriptionController.text = category.description ?? '';
        _imageController.text = category.image ?? '';
        _displayOrderController.text = category.displayOrder.toString();
        _isActive = category.isActive;

        _selectedParentId = category.parentId;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error loading category: $e')),
      );
    }
  }

  Future<void> _saveCategory() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    try {
      final request = CategoryRequest(
        name: _nameController.text.trim(),
        slug: _slugController.text.trim().isEmpty
            ? null
            : _slugController.text.trim(),
        description: _descriptionController.text.trim().isEmpty
            ? null
            : _descriptionController.text.trim(),
        image: _imageController.text.trim().isEmpty
            ? null
            : _imageController.text.trim(),
        displayOrder: int.tryParse(_displayOrderController.text) ?? 0,
        isActive: _isActive,
        parentId: _selectedParentId,
      );

      if (widget.categoryId == null) {
        await ApiService.categories.createCategory(request);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Category created successfully')),
        );
      } else {
        await ApiService.categories.updateCategory(widget.categoryId!, request);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Category updated successfully')),
        );
      }

      Navigator.pop(context);
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    } finally {
      setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return AdminRouteGuard(
      child: AdminLayout(
        currentRoute: '/admin/categories',
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(color: Colors.black))
            : SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.categoryId == null
                          ? 'New Category'
                          : 'Edit Category',
                      style: const TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 24),
                    Container(
                      padding: const EdgeInsets.all(24),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Form(
                        key: _formKey,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            // Basic Info Section
                            const Text(
                              'Basic Information',
                              style: TextStyle(
                                  fontSize: 18, fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 16),

                            // Parent Category dropdown
                            FutureBuilder<List<CategoryDto>>(
                              future: ApiService.categories.getCategories(),
                              builder: (context, snap) {
                                final all = snap.data ?? [];
                                final parents = all
                                    .where((c) => c.parentId == null)
                                    .toList();

                                return DropdownButtonFormField<String?>(
                                  initialValue: _selectedParentId,
                                  decoration: const InputDecoration(
                                    labelText: 'Parent Category (optional)',
                                    border: OutlineInputBorder(),
                                  ),
                                  items: [
                                    const DropdownMenuItem<String?>(
                                      value: null,
                                      child: Text('— None (Top level) —'),
                                    ),
                                    ...parents
                                        .map((c) => DropdownMenuItem<String?>(
                                              value: c.id,
                                              child: Text(c.name),
                                            )),
                                  ],
                                  onChanged: (v) =>
                                      setState(() => _selectedParentId = v),
                                );
                              },
                            ),
                            const SizedBox(height: 16),

                            // Name & Slug Row
                            Row(
                              children: [
                                Expanded(
                                  child: TextFormField(
                                    controller: _nameController,
                                    decoration: const InputDecoration(
                                      labelText: 'Name *',
                                      border: OutlineInputBorder(),
                                    ),
                                    validator: (v) => v == null || v.isEmpty
                                        ? 'Name is required'
                                        : null,
                                    onChanged: (value) {
                                      // Auto-generate slug from name
                                      if (widget.categoryId == null) {
                                        _slugController.text = value
                                            .toLowerCase()
                                            .replaceAll(
                                                RegExp(r'[^a-z0-9]+'), '-')
                                            .replaceAll(RegExp(r'^-|-$'), '');
                                      }
                                    },
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: TextFormField(
                                    controller: _slugController,
                                    decoration: const InputDecoration(
                                      labelText: 'Slug *',
                                      helperText: 'URL-friendly identifier',
                                      border: OutlineInputBorder(),
                                    ),
                                    validator: (v) => v == null || v.isEmpty
                                        ? 'Slug is required'
                                        : null,
                                  ),
                                ),
                              ],
                            ),

                            const SizedBox(height: 16),

                            // Description
                            TextFormField(
                              controller: _descriptionController,
                              decoration: const InputDecoration(
                                labelText: 'Description',
                                border: OutlineInputBorder(),
                              ),
                              maxLines: 3,
                            ),

                            const SizedBox(height: 24),

                            // Image Section
                            TextFormField(
                              controller: _imageController,
                              decoration: const InputDecoration(
                                labelText: 'Image URL',
                                hintText: 'https://example.com/image.jpg',
                                border: OutlineInputBorder(),
                              ),
                            ),

                            const SizedBox(height: 24),

                            // Display Order & Active Status
                            Row(
                              children: [
                                Expanded(
                                  child: TextFormField(
                                    controller: _displayOrderController,
                                    decoration: const InputDecoration(
                                      labelText: 'Display Order',
                                      border: OutlineInputBorder(),
                                    ),
                                    keyboardType: TextInputType.number,
                                  ),
                                ),
                                const SizedBox(width: 16),
                                Expanded(
                                  child: SwitchListTile(
                                    title: const Text('Active'),
                                    subtitle: const Text('Category is visible'),
                                    value: _isActive,
                                    onChanged: (value) {
                                      setState(() => _isActive = value);
                                    },
                                  ),
                                ),
                              ],
                            ),

                            const SizedBox(height: 32),

                            // Action Buttons
                            Row(
                              children: [
                                ElevatedButton(
                                  onPressed: _isSaving ? null : _saveCategory,
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: Colors.black,
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 32,
                                      vertical: 16,
                                    ),
                                  ),
                                  child: _isSaving
                                      ? const SizedBox(
                                          width: 20,
                                          height: 20,
                                          child: CircularProgressIndicator(
                                            color: Colors.white,
                                            strokeWidth: 2,
                                          ),
                                        )
                                      : const Text('Save'),
                                ),
                                const SizedBox(width: 12),
                                TextButton(
                                  onPressed: () => Navigator.pop(context),
                                  child: const Text('Cancel'),
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
      ),
    );
  }
}
