import 'package:flutter/material.dart';
import '../providers/product_list_provider.dart';
import '../widgets/porto/porto_product_card.dart';

/// Product List Screen - Shows products by collection, category, brand, or search
class ProductListScreen extends StatefulWidget {
  final String? collection; // new-arrivals, best-sellers, sale, featured
  final String? categorySlug;
  final String? subcategoryId; // Subcategory filter
  final String? brandId;
  final String? searchQuery;
  final String? title; // Custom title to display

  const ProductListScreen({
    super.key,
    this.collection,
    this.categorySlug,
    this.subcategoryId,
    this.brandId,
    this.searchQuery,
    this.title,
  });

  @override
  State<ProductListScreen> createState() => _ProductListScreenState();
}

class _ProductListScreenState extends State<ProductListScreen> {
  String _sortBy = 'newest';
  late ProductListProvider _provider;

  @override
  void initState() {
    super.initState();
    _provider = ProductListProvider();
    _loadProducts();
  }

  @override
  void dispose() {
    _provider.dispose();
    super.dispose();
  }

  String get _title {
    // Use custom title if provided
    if (widget.title != null && widget.title!.isNotEmpty) {
      return widget.title!;
    }
    if (widget.collection != null) {
      switch (widget.collection) {
        case 'new-arrivals':
          return 'New Arrivals';
        case 'best-sellers':
          return 'Best Sellers';
        case 'sale':
          return 'On Sale';
        case 'featured':
          return 'Featured Products';
        default:
          return widget.collection!;
      }
    }
    if (widget.searchQuery != null && widget.searchQuery!.isNotEmpty) {
      return 'Search: ${widget.searchQuery}';
    }
    if (widget.brandId != null) {
      return 'Brand Products';
    }
    if (widget.categorySlug != null) {
      // Format the slug for display
      return widget.categorySlug!
          .split('-')
          .map((word) => word.isNotEmpty
              ? '${word[0].toUpperCase()}${word.substring(1)}'
              : '')
          .join(' ');
    }
    return 'Products';
  }

  Future<void> _loadProducts() async {
    bool? isFeatured;
    bool? isNew;
    bool? isBestSeller;
    bool? isOnSale;

    if (widget.collection != null) {
      switch (widget.collection) {
        case 'new-arrivals':
          isNew = true;
          break;
        case 'best-sellers':
          isBestSeller = true;
          break;
        case 'sale':
          isOnSale = true;
          break;
        case 'featured':
          isFeatured = true;
          break;
      }
    }

    // Note: categorySlug needs to be resolved to categoryId through API
    // For now, we pass it as categoryId and let the backend handle slug lookup
    await _provider.loadProducts(
      categoryId: widget.categorySlug, // Backend should support slug lookup
      subcategoryId: widget.subcategoryId,
      search: widget.searchQuery,
      brandId: widget.brandId,
      isFeatured: isFeatured,
      isNew: isNew,
      isBestSeller: isBestSeller,
      isOnSale: isOnSale,
      sortBy: _sortBy == 'price-low'
          ? 'price_asc'
          : _sortBy == 'price-high'
              ? 'price_desc'
              : _sortBy == 'name'
                  ? 'name_asc'
                  : 'newest',
    );

    if (mounted) setState(() {});
  }

  void _sortProducts(String sortBy) {
    setState(() => _sortBy = sortBy);
    _loadProducts();
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 600;
    final isTablet = screenWidth < 1024 && !isMobile;
    final crossAxisCount = isMobile ? 2 : (isTablet ? 3 : 4);
    final products = _provider.products;

    return Scaffold(
      appBar: AppBar(
        title: Text(_title),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1A1A1A),
        elevation: 0,
      ),
      body: Column(
        children: [
          // Filter/Sort bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(bottom: BorderSide(color: Colors.grey[200]!)),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${products.length} Products',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
                DropdownButton<String>(
                  value: _sortBy,
                  underline: const SizedBox.shrink(),
                  items: const [
                    DropdownMenuItem(value: 'newest', child: Text('Newest')),
                    DropdownMenuItem(
                        value: 'price-low', child: Text('Price: Low to High')),
                    DropdownMenuItem(
                        value: 'price-high', child: Text('Price: High to Low')),
                    DropdownMenuItem(value: 'name', child: Text('Name')),
                  ],
                  onChanged: (value) {
                    if (value != null) _sortProducts(value);
                  },
                ),
              ],
            ),
          ),

          // Products grid
          Expanded(
            child: _provider.isLoading
                ? const Center(child: CircularProgressIndicator())
                : products.isEmpty
                    ? _buildEmptyState()
                    : GridView.builder(
                        padding: EdgeInsets.all(isMobile ? 16 : 32),
                        gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: crossAxisCount,
                          crossAxisSpacing: 16,
                          mainAxisSpacing: 16,
                          childAspectRatio: 0.7,
                        ),
                        itemCount: products.length,
                        itemBuilder: (context, index) {
                          return PortoProductCard(
                            product: products[index],
                            onTap: () => Navigator.pushNamed(
                              context,
                              '/product/${products[index].id}',
                            ),
                            onAddToCart: () {
                              // TODO: Add to cart
                            },
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(Icons.inventory_2_outlined, size: 64, color: Colors.grey[400]),
          const SizedBox(height: 16),
          Text(
            'No products found',
            style: TextStyle(
              fontSize: 18,
              color: Colors.grey[600],
            ),
          ),
          const SizedBox(height: 24),
          OutlinedButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Go Back'),
          ),
        ],
      ),
    );
  }
}
