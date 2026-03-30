import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../models/product.dart';
import '../models/product_dto_extension.dart';
import '../core/dto/catalog_dto.dart' show CategoryDto;
import '../services/api_service.dart';
import '../widgets/app_header.dart';
import '../widgets/modern_drawer.dart';
import '../widgets/top_banner.dart';
import '../widgets/cart_dialog.dart';
import '../providers/cart_provider.dart';
import '../providers/catalog_provider.dart';
import '../providers/favorites_provider.dart';
import '../providers/auth_provider.dart';
import 'cart_screen.dart';
import 'checkout_screen.dart';

/// Static cache for categories tree to avoid refetching
class _CategoryTreeCache {
  static List<CategoryDto>? _cachedTree;
  static DateTime? _cacheTime;
  static const Duration _cacheDuration = Duration(minutes: 10);

  static List<CategoryDto>? get tree {
    if (_cachedTree != null && _cacheTime != null) {
      if (DateTime.now().difference(_cacheTime!) < _cacheDuration) {
        return _cachedTree;
      }
    }
    return null;
  }

  static void set(List<CategoryDto> tree) {
    _cachedTree = tree;
    _cacheTime = DateTime.now();
  }
}

class ProductDetailScreen extends StatefulWidget {
  final Product product;

  const ProductDetailScreen({
    super.key,
    required this.product,
  });

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  int _selectedImageIndex = 0;
  int _quantity = 1;
  String _selectedTab = 'description';
  List<Product>? _relatedProductsCache;
  String? _categoryBreadcrumbFromTree; // Breadcrumb computed from DB tree

  @override
  void initState() {
    super.initState();
    _loadCategoryBreadcrumb();
  }

  /// Load category breadcrumb from DB categories tree
  Future<void> _loadCategoryBreadcrumb() async {
    final categoryId = widget.product.categoryId;
    if (categoryId == null || categoryId.isEmpty) return;

    try {
      // Use cached tree if available
      List<CategoryDto> tree = _CategoryTreeCache.tree ?? [];
      if (tree.isEmpty) {
        tree = await ApiService.categories.getCategories();
        _CategoryTreeCache.set(tree);
      }

      // Find category and compute breadcrumb
      final breadcrumb = _computeBreadcrumbFromTree(tree, categoryId);
      if (breadcrumb != null && mounted) {
        setState(() {
          _categoryBreadcrumbFromTree = breadcrumb;
        });
      }
    } catch (e) {
      // Category breadcrumb load error - non-critical
    }
  }

  /// Compute breadcrumb path from categories tree
  String? _computeBreadcrumbFromTree(
      List<CategoryDto> tree, String categoryId) {
    final path = <String>[];
    if (_findCategoryPath(tree, categoryId, path)) {
      return path.join(' > ');
    }
    return null;
  }

  /// Recursively find category and build path
  bool _findCategoryPath(
      List<CategoryDto> categories, String targetId, List<String> path) {
    for (final category in categories) {
      path.add(category.name);
      if (category.id == targetId) {
        return true;
      }
      if (category.children.isNotEmpty) {
        if (_findCategoryPath(category.children, targetId, path)) {
          return true;
        }
      }
      path.removeLast();
    }
    return false;
  }

  Future<List<Product>> _fetchRelatedProducts(String? categoryId) async {
    // Return cached if available
    if (_relatedProductsCache != null) return _relatedProductsCache!;

    try {
      final result = await ApiService.products.getProducts(
        categoryId: categoryId,
        limit: 5, // Get 5 to filter out current product
      );

      _relatedProductsCache = result.data
          .where((p) => p.id != widget.product.id)
          .take(4)
          .map((dto) => dto.toProduct())
          .toList();

      return _relatedProductsCache!;
    } catch (e) {
      return [];
    }
  }

  List<String> get _images {
    // Use the new effectiveGalleryImages getter which prefers galleryImageUrls
    return widget.product.effectiveGalleryImages;
  }

  /// Build category breadcrumb - prefer DB tree lookup, fallback to string fields
  Widget _buildCategoryBreadcrumb() {
    // Prefer tree-based breadcrumb if available
    if (_categoryBreadcrumbFromTree != null &&
        _categoryBreadcrumbFromTree!.isNotEmpty) {
      final parts = _categoryBreadcrumbFromTree!.split(' > ');
      return _buildBreadcrumbWidget(parts, isFromTree: true);
    }

    // Fallback to old string-based breadcrumb
    final category = widget.product.category;
    final subcategory = widget.product.subcategory;

    if (category.isEmpty) {
      return const SizedBox.shrink();
    }

    final List<String> parts = [category];
    if (subcategory != null && subcategory.isNotEmpty) {
      parts.add(subcategory);
    }

    return _buildBreadcrumbWidget(parts, isFromTree: false);
  }

  /// Shared breadcrumb widget builder
  Widget _buildBreadcrumbWidget(List<String> parts,
      {required bool isFromTree}) {
    return Wrap(
      crossAxisAlignment: WrapCrossAlignment.center,
      children: [
        Icon(Icons.folder_outlined, size: 16, color: Colors.grey[600]),
        const SizedBox(width: 6),
        for (int i = 0; i < parts.length; i++) ...[
          if (i > 0) ...[
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child:
                  Icon(Icons.chevron_right, size: 16, color: Colors.grey[400]),
            ),
          ],
          Text(
            parts[i],
            style: TextStyle(
              fontSize: 13,
              color: Colors.grey[700],
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 768;

    return Scaffold(
      drawer: const ModernDrawer(),
      backgroundColor: Colors.white,
      appBar: AppHeader(
        onCartPressed: () => Navigator.pushNamed(context, '/cart'),
        onSearchPressed: () {},
        onFavoritesPressed: () => Navigator.pushNamed(context, '/favorites'),
      ),
      body: Column(
        children: [
          const TopBanner(),
          Expanded(
            child: SingleChildScrollView(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (isMobile) ...[
                    _buildImageGallery(),
                    _buildProductInfo(),
                  ] else
                    _buildDesktopImageAndInfo(),
                  _buildDeliveryBanner(),
                  const Divider(height: 1),
                  _buildAtAGlance(),
                  const Divider(height: 1),
                  _buildTabSection(),
                  const Divider(height: 1),
                  _buildSpecifications(),
                  const Divider(height: 1),
                  _buildReturnPolicy(),
                  const Divider(height: 1),
                  _buildRelatedProducts(),
                  const SizedBox(height: 20),
                ],
              ),
            ),
          ),
          _buildBottomBar(),
        ],
      ),
    );
  }

  PreferredSizeWidget _buildAppBar() {
    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      surfaceTintColor: Colors.transparent,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back, color: Colors.black),
        onPressed: () => Navigator.pop(context),
      ),
      actions: [
        Consumer<FavoritesProvider>(
          builder: (context, favProvider, _) {
            final isFav = favProvider.isFavorite(widget.product);
            return IconButton(
              icon: Icon(
                isFav ? Icons.favorite : Icons.favorite_border,
                color: isFav ? Colors.red : Colors.black,
              ),
              onPressed: () => _handleFavoriteToggle(),
            );
          },
        ),
        IconButton(
          icon: const Icon(Icons.share_outlined, color: Colors.black),
          onPressed: () {
            ScaffoldMessenger.of(context).showSnackBar(
              const SnackBar(
                content: Text('Share feature coming soon'),
                duration: Duration(seconds: 1),
                behavior: SnackBarBehavior.floating,
              ),
            );
          },
        ),
        const SizedBox(width: 8),
      ],
    );
  }

  Widget _buildDesktopImageAndInfo() {
    return Padding(
      padding: const EdgeInsets.all(24),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Left side: Image gallery (40% of width)
          Expanded(
            flex: 4,
            child: _buildImageGalleryContent(),
          ),
          const SizedBox(width: 32),

          // Right side: Product info (60% of width)
          Expanded(
            flex: 6,
            child: _buildProductInfoContent(),
          ),
        ],
      ),
    );
  }

  Future<void> _handleFavoriteToggle() async {
    final authProvider = context.read<AuthProvider>();
    if (!authProvider.isAuthenticated) {
      final result = await Navigator.pushNamed(context, '/login');
      if (result != true) return;
    }

    try {
      await context.read<FavoritesProvider>().toggleFavorite(widget.product);
      if (mounted) {
        final isFav =
            context.read<FavoritesProvider>().isFavorite(widget.product);
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content:
                Text(isFav ? 'Added to favorites' : 'Removed from favorites'),
            duration: const Duration(seconds: 1),
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not update favorites: $e')),
        );
      }
    }
  }

  Widget _buildImageGalleryContent() {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Vertical thumbnail column on the left
        if (_images.length > 1)
          Container(
            width: 80,
            constraints: const BoxConstraints(maxHeight: 400),
            child: ListView.builder(
              shrinkWrap: true,
              itemCount: _images.length,
              itemBuilder: (context, index) => _buildThumbnail(index, false),
            ),
          ),
        if (_images.length > 1) const SizedBox(width: 16),

        // Large preview image on the right
        Expanded(
          child: GestureDetector(
            onTap: () => _showImageViewer(context),
            child: Container(
              height: 400,
              decoration: BoxDecoration(
                color: Colors.grey[50],
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: Colors.grey[200]!),
              ),
              child: ClipRRect(
                borderRadius: BorderRadius.circular(8),
                child: Stack(
                  children: [
                    Center(
                      child: Image.network(
                        _images[_selectedImageIndex],
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) {
                          return Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(Icons.image_outlined,
                                    size: 80, color: Colors.grey[400]),
                                const SizedBox(height: 8),
                                Text(
                                  'Image not available',
                                  style: TextStyle(color: Colors.grey[600]),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    ),
                    // Click to see full view hint
                    Positioned(
                      bottom: 16,
                      left: 0,
                      right: 0,
                      child: Center(
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 8,
                          ),
                          decoration: BoxDecoration(
                            color: Colors.black.withOpacity(0.7),
                            borderRadius: BorderRadius.circular(20),
                          ),
                          child: const Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(Icons.zoom_in,
                                  color: Colors.white, size: 16),
                              SizedBox(width: 8),
                              Text(
                                'Click to see full view',
                                style: TextStyle(
                                  color: Colors.white,
                                  fontSize: 12,
                                  fontWeight: FontWeight.w500,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildProductInfoContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Brand
        Text(
          widget.product.brand.toUpperCase(),
          style: TextStyle(
            fontSize: 13,
            color: Colors.grey[600],
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 8),

        // Product Name
        Text(
          widget.product.name,
          style: const TextStyle(
            fontSize: 26,
            fontWeight: FontWeight.w700,
            height: 1.3,
            letterSpacing: -0.5,
          ),
        ),
        const SizedBox(height: 8),

        // Category Breadcrumb
        _buildCategoryBreadcrumb(),
        const SizedBox(height: 12),

        // Price Section
        Row(
          crossAxisAlignment: CrossAxisAlignment.center,
          children: [
            Text(
              'AED ${widget.product.price.toStringAsFixed(2)}',
              style: const TextStyle(
                fontSize: 34,
                fontWeight: FontWeight.bold,
                letterSpacing: -1,
              ),
            ),
            if (widget.product.originalPrice != null) ...[
              const SizedBox(width: 12),
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'AED ${widget.product.originalPrice!.toStringAsFixed(2)}',
                    style: TextStyle(
                      fontSize: 16,
                      color: Colors.grey[600],
                      decoration: TextDecoration.lineThrough,
                    ),
                  ),
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: Colors.red[50],
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      'Save ${(((widget.product.originalPrice! - widget.product.price) / widget.product.originalPrice!) * 100).toStringAsFixed(0)}%',
                      style: TextStyle(
                        fontSize: 11,
                        color: Colors.red[700],
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
        const SizedBox(height: 24),

        // Description (use shortDescription if available for product card/summary)
        Text(
          widget.product.shortDescription?.isNotEmpty == true
              ? widget.product.shortDescription!
              : widget.product.description,
          style: TextStyle(
            fontSize: 15,
            color: Colors.grey[700],
            height: 1.5,
          ),
        ),
      ],
    );
  }

  Widget _buildImageGallery() {
    final screenWidth = MediaQuery.of(context).size.width;

    // Mobile only: Horizontal thumbnail layout below main image
    return Column(
      children: [
        GestureDetector(
          onTap: () => _showImageViewer(context),
          child: Container(
            height: screenWidth * 0.8,
            width: double.infinity,
            color: Colors.grey[50],
            child: Image.network(
              _images[_selectedImageIndex],
              fit: BoxFit.contain,
            ),
          ),
        ),
        if (_images.length > 1)
          Container(
            height: 80,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              itemCount: _images.length,
              itemBuilder: (context, index) => _buildThumbnail(index, true),
            ),
          ),
      ],
    );
  }

  Widget _buildThumbnail(int index, bool isHorizontal) {
    final isSelected = index == _selectedImageIndex;
    return GestureDetector(
      onTap: () => setState(() => _selectedImageIndex = index),
      child: Container(
        width: isHorizontal ? 60 : 80,
        height: isHorizontal ? 60 : 80,
        margin: isHorizontal
            ? const EdgeInsets.only(right: 8)
            : const EdgeInsets.only(bottom: 8),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(8),
          border: Border.all(
            color: isSelected ? Colors.black : Colors.grey[300]!,
            width: isSelected ? 2.5 : 1,
          ),
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(6),
          child: Image.network(
            _images[index],
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) {
              return Container(
                color: Colors.grey[200],
                child: Icon(Icons.image_outlined,
                    size: 24, color: Colors.grey[400]),
              );
            },
          ),
        ),
      ),
    );
  }

  void _showImageViewer(BuildContext context) {
    showDialog(
      context: context,
      barrierColor: Colors.black.withOpacity(0.9),
      builder: (context) => _ImageViewerDialog(
        images: _images,
        initialIndex: _selectedImageIndex,
      ),
    );
  }

  Widget _buildProductInfo() {
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 768;

    return Padding(
      padding: EdgeInsets.all(isMobile ? 16 : 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Brand
          Text(
            widget.product.brand.toUpperCase(),
            style: TextStyle(
              fontSize: isMobile ? 12 : 13,
              color: Colors.grey[600],
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 8),

          // Product Name
          Text(
            widget.product.name,
            style: TextStyle(
              fontSize: isMobile ? 20 : 26,
              fontWeight: FontWeight.w700,
              height: 1.3,
              letterSpacing: -0.5,
            ),
          ),
          const SizedBox(height: 8),

          // Category Breadcrumb
          _buildCategoryBreadcrumb(),
          const SizedBox(height: 12),

          // Price Section
          Row(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              Text(
                'AED ${widget.product.price.toStringAsFixed(2)}',
                style: TextStyle(
                  fontSize: isMobile ? 28 : 34,
                  fontWeight: FontWeight.bold,
                  letterSpacing: -1,
                ),
              ),
              if (widget.product.originalPrice != null) ...[
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'AED ${widget.product.originalPrice!.toStringAsFixed(2)}',
                      style: TextStyle(
                        fontSize: 16,
                        color: Colors.grey[600],
                        decoration: TextDecoration.lineThrough,
                        decorationColor: Colors.grey[600],
                      ),
                    ),
                    Container(
                      margin: const EdgeInsets.only(top: 4),
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 2,
                      ),
                      decoration: BoxDecoration(
                        color: Colors.red[50],
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        'Save ${widget.product.discountPercent.toInt()}%',
                        style: TextStyle(
                          color: Colors.red[700],
                          fontWeight: FontWeight.w600,
                          fontSize: 12,
                        ),
                      ),
                    ),
                  ],
                ),
              ],
            ],
          ),

          // Stock Status
          const SizedBox(height: 16),
          Row(
            children: [
              Icon(Icons.check_circle, color: Colors.green[600], size: 20),
              const SizedBox(width: 8),
              Text(
                'In Stock',
                style: TextStyle(
                  color: Colors.green[700],
                  fontWeight: FontWeight.w600,
                  fontSize: 14,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildDeliveryBanner() {
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 768;

    // Use product.deliveryNote if available, otherwise use default text
    final deliveryText = widget.product.deliveryNote?.isNotEmpty == true
        ? widget.product.deliveryNote!
        : 'Free Delivery';

    return Container(
      margin: EdgeInsets.symmetric(horizontal: isMobile ? 16 : 24),
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.green[50],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.green[200]!),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(Icons.local_shipping_outlined,
              color: Colors.green[700], size: 20),
          const SizedBox(width: 10),
          Text(
            deliveryText,
            style: TextStyle(
              fontWeight: FontWeight.w600,
              color: Colors.green[900],
              fontSize: 14,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildAtAGlance() {
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 768;

    return Padding(
      padding: EdgeInsets.all(isMobile ? 16 : 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'At a Glance',
            style: TextStyle(
              fontSize: isMobile ? 18 : 22,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 20),
          Wrap(
            spacing: 12,
            runSpacing: 12,
            children: [
              _buildFeatureChip('Oven Safe', Icons.whatshot_outlined),
              _buildFeatureChip('Stackable', Icons.layers_outlined),
              _buildFeatureChip(
                  'Induction Compatible', Icons.electric_bolt_outlined),
              _buildFeatureChip('Cool Touch Handles', Icons.touch_app_outlined),
              _buildFeatureChip(
                  'Dishwasher Safe', Icons.local_laundry_service_outlined),
              _buildFeatureChip(
                  'Non-Stick Surface', Icons.cleaning_services_outlined),
              _buildFeatureChip('Premium Quality', Icons.star_outline),
              _buildFeatureChip('Easy to Clean', Icons.water_drop_outlined),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildFeatureChip(String label, IconData icon) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      decoration: BoxDecoration(
        color: Colors.grey[100],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.grey[300]!),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 18, color: Colors.grey[700]),
          const SizedBox(width: 8),
          Text(
            label,
            style: const TextStyle(
              fontSize: 14,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildTabSection() {
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 768;

    return Column(
      children: [
        // Tab Headers
        Container(
          padding: EdgeInsets.symmetric(
            horizontal: isMobile ? 16 : 24,
            vertical: isMobile ? 12 : 16,
          ),
          child: Row(
            children: [
              _buildTab('Description', 'description'),
              const SizedBox(width: 24),
              _buildTab('Features', 'features'),
            ],
          ),
        ),

        // Tab Content
        Padding(
          padding: EdgeInsets.symmetric(
            horizontal: isMobile ? 16 : 24,
            vertical: 8,
          ),
          child: _selectedTab == 'description'
              ? _buildDescriptionContent()
              : _buildFeaturesContent(),
        ),
      ],
    );
  }

  Widget _buildTab(String label, String value) {
    final isSelected = _selectedTab == value;
    return GestureDetector(
      onTap: () => setState(() => _selectedTab = value),
      child: Column(
        children: [
          Text(
            label,
            style: TextStyle(
              fontSize: 16,
              fontWeight: isSelected ? FontWeight.w700 : FontWeight.w500,
              color: isSelected ? Colors.black : Colors.grey[600],
            ),
          ),
          const SizedBox(height: 8),
          if (isSelected)
            Container(
              height: 3,
              width: 40,
              decoration: BoxDecoration(
                color: Colors.black,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildDescriptionContent() {
    // Use fullDescription if available, otherwise fall back to description
    final descriptionText = widget.product.fullDescription?.isNotEmpty == true
        ? widget.product.fullDescription!
        : widget.product.description;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Show highlights chips if available
        if (widget.product.highlights.isNotEmpty) ...[
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: widget.product.highlights.map((highlight) {
              return Chip(
                label: Text(highlight),
                backgroundColor: Colors.blue.shade50,
                labelStyle: TextStyle(
                  color: Colors.blue.shade700,
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                ),
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
              );
            }).toList(),
          ),
          const SizedBox(height: 24),
        ],
        const Text(
          'About This Product',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        Text(
          descriptionText,
          style: TextStyle(
            fontSize: 15,
            height: 1.7,
            color: Colors.grey[800],
          ),
        ),
        const SizedBox(height: 24),
        const Text(
          'What\'s Included?',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        _buildBulletPoint('Premium quality ${widget.product.name}'),
        _buildBulletPoint('Manufacturer\'s warranty included'),
        _buildBulletPoint('Care and maintenance instructions'),
        _buildBulletPoint('Original packaging for safe storage'),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildFeaturesContent() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          'Key Features',
          style: TextStyle(
            fontSize: 18,
            fontWeight: FontWeight.w600,
          ),
        ),
        const SizedBox(height: 12),
        _buildBulletPoint(
            'Premium construction with high-quality materials for lasting durability'),
        _buildBulletPoint(
            'Fast, even heating across the entire cooking surface'),
        _buildBulletPoint(
            'Oven-safe up to 500°F (260°C) for versatile cooking options'),
        _buildBulletPoint(
            'Compatible with all stovetops including gas, electric, glass, and induction'),
        _buildBulletPoint(
            'Ergonomic stay-cool handles designed for safe and comfortable handling'),
        _buildBulletPoint(
            'Easy to clean surface that resists staining and discoloration'),
        _buildBulletPoint(
            'Professional-grade performance perfect for home chefs'),
        _buildBulletPoint(
            'Stackable design for efficient storage and space-saving'),
        const SizedBox(height: 16),
      ],
    );
  }

  Widget _buildBulletPoint(String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: 7),
            child: Container(
              width: 6,
              height: 6,
              decoration: const BoxDecoration(
                color: Colors.black,
                shape: BoxShape.circle,
              ),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              text,
              style: TextStyle(
                fontSize: 15,
                height: 1.6,
                color: Colors.grey[800],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSpecifications() {
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 768;

    // Use product.specs if available, otherwise fall back to defaults
    final hasCustomSpecs = widget.product.specs.isNotEmpty;

    return Padding(
      padding: EdgeInsets.all(isMobile ? 16 : 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Specifications',
            style: TextStyle(
              fontSize: isMobile ? 18 : 22,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 20),
          // Always show brand and category
          _buildSpecRow('Brand', widget.product.brand),
          _buildSpecRow('Category', widget.product.category),
          if (widget.product.subcategory != null)
            _buildSpecRow('Type', widget.product.subcategory!),
          // If custom specs exist, show them
          if (hasCustomSpecs)
            ...widget.product.specs
                .map((spec) => _buildSpecRow(spec.key, spec.value))
          else ...[
            // Fallback to hardcoded specs
            _buildSpecRow('Collection name', 'Modern Kitchen Collection'),
            _buildSpecRow(
                'Colour',
                widget.product.colors.isNotEmpty
                    ? widget.product.colors.first
                    : 'Sage'),
            _buildSpecRow('Material', 'Premium Stainless Steel'),
            _buildSpecRow('Pattern', 'Solid'),
            _buildSpecRow('Dishwasher Safe', 'Yes'),
            _buildSpecRow('Oven Safe', 'Up to 500°F (260°C)'),
            _buildSpecRow(
                'Stovetop Compatibility', 'All types including Induction'),
            _buildSpecRow(
                'Care Instructions', 'Hand wash recommended for best results'),
          ],
        ],
      ),
    );
  }

  Widget _buildReturnPolicy() {
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 768;

    // Use product.returnsNote if available, otherwise show defaults
    final hasCustomReturnsNote = widget.product.returnsNote?.isNotEmpty == true;

    return Padding(
      padding: EdgeInsets.all(isMobile ? 16 : 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            'Return Policy',
            style: TextStyle(
              fontSize: isMobile ? 18 : 22,
              fontWeight: FontWeight.w700,
            ),
          ),
          const SizedBox(height: 16),
          if (hasCustomReturnsNote)
            _buildPolicyItem(
              Icons.autorenew,
              'Returns',
              widget.product.returnsNote!,
            )
          else ...[
            _buildPolicyItem(
              Icons.autorenew,
              '30-Day Returns',
              'Free returns within 30 days of delivery',
            ),
            const SizedBox(height: 12),
            _buildPolicyItem(
              Icons.verified_user_outlined,
              'Quality Guarantee',
              'All products are covered by our quality guarantee',
            ),
            const SizedBox(height: 12),
            _buildPolicyItem(
              Icons.local_shipping_outlined,
              'Easy Returns',
              'Print prepaid return label from your account',
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildPolicyItem(IconData icon, String title, String description) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: Colors.blue[50],
            borderRadius: BorderRadius.circular(8),
          ),
          child: Icon(icon, color: Colors.blue[700], size: 20),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                description,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                  height: 1.4,
                ),
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildSpecRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 150,
            child: Text(
              label,
              style: TextStyle(
                fontSize: 15,
                color: Colors.grey[700],
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildRelatedProducts() {
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 768;

    // Get category ID from CatalogProvider if available
    final catalogProvider = context.read<CatalogProvider>();
    final categoryId = catalogProvider.categories
        .where((c) => c.name == widget.product.category)
        .map((c) => c.id)
        .firstOrNull;

    return FutureBuilder<List<Product>>(
      future: _fetchRelatedProducts(categoryId),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Padding(
            padding: EdgeInsets.all(24),
            child: Center(child: CircularProgressIndicator()),
          );
        }

        final relatedProducts = snapshot.data ?? [];
        if (relatedProducts.isEmpty) return const SizedBox.shrink();

        return Padding(
          padding: EdgeInsets.all(isMobile ? 16 : 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Related Products',
                style: TextStyle(
                  fontSize: isMobile ? 18 : 22,
                  fontWeight: FontWeight.w700,
                ),
              ),
              const SizedBox(height: 16),
              LayoutBuilder(
                builder: (context, constraints) {
                  final crossAxisCount = constraints.maxWidth < 600
                      ? 2
                      : constraints.maxWidth < 900
                          ? 3
                          : 4;

                  return GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                      crossAxisCount: crossAxisCount,
                      childAspectRatio: 0.85,
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                    ),
                    itemCount: relatedProducts.length,
                    itemBuilder: (context, index) {
                      final product = relatedProducts[index];
                      return GestureDetector(
                        onTap: () {
                          Navigator.pushReplacement(
                            context,
                            MaterialPageRoute(
                              builder: (context) => ProductDetailScreen(
                                product: product,
                              ),
                            ),
                          );
                        },
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.grey[200]!),
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Expanded(
                                flex: 3,
                                child: Container(
                                  decoration: BoxDecoration(
                                    color: Colors.grey[50],
                                    borderRadius: const BorderRadius.vertical(
                                      top: Radius.circular(8),
                                    ),
                                  ),
                                  child: Center(
                                    child: Image.network(
                                      product.imageUrl,
                                      fit: BoxFit.contain,
                                      errorBuilder:
                                          (context, error, stackTrace) {
                                        return Icon(Icons.image_outlined,
                                            size: 30, color: Colors.grey[400]);
                                      },
                                    ),
                                  ),
                                ),
                              ),
                              Expanded(
                                flex: 2,
                                child: Padding(
                                  padding: const EdgeInsets.all(4),
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    mainAxisAlignment:
                                        MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(
                                        product.name,
                                        style: const TextStyle(
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                        ),
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      Column(
                                        crossAxisAlignment:
                                            CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            'AED ${product.price.toStringAsFixed(2)}',
                                            style: const TextStyle(
                                              fontSize: 13,
                                              fontWeight: FontWeight.bold,
                                            ),
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
                      );
                    },
                  );
                },
              ),
            ],
          ),
        );
      }, // Close FutureBuilder builder
    ); // Close FutureBuilder
  }

  Widget _buildBottomBar() {
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 768;

    return Container(
      padding: EdgeInsets.fromLTRB(
        isMobile ? 12 : 20,
        isMobile ? 12 : 16,
        isMobile ? 12 : 20,
        isMobile ? 12 : 16,
      ),
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border(
          top: BorderSide(color: Colors.grey[300]!, width: 1),
        ),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.08),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Quantity Selector
          Container(
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey[300]!),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.remove, size: 20),
                  onPressed:
                      _quantity > 1 ? () => setState(() => _quantity--) : null,
                  color: _quantity > 1 ? Colors.black : Colors.grey[400],
                ),
                Container(
                  width: 40,
                  alignment: Alignment.center,
                  child: Text(
                    '$_quantity',
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      fontSize: 16,
                    ),
                  ),
                ),
                IconButton(
                  icon: const Icon(Icons.add, size: 20),
                  onPressed: () => setState(() => _quantity++),
                  color: Colors.black,
                ),
              ],
            ),
          ),
          const SizedBox(width: 12),

          // Add to Cart Button
          Expanded(
            child: ElevatedButton(
              onPressed: () {
                // Add product to cart using provider
                context.read<CartProvider>().addToCart(widget.product);

                // Show cart dialog
                showDialog(
                  context: context,
                  barrierDismissible: true,
                  builder: (BuildContext context) {
                    return CartDialog(
                      addedProduct: widget.product,
                      onViewCart: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const CartScreen(),
                          ),
                        );
                      },
                      onCheckout: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const CheckoutScreen(),
                          ),
                        );
                      },
                    );
                  },
                );
              },
              style: ElevatedButton.styleFrom(
                padding: EdgeInsets.symmetric(vertical: isMobile ? 14 : 16),
                backgroundColor: Colors.white,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                  side: BorderSide(color: Colors.grey[800]!, width: 1.5),
                ),
                elevation: 0,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.shopping_bag_outlined,
                      size: isMobile ? 18 : 20, color: Colors.black),
                  if (!isMobile) const SizedBox(width: 8),
                  if (!isMobile)
                    const Text(
                      'Add to Cart',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: 15,
                        color: Colors.black,
                      ),
                    ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 12),

          // Buy Now Button
          Expanded(
            child: ElevatedButton(
              onPressed: () {
                // Add product to cart using provider
                context.read<CartProvider>().addToCart(widget.product);

                // Show cart dialog
                showDialog(
                  context: context,
                  barrierDismissible: true,
                  builder: (BuildContext context) {
                    return CartDialog(
                      addedProduct: widget.product,
                      onViewCart: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const CartScreen(),
                          ),
                        );
                      },
                      onCheckout: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => const CheckoutScreen(),
                          ),
                        );
                      },
                    );
                  },
                );
              },
              style: ElevatedButton.styleFrom(
                padding: EdgeInsets.symmetric(vertical: isMobile ? 14 : 16),
                backgroundColor: Colors.black,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(8),
                ),
                elevation: 0,
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.bolt,
                      size: isMobile ? 18 : 20, color: Colors.white),
                  SizedBox(width: isMobile ? 6 : 8),
                  Flexible(
                    child: Text(
                      'Buy Now',
                      style: TextStyle(
                        fontWeight: FontWeight.w700,
                        fontSize: isMobile ? 14 : 15,
                        color: Colors.white,
                      ),
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// Fullscreen Image Viewer Dialog
class _ImageViewerDialog extends StatefulWidget {
  final List<String> images;
  final int initialIndex;

  const _ImageViewerDialog({
    required this.images,
    required this.initialIndex,
  });

  @override
  State<_ImageViewerDialog> createState() => _ImageViewerDialogState();
}

class _ImageViewerDialogState extends State<_ImageViewerDialog> {
  late int _currentIndex;
  late PageController _pageController;

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex;
    _pageController = PageController(initialPage: widget.initialIndex);
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: Colors.transparent,
      insetPadding: EdgeInsets.zero,
      child: Stack(
        children: [
          // Close button
          Positioned(
            top: 40,
            right: 40,
            child: IconButton(
              icon: const Icon(Icons.close, color: Colors.white, size: 32),
              onPressed: () => Navigator.pop(context),
            ),
          ),

          // Image counter
          Positioned(
            top: 50,
            left: 0,
            right: 0,
            child: Center(
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.black.withOpacity(0.7),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '${_currentIndex + 1} / ${widget.images.length}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),
          ),

          // Main image viewer with swipe
          Center(
            child: SizedBox(
              height: MediaQuery.of(context).size.height * 0.8,
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: (index) {
                  setState(() => _currentIndex = index);
                },
                itemCount: widget.images.length,
                itemBuilder: (context, index) {
                  return Center(
                    child: InteractiveViewer(
                      minScale: 0.5,
                      maxScale: 4.0,
                      child: Image.network(
                        widget.images[index],
                        fit: BoxFit.contain,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            color: Colors.grey[900],
                            child: Center(
                              child: Column(
                                mainAxisAlignment: MainAxisAlignment.center,
                                children: [
                                  Icon(Icons.image_outlined,
                                      size: 80, color: Colors.grey[600]),
                                  const SizedBox(height: 8),
                                  Text(
                                    'Image not available',
                                    style: TextStyle(color: Colors.grey[400]),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                  );
                },
              ),
            ),
          ),

          // Navigation arrows (desktop)
          if (widget.images.length > 1 &&
              MediaQuery.of(context).size.width >= 768) ...[
            // Previous button
            if (_currentIndex > 0)
              Positioned(
                left: 20,
                top: 0,
                bottom: 0,
                child: Center(
                  child: IconButton(
                    icon: const Icon(Icons.arrow_back_ios,
                        color: Colors.white, size: 40),
                    onPressed: () {
                      _pageController.previousPage(
                        duration: const Duration(milliseconds: 300),
                        curve: Curves.easeInOut,
                      );
                    },
                  ),
                ),
              ),

            // Next button
            if (_currentIndex < widget.images.length - 1)
              Positioned(
                right: 20,
                top: 0,
                bottom: 0,
                child: Center(
                  child: IconButton(
                    icon: const Icon(Icons.arrow_forward_ios,
                        color: Colors.white, size: 40),
                    onPressed: () {
                      _pageController.nextPage(
                        duration: const Duration(milliseconds: 300),
                        curve: Curves.easeInOut,
                      );
                    },
                  ),
                ),
              ),
          ],

          // Thumbnail strip at bottom
          if (widget.images.length > 1)
            Positioned(
              bottom: 30,
              left: 0,
              right: 0,
              child: Center(
                child: Container(
                  height: 80,
                  constraints: BoxConstraints(
                    maxWidth: MediaQuery.of(context).size.width * 0.8,
                  ),
                  child: ListView.builder(
                    scrollDirection: Axis.horizontal,
                    itemCount: widget.images.length,
                    itemBuilder: (context, index) {
                      final isSelected = index == _currentIndex;
                      return GestureDetector(
                        onTap: () {
                          _pageController.animateToPage(
                            index,
                            duration: const Duration(milliseconds: 300),
                            curve: Curves.easeInOut,
                          );
                        },
                        child: Container(
                          width: 60,
                          height: 60,
                          margin: const EdgeInsets.symmetric(horizontal: 4),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(
                              color:
                                  isSelected ? Colors.white : Colors.grey[600]!,
                              width: isSelected ? 3 : 1,
                            ),
                          ),
                          child: ClipRRect(
                            borderRadius: BorderRadius.circular(6),
                            child: Image.network(
                              widget.images[index],
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}
