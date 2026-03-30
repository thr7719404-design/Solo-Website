import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../services/api/cms_api.dart';
import '../config/app_config.dart';
import '../providers/catalog_provider.dart';
import '../providers/cart_provider.dart';
import '../widgets/modern_drawer.dart';
import 'cart_screen.dart';
import 'product_list_screen.dart';

/// Category Landing Screen
/// Displays CMS-driven category landing page with hero, subcategory nav, and product sections
class CategoryLandingScreen extends StatefulWidget {
  final String categoryId;

  const CategoryLandingScreen({
    super.key,
    required this.categoryId,
  });

  @override
  State<CategoryLandingScreen> createState() => _CategoryLandingScreenState();
}

class _CategoryLandingScreenState extends State<CategoryLandingScreen> {
  late final CmsApi _cmsApi;
  Future<Map<String, dynamic>>? _landingFuture;

  @override
  void initState() {
    super.initState();
    _cmsApi = CmsApi(baseUrl: AppConfig.apiBaseUrl);
    _loadLanding();
  }

  void _loadLanding() {
    _landingFuture = _cmsApi.getCategoryLanding(widget.categoryId);
  }

  void _openCart() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const CartScreen()),
    );
  }

  @override
  Widget build(BuildContext context) {
    final catalog = context.watch<CatalogProvider>();
    final cartItemCount = context.watch<CartProvider>().itemCount;

    return FutureBuilder<Map<String, dynamic>>(
      future: _landingFuture,
      builder: (context, snapshot) {
        final loading = snapshot.connectionState == ConnectionState.waiting;
        final err = snapshot.hasError ? snapshot.error.toString() : null;
        final data = snapshot.data;

        // Loading state
        if (loading) {
          return Scaffold(
            appBar: AppBar(
              title: const Text('Loading...'),
              backgroundColor: Colors.white,
              foregroundColor: Colors.black,
              elevation: 0,
            ),
            body: const Center(
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.black,
              ),
            ),
          );
        }

        // Error state
        if (err != null) {
          return Scaffold(
            appBar: AppBar(
              title: const Text('Category'),
              backgroundColor: Colors.white,
              foregroundColor: Colors.black,
              elevation: 0,
            ),
            body: Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.error_outline,
                        size: 48, color: Colors.grey[400]),
                    const SizedBox(height: 16),
                    Text(
                      'Failed to load landing page',
                      style: TextStyle(
                        fontFamily: 'WorkSans',
                        fontSize: 18,
                        fontWeight: FontWeight.w500,
                        color: Colors.grey[800],
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      err,
                      style: TextStyle(
                        fontFamily: 'WorkSans',
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 24),
                    ElevatedButton(
                      onPressed: () => setState(() => _loadLanding()),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.black,
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 32,
                          vertical: 14,
                        ),
                      ),
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            ),
          );
        }

        // Parse CMS data
        final heroTitle = (data?['heroTitle'] as String?) ?? 'Category';
        final heroSubtitle = data?['heroSubtitle'] as String?;
        final isHeroEnabled = (data?['isHeroEnabled'] as bool?) ?? false;
        final heroImageUrl = data?['heroImageUrl'] as String?;
        final heroImageMobileUrl = data?['heroImageMobileUrl'] as String?;
        final ctaLabel = data?['ctaLabel'] as String?;
        final ctaTargetType = data?['ctaTargetType'] as String?;
        final ctaTargetValue = data?['ctaTargetValue'] as String?;

        final sections = (data?['sections'] as List?) ?? [];

        // Find this category in the catalog tree for subcategory nav
        final categoryNode = catalog.findCategoryNodeById(widget.categoryId);
        final children = categoryNode?.children ?? [];

        final isMobile = MediaQuery.of(context).size.width < 600;
        final effectiveHeroImage =
            isMobile ? (heroImageMobileUrl ?? heroImageUrl) : heroImageUrl;

        return Scaffold(
          drawer: ModernDrawer(
            cartItemCount: cartItemCount,
            onOpenCart: _openCart,
          ),
          appBar: AppBar(
            title: Text(heroTitle),
            backgroundColor: Colors.white,
            foregroundColor: Colors.black,
            elevation: 0,
            actions: [
              IconButton(
                icon: const Icon(Icons.search),
                onPressed: () {
                  // TODO: Open search with category filter
                },
              ),
              Stack(
                children: [
                  IconButton(
                    icon: const Icon(Icons.shopping_bag_outlined),
                    onPressed: _openCart,
                  ),
                  if (cartItemCount > 0)
                    Positioned(
                      right: 8,
                      top: 8,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: Colors.black,
                          shape: BoxShape.circle,
                        ),
                        constraints: const BoxConstraints(
                          minWidth: 16,
                          minHeight: 16,
                        ),
                        child: Text(
                          '$cartItemCount',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 10,
                            fontWeight: FontWeight.bold,
                          ),
                          textAlign: TextAlign.center,
                        ),
                      ),
                    ),
                ],
              ),
            ],
          ),
          body: ListView(
            padding: EdgeInsets.zero,
            children: [
              // ═══════════════════════════════════════════
              // HERO SECTION
              // ═══════════════════════════════════════════
              if (isHeroEnabled) ...[
                _buildHeroSection(
                  context: context,
                  title: heroTitle,
                  subtitle: heroSubtitle,
                  imageUrl: effectiveHeroImage,
                  ctaLabel: ctaLabel,
                  ctaTargetType: ctaTargetType,
                  ctaTargetValue: ctaTargetValue,
                  isMobile: isMobile,
                ),
              ],

              // ═══════════════════════════════════════════
              // CMS SECTIONS
              // ═══════════════════════════════════════════
              Padding(
                padding: EdgeInsets.symmetric(
                  horizontal: isMobile ? 16 : 40,
                  vertical: 24,
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    for (final section in sections) ...[
                      _buildSection(
                        context: context,
                        section: section as Map<String, dynamic>,
                        children: children,
                        isMobile: isMobile,
                      ),
                      const SizedBox(height: 32),
                    ],
                  ],
                ),
              ),

              // ═══════════════════════════════════════════
              // FALLBACK: Show subcategories if no sections
              // ═══════════════════════════════════════════
              if (sections.isEmpty && children.isNotEmpty) ...[
                Padding(
                  padding: EdgeInsets.symmetric(
                    horizontal: isMobile ? 16 : 40,
                    vertical: 24,
                  ),
                  child: _buildSubcategoryGrid(
                    context: context,
                    title: 'Browse $heroTitle',
                    children: children,
                    isMobile: isMobile,
                  ),
                ),
              ],

              const SizedBox(height: 40),
            ],
          ),
        );
      },
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HERO SECTION BUILDER
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildHeroSection({
    required BuildContext context,
    required String title,
    String? subtitle,
    String? imageUrl,
    String? ctaLabel,
    String? ctaTargetType,
    String? ctaTargetValue,
    required bool isMobile,
  }) {
    final heroHeight = isMobile ? 220.0 : 360.0;

    return Container(
      height: heroHeight,
      width: double.infinity,
      decoration: BoxDecoration(
        color: Colors.grey[200],
      ),
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Background image
          if (imageUrl != null && imageUrl.isNotEmpty)
            Image.network(
              imageUrl,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => Container(
                color: Colors.grey[300],
                child: const Center(
                  child: Icon(Icons.image_not_supported,
                      size: 48, color: Colors.grey),
                ),
              ),
            )
          else
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                  colors: [Colors.grey[300]!, Colors.grey[400]!],
                ),
              ),
            ),

          // Overlay gradient
          Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.centerLeft,
                end: Alignment.centerRight,
                colors: [
                  Colors.black.withOpacity(0.6),
                  Colors.transparent,
                ],
              ),
            ),
          ),

          // Content
          Positioned(
            left: isMobile ? 20 : 60,
            bottom: isMobile ? 30 : 50,
            right: isMobile ? 20 : null,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  title,
                  style: TextStyle(
                    fontFamily: 'WorkSans',
                    fontSize: isMobile ? 28 : 42,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                    height: 1.2,
                  ),
                ),
                if (subtitle != null && subtitle.isNotEmpty) ...[
                  const SizedBox(height: 8),
                  Text(
                    subtitle,
                    style: TextStyle(
                      fontFamily: 'WorkSans',
                      fontSize: isMobile ? 14 : 18,
                      fontWeight: FontWeight.w300,
                      color: Colors.white.withOpacity(0.9),
                    ),
                  ),
                ],
                if (ctaLabel != null && ctaLabel.isNotEmpty) ...[
                  const SizedBox(height: 20),
                  ElevatedButton(
                    onPressed: () =>
                        _handleCtaNavigation(ctaTargetType, ctaTargetValue),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: Colors.black,
                      padding: EdgeInsets.symmetric(
                        horizontal: isMobile ? 24 : 32,
                        vertical: isMobile ? 12 : 16,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(0),
                      ),
                    ),
                    child: Text(
                      ctaLabel.toUpperCase(),
                      style: TextStyle(
                        fontFamily: 'WorkSans',
                        fontSize: isMobile ? 12 : 14,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 1.5,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SECTION ROUTER
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildSection({
    required BuildContext context,
    required Map<String, dynamic> section,
    required List<dynamic> children,
    required bool isMobile,
  }) {
    final type = section['type']?.toString() ?? '';
    final title = section['title']?.toString();
    final config = section['config'] as Map<String, dynamic>? ?? {};
    final isEnabled = section['isEnabled'] as bool? ?? true;

    if (!isEnabled) return const SizedBox.shrink();

    switch (type) {
      case 'SUBCATEGORY_NAV':
        return _buildSubcategoryGrid(
          context: context,
          title: title,
          children: children,
          isMobile: isMobile,
        );

      case 'PRODUCT_GRID':
        return _buildProductGridSection(
          context: context,
          title: title,
          config: config,
          isMobile: isMobile,
        );

      case 'TOP_SELLERS':
        return _buildProductGridSection(
          context: context,
          title: title ?? 'Top Sellers',
          config: config,
          isMobile: isMobile,
        );

      case 'PROMO_BANNER':
        return _buildPromoBanner(
          context: context,
          config: config,
          isMobile: isMobile,
        );

      case 'TEXT_BLOCK':
        return _buildTextBlock(
          context: context,
          title: title,
          config: config,
        );

      default:
        // Unknown section type - render placeholder in debug
        return Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            border: Border.all(color: Colors.grey[300]!),
            borderRadius: BorderRadius.circular(8),
          ),
          child: Text(
            'Unknown section: $type',
            style: TextStyle(color: Colors.grey[500]),
          ),
        );
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SUBCATEGORY GRID
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildSubcategoryGrid({
    required BuildContext context,
    String? title,
    required List<dynamic> children,
    required bool isMobile,
  }) {
    if (children.isEmpty) return const SizedBox.shrink();

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title != null) ...[
          Text(
            title,
            style: TextStyle(
              fontFamily: 'WorkSans',
              fontSize: isMobile ? 20 : 24,
              fontWeight: FontWeight.w500,
              color: Colors.black,
            ),
          ),
          const SizedBox(height: 16),
        ],
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: isMobile ? 2 : 4,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            childAspectRatio: 1.0,
          ),
          itemCount: children.length,
          itemBuilder: (context, index) {
            final child = children[index];
            final name = child.name ?? 'Category';
            final imageUrl = child.imageUrl ?? '';
            final categoryId = child.id?.toString() ?? '';

            return _buildCategoryTile(
              context: context,
              name: name,
              imageUrl: imageUrl,
              categoryId: categoryId,
            );
          },
        ),
      ],
    );
  }

  Widget _buildCategoryTile({
    required BuildContext context,
    required String name,
    required String imageUrl,
    required String categoryId,
  }) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        onTap: () => _navigateToCategory(categoryId),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(8),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.08),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          clipBehavior: Clip.antiAlias,
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Image
              if (imageUrl.isNotEmpty)
                Image.network(
                  imageUrl,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    color: Colors.grey[100],
                    child:
                        Icon(Icons.category, size: 32, color: Colors.grey[400]),
                  ),
                )
              else
                Container(
                  color: Colors.grey[100],
                  child:
                      Icon(Icons.category, size: 32, color: Colors.grey[400]),
                ),

              // Overlay
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      Colors.black.withOpacity(0.6),
                    ],
                  ),
                ),
              ),

              // Title
              Positioned(
                left: 12,
                right: 12,
                bottom: 12,
                child: Text(
                  name,
                  style: const TextStyle(
                    fontFamily: 'WorkSans',
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRODUCT GRID SECTION
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildProductGridSection({
    required BuildContext context,
    String? title,
    required Map<String, dynamic> config,
    required bool isMobile,
  }) {
    final limit = config['limit'] as int? ?? 8;
    final sortBy = config['sortBy'] as String? ?? 'createdAt';

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title != null) ...[
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                title,
                style: TextStyle(
                  fontFamily: 'WorkSans',
                  fontSize: isMobile ? 20 : 24,
                  fontWeight: FontWeight.w500,
                  color: Colors.black,
                ),
              ),
              TextButton(
                onPressed: () => _navigateToCategoryProducts(),
                child: Text(
                  'View All',
                  style: TextStyle(
                    fontFamily: 'WorkSans',
                    fontSize: 14,
                    fontWeight: FontWeight.w500,
                    color: Colors.grey[700],
                  ),
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),
        ],
        // TODO: Replace with actual product grid fetching from API
        Container(
          height: 200,
          decoration: BoxDecoration(
            color: Colors.grey[100],
            borderRadius: BorderRadius.circular(8),
            border: Border.all(color: Colors.grey[300]!),
          ),
          child: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Icon(Icons.grid_view, size: 40, color: Colors.grey[400]),
                const SizedBox(height: 12),
                Text(
                  'Product Grid ($limit products, sort: $sortBy)',
                  style: TextStyle(
                    fontFamily: 'WorkSans',
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROMO BANNER
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildPromoBanner({
    required BuildContext context,
    required Map<String, dynamic> config,
    required bool isMobile,
  }) {
    final imageUrl = config['imageUrl'] as String?;
    final text = config['text'] as String?;
    final backgroundColor = config['backgroundColor'] as String?;

    return Container(
      height: isMobile ? 120 : 160,
      width: double.infinity,
      decoration: BoxDecoration(
        color: backgroundColor != null
            ? Color(int.parse(backgroundColor.replaceFirst('#', '0xFF')))
            : Colors.grey[200],
        borderRadius: BorderRadius.circular(8),
      ),
      clipBehavior: Clip.antiAlias,
      child: Stack(
        fit: StackFit.expand,
        children: [
          if (imageUrl != null && imageUrl.isNotEmpty)
            Image.network(
              imageUrl,
              fit: BoxFit.cover,
              errorBuilder: (_, __, ___) => const SizedBox.shrink(),
            ),
          if (text != null)
            Center(
              child: Text(
                text,
                style: TextStyle(
                  fontFamily: 'WorkSans',
                  fontSize: isMobile ? 18 : 24,
                  fontWeight: FontWeight.w600,
                  color: Colors.white,
                ),
                textAlign: TextAlign.center,
              ),
            ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TEXT BLOCK
  // ═══════════════════════════════════════════════════════════════════════════
  Widget _buildTextBlock({
    required BuildContext context,
    String? title,
    required Map<String, dynamic> config,
  }) {
    final body = config['body'] as String?;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title != null) ...[
          Text(
            title,
            style: const TextStyle(
              fontFamily: 'WorkSans',
              fontSize: 20,
              fontWeight: FontWeight.w500,
              color: Colors.black,
            ),
          ),
          const SizedBox(height: 12),
        ],
        if (body != null)
          Text(
            body,
            style: TextStyle(
              fontFamily: 'WorkSans',
              fontSize: 14,
              height: 1.6,
              color: Colors.grey[700],
            ),
          ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // NAVIGATION HELPERS
  // ═══════════════════════════════════════════════════════════════════════════
  void _handleCtaNavigation(String? targetType, String? targetValue) {
    if (targetValue == null || targetValue.isEmpty) return;

    switch (targetType) {
      case 'category':
        _navigateToCategory(targetValue);
        break;
      case 'url':
      case 'page':
        if (targetValue.startsWith('/')) {
          Navigator.pushNamed(context, targetValue);
        }
        break;
      case 'product':
        Navigator.pushNamed(context, '/product/$targetValue');
        break;
      default:
        break;
    }
  }

  void _navigateToCategory(String categoryId) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => CategoryLandingScreen(categoryId: categoryId),
      ),
    );
  }

  void _navigateToCategoryProducts() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => ProductListScreen(
          categorySlug: widget.categoryId,
        ),
      ),
    );
  }
}
