import 'package:flutter/material.dart';
import '../widgets/brand_logo.dart';
import 'package:provider/provider.dart';
import '../models/product.dart';
import '../models/dto/product_dto.dart';
import '../models/product_dto_extension.dart';
import '../providers/home_provider.dart';
import '../providers/catalog_provider.dart';
import '../providers/cart_provider.dart';
import '../widgets/top_banner.dart';
import '../widgets/modern_drawer.dart';
import '../widgets/porto/porto_widgets.dart';
import 'product_detail_screen.dart';
import 'cart_screen.dart';
import 'search_screen.dart';

/// CMS-Driven Home Screen
/// Renders homepage layout from CMS (LandingPage with slug "home")
/// Falls back to legacy hardcoded layout if no CMS home page exists
class HomeScreenCMS extends StatefulWidget {
  const HomeScreenCMS({super.key});

  @override
  State<HomeScreenCMS> createState() => _HomeScreenCMSState();
}

class _HomeScreenCMSState extends State<HomeScreenCMS> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      // Load CMS home page and categories
      context.read<HomeProvider>().loadAllSections();
      context.read<CatalogProvider>().loadCategories();
      context.read<CatalogProvider>().loadBrands();
    });
  }

  void _addToCart(Product product) {
    context.read<CartProvider>().addToCart(product);
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('${product.name} added to cart'),
        behavior: SnackBarBehavior.floating,
        action: SnackBarAction(
          label: 'View Cart',
          onPressed: () => _openCart(),
        ),
      ),
    );
  }

  void _addToCartDto(ProductDto productDto) {
    _addToCart(productDto.toProduct());
  }

  void _openCart() {
    Navigator.push(
      context,
      MaterialPageRoute(builder: (context) => const CartScreen()),
    );
  }

  void _openSearch() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => SearchScreen(onAddToCart: _addToCart),
      ),
    );
  }

  void _openProduct(ProductDto productDto) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) =>
            ProductDetailScreen(product: productDto.toProduct()),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cartItemCount = context.watch<CartProvider>().itemCount;

    return Scaffold(
      drawer: ModernDrawer(
        cartItemCount: cartItemCount,
        onOpenCart: _openCart,
      ),
      body: CustomScrollView(
        slivers: [
          // Top Banner
          const SliverToBoxAdapter(child: TopBanner()),

          // App Bar
          _buildAppBar(cartItemCount),

          // CMS-Driven Content
          SliverToBoxAdapter(
            child: Consumer<HomeProvider>(
              builder: (context, homeProvider, child) {
                // Loading state
                if (homeProvider.isHomePageLoading) {
                  return SizedBox(
                    height: 400,
                    child: const Center(
                      child: CircularProgressIndicator(
                          strokeWidth: 2, color: Colors.black),
                    ),
                  );
                }

                // If CMS home page exists, render sections dynamically
                if (homeProvider.hasHomePage) {
                  return _buildCMSSections(homeProvider);
                }

                // Fallback: No CMS home page, show message
                return _buildNoCMSFallback(homeProvider);
              },
            ),
          ),

          // Footer
          SliverToBoxAdapter(child: _buildFooter()),
        ],
      ),
    );
  }

  Widget _buildAppBar(int cartItemCount) {
    return SliverAppBar(
      floating: true,
      snap: true,
      pinned: true,
      expandedHeight: 100,
      backgroundColor: Colors.white,
      surfaceTintColor: Colors.transparent,
      flexibleSpace: FlexibleSpaceBar(
        centerTitle: true,
        title: const BrandLogo(height: 60),
      ),
      leading: Builder(
        builder: (context) => IconButton(
          icon: const Icon(Icons.menu),
          onPressed: () => Scaffold.of(context).openDrawer(),
        ),
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.search),
          onPressed: _openSearch,
        ),
        IconButton(
          icon: const Icon(Icons.favorite_border),
          onPressed: () => Navigator.pushNamed(context, '/favorites'),
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
                  constraints:
                      const BoxConstraints(minWidth: 16, minHeight: 16),
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
        const SizedBox(width: 8),
      ],
      bottom: PreferredSize(
        preferredSize: const Size.fromHeight(1),
        child: Container(height: 1, color: Colors.grey[200]),
      ),
    );
  }

  /// Render CMS sections dynamically
  Widget _buildCMSSections(HomeProvider homeProvider) {
    final sections = homeProvider.sections;

    if (sections.isEmpty) {
      return _buildNoCMSFallback(homeProvider);
    }

    return Column(
      children: sections.map((section) {
        return PortoSectionRenderer(
          section: section,
          homeProvider: homeProvider,
          onProductTap: _openProduct,
          onAddToCart: _addToCartDto,
        );
      }).toList(),
    );
  }

  /// Fallback when no CMS home page exists
  Widget _buildNoCMSFallback(HomeProvider homeProvider) {
    return Container(
      padding: const EdgeInsets.all(60),
      child: Center(
        child: Column(
          children: [
            Icon(Icons.web_outlined, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 24),
            Text(
              'Home Page Not Configured',
              style: TextStyle(
                fontFamily: 'WorkSans',
                fontSize: 24,
                fontWeight: FontWeight.w300,
                color: Colors.grey[800],
              ),
            ),
            const SizedBox(height: 12),
            Text(
              'Create a landing page with slug "home" in the Admin panel\nto configure the homepage layout.',
              style: TextStyle(
                fontFamily: 'WorkSans',
                fontSize: 14,
                color: Colors.grey[600],
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: () =>
                  Navigator.pushNamed(context, '/admin/landing-pages'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.black,
                foregroundColor: Colors.white,
                padding:
                    const EdgeInsets.symmetric(horizontal: 32, vertical: 14),
              ),
              child: const Text('Go to Admin'),
            ),
            const SizedBox(height: 60),
            // Show products as fallback
            if (homeProvider.featuredProducts.isNotEmpty) ...[
              const PortoSectionHeader(
                title: 'Featured Products',
                subtitle: 'Our top picks for you',
              ),
              const SizedBox(height: 40),
              _buildProductGrid(homeProvider.featuredProducts),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildProductGrid(List<ProductDto> products) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final isMobile = constraints.maxWidth < 600;
        final crossAxisCount = isMobile ? 2 : 4;
        final spacing = isMobile ? 12.0 : 24.0;

        return GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          padding: EdgeInsets.symmetric(horizontal: isMobile ? 16 : 60),
          gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: crossAxisCount,
            childAspectRatio: 0.65,
            crossAxisSpacing: spacing,
            mainAxisSpacing: spacing,
          ),
          itemCount: products.length,
          itemBuilder: (context, index) {
            final productDto = products[index];
            final product = productDto.toProduct();
            return GestureDetector(
              onTap: () => _openProduct(productDto),
              child: Container(
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(4),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 8,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Expanded(
                      flex: 3,
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.grey[100],
                          borderRadius: const BorderRadius.vertical(
                            top: Radius.circular(4),
                          ),
                        ),
                        child: product.imageUrl.isNotEmpty
                            ? Image.network(
                                product.imageUrl,
                                fit: BoxFit.cover,
                                width: double.infinity,
                              )
                            : Center(
                                child: Icon(
                                  Icons.image,
                                  size: 48,
                                  color: Colors.grey[400],
                                ),
                              ),
                      ),
                    ),
                    Expanded(
                      flex: 2,
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            if (product.brand.isNotEmpty)
                              Text(
                                product.brand.toUpperCase(),
                                style: TextStyle(
                                  fontFamily: 'WorkSans',
                                  fontSize: 10,
                                  fontWeight: FontWeight.w500,
                                  color: Colors.grey[500],
                                  letterSpacing: 1,
                                ),
                              ),
                            const SizedBox(height: 4),
                            Text(
                              product.name,
                              style: const TextStyle(
                                fontFamily: 'WorkSans',
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                              ),
                              maxLines: 2,
                              overflow: TextOverflow.ellipsis,
                            ),
                            const Spacer(),
                            Text(
                              'AED ${product.price.toStringAsFixed(2)}',
                              style: const TextStyle(
                                fontFamily: 'WorkSans',
                                fontSize: 14,
                                fontWeight: FontWeight.w600,
                              ),
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
    );
  }

  Widget _buildFooter() {
    return Container(
      color: const Color(0xFF1A1A1A),
      padding: const EdgeInsets.symmetric(vertical: 60, horizontal: 40),
      child: Column(
        children: [
          // Footer content
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                'SOLO ECOMMERCE',
                style: TextStyle(
                  fontFamily: 'WorkSans',
                  fontSize: 18,
                  fontWeight: FontWeight.w300,
                  color: Colors.white,
                  letterSpacing: 3,
                ),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Text(
            '© 2026 Solo Ecommerce. All rights reserved.',
            style: TextStyle(
              fontFamily: 'WorkSans',
              fontSize: 12,
              color: Colors.grey[500],
            ),
          ),
        ],
      ),
    );
  }
}
