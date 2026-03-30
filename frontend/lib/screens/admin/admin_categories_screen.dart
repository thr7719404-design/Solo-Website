import 'package:flutter/material.dart';
import '../../layouts/admin_layout.dart';
import '../../guards/admin_route_guard.dart';
import '../../services/api_service.dart';
import '../../core/dto/catalog_dto.dart' as catalog;
import '../../core/events/app_event_bus.dart';
import 'dart:async';

/// Admin Categories CRUD Screen
class AdminCategoriesScreen extends StatefulWidget {
  const AdminCategoriesScreen({super.key});

  @override
  State<AdminCategoriesScreen> createState() => _AdminCategoriesScreenState();
}

enum CategoryFilter { all, active, hidden }

enum CategorySort { name, updated, subcategories }

class _AdminCategoriesScreenState extends State<AdminCategoriesScreen> {
  bool _isLoading = true;
  List<catalog.CategoryDto> _categories = [];
  String? _error;
  StreamSubscription<AppEventData>? _eventSubscription;
  final Set<String> _expandedCategoryIds = {};

  // New filter/search state
  final TextEditingController _searchController = TextEditingController();
  CategoryFilter _filter = CategoryFilter.all;
  CategorySort _sort = CategorySort.name;
  String _searchQuery = '';

  // Bulk selection state
  final Set<String> _selectedCategoryIds = {};
  bool _isBulkOperating = false;

  @override
  void initState() {
    super.initState();
    _loadCategories();
    _subscribeToEvents();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _eventSubscription?.cancel();
    super.dispose();
  }

  void _subscribeToEvents() {
    _eventSubscription = AppEventBus().on(AppEvent.categoriesChanged, (_) {
      _loadCategories();
    });
  }

  Future<void> _loadCategories() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      final allCategories = await ApiService.categories.getCategories(
        includeSubcategories: true,
      );

      setState(() {
        _categories = allCategories.where((c) => c.parentId == null).toList();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  List<catalog.CategoryDto> get _filteredCategories {
    var filtered = _categories;

    // Apply filter
    switch (_filter) {
      case CategoryFilter.active:
        filtered = filtered.where((c) => c.isActive).toList();
        break;
      case CategoryFilter.hidden:
        filtered = filtered.where((c) => !c.isActive).toList();
        break;
      case CategoryFilter.all:
        break;
    }

    // Apply search
    if (_searchQuery.isNotEmpty) {
      filtered = filtered
          .where((c) =>
              c.name.toLowerCase().contains(_searchQuery.toLowerCase()) ||
              c.slug.toLowerCase().contains(_searchQuery.toLowerCase()))
          .toList();
    }

    // Apply sort
    switch (_sort) {
      case CategorySort.name:
        filtered.sort((a, b) => a.name.compareTo(b.name));
        break;
      case CategorySort.updated:
        filtered.sort((a, b) {
          final aTime = a.updatedAt ?? a.createdAt ?? DateTime.now();
          final bTime = b.updatedAt ?? b.createdAt ?? DateTime.now();
          return bTime.compareTo(aTime);
        });
        break;
      case CategorySort.subcategories:
        filtered.sort((a, b) => b.children.length.compareTo(a.children.length));
        break;
    }

    return filtered;
  }

  bool get _isAllVisibleSelected {
    if (_filteredCategories.isEmpty) return false;
    return _filteredCategories
        .every((c) => _selectedCategoryIds.contains(c.id));
  }

  void _toggleSelectAll() {
    setState(() {
      if (_isAllVisibleSelected) {
        // Deselect all visible
        for (final category in _filteredCategories) {
          _selectedCategoryIds.remove(category.id);
        }
      } else {
        // Select all visible
        for (final category in _filteredCategories) {
          _selectedCategoryIds.add(category.id);
        }
      }
    });
  }

  void _toggleSelect(String categoryId) {
    setState(() {
      if (_selectedCategoryIds.contains(categoryId)) {
        _selectedCategoryIds.remove(categoryId);
      } else {
        _selectedCategoryIds.add(categoryId);
      }
    });
  }

  void _clearSelection() {
    setState(() {
      _selectedCategoryIds.clear();
    });
  }

  Future<void> _bulkToggleActive(bool isActive) async {
    if (_selectedCategoryIds.isEmpty) return;

    setState(() => _isBulkOperating = true);

    final selectedIds = _selectedCategoryIds.toList();
    int successCount = 0;
    int failCount = 0;

    for (final categoryId in selectedIds) {
      try {
        await ApiService.categories.toggleCategoryActive(categoryId, isActive);
        successCount++;
      } catch (e) {
        failCount++;
      }
    }

    setState(() => _isBulkOperating = false);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '$successCount categories ${isActive ? "activated" : "deactivated"}${failCount > 0 ? ", $failCount failed" : ""}',
          ),
          backgroundColor: failCount > 0 ? Colors.orange : Colors.green,
        ),
      );
      _clearSelection();
      _loadCategories();
    }
  }

  Future<void> _bulkDelete() async {
    if (_selectedCategoryIds.isEmpty) return;

    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Categories'),
        content: Text(
          'Are you sure you want to delete ${_selectedCategoryIds.length} categories? This action cannot be undone.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _isBulkOperating = true);

    final selectedIds = _selectedCategoryIds.toList();
    int successCount = 0;
    int failCount = 0;

    for (final categoryId in selectedIds) {
      try {
        await ApiService.categories.deleteCategory(categoryId);
        successCount++;
      } catch (e) {
        failCount++;
      }
    }

    setState(() => _isBulkOperating = false);

    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            '$successCount categories deleted${failCount > 0 ? ", $failCount failed" : ""}',
          ),
          backgroundColor: failCount > 0 ? Colors.orange : Colors.green,
        ),
      );
      _clearSelection();
      _loadCategories();
    }
  }

  Future<void> _createCategory() async {
    await Navigator.pushNamed(context, '/admin/categories/new');
    if (mounted) {
      _loadCategories();
    }
  }

  Future<void> _editCategory(catalog.CategoryDto category) async {
    await Navigator.pushNamed(
      context,
      '/admin/categories/edit',
      arguments: category.id,
    );
    if (mounted) {
      _loadCategories();
    }
  }

  Future<void> _deleteCategory(String categoryId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Category'),
        content: const Text('Are you sure you want to delete this category?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(context, true),
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      await ApiService.categories.deleteCategory(categoryId);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Category deleted successfully')),
      );
      _loadCategories();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    }
  }

  Future<void> _toggleActive(catalog.CategoryDto category) async {
    try {
      await ApiService.categories.toggleCategoryActive(
        category.id,
        !category.isActive,
      );
      _loadCategories();
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e'), backgroundColor: Colors.red),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return AdminRouteGuard(
      child: AdminLayout(
        currentRoute: '/admin/categories',
        child: _buildBody(),
      ),
    );
  }

  Widget _buildBody() {
    return Container(
      color: Colors.grey.shade50,
      child: Column(
        children: [
          _buildToolbar(),
          if (_selectedCategoryIds.isNotEmpty) _buildBulkActionsBar(),
          Expanded(child: _buildContent()),
        ],
      ),
    );
  }

  Widget _buildToolbar() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Top row: Title + Search + Button
          Row(
            children: [
              // Title section
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      'Categories',
                      style: TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '${_filteredCategories.length} of ${_categories.length} categories',
                      style: TextStyle(
                        fontSize: 13,
                        color: Colors.grey.shade600,
                      ),
                    ),
                  ],
                ),
              ),

              const SizedBox(width: 16),

              // Search box
              SizedBox(
                width: 280,
                child: TextField(
                  controller: _searchController,
                  decoration: InputDecoration(
                    hintText: 'Search categories...',
                    prefixIcon: const Icon(Icons.search, size: 20),
                    suffixIcon: _searchQuery.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.clear, size: 20),
                            onPressed: () {
                              _searchController.clear();
                              setState(() => _searchQuery = '');
                            },
                          )
                        : null,
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(12),
                      borderSide: BorderSide(color: Colors.grey.shade300),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 12,
                    ),
                    filled: true,
                    fillColor: Colors.grey.shade50,
                  ),
                  onChanged: (value) => setState(() => _searchQuery = value),
                ),
              ),

              const SizedBox(width: 16),

              // New Category button
              ElevatedButton.icon(
                onPressed: _createCategory,
                icon: const Icon(Icons.add, size: 20),
                label: const Text('New Category'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue.shade700,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(
                    horizontal: 20,
                    vertical: 14,
                  ),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                  elevation: 0,
                ),
              ),
            ],
          ),

          const SizedBox(height: 16),

          // Bottom row: Filter chips + Sort
          Row(
            children: [
              // Filter chips
              _buildFilterChip('All', CategoryFilter.all),
              const SizedBox(width: 8),
              _buildFilterChip('Active', CategoryFilter.active),
              const SizedBox(width: 8),
              _buildFilterChip('Hidden', CategoryFilter.hidden),

              const Spacer(),

              // Sort dropdown
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12),
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey.shade300),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: DropdownButton<CategorySort>(
                  value: _sort,
                  underline: const SizedBox(),
                  icon: const Icon(Icons.arrow_drop_down, size: 20),
                  style: TextStyle(
                    fontSize: 13,
                    color: Colors.grey.shade800,
                  ),
                  items: const [
                    DropdownMenuItem(
                      value: CategorySort.name,
                      child: Row(
                        children: [
                          Icon(Icons.sort_by_alpha, size: 16),
                          SizedBox(width: 8),
                          Text('Name'),
                        ],
                      ),
                    ),
                    DropdownMenuItem(
                      value: CategorySort.updated,
                      child: Row(
                        children: [
                          Icon(Icons.schedule, size: 16),
                          SizedBox(width: 8),
                          Text('Updated'),
                        ],
                      ),
                    ),
                    DropdownMenuItem(
                      value: CategorySort.subcategories,
                      child: Row(
                        children: [
                          Icon(Icons.format_list_numbered, size: 16),
                          SizedBox(width: 8),
                          Text('Subcategories'),
                        ],
                      ),
                    ),
                  ],
                  onChanged: (value) {
                    if (value != null) setState(() => _sort = value);
                  },
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBulkActionsBar() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.blue.shade700,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Icon(Icons.check_circle, color: Colors.white, size: 20),
          const SizedBox(width: 12),
          Text(
            '${_selectedCategoryIds.length} selected',
            style: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
          ),
          const SizedBox(width: 24),
          if (_isBulkOperating)
            const Row(
              children: [
                SizedBox(
                  width: 16,
                  height: 16,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                ),
                SizedBox(width: 8),
                Text(
                  'Processing...',
                  style: TextStyle(color: Colors.white, fontSize: 13),
                ),
              ],
            )
          else
            Expanded(
              child: Row(
                children: [
                  _buildBulkActionButton(
                    icon: Icons.visibility,
                    label: 'Show',
                    onPressed: () => _bulkToggleActive(true),
                  ),
                  const SizedBox(width: 8),
                  _buildBulkActionButton(
                    icon: Icons.visibility_off,
                    label: 'Hide',
                    onPressed: () => _bulkToggleActive(false),
                  ),
                  const SizedBox(width: 8),
                  _buildBulkActionButton(
                    icon: Icons.delete,
                    label: 'Delete',
                    onPressed: _bulkDelete,
                    isDestructive: true,
                  ),
                  const Spacer(),
                  TextButton(
                    onPressed: _clearSelection,
                    style: TextButton.styleFrom(
                      foregroundColor: Colors.white,
                    ),
                    child: const Text('Clear Selection'),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildBulkActionButton({
    required IconData icon,
    required String label,
    required VoidCallback onPressed,
    bool isDestructive = false,
  }) {
    return ElevatedButton.icon(
      onPressed: onPressed,
      icon: Icon(icon, size: 16),
      label: Text(label),
      style: ElevatedButton.styleFrom(
        backgroundColor: isDestructive ? Colors.red.shade600 : Colors.white,
        foregroundColor: isDestructive ? Colors.white : Colors.blue.shade700,
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(8),
        ),
        elevation: 0,
      ),
    );
  }

  Widget _buildFilterChip(String label, CategoryFilter filter) {
    final isSelected = _filter == filter;
    return InkWell(
      onTap: () => setState(() => _filter = filter),
      borderRadius: BorderRadius.circular(20),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? Colors.blue.shade700 : Colors.transparent,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? Colors.blue.shade700 : Colors.grey.shade300,
          ),
        ),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 13,
            fontWeight: FontWeight.w500,
            color: isSelected ? Colors.white : Colors.grey.shade700,
          ),
        ),
      ),
    );
  }

  Widget _buildContent() {
    if (_isLoading) {
      return const Center(
        child: CircularProgressIndicator(),
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
              onPressed: _loadCategories,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_categories.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.category_outlined, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            const Text('No categories yet'),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: _createCategory,
              icon: const Icon(Icons.add),
              label: const Text('Create First Category'),
            ),
          ],
        ),
      );
    }

    final filtered = _filteredCategories;

    if (filtered.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.search_off, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            const Text('No categories found'),
            const SizedBox(height: 8),
            TextButton(
              onPressed: () {
                _searchController.clear();
                setState(() {
                  _searchQuery = '';
                  _filter = CategoryFilter.all;
                });
              },
              child: const Text('Clear filters'),
            ),
          ],
        ),
      );
    }

    return Container(
      margin: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Table header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.grey.shade50,
              borderRadius: const BorderRadius.only(
                topLeft: Radius.circular(12),
                topRight: Radius.circular(12),
              ),
            ),
            child: Row(
              children: [
                // Checkbox column
                SizedBox(
                  width: 48,
                  child: Checkbox(
                    value: _isAllVisibleSelected,
                    onChanged: (_) => _toggleSelectAll(),
                    tristate: false,
                  ),
                ),
                SizedBox(
                  width: 280,
                  child: Text(
                    'CATEGORY',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey.shade600,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                SizedBox(
                  width: 160,
                  child: Text(
                    'SLUG',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey.shade600,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                Expanded(
                  flex: 2,
                  child: Text(
                    'SUBCATEGORIES',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey.shade600,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                SizedBox(
                  width: 100,
                  child: Text(
                    'STATUS',
                    style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey.shade600,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
                const SizedBox(width: 100), // Actions space
              ],
            ),
          ),

          // Table rows
          Expanded(
            child: ListView.builder(
              itemCount: filtered.length,
              itemBuilder: (context, index) {
                final category = filtered[index];
                return Column(
                  children: [
                    _buildCategoryRow(category, isChild: false),
                    if (_expandedCategoryIds.contains(category.id) &&
                        category.children.isNotEmpty)
                      ...category.children.map(
                        (child) => _buildCategoryRow(child, isChild: true),
                      ),
                  ],
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryRow(catalog.CategoryDto category,
      {required bool isChild}) {
    final hasChildren = category.children.isNotEmpty;
    final isExpanded = _expandedCategoryIds.contains(category.id);
    final isSelected = _selectedCategoryIds.contains(category.id);

    return InkWell(
      onTap: () => _editCategory(category),
      hoverColor: Colors.blue.shade50,
      child: Container(
        padding: EdgeInsets.only(
          left: isChild ? 60 : 20,
          right: 20,
          top: 12,
          bottom: 12,
        ),
        decoration: BoxDecoration(
          color: isSelected ? Colors.blue.shade50 : null,
          border: Border(
            bottom: BorderSide(color: Colors.grey.shade100),
          ),
        ),
        child: Row(
          children: [
            // Checkbox column
            if (!isChild)
              SizedBox(
                width: 48,
                child: Checkbox(
                  value: isSelected,
                  onChanged: (_) => _toggleSelect(category.id),
                ),
              )
            else
              const SizedBox(width: 48),

            // Category column (icon + name)
            SizedBox(
              width: isChild ? 240 : 280,
              child: Row(
                children: [
                  // Expand/collapse button for parents with children
                  if (!isChild && hasChildren)
                    IconButton(
                      icon: Icon(
                        isExpanded ? Icons.expand_less : Icons.expand_more,
                        size: 20,
                        color: Colors.grey.shade600,
                      ),
                      padding: EdgeInsets.zero,
                      constraints: const BoxConstraints(),
                      onPressed: () {
                        setState(() {
                          if (isExpanded) {
                            _expandedCategoryIds.remove(category.id);
                          } else {
                            _expandedCategoryIds.add(category.id);
                          }
                        });
                      },
                    )
                  else if (!isChild)
                    const SizedBox(width: 36),

                  const SizedBox(width: 8),

                  // Category icon/image
                  if (category.image != null && category.image!.isNotEmpty)
                    ClipRRect(
                      borderRadius: BorderRadius.circular(8),
                      child: Image.network(
                        category.image!,
                        width: 40,
                        height: 40,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => _buildDefaultIcon(),
                      ),
                    )
                  else
                    _buildDefaultIcon(),

                  const SizedBox(width: 12),

                  // Category name
                  Expanded(
                    child: Text(
                      category.name,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: isChild ? FontWeight.w500 : FontWeight.w600,
                        color: Colors.grey.shade900,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),

            // Slug column
            SizedBox(
              width: 160,
              child: Text(
                '/${category.slug}',
                style: TextStyle(
                  fontSize: 13,
                  color: Colors.grey.shade600,
                  fontFamily: 'monospace',
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),

            // Subcategories column - show names as chips
            Expanded(
              flex: 2,
              child: !isChild && hasChildren
                  ? Wrap(
                      spacing: 6,
                      runSpacing: 4,
                      children: [
                        // Count badge first
                        Container(
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 3),
                          decoration: BoxDecoration(
                            color: Colors.blue.shade100,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: Text(
                            '${category.children.length}',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.bold,
                              color: Colors.blue.shade800,
                            ),
                          ),
                        ),
                        // Subcategory name chips
                        ...category.children.map((child) => Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 3),
                              decoration: BoxDecoration(
                                color: Colors.grey.shade100,
                                borderRadius: BorderRadius.circular(10),
                                border: Border.all(
                                  color: Colors.grey.shade300,
                                  width: 0.5,
                                ),
                              ),
                              child: Text(
                                child.name,
                                style: TextStyle(
                                  fontSize: 11,
                                  color: Colors.grey.shade700,
                                ),
                              ),
                            )),
                      ],
                    )
                  : const Text('—', style: TextStyle(color: Colors.grey)),
            ),

            // Status column
            SizedBox(
              width: 100,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(
                  color: category.isActive
                      ? Colors.green.shade50
                      : Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Text(
                  category.isActive ? 'Active' : 'Hidden',
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w600,
                    color: category.isActive
                        ? Colors.green.shade700
                        : Colors.grey.shade600,
                  ),
                ),
              ),
            ),

            // Actions column
            SizedBox(
              width: 100,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.end,
                children: [
                  IconButton(
                    icon: Icon(
                      category.isActive
                          ? Icons.visibility
                          : Icons.visibility_off,
                      size: 20,
                      color: category.isActive
                          ? Colors.green.shade600
                          : Colors.grey.shade400,
                    ),
                    tooltip: category.isActive ? 'Hide' : 'Show',
                    onPressed: () => _toggleActive(category),
                  ),
                  PopupMenuButton<String>(
                    icon: Icon(Icons.more_vert,
                        size: 20, color: Colors.grey.shade600),
                    onSelected: (value) async {
                      if (value == 'edit') {
                        await _editCategory(category);
                      } else if (value == 'delete') {
                        await _deleteCategory(category.id);
                      }
                    },
                    itemBuilder: (context) => [
                      const PopupMenuItem(
                        value: 'edit',
                        child: Row(
                          children: [
                            Icon(Icons.edit, size: 18),
                            SizedBox(width: 12),
                            Text('Edit'),
                          ],
                        ),
                      ),
                      const PopupMenuItem(
                        value: 'delete',
                        child: Row(
                          children: [
                            Icon(Icons.delete, size: 18, color: Colors.red),
                            SizedBox(width: 12),
                            Text('Delete', style: TextStyle(color: Colors.red)),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDefaultIcon() {
    return Container(
      width: 40,
      height: 40,
      decoration: BoxDecoration(
        color: Colors.grey.shade100,
        borderRadius: BorderRadius.circular(8),
      ),
      child: Icon(
        Icons.category,
        size: 20,
        color: Colors.grey.shade400,
      ),
    );
  }
}
