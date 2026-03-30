import 'package:flutter/material.dart';
import '../models/category.dart';
import '../models/product.dart';
import '../models/product_dto_extension.dart';
import '../services/api_service.dart';
import '../widgets/product_card.dart';
import '../widgets/app_header.dart';
import '../widgets/modern_drawer.dart';
import '../widgets/top_banner.dart';
import 'product_detail_screen.dart';

class CategoryScreen extends StatefulWidget {
  final Category category;

  const CategoryScreen({
    super.key,
    required this.category,
  });

  @override
  State<CategoryScreen> createState() => _CategoryScreenState();
}

class _CategoryScreenState extends State<CategoryScreen> {
  String _sortBy = 'featured';
  List<Product> _products = [];
  bool _isLoading = true;
  String? _errorMessage;
  String? _selectedSubcategory;
  List<dynamic> _subcategories = [];

  // Filter options
  RangeValues _priceRange = const RangeValues(0, 1000);
  final Set<String> _selectedBrands = {};

  @override
  void initState() {
    super.initState();
    _loadSubcategories();
    _loadProducts();
  }

  Future<void> _loadSubcategories() async {
    try {
      // Load category with children from API
      final category =
          await ApiService.categories.getCategory(widget.category.id);
      setState(() {
        // Use children array from hierarchical API response
        _subcategories = category.children ?? category.subcategories ?? [];
      });
    } catch (e) {
      // Silently fail - subcategories are optional
      debugPrint('Failed to load subcategories: $e');
    }
  }

  Future<void> _loadProducts() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // Fetch products from API - if subcategory selected, filter by it; otherwise by parent category
      final categoryIdToFilter = _selectedSubcategory ?? widget.category.id;

      final result = await ApiService.products.getProducts(
        categoryId: categoryIdToFilter,
        minPrice: _priceRange.start,
        maxPrice: _priceRange.end,
        limit: 100, // Get all products for client-side filtering
      );

      setState(() {
        _products = result.data
            .map((dto) => dto.toProduct())
            .where((p) =>
                _selectedBrands.isEmpty || _selectedBrands.contains(p.brand))
            .toList();
        _sortProducts();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _isLoading = false;
        _errorMessage = 'Failed to load products: $e';
        _products = [];
      });
    }
  }

  void _sortProducts() {
    setState(() {
      switch (_sortBy) {
        case 'price_low':
          _products.sort((a, b) => a.price.compareTo(b.price));
          break;
        case 'price_high':
          _products.sort((a, b) => b.price.compareTo(a.price));
          break;
        case 'name':
          _products.sort((a, b) => a.name.compareTo(b.name));
          break;
        default:
          // featured - no sorting needed
          break;
      }
    });
  }

  void _openProduct(Product product) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ProductDetailScreen(
          product: product,
        ),
      ),
    );
  }

  void _addToCart(Product product) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${product.name} added to cart'),
        behavior: SnackBarBehavior.floating,
        duration: const Duration(seconds: 2),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const ModernDrawer(),
      appBar: AppHeader(
        onCartPressed: () => Navigator.pushNamed(context, '/cart'),
        onSearchPressed: () {},
        onFavoritesPressed: () => Navigator.pushNamed(context, '/favorites'),
      ),
      body: Column(
        children: [
          const TopBanner(),
          // Category Title
          Container(
            padding: const EdgeInsets.symmetric(vertical: 16),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(
                bottom: BorderSide(color: Colors.grey[200]!, width: 1),
              ),
            ),
            child: Center(
              child: Text(
                widget.category.name.toUpperCase(),
                style: const TextStyle(
                  fontFamily: 'WorkSans',
                  fontSize: 20,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 3,
                  color: Colors.black,
                ),
              ),
            ),
          ),
          // Dynamic Subcategories Banner - from API
          if (_subcategories.isNotEmpty)
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 24),
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border(
                  bottom: BorderSide(color: Colors.grey[200]!, width: 1),
                ),
              ),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildSubcategoryChip(
                        'All ${widget.category.name}', null, '📦'),
                    ..._subcategories.map((sub) {
                      final name = sub.name?.toString() ?? '';
                      final id = sub.id?.toString() ?? '';
                      return _buildSubcategoryChip(name, id, '📁');
                    }),
                  ],
                ),
              ),
            ),
          // Sort Options
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 20),
            decoration: BoxDecoration(
              color: Colors.white,
              border: Border(
                bottom: BorderSide(color: Colors.grey[300]!, width: 1),
              ),
            ),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  'Sort by:',
                  style: TextStyle(
                    fontFamily: 'WorkSans',
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: Colors.black,
                  ),
                ),
                DropdownButton<String>(
                  value: _sortBy,
                  underline: Container(),
                  style: TextStyle(
                    fontFamily: 'WorkSans',
                    fontSize: 14,
                    fontWeight: FontWeight.w400,
                    color: Colors.black,
                  ),
                  onChanged: (value) {
                    if (value != null) {
                      setState(() {
                        _sortBy = value;
                        _sortProducts();
                      });
                    }
                  },
                  items: const [
                    DropdownMenuItem(
                      value: 'featured',
                      child: Text('Featured'),
                    ),
                    DropdownMenuItem(
                      value: 'price_low',
                      child: Text('Price: Low to High'),
                    ),
                    DropdownMenuItem(
                      value: 'price_high',
                      child: Text('Price: High to Low'),
                    ),
                    DropdownMenuItem(
                      value: 'name',
                      child: Text('Name'),
                    ),
                  ],
                ),
              ],
            ),
          ),

          // Products Grid with Filters
          Expanded(
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Left Sidebar - Filters
                Container(
                  width: 280,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border(
                      right: BorderSide(color: Colors.grey[300]!, width: 1),
                    ),
                  ),
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Filter Header
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'FILTERS',
                              style: TextStyle(
                                fontFamily: 'WorkSans',
                                fontSize: 16,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 1.5,
                              ),
                            ),
                            TextButton(
                              onPressed: () {
                                setState(() {
                                  _priceRange = const RangeValues(0, 1000);
                                  _selectedBrands.clear();
                                  _loadProducts();
                                });
                              },
                              child: Text(
                                'Clear All',
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.blue[700],
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 24),

                        // Price Range Filter
                        Text(
                          'PRICE RANGE',
                          style: TextStyle(
                            fontFamily: 'WorkSans',
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 1,
                          ),
                        ),
                        const SizedBox(height: 12),
                        RangeSlider(
                          values: _priceRange,
                          min: 0,
                          max: 1000,
                          divisions: 20,
                          labels: RangeLabels(
                            'AED ${_priceRange.start.round()}',
                            'AED ${_priceRange.end.round()}',
                          ),
                          onChanged: (values) {
                            setState(() {
                              _priceRange = values;
                            });
                          },
                          onChangeEnd: (values) {
                            _loadProducts();
                          },
                        ),
                        Text(
                          'AED ${_priceRange.start.round()} - AED ${_priceRange.end.round()}',
                          style: TextStyle(
                            fontSize: 12,
                            color: Colors.grey[600],
                          ),
                        ),
                        const SizedBox(height: 24),
                        const Divider(),
                        const SizedBox(height: 24),

                        // Brand Filter
                        Text(
                          'BRAND',
                          style: TextStyle(
                            fontFamily: 'WorkSans',
                            fontSize: 13,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 1,
                          ),
                        ),
                        const SizedBox(height: 12),
                        ...['Eva Solo', 'Joseph Joseph', 'Nordic Kitchen']
                            .map((brand) {
                          return CheckboxListTile(
                            dense: true,
                            contentPadding: EdgeInsets.zero,
                            title: Text(
                              brand,
                              style: TextStyle(fontSize: 13),
                            ),
                            value: _selectedBrands.contains(brand),
                            onChanged: (bool? value) {
                              setState(() {
                                if (value == true) {
                                  _selectedBrands.add(brand);
                                } else {
                                  _selectedBrands.remove(brand);
                                }
                                _loadProducts();
                              });
                            },
                          );
                        }),
                      ],
                    ),
                  ),
                ),

                // Right Side - Products Grid
                Expanded(
                  child: _products.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.shopping_basket_outlined,
                                size: 64,
                                color: Colors.grey[400],
                              ),
                              const SizedBox(height: 16),
                              Text(
                                'No products match your filters',
                                style: TextStyle(
                                  fontFamily: 'WorkSans',
                                  fontSize: 16,
                                  fontWeight: FontWeight.w400,
                                  color: Colors.grey[600],
                                ),
                              ),
                            ],
                          ),
                        )
                      : LayoutBuilder(
                          builder: (context, constraints) {
                            // Responsive grid columns
                            int crossAxisCount;
                            if (constraints.maxWidth < 600) {
                              crossAxisCount = 2; // Mobile
                            } else if (constraints.maxWidth < 900) {
                              crossAxisCount = 3; // Tablet
                            } else {
                              crossAxisCount = 4; // Desktop
                            }

                            return GridView.builder(
                              padding: EdgeInsets.all(
                                  constraints.maxWidth < 600 ? 16 : 30),
                              gridDelegate:
                                  SliverGridDelegateWithFixedCrossAxisCount(
                                crossAxisCount: crossAxisCount,
                                childAspectRatio: 0.65,
                                crossAxisSpacing:
                                    constraints.maxWidth < 600 ? 12 : 16,
                                mainAxisSpacing:
                                    constraints.maxWidth < 600 ? 16 : 24,
                              ),
                              itemCount: _products.length,
                              itemBuilder: (context, index) {
                                final product = _products[index];
                                return ProductCard(
                                  product: product,
                                  onTap: () => _openProduct(product),
                                  onAddToCart: () => _addToCart(product),
                                );
                              },
                            );
                          },
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSubcategoryChip(
      String label, String? subcategoryValue, String imageOrEmoji) {
    final isSelected = _selectedSubcategory == subcategoryValue;
    final isImage = imageOrEmoji.startsWith('http');

    return Container(
      width: 90,
      margin: const EdgeInsets.only(right: 16),
      child: InkWell(
        onTap: () {
          setState(() {
            _selectedSubcategory = subcategoryValue;
            _loadProducts();
          });
        },
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Container(
              width: 90,
              height: 90,
              decoration: BoxDecoration(
                color: Colors.white,
                border: Border.all(
                  color: isSelected ? Colors.black : Colors.grey[300]!,
                  width: isSelected ? 2 : 1,
                ),
                borderRadius: BorderRadius.circular(12),
                boxShadow: isSelected
                    ? [
                        BoxShadow(
                          color: Colors.black.withOpacity(0.1),
                          blurRadius: 8,
                          offset: Offset(0, 2),
                        ),
                      ]
                    : [],
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(11),
                child: isImage
                    ? Image.network(
                        imageOrEmoji,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Center(
                            child: Icon(
                              Icons.image_not_supported,
                              color: Colors.grey[400],
                              size: 32,
                            ),
                          );
                        },
                      )
                    : Center(
                        child: Text(
                          imageOrEmoji,
                          style: TextStyle(fontSize: 40),
                        ),
                      ),
              ),
            ),
            const SizedBox(height: 8),
            SizedBox(
              width: 90,
              height: 32,
              child: Text(
                label,
                textAlign: TextAlign.center,
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
                style: TextStyle(
                  fontFamily: 'WorkSans',
                  fontSize: 12,
                  fontWeight: isSelected ? FontWeight.w600 : FontWeight.w400,
                  color: isSelected ? Colors.black : Colors.black87,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
