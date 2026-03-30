import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/product.dart';
import '../models/product_dto_extension.dart';
import '../services/api_service.dart';
import '../providers/catalog_provider.dart';
import '../widgets/product_card.dart';
import '../widgets/app_header.dart';
import '../widgets/modern_drawer.dart';
import '../widgets/top_banner.dart';
import '../theme/app_theme.dart';
import 'product_detail_screen.dart';

class SearchScreen extends StatefulWidget {
  final Function(Product) onAddToCart;

  const SearchScreen({super.key, required this.onAddToCart});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  List<Product> _searchResults = [];
  List<Product> _filteredResults = [];
  String _selectedCategory = 'All';
  RangeValues _priceRange = const RangeValues(0, 500);
  String _sortBy = 'relevance';
  final bool _showFilters = false;
  bool _isLoading = false;

  // Categories will be loaded from API
  List<String> _categories = ['All'];

  final List<Map<String, String>> _sortOptions = [
    {'value': 'relevance', 'label': 'Relevance'},
    {'value': 'price_low', 'label': 'Price: Low to High'},
    {'value': 'price_high', 'label': 'Price: High to Low'},
    {'value': 'newest', 'label': 'Newest'},
  ];

  @override
  void initState() {
    super.initState();
    _loadCategories();
    _loadInitialProducts();
  }

  Future<void> _loadCategories() async {
    // Load categories from API via provider
    final catalogProvider = context.read<CatalogProvider>();
    await catalogProvider.loadCategories();
    final categories = catalogProvider.categories;
    setState(() {
      _categories = ['All', ...categories.map((c) => c.name)];
    });
  }

  Future<void> _loadInitialProducts() async {
    setState(() => _isLoading = true);
    try {
      final result = await ApiService.products.getProducts(limit: 50);
      setState(() {
        _searchResults = result.data.map((dto) => dto.toProduct()).toList();
        _filteredResults = _searchResults;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _searchResults = [];
        _filteredResults = [];
        _isLoading = false;
      });
    }
  }

  Future<void> _performSearch(String query) async {
    setState(() => _isLoading = true);
    try {
      final result = await ApiService.products.getProducts(
        search: query.isEmpty ? null : query,
        limit: 50,
      );
      setState(() {
        _searchResults = result.data.map((dto) => dto.toProduct()).toList();
        _isLoading = false;
      });
      _applyFilters();
    } catch (e) {
      setState(() {
        _searchResults = [];
        _filteredResults = [];
        _isLoading = false;
      });
    }
  }

  void _applyFilters() {
    setState(() {
      _filteredResults = _searchResults.where((product) {
        // Category filter
        if (_selectedCategory != 'All' &&
            product.category != _selectedCategory) {
          return false;
        }

        // Price filter
        if (product.price < _priceRange.start ||
            product.price > _priceRange.end) {
          return false;
        }

        return true;
      }).toList();

      // Apply sorting
      switch (_sortBy) {
        case 'price_low':
          _filteredResults.sort((a, b) => a.price.compareTo(b.price));
          break;
        case 'price_high':
          _filteredResults.sort((a, b) => b.price.compareTo(a.price));
          break;
        case 'newest':
          _filteredResults.sort((a, b) => b.isNew ? 1 : -1);
          break;
        default: // relevance
          break;
      }
    });
  }

  void _resetFilters() {
    setState(() {
      _selectedCategory = 'All';
      _priceRange = const RangeValues(0, 500);
      _sortBy = 'relevance';
      _applyFilters();
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
          // Search Bar
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: TextField(
              controller: _searchController,
              autofocus: true,
              decoration: InputDecoration(
                hintText: 'Search products...',
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          _performSearch('');
                        },
                      )
                    : null,
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                hintStyle: TextStyle(color: Colors.grey[400]),
              ),
              style: const TextStyle(fontSize: 16),
              onChanged: _performSearch,
            ),
          ),
          Expanded(
            child: Column(
              children: [
                // Search Info Bar
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                  color: Colors.grey[100],
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        '${_filteredResults.length} products found',
                        style: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 14,
                        ),
                      ),
                      Row(
                        children: [
                          Text(
                            'Sort by: ',
                            style: TextStyle(
                              color: AppTheme.textSecondary,
                              fontSize: 14,
                            ),
                          ),
                          DropdownButton<String>(
                            value: _sortBy,
                            underline: const SizedBox(),
                            style: const TextStyle(
                              color: Colors.black,
                              fontWeight: FontWeight.w600,
                              fontSize: 14,
                            ),
                            onChanged: (value) {
                              setState(() => _sortBy = value!);
                              _applyFilters();
                            },
                            items: _sortOptions.map((option) {
                              return DropdownMenuItem(
                                value: option['value'],
                                child: Text(option['label']!),
                              );
                            }).toList(),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),

                // Filters Panel
                if (_showFilters) _buildFiltersPanel(),

                // Results Grid
                Expanded(
                  child: _filteredResults.isEmpty
                      ? _buildEmptyState()
                      : GridView.builder(
                          padding: const EdgeInsets.all(20),
                          gridDelegate:
                              SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: _getCrossAxisCount(context),
                            childAspectRatio: 0.58,
                            crossAxisSpacing: 32,
                            mainAxisSpacing: 32,
                          ),
                          itemCount: _filteredResults.length,
                          itemBuilder: (context, index) {
                            final product = _filteredResults[index];
                            return ProductCard(
                              product: product,
                              onTap: () => _openProduct(product),
                              onAddToCart: () => widget.onAddToCart(product),
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

  Widget _buildFiltersPanel() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Text(
                'Filters',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              TextButton(
                onPressed: _resetFilters,
                child: const Text('Reset All'),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Category Filter
          const Text(
            'Category',
            style: TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
          ),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: _categories.map((category) {
              final isSelected = category == _selectedCategory;
              return ChoiceChip(
                label: Text(category),
                selected: isSelected,
                onSelected: (selected) {
                  setState(() => _selectedCategory = category);
                  _applyFilters();
                },
                selectedColor: Theme.of(context).colorScheme.primary,
                labelStyle: TextStyle(
                  color: isSelected ? Colors.white : null,
                  fontWeight: FontWeight.w500,
                ),
              );
            }).toList(),
          ),
          const SizedBox(height: 20),

          // Price Range Filter
          Text(
            'Price Range: \$${_priceRange.start.toInt()} - \$${_priceRange.end.toInt()}',
            style: const TextStyle(
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
          ),
          RangeSlider(
            values: _priceRange,
            min: 0,
            max: 500,
            divisions: 50,
            labels: RangeLabels(
              'AED ${_priceRange.start.toInt()}',
              'AED ${_priceRange.end.toInt()}',
            ),
            onChanged: (values) {
              setState(() => _priceRange = values);
            },
            onChangeEnd: (values) {
              _applyFilters();
            },
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
          Icon(
            Icons.search_off,
            size: 80,
            color: Colors.grey[300],
          ),
          const SizedBox(height: 16),
          const Text(
            'No products found',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            'Try adjusting your filters or search term',
            style: TextStyle(
              color: AppTheme.textSecondary,
            ),
          ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () {
              _searchController.clear();
              _resetFilters();
              _performSearch('');
            },
            child: const Text('Clear All'),
          ),
        ],
      ),
    );
  }

  int _getCrossAxisCount(BuildContext context) {
    final width = MediaQuery.of(context).size.width;
    if (width > 1200) return 5;
    if (width > 900) return 4;
    if (width > 600) return 3;
    return 2;
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }
}
