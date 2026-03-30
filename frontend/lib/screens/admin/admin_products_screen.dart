import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart'; // DEBUG: for clipboard
import '../../layouts/admin_layout.dart';
import '../../guards/admin_route_guard.dart';
import '../../services/api_service.dart';
import '../../models/dto/product_dto.dart';

/// Filter options for status
enum _StatusFilter { all, active, draft, outOfStock }

/// Filter options for tags
enum _TagFilter { all, featured, newArrival }

/// Sort options
enum _SortOption { newest, name, price }

/// Admin Products List Screen with search and filters
class AdminProductsScreen extends StatefulWidget {
  const AdminProductsScreen({super.key});

  @override
  State<AdminProductsScreen> createState() => _AdminProductsScreenState();
}

class _AdminProductsScreenState extends State<AdminProductsScreen> {
  // ─────────────────────────────────────────────────────────────────────────
  // EXISTING STATE (unchanged)
  // ─────────────────────────────────────────────────────────────────────────
  bool _isLoading = true;
  List<ProductDto> _products = [];
  String? _error;

  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';
  int _currentPage = 1;
  int _totalPages = 1;
  int _total = 0;

  // ─────────────────────────────────────────────────────────────────────────
  // NEW UI STATE (UI-only filters/sort)
  // ─────────────────────────────────────────────────────────────────────────
  _StatusFilter _statusFilter = _StatusFilter.all;
  _TagFilter _tagFilter = _TagFilter.all;
  _SortOption _sortOption = _SortOption.newest;
  bool _bulkSelectMode = false;
  final Set<String> _selectedIds = {};
  Timer? _debounce;

  // ─────────────────────────────────────────────────────────────────────────
  // DEBUG: Last API request URL (remove this section later)
  // ─────────────────────────────────────────────────────────────────────────
  String? _lastProductsRequestUrl;

  @override
  void initState() {
    super.initState();
    _loadProducts();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  // ─────────────────────────────────────────────────────────────────────────
  // API METHODS (server-side filtering/sorting/pagination)
  // ─────────────────────────────────────────────────────────────────────────
  Future<void> _loadProducts() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      // ─────────────────────────────────────────────────────────────────────
      // DEBUG: Build URL string for display (remove this block later)
      // ─────────────────────────────────────────────────────────────────────
      final statusParam = _getStatusParam();
      final debugParams = <String, String>{
        'page': _currentPage.toString(),
        'limit': '20',
        if (_searchQuery.isNotEmpty) 'search': _searchQuery,
        if (statusParam != null) 'status': statusParam,
        if (_tagFilter == _TagFilter.featured) 'isFeatured': 'true',
        if (_tagFilter == _TagFilter.newArrival) 'isNew': 'true',
        if (_getSortByParam() != null) 'sortBy': _getSortByParam()!,
      };
      final queryString = debugParams.entries
          .map((e) => '${e.key}=${Uri.encodeComponent(e.value)}')
          .join('&');
      setState(() {
        _lastProductsRequestUrl = '/products?$queryString';
      });
      // ─────────────────────────────────────────────────────────────────────

      // Build server-side filter params
      final response = await ApiService.products.getProducts(
        page: _currentPage,
        limit: 20,
        search: _searchQuery.isEmpty ? null : _searchQuery,
        // Status filter → server-side status param
        status: statusParam,
        // Tag filters
        isFeatured: _tagFilter == _TagFilter.featured ? true : null,
        isNew: _tagFilter == _TagFilter.newArrival ? true : null,
        // Sort option → sortBy param
        sortBy: _getSortByParam(),
      );

      setState(() {
        _products = response.data;
        _total = response.meta.total;
        _totalPages = response.meta.totalPages;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  /// Convert sort option to API sortBy param
  String? _getSortByParam() {
    switch (_sortOption) {
      case _SortOption.newest:
        return 'newest';
      case _SortOption.name:
        return 'name_asc';
      case _SortOption.price:
        return 'price_asc';
    }
  }

  /// Convert status filter to API status param
  String? _getStatusParam() {
    switch (_statusFilter) {
      case _StatusFilter.all:
        return null; // No filter
      case _StatusFilter.active:
        return 'active';
      case _StatusFilter.draft:
        return 'draft';
      case _StatusFilter.outOfStock:
        return 'out_of_stock';
    }
  }

  Future<void> _deleteProduct(String productId) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        title: const Text('Delete Product Override'),
        content: const Text(
          'This will remove the product override (featured flags, custom pricing, etc.). '
          'The product will revert to inventory defaults.\n\n'
          'Are you sure?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(context, true),
            style: FilledButton.styleFrom(
              backgroundColor: Colors.red,
            ),
            child: const Text('Delete'),
          ),
        ],
      ),
    );

    if (confirm != true) return;

    try {
      await ApiService.products.deleteProduct(productId);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: const Text('Product override deleted'),
            behavior: SnackBarBehavior.floating,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
        );
      }
      _loadProducts();
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Error: $e'),
            backgroundColor: Colors.red,
            behavior: SnackBarBehavior.floating,
            shape:
                RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
          ),
        );
      }
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // NEW HELPERS
  // ─────────────────────────────────────────────────────────────────────────
  void _onSearchChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 300), () {
      setState(() {
        _searchQuery = value;
        _currentPage = 1;
      });
      _loadProducts();
    });
  }

  void _clearFilters() {
    setState(() {
      _searchController.clear();
      _searchQuery = '';
      _statusFilter = _StatusFilter.all;
      _tagFilter = _TagFilter.all;
      _sortOption = _SortOption.newest;
      _currentPage = 1;
    });
    _loadProducts();
  }

  void _navigateToNewProduct() {
    Navigator.pushNamed(context, '/admin/products/new')
        .then((_) => _loadProducts());
  }

  void _navigateToEditProduct(String productId) {
    Navigator.pushNamed(context, '/admin/products/edit', arguments: productId)
        .then((_) => _loadProducts());
  }

  /// Get filtered products - now fully server-side
  /// No client-side filtering needed since backend handles status param
  List<ProductDto> get _filteredProducts {
    // All filtering is now server-side via status param
    // Just return the products from the API response
    return _products;
  }

  @override
  Widget build(BuildContext context) {
    return AdminRouteGuard(
      child: AdminLayout(
        currentRoute: '/admin/products',
        child: Container(
          color: const Color(0xFFF8F9FA),
          child: Column(
            children: [
              _ProductsHeader(
                total: _total,
                currentPage: _currentPage,
                totalPages: _totalPages,
                onRefresh: _loadProducts,
                onNewProduct: _navigateToNewProduct,
              ),
              _ProductsToolbar(
                searchController: _searchController,
                onSearchChanged: _onSearchChanged,
                onSearchClear: () {
                  _searchController.clear();
                  _onSearchChanged('');
                },
                statusFilter: _statusFilter,
                onStatusChanged: (v) {
                  setState(() {
                    _statusFilter = v;
                    _currentPage = 1;
                  });
                  _loadProducts();
                },
                tagFilter: _tagFilter,
                onTagChanged: (v) {
                  setState(() {
                    _tagFilter = v;
                    _currentPage = 1;
                  });
                  _loadProducts();
                },
                sortOption: _sortOption,
                onSortChanged: (v) {
                  setState(() {
                    _sortOption = v;
                    _currentPage = 1;
                  });
                  _loadProducts();
                },
                bulkSelectMode: _bulkSelectMode,
                onBulkSelectToggle: () => setState(() {
                  _bulkSelectMode = !_bulkSelectMode;
                  _selectedIds.clear();
                }),
              ),
              // ─────────────────────────────────────────────────────────────
              // DEBUG: API URL display (remove this section later)
              // ─────────────────────────────────────────────────────────────
              if (_lastProductsRequestUrl != null)
                Container(
                  margin: const EdgeInsets.fromLTRB(24, 8, 24, 0),
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  decoration: BoxDecoration(
                    color: Colors.amber.shade50,
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: Colors.amber.shade200),
                  ),
                  child: Row(
                    children: [
                      Icon(Icons.bug_report,
                          size: 16, color: Colors.amber.shade700),
                      const SizedBox(width: 8),
                      Text(
                        'DEBUG',
                        style: TextStyle(
                          fontSize: 10,
                          fontWeight: FontWeight.bold,
                          color: Colors.amber.shade800,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          'API: $_lastProductsRequestUrl',
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.grey.shade700,
                            fontFamily: 'monospace',
                          ),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                      IconButton(
                        icon: const Icon(Icons.copy, size: 16),
                        padding: EdgeInsets.zero,
                        constraints: const BoxConstraints(),
                        tooltip: 'Copy URL',
                        onPressed: () {
                          Clipboard.setData(
                            ClipboardData(text: _lastProductsRequestUrl!),
                          );
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('URL copied to clipboard'),
                              duration: Duration(seconds: 1),
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                ),
              // ─────────────────────────────────────────────────────────────
              Expanded(
                child: _buildContent(),
              ),
              _ProductsPagination(
                currentPage: _currentPage,
                totalPages: _totalPages,
                total: _total,
                onPrevious: _currentPage > 1
                    ? () {
                        setState(() => _currentPage--);
                        _loadProducts();
                      }
                    : null,
                onNext: _currentPage < _totalPages
                    ? () {
                        setState(() => _currentPage++);
                        _loadProducts();
                      }
                    : null,
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildContent() {
    if (_isLoading) {
      return const _LoadingPlaceholders();
    }

    if (_error != null) {
      return _ErrorState(error: _error!, onRetry: _loadProducts);
    }

    final products = _filteredProducts;

    if (products.isEmpty) {
      return _EmptyState(
        hasFilters: _searchQuery.isNotEmpty ||
            _statusFilter != _StatusFilter.all ||
            _tagFilter != _TagFilter.all,
        onClearFilters: _clearFilters,
        onNewProduct: _navigateToNewProduct,
      );
    }

    return LayoutBuilder(
      builder: (context, constraints) {
        if (constraints.maxWidth >= 1000) {
          return _ProductsTable(
            products: products,
            bulkSelectMode: _bulkSelectMode,
            selectedIds: _selectedIds,
            onSelectChanged: (id, selected) {
              setState(() {
                if (selected) {
                  _selectedIds.add(id);
                } else {
                  _selectedIds.remove(id);
                }
              });
            },
            onEdit: _navigateToEditProduct,
            onDelete: _deleteProduct,
          );
        } else {
          return _ProductsCardsList(
            products: products,
            onEdit: _navigateToEditProduct,
            onDelete: _deleteProduct,
          );
        }
      },
    );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PRIVATE WIDGETS
// ═══════════════════════════════════════════════════════════════════════════

/// Page header with title, subtitle, and actions
class _ProductsHeader extends StatelessWidget {
  final int total;
  final int currentPage;
  final int totalPages;
  final VoidCallback onRefresh;
  final VoidCallback onNewProduct;

  const _ProductsHeader({
    required this.total,
    required this.currentPage,
    required this.totalPages,
    required this.onRefresh,
    required this.onNewProduct,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.fromLTRB(24, 24, 24, 16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Products',
                  style: TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.bold,
                    letterSpacing: -0.5,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '$total products • Page $currentPage of $totalPages',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
          IconButton.outlined(
            onPressed: onRefresh,
            icon: const Icon(Icons.refresh_rounded),
            tooltip: 'Refresh',
          ),
          const SizedBox(width: 12),
          FilledButton.icon(
            onPressed: onNewProduct,
            icon: const Icon(Icons.add_rounded, size: 20),
            label: const Text('New Product'),
            style: FilledButton.styleFrom(
              backgroundColor: Colors.black,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(10),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Toolbar with search, filters, and sort
class _ProductsToolbar extends StatelessWidget {
  final TextEditingController searchController;
  final ValueChanged<String> onSearchChanged;
  final VoidCallback onSearchClear;
  final _StatusFilter statusFilter;
  final ValueChanged<_StatusFilter> onStatusChanged;
  final _TagFilter tagFilter;
  final ValueChanged<_TagFilter> onTagChanged;
  final _SortOption sortOption;
  final ValueChanged<_SortOption> onSortChanged;
  final bool bulkSelectMode;
  final VoidCallback onBulkSelectToggle;

  const _ProductsToolbar({
    required this.searchController,
    required this.onSearchChanged,
    required this.onSearchClear,
    required this.statusFilter,
    required this.onStatusChanged,
    required this.tagFilter,
    required this.onTagChanged,
    required this.sortOption,
    required this.onSortChanged,
    required this.bulkSelectMode,
    required this.onBulkSelectToggle,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.fromLTRB(24, 16, 24, 0),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Search row
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: searchController,
                  onChanged: onSearchChanged,
                  decoration: InputDecoration(
                    hintText: 'Search products by name, SKU...',
                    hintStyle: TextStyle(color: Colors.grey[400]),
                    prefixIcon:
                        Icon(Icons.search_rounded, color: Colors.grey[500]),
                    suffixIcon: searchController.text.isNotEmpty
                        ? IconButton(
                            icon: Icon(Icons.close_rounded,
                                color: Colors.grey[500]),
                            onPressed: onSearchClear,
                          )
                        : null,
                    filled: true,
                    fillColor: const Color(0xFFF5F5F5),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(10),
                      borderSide: BorderSide.none,
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                      horizontal: 16,
                      vertical: 14,
                    ),
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
          // Filters row
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            child: Row(
              children: [
                // Status segmented button
                _buildSegmentedSection(
                  'Status',
                  SegmentedButton<_StatusFilter>(
                    segments: const [
                      ButtonSegment(
                          value: _StatusFilter.all, label: Text('All')),
                      ButtonSegment(
                          value: _StatusFilter.active, label: Text('Active')),
                      ButtonSegment(
                          value: _StatusFilter.draft, label: Text('Draft')),
                      ButtonSegment(
                          value: _StatusFilter.outOfStock,
                          label: Text('Out of Stock')),
                    ],
                    selected: {statusFilter},
                    onSelectionChanged: (v) => onStatusChanged(v.first),
                    style: ButtonStyle(
                      visualDensity: VisualDensity.compact,
                      textStyle: WidgetStateProperty.all(
                        const TextStyle(fontSize: 12),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                // Tag filter chips
                _buildSegmentedSection(
                  'Tags',
                  Wrap(
                    spacing: 8,
                    children: [
                      FilterChip(
                        label: const Text('Featured'),
                        selected: tagFilter == _TagFilter.featured,
                        onSelected: (v) => onTagChanged(
                          v ? _TagFilter.featured : _TagFilter.all,
                        ),
                        showCheckmark: false,
                        selectedColor: Colors.amber.shade100,
                      ),
                      FilterChip(
                        label: const Text('New'),
                        selected: tagFilter == _TagFilter.newArrival,
                        onSelected: (v) => onTagChanged(
                          v ? _TagFilter.newArrival : _TagFilter.all,
                        ),
                        showCheckmark: false,
                        selectedColor: Colors.green.shade100,
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: 16),
                // Sort dropdown
                _buildSegmentedSection(
                  'Sort by',
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    decoration: BoxDecoration(
                      color: const Color(0xFFF5F5F5),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: DropdownButtonHideUnderline(
                      child: DropdownButton<_SortOption>(
                        value: sortOption,
                        items: const [
                          DropdownMenuItem(
                            value: _SortOption.newest,
                            child: Text('Newest'),
                          ),
                          DropdownMenuItem(
                            value: _SortOption.name,
                            child: Text('Name'),
                          ),
                          DropdownMenuItem(
                            value: _SortOption.price,
                            child: Text('Price'),
                          ),
                        ],
                        onChanged: (v) => onSortChanged(v!),
                        style: const TextStyle(
                            fontSize: 14, color: Colors.black87),
                        icon: const Icon(Icons.keyboard_arrow_down_rounded),
                      ),
                    ),
                  ),
                ),
                const SizedBox(width: 16),
                // Bulk select toggle
                _buildSegmentedSection(
                  'Bulk',
                  IconButton.outlined(
                    onPressed: onBulkSelectToggle,
                    icon: Icon(
                      bulkSelectMode
                          ? Icons.check_box_rounded
                          : Icons.check_box_outline_blank_rounded,
                      size: 20,
                    ),
                    tooltip: 'Toggle bulk select',
                    style: IconButton.styleFrom(
                      backgroundColor: bulkSelectMode
                          ? Colors.blue.shade50
                          : Colors.transparent,
                      side: BorderSide(
                        color:
                            bulkSelectMode ? Colors.blue : Colors.grey.shade300,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSegmentedSection(String label, Widget child) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: TextStyle(
            fontSize: 11,
            fontWeight: FontWeight.w600,
            color: Colors.grey[600],
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 6),
        child,
      ],
    );
  }
}

/// Desktop table view for products
class _ProductsTable extends StatelessWidget {
  final List<ProductDto> products;
  final bool bulkSelectMode;
  final Set<String> selectedIds;
  final void Function(String id, bool selected) onSelectChanged;
  final ValueChanged<String> onEdit;
  final ValueChanged<String> onDelete;

  const _ProductsTable({
    required this.products,
    required this.bulkSelectMode,
    required this.selectedIds,
    required this.onSelectChanged,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        children: [
          // Table header
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: const Color(0xFFFAFAFA),
              borderRadius:
                  const BorderRadius.vertical(top: Radius.circular(12)),
              border: Border(
                bottom: BorderSide(color: Colors.grey.shade200),
              ),
            ),
            child: Row(
              children: [
                if (bulkSelectMode)
                  SizedBox(
                    width: 48,
                    child: Checkbox(
                      value: selectedIds.length == products.length &&
                          products.isNotEmpty,
                      onChanged: (v) {
                        for (final p in products) {
                          onSelectChanged(p.id, v ?? false);
                        }
                      },
                    ),
                  ),
                const SizedBox(width: 72), // Thumbnail space
                const Expanded(
                  flex: 3,
                  child: Text('PRODUCT', style: _headerStyle),
                ),
                const Expanded(
                  flex: 1,
                  child: Text('SKU', style: _headerStyle),
                ),
                const Expanded(
                  flex: 1,
                  child: Text('PRICE', style: _headerStyle),
                ),
                const Expanded(
                  flex: 1,
                  child: Text('STOCK', style: _headerStyle),
                ),
                const Expanded(
                  flex: 2,
                  child: Text('STATUS', style: _headerStyle),
                ),
                const SizedBox(width: 48), // Actions space
              ],
            ),
          ),
          // Table body
          Expanded(
            child: ListView.separated(
              itemCount: products.length,
              separatorBuilder: (_, __) =>
                  Divider(height: 1, color: Colors.grey.shade100),
              itemBuilder: (context, index) {
                final product = products[index];
                final isSelected = selectedIds.contains(product.id);
                return _ProductTableRow(
                  product: product,
                  bulkSelectMode: bulkSelectMode,
                  isSelected: isSelected,
                  onSelectChanged: (v) => onSelectChanged(product.id, v),
                  onEdit: () => onEdit(product.id),
                  onDelete: () => onDelete(product.id),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  static const _headerStyle = TextStyle(
    fontSize: 11,
    fontWeight: FontWeight.w600,
    color: Colors.grey,
    letterSpacing: 0.5,
  );
}

/// Single table row
class _ProductTableRow extends StatelessWidget {
  final ProductDto product;
  final bool bulkSelectMode;
  final bool isSelected;
  final ValueChanged<bool> onSelectChanged;
  final VoidCallback onEdit;
  final VoidCallback onDelete;

  const _ProductTableRow({
    required this.product,
    required this.bulkSelectMode,
    required this.isSelected,
    required this.onSelectChanged,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onEdit,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        color: isSelected ? Colors.blue.shade50 : Colors.transparent,
        child: Row(
          children: [
            if (bulkSelectMode)
              SizedBox(
                width: 48,
                child: Checkbox(
                  value: isSelected,
                  onChanged: (v) => onSelectChanged(v ?? false),
                ),
              ),
            // Thumbnail
            ClipRRect(
              borderRadius: BorderRadius.circular(8),
              child: Container(
                width: 56,
                height: 56,
                color: Colors.grey.shade100,
                child: Image.network(
                  product.imageUrl,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Icon(
                    Icons.image_not_supported_outlined,
                    color: Colors.grey.shade400,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 16),
            // Name
            Expanded(
              flex: 3,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    product.name,
                    style: const TextStyle(fontWeight: FontWeight.w600),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                  if (product.category?.name != null)
                    Text(
                      product.category!.name,
                      style:
                          TextStyle(fontSize: 12, color: Colors.grey.shade600),
                    ),
                ],
              ),
            ),
            // SKU
            Expanded(
              flex: 1,
              child: Text(
                product.sku,
                style: TextStyle(fontSize: 13, color: Colors.grey.shade700),
              ),
            ),
            // Price
            Expanded(
              flex: 1,
              child: Text(
                '\$${product.price.toStringAsFixed(2)}',
                style: const TextStyle(fontWeight: FontWeight.w600),
              ),
            ),
            // Stock
            Expanded(
              flex: 1,
              child: _buildStockBadge(),
            ),
            // Status badges
            Expanded(
              flex: 2,
              child: Wrap(
                spacing: 6,
                runSpacing: 4,
                children: [
                  if (product.isActive)
                    _buildChip('Active', Colors.green)
                  else
                    _buildChip('Draft', Colors.grey),
                  if (product.isFeatured) _buildChip('Featured', Colors.amber),
                  if (product.isNew) _buildChip('New', Colors.blue),
                  if (product.isBestSeller)
                    _buildChip('Best Seller', Colors.purple),
                ],
              ),
            ),
            // Actions
            PopupMenuButton<String>(
              icon: const Icon(Icons.more_vert_rounded, size: 20),
              onSelected: (value) {
                if (value == 'edit') onEdit();
                if (value == 'delete') onDelete();
              },
              itemBuilder: (context) => [
                const PopupMenuItem(
                  value: 'edit',
                  child: Row(
                    children: [
                      Icon(Icons.edit_rounded, size: 18),
                      SizedBox(width: 12),
                      Text('Edit'),
                    ],
                  ),
                ),
                const PopupMenuItem(
                  value: 'delete',
                  child: Row(
                    children: [
                      Icon(Icons.delete_rounded, size: 18, color: Colors.red),
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
    );
  }

  Widget _buildStockBadge() {
    final stock = product.stock;
    Color color;
    String text;
    if (stock <= 0) {
      color = Colors.red;
      text = 'Out';
    } else if (stock < 10) {
      color = Colors.orange;
      text = '$stock';
    } else {
      color = Colors.green;
      text = '$stock';
    }
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        text,
        style:
            TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: color),
      ),
    );
  }

  Widget _buildChip(String label, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(
        label,
        style: TextStyle(
          fontSize: 11,
          fontWeight: FontWeight.w600,
          color: HSLColor.fromColor(color).withLightness(0.3).toColor(),
        ),
      ),
    );
  }
}

/// Mobile/tablet card list view
class _ProductsCardsList extends StatelessWidget {
  final List<ProductDto> products;
  final ValueChanged<String> onEdit;
  final ValueChanged<String> onDelete;

  const _ProductsCardsList({
    required this.products,
    required this.onEdit,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: products.length,
      itemBuilder: (context, index) {
        final product = products[index];
        return Container(
          margin: const EdgeInsets.only(bottom: 12),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(12),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: InkWell(
            onTap: () => onEdit(product.id),
            borderRadius: BorderRadius.circular(12),
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  // Thumbnail
                  ClipRRect(
                    borderRadius: BorderRadius.circular(10),
                    child: Container(
                      width: 72,
                      height: 72,
                      color: Colors.grey.shade100,
                      child: Image.network(
                        product.imageUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (_, __, ___) => Icon(
                          Icons.image_not_supported_outlined,
                          color: Colors.grey.shade400,
                        ),
                      ),
                    ),
                  ),
                  const SizedBox(width: 16),
                  // Details
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          product.name,
                          style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 15,
                          ),
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 4),
                        Text(
                          'SKU: ${product.sku}',
                          style: TextStyle(
                              fontSize: 12, color: Colors.grey.shade600),
                        ),
                        const SizedBox(height: 6),
                        Row(
                          children: [
                            Text(
                              '\$${product.price.toStringAsFixed(2)}',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                            const SizedBox(width: 12),
                            if (product.isFeatured)
                              _buildMiniChip('Featured', Colors.amber),
                            if (product.isNew)
                              _buildMiniChip('New', Colors.blue),
                          ],
                        ),
                      ],
                    ),
                  ),
                  // Actions
                  PopupMenuButton<String>(
                    icon: const Icon(Icons.more_vert_rounded),
                    onSelected: (value) {
                      if (value == 'edit') onEdit(product.id);
                      if (value == 'delete') onDelete(product.id);
                    },
                    itemBuilder: (context) => [
                      const PopupMenuItem(
                        value: 'edit',
                        child: Row(
                          children: [
                            Icon(Icons.edit_rounded, size: 18),
                            SizedBox(width: 12),
                            Text('Edit'),
                          ],
                        ),
                      ),
                      const PopupMenuItem(
                        value: 'delete',
                        child: Row(
                          children: [
                            Icon(Icons.delete_rounded,
                                size: 18, color: Colors.red),
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
          ),
        );
      },
    );
  }

  Widget _buildMiniChip(String label, Color color) {
    return Container(
      margin: const EdgeInsets.only(right: 6),
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: color.withOpacity(0.12),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: TextStyle(
            fontSize: 10,
            fontWeight: FontWeight.w600,
            color: HSLColor.fromColor(color).withLightness(0.3).toColor()),
      ),
    );
  }
}

/// Loading skeleton placeholders
class _LoadingPlaceholders extends StatelessWidget {
  const _LoadingPlaceholders();

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
      ),
      child: ListView.separated(
        padding: const EdgeInsets.all(16),
        itemCount: 8,
        separatorBuilder: (_, __) => const SizedBox(height: 16),
        itemBuilder: (context, index) {
          return Row(
            children: [
              // Thumbnail placeholder
              Container(
                width: 56,
                height: 56,
                decoration: BoxDecoration(
                  color: Colors.grey.shade200,
                  borderRadius: BorderRadius.circular(8),
                ),
              ),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      height: 14,
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade200,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                    const SizedBox(height: 8),
                    Container(
                      height: 12,
                      width: 120,
                      decoration: BoxDecoration(
                        color: Colors.grey.shade100,
                        borderRadius: BorderRadius.circular(4),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 16),
              Container(
                height: 24,
                width: 60,
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(6),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

/// Error state widget
class _ErrorState extends StatelessWidget {
  final String error;
  final VoidCallback onRetry;

  const _ErrorState({required this.error, required this.onRetry});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.red.shade50,
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.error_outline_rounded,
                  size: 48, color: Colors.red.shade400),
            ),
            const SizedBox(height: 24),
            const Text(
              'Something went wrong',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              error,
              style: TextStyle(color: Colors.grey.shade600),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh_rounded, size: 18),
              label: const Text('Try Again'),
              style: FilledButton.styleFrom(
                backgroundColor: Colors.black,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Empty state widget
class _EmptyState extends StatelessWidget {
  final bool hasFilters;
  final VoidCallback onClearFilters;
  final VoidCallback onNewProduct;

  const _EmptyState({
    required this.hasFilters,
    required this.onClearFilters,
    required this.onNewProduct,
  });

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(24),
              decoration: BoxDecoration(
                color: Colors.grey.shade100,
                shape: BoxShape.circle,
              ),
              child: Icon(
                hasFilters
                    ? Icons.filter_list_off_rounded
                    : Icons.inventory_2_outlined,
                size: 56,
                color: Colors.grey.shade400,
              ),
            ),
            const SizedBox(height: 24),
            Text(
              hasFilters ? 'No products match your filters' : 'No products yet',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              hasFilters
                  ? 'Try adjusting your search or filters'
                  : 'Add your first product to get started',
              style: TextStyle(color: Colors.grey.shade600),
            ),
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                if (hasFilters) ...[
                  OutlinedButton.icon(
                    onPressed: onClearFilters,
                    icon: const Icon(Icons.clear_all_rounded, size: 18),
                    label: const Text('Clear Filters'),
                  ),
                  const SizedBox(width: 12),
                ],
                FilledButton.icon(
                  onPressed: onNewProduct,
                  icon: const Icon(Icons.add_rounded, size: 18),
                  label: const Text('New Product'),
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.black,
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

/// Pagination controls
class _ProductsPagination extends StatelessWidget {
  final int currentPage;
  final int totalPages;
  final int total;
  final VoidCallback? onPrevious;
  final VoidCallback? onNext;

  const _ProductsPagination({
    required this.currentPage,
    required this.totalPages,
    required this.total,
    this.onPrevious,
    this.onNext,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            'Showing page $currentPage of $totalPages ($total total)',
            style: TextStyle(color: Colors.grey.shade600, fontSize: 13),
          ),
          Row(
            children: [
              IconButton.outlined(
                onPressed: onPrevious,
                icon: const Icon(Icons.chevron_left_rounded, size: 20),
                tooltip: 'Previous page',
              ),
              Container(
                margin: const EdgeInsets.symmetric(horizontal: 12),
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Text(
                  '$currentPage / $totalPages',
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
              ),
              IconButton.outlined(
                onPressed: onNext,
                icon: const Icon(Icons.chevron_right_rounded, size: 20),
                tooltip: 'Next page',
              ),
            ],
          ),
        ],
      ),
    );
  }
}
