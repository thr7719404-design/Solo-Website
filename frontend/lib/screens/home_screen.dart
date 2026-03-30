import 'package:flutter/material.dart';
import '../widgets/brand_logo.dart';
import 'package:provider/provider.dart';
// Conditional web import for SEO
import 'home_screen_web_stub.dart' if (dart.library.html) 'home_screen_web.dart'
    as web_seo;
import '../models/product.dart';
import '../models/category.dart';
import '../models/product_dto_extension.dart';
import '../providers/home_provider.dart';
import '../providers/home_cms_provider.dart';
import '../providers/catalog_provider.dart';
import '../providers/cart_provider.dart';
import '../widgets/hero_banner.dart';
import '../widgets/home/loyalty_program_banner.dart';
import '../widgets/product_card.dart';
import '../widgets/top_banner.dart';
import '../widgets/modern_drawer.dart';
import 'product_detail_screen.dart';
import 'cart_screen.dart';
import 'search_screen.dart';
import 'category_screen.dart';
import 'loyalty_program_screen.dart';
import 'about_us_screen.dart';
import 'bulk_order_screen.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final bool _categoriesExpanded = false;
  final bool _topSellersExpanded = false;
  final bool _newArrivalsExpanded = false;
  final bool _specialOffersExpanded = false;

  @override
  void initState() {
    super.initState();
    // Load home sections and categories on mount
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final homeProvider = context.read<HomeProvider>();
      homeProvider.loadAllSections(
        featuredLimit: 8,
        bestSellersLimit: 8,
        newArrivalsLimit: 8,
      );
      // Load categories from API
      context.read<CatalogProvider>().loadCategories();

      // Load CMS home page data
      context.read<HomeCmsProvider>().loadHomeCms();

      // Listen for home page load to set SEO meta tags (web only)
      _updateSeoMetaTags(homeProvider);
    });
  }

  /// Update browser meta tags for SEO (web only)
  void _updateSeoMetaTags(HomeProvider provider) {
    // Only run on web - the conditional import handles the stub
    final homePage = provider.homePage;
    if (homePage != null) {
      final title = homePage.metaTitle ?? homePage.seoTitle ?? homePage.title;
      final description = homePage.metaDescription ?? '';
      web_seo.setMetaTags(
        title: title,
        description: description,
      );
    } else {
      // If home page not loaded yet, listen for changes
      provider.addListener(() {
        final page = provider.homePage;
        if (page != null) {
          final title = page.metaTitle ?? page.seoTitle ?? page.title;
          final description = page.metaDescription ?? '';
          web_seo.setMetaTags(
            title: title,
            description: description,
          );
        }
      });
    }
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

  void _openCart() {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => const CartScreen(),
      ),
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
    final cartItemCount = context.watch<CartProvider>().itemCount;
    return Scaffold(
      drawer: ModernDrawer(
        cartItemCount: cartItemCount,
        onOpenCart: _openCart,
      ),
      body: CustomScrollView(
        slivers: [
          // Top Banner
          const SliverToBoxAdapter(
            child: TopBanner(),
          ),

          // App Bar
          SliverAppBar(
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
                onPressed: () {
                  Scaffold.of(context).openDrawer();
                },
              ),
            ),
            actions: [
              IconButton(
                icon: const Icon(Icons.search),
                onPressed: _openSearch,
              ),
              IconButton(
                icon: const Icon(Icons.favorite_border),
                onPressed: () {
                  // TODO: Open favorites
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
              const SizedBox(width: 8),
            ],
            bottom: PreferredSize(
              preferredSize: const Size.fromHeight(1),
              child: Container(
                height: 1,
                color: Colors.grey[200],
              ),
            ),
          ),

          // CMS-Driven Content Sections
          SliverToBoxAdapter(
            child: Consumer<HomeCmsProvider>(
              builder: (context, cmsProvider, child) {
                // Loading state
                if (cmsProvider.isLoading) {
                  return const SizedBox(
                    height: 400,
                    child: Center(
                      child: CircularProgressIndicator(
                        strokeWidth: 2,
                        color: Colors.black,
                      ),
                    ),
                  );
                }

                // Error state
                if (cmsProvider.error != null) {
                  return Padding(
                    padding: const EdgeInsets.all(40),
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.error_outline, size: 48, color: Colors.grey[400]),
                          const SizedBox(height: 16),
                          Text(
                            'Failed to load content',
                            style: TextStyle(
                              fontFamily: 'WorkSans',
                              fontSize: 18,
                              color: Colors.grey[600],
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            cmsProvider.error!,
                            style: TextStyle(
                              fontFamily: 'WorkSans',
                              fontSize: 12,
                              color: Colors.grey[500],
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 24),
                          ElevatedButton(
                            onPressed: () => cmsProvider.loadHomeCms(),
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
                  );
                }

                // CMS sections from database
                if (cmsProvider.sections.isNotEmpty) {
                  return Column(
                    children: [
                      const SizedBox(height: 1),
                      // Render CMS sections
                      for (final section in cmsProvider.sections)
                        _buildCmsSection(section),
                      const SizedBox(height: 60),
                    ],
                  );
                }

                // Fallback: No CMS data - show legacy HeroBanner
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const SizedBox(height: 1),
                    const HeroBanner(),
                    const LoyaltyProgramBanner(),
                    const SizedBox(height: 60),
                    // Categories from CatalogProvider
                    Padding(
                      padding: EdgeInsets.symmetric(
                        horizontal:
                            MediaQuery.of(context).size.width < 600 ? 16 : 60,
                      ),
                      child: Consumer<CatalogProvider>(
                        builder: (context, catalogProvider, child) {
                          final categories =
                              catalogProvider.categories.take(4).toList();

                          if (catalogProvider.isLoading) {
                            return const Center(
                                child: CircularProgressIndicator());
                          }

                          if (categories.isEmpty) {
                            return const SizedBox
                                .shrink(); // Hide section if no categories
                          }

                          return LayoutBuilder(
                            builder: (context, constraints) {
                              int crossAxisCount;
                              double childAspectRatio;

                              if (constraints.maxWidth < 600) {
                                crossAxisCount = 2; // Mobile: 2 columns
                                childAspectRatio = 0.9;
                              } else if (constraints.maxWidth < 900) {
                                crossAxisCount = 4; // Tablet: 4 columns
                                childAspectRatio = 0.85;
                              } else {
                                crossAxisCount = 4; // Desktop: 4 columns
                                childAspectRatio = 0.85;
                              }

                              return GridView.builder(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                gridDelegate:
                                    SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: crossAxisCount,
                                  crossAxisSpacing: 16,
                                  mainAxisSpacing: 16,
                                  childAspectRatio: childAspectRatio,
                                ),
                                itemCount: categories.length,
                                itemBuilder: (context, index) {
                                  final category = categories[index];
                                  return _buildFeaturedCategoryBox(
                                    category.name,
                                    category.imageUrl.isNotEmpty
                                        ? category.imageUrl
                                        : 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400',
                                  );
                                },
                              );
                            },
                          );
                        },
                      ),
                    );
                  },
                ),

                const SizedBox(height: 80),

                // Categories Section - Luxury Design
                Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topCenter,
                      end: Alignment.bottomCenter,
                      colors: [
                        Colors.grey[50]!,
                        Colors.white,
                        Colors.grey[50]!,
                      ],
                    ),
                  ),
                  child: Column(
                    children: [
                      const SizedBox(height: 100),
                      // Luxury Header
                      Column(
                        children: [
                          // Gold accent line top
                          Container(
                            width: 80,
                            height: 2,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  Colors.transparent,
                                  const Color(0xFFB8860B),
                                  Colors.transparent,
                                ],
                              ),
                            ),
                          ),
                          const SizedBox(height: 30),
                          Text(
                            'CURATED',
                            style: TextStyle(
                              fontFamily: 'WorkSans',
                              fontSize: 12,
                              fontWeight: FontWeight.w300,
                              color: const Color(0xFFB8860B),
                              letterSpacing: 4,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'Shop by Category',
                            style: TextStyle(
                              fontFamily: 'WorkSans',
                              fontSize: 48,
                              fontWeight: FontWeight.w200,
                              color: Colors.black,
                              letterSpacing: 1,
                              height: 1.2,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Container(
                            width: 60,
                            height: 1,
                            color: Colors.black.withOpacity(0.2),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Discover our meticulously selected professional collections',
                            style: TextStyle(
                              fontFamily: 'WorkSans',
                              fontSize: 14,
                              fontWeight: FontWeight.w300,
                              color: Colors.grey[600],
                              letterSpacing: 0.5,
                            ),
                          ),
                          const SizedBox(height: 30),
                          // Gold accent line bottom
                          Container(
                            width: 80,
                            height: 2,
                            decoration: BoxDecoration(
                              gradient: LinearGradient(
                                colors: [
                                  Colors.transparent,
                                  const Color(0xFFB8860B),
                                  Colors.transparent,
                                ],
                              ),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 70),
                      // Premium Category Grid
                      Padding(
                        padding: EdgeInsets.symmetric(
                          horizontal:
                              MediaQuery.of(context).size.width < 600 ? 16 : 60,
                        ),
                        child: Consumer<CatalogProvider>(
                          builder: (context, catalogProvider, child) {
                            final categories = catalogProvider.categories;

                            if (catalogProvider.isLoading) {
                              return const Center(
                                child: CircularProgressIndicator(),
                              );
                            }

                            if (categories.isEmpty) {
                              return const Center(
                                child: Text('No categories available'),
                              );
                            }

                            return LayoutBuilder(
                              builder: (context, constraints) {
                                int crossAxisCount;
                                if (constraints.maxWidth < 600) {
                                  crossAxisCount = 2; // Mobile
                                } else if (constraints.maxWidth < 900) {
                                  crossAxisCount = 3; // Tablet
                                } else {
                                  const itemWidth = 220.0;
                                  crossAxisCount =
                                      (constraints.maxWidth / itemWidth)
                                          .floor()
                                          .clamp(3, 6);
                                }

                                return GridView.builder(
                                  shrinkWrap: true,
                                  physics: const NeverScrollableScrollPhysics(),
                                  gridDelegate:
                                      SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: crossAxisCount,
                                    childAspectRatio: 0.9,
                                    crossAxisSpacing:
                                        constraints.maxWidth < 600 ? 12 : 20,
                                    mainAxisSpacing:
                                        constraints.maxWidth < 600 ? 12 : 20,
                                  ),
                                  itemCount: categories.length,
                                  itemBuilder: (context, index) {
                                    final category = categories[index];
                                    return _buildCategoryCard(category);
                                  },
                                );
                              },
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 50),
                      // View All Button
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 32, vertical: 14),
                        decoration: BoxDecoration(
                          border: Border.all(
                              color: const Color(0xFF1A1A1A), width: 1.5),
                          color: Colors.white,
                        ),
                        child: InkWell(
                          onTap: () {
                            // TODO: Navigate to all categories
                          },
                          child: Text(
                            'VIEW ALL CATEGORIES',
                            style: TextStyle(
                              fontFamily: 'WorkSans',
                              fontSize: 13,
                              fontWeight: FontWeight.w500,
                              color: const Color(0xFF1A1A1A),
                              letterSpacing: 1.5,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 100),
                    ],
                  ),
                ),

                const SizedBox(height: 80),

                // New Arrivals
                Container(
                  color: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 60),
                  child: Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 40),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'New Arrivals',
                              style: TextStyle(
                                fontFamily: 'WorkSans',
                                fontSize: 32,
                                fontWeight: FontWeight.w400,
                                color: Colors.black,
                                letterSpacing: 0,
                              ),
                            ),
                            InkWell(
                              onTap: () {
                                // TODO: Navigate to all new arrivals
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 20, vertical: 10),
                                decoration: BoxDecoration(
                                  border: Border.all(
                                      color: const Color(0xFF1A1A1A),
                                      width: 1.5),
                                ),
                                child: Text(
                                  'VIEW ALL',
                                  style: TextStyle(
                                    fontFamily: 'WorkSans',
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                    color: const Color(0xFF1A1A1A),
                                    letterSpacing: 1.5,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 40),
                      Padding(
                        padding: EdgeInsets.symmetric(
                          horizontal:
                              MediaQuery.of(context).size.width < 600 ? 16 : 40,
                        ),
                        child: LayoutBuilder(
                          builder: (context, constraints) {
                            int crossAxisCount;
                            if (constraints.maxWidth < 600) {
                              crossAxisCount = 2;
                            } else if (constraints.maxWidth < 900) {
                              crossAxisCount = 3;
                            } else {
                              crossAxisCount = 4;
                            }

                            return Consumer<HomeProvider>(
                              builder: (context, homeProvider, child) {
                                // Loading state
                                if (homeProvider.isNewArrivalsLoading) {
                                  return Center(
                                    child: Padding(
                                      padding: const EdgeInsets.all(40.0),
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.black,
                                      ),
                                    ),
                                  );
                                }

                                // Error state
                                if (homeProvider.hasNewArrivalsError) {
                                  return Center(
                                    child: Padding(
                                      padding: const EdgeInsets.all(40.0),
                                      child: Column(
                                        children: [
                                          Icon(Icons.error_outline,
                                              size: 48,
                                              color: Colors.grey[400]),
                                          const SizedBox(height: 16),
                                          Text(
                                            'Failed to load new arrivals',
                                            style: TextStyle(
                                                color: Colors.grey[600]),
                                          ),
                                          const SizedBox(height: 8),
                                          TextButton(
                                            onPressed: () => homeProvider
                                                .loadNewArrivals(limit: 8),
                                            child: Text('Try Again'),
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                }

                                final products =
                                    homeProvider.newArrivals.toProducts();

                                // Empty state
                                if (products.isEmpty) {
                                  return Center(
                                    child: Padding(
                                      padding: const EdgeInsets.all(40.0),
                                      child: Text(
                                        'No new arrivals available',
                                        style:
                                            TextStyle(color: Colors.grey[600]),
                                      ),
                                    ),
                                  );
                                }

                                // Success state - show products
                                return GridView.builder(
                                  shrinkWrap: true,
                                  physics: const NeverScrollableScrollPhysics(),
                                  gridDelegate:
                                      SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: crossAxisCount,
                                    childAspectRatio: 0.62,
                                    crossAxisSpacing:
                                        constraints.maxWidth < 600 ? 12 : 24,
                                    mainAxisSpacing:
                                        constraints.maxWidth < 600 ? 16 : 24,
                                  ),
                                  itemCount: products.length,
                                  itemBuilder: (context, index) {
                                    final product = products[index];
                                    return ProductCard(
                                      product: product,
                                      onTap: () => _openProduct(product),
                                      onAddToCart: () => _addToCart(product),
                                    );
                                  },
                                );
                              },
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 60),
                    ],
                  ),
                ),

                const SizedBox(height: 80),

                // Best Sellers
                Container(
                  color: Colors.grey[50],
                  padding: const EdgeInsets.symmetric(vertical: 60),
                  child: Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 40),
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              'Top sellers',
                              style: TextStyle(
                                fontFamily: 'WorkSans',
                                fontSize: 32,
                                fontWeight: FontWeight.w400,
                                color: Colors.black,
                                letterSpacing: 0,
                              ),
                            ),
                            InkWell(
                              onTap: () {
                                // TODO: Navigate to all top sellers
                              },
                              child: Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 20, vertical: 10),
                                decoration: BoxDecoration(
                                  border: Border.all(
                                      color: const Color(0xFF1A1A1A),
                                      width: 1.5),
                                ),
                                child: Text(
                                  'VIEW ALL',
                                  style: TextStyle(
                                    fontFamily: 'WorkSans',
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                    color: const Color(0xFF1A1A1A),
                                    letterSpacing: 1.5,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 40),
                      Padding(
                        padding: EdgeInsets.symmetric(
                          horizontal:
                              MediaQuery.of(context).size.width < 600 ? 16 : 40,
                        ),
                        child: LayoutBuilder(
                          builder: (context, constraints) {
                            int crossAxisCount;
                            if (constraints.maxWidth < 600) {
                              crossAxisCount = 2;
                            } else if (constraints.maxWidth < 900) {
                              crossAxisCount = 3;
                            } else {
                              crossAxisCount = 4;
                            }

                            return Consumer<HomeProvider>(
                              builder: (context, homeProvider, child) {
                                // Loading state
                                if (homeProvider.isBestSellersLoading) {
                                  return Center(
                                    child: Padding(
                                      padding: const EdgeInsets.all(40.0),
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.black,
                                      ),
                                    ),
                                  );
                                }

                                // Error state
                                if (homeProvider.hasBestSellersError) {
                                  return Center(
                                    child: Padding(
                                      padding: const EdgeInsets.all(40.0),
                                      child: Column(
                                        children: [
                                          Icon(Icons.error_outline,
                                              size: 48,
                                              color: Colors.grey[400]),
                                          const SizedBox(height: 16),
                                          Text(
                                            'Failed to load best sellers',
                                            style: TextStyle(
                                                color: Colors.grey[600]),
                                          ),
                                          const SizedBox(height: 8),
                                          TextButton(
                                            onPressed: () => homeProvider
                                                .loadBestSellers(limit: 8),
                                            child: Text('Try Again'),
                                          ),
                                        ],
                                      ),
                                    ),
                                  );
                                }

                                final products =
                                    homeProvider.bestSellers.toProducts();

                                // Empty state
                                if (products.isEmpty) {
                                  return Center(
                                    child: Padding(
                                      padding: const EdgeInsets.all(40.0),
                                      child: Text(
                                        'No best sellers available',
                                        style:
                                            TextStyle(color: Colors.grey[600]),
                                      ),
                                    ),
                                  );
                                }

                                // Success state - show products
                                return GridView.builder(
                                  shrinkWrap: true,
                                  physics: const NeverScrollableScrollPhysics(),
                                  gridDelegate:
                                      SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: crossAxisCount,
                                    childAspectRatio: 0.62,
                                    crossAxisSpacing:
                                        constraints.maxWidth < 600 ? 12 : 24,
                                    mainAxisSpacing:
                                        constraints.maxWidth < 600 ? 16 : 24,
                                  ),
                                  itemCount: products.length,
                                  itemBuilder: (context, index) {
                                    final product = products[index];
                                    return ProductCard(
                                      product: product,
                                      onTap: () => _openProduct(product),
                                      onAddToCart: () => _addToCart(product),
                                    );
                                  },
                                );
                              },
                            );
                          },
                        ),
                      ),
                      const SizedBox(height: 60),
                    ],
                  ),
                ),

                const SizedBox(height: 80),

                // Special Selection Banner
                Container(
                  height: 500,
                  margin: const EdgeInsets.symmetric(horizontal: 40),
                  decoration: BoxDecoration(
                    color: const Color(0xFF1A1A1A),
                    border:
                        Border.all(color: const Color(0xFFE5E5E5), width: 1),
                  ),
                  child: Stack(
                    children: [
                      // Background Image
                      Positioned.fill(
                        child: Image.network(
                          'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1200',
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return Container(color: const Color(0xFF1A1A1A));
                          },
                        ),
                      ),
                      // Dark Overlay
                      Positioned.fill(
                        child: Container(
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              colors: [
                                Colors.black.withOpacity(0.7),
                                Colors.black.withOpacity(0.4),
                              ],
                              begin: Alignment.centerLeft,
                              end: Alignment.centerRight,
                            ),
                          ),
                        ),
                      ),
                      // Content
                      Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Text(
                              'SPECIAL SELECTION',
                              style: TextStyle(
                                fontFamily: 'WorkSans',
                                fontSize: 14,
                                fontWeight: FontWeight.w300,
                                color: const Color(0xFFB8860B),
                                letterSpacing: 3,
                              ),
                            ),
                            const SizedBox(height: 20),
                            Text(
                              'PROFESSIONAL COOKWARE',
                              style: TextStyle(
                                fontFamily: 'WorkSans',
                                fontSize: 56,
                                fontWeight: FontWeight.w300,
                                color: Colors.white,
                                letterSpacing: 2,
                                height: 1.2,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 16),
                            Text(
                              'Handcrafted excellence for culinary mastery',
                              style: TextStyle(
                                fontFamily: 'WorkSans',
                                fontSize: 16,
                                fontWeight: FontWeight.w300,
                                color: Colors.white.withOpacity(0.8),
                                letterSpacing: 1,
                              ),
                              textAlign: TextAlign.center,
                            ),
                            const SizedBox(height: 40),
                            Container(
                              decoration: BoxDecoration(
                                border:
                                    Border.all(color: Colors.white, width: 1),
                              ),
                              child: Material(
                                color: Colors.transparent,
                                child: InkWell(
                                  onTap: () {},
                                  child: Padding(
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 40,
                                      vertical: 16,
                                    ),
                                    child: Text(
                                      'EXPLORE COLLECTION',
                                      style: TextStyle(
                                        fontFamily: 'WorkSans',
                                        fontSize: 12,
                                        fontWeight: FontWeight.w500,
                                        color: Colors.white,
                                        letterSpacing: 2,
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 80),

                // Our Top Categories
                Container(
                  color: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 60),
                  child: Column(
                    children: [
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 40),
                        child: Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            'Our top categories',
                            style: TextStyle(
                              fontFamily: 'WorkSans',
                              fontSize: 32,
                              fontWeight: FontWeight.w400,
                              color: Colors.black,
                              letterSpacing: 0,
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 40),
                      Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 40),
                        child: Consumer<CatalogProvider>(
                          builder: (context, catalogProvider, child) {
                            final categories = catalogProvider.categories;

                            if (categories.isEmpty) {
                              return const SizedBox.shrink();
                            }

                            final topCategories = categories.take(4).toList();

                            return LayoutBuilder(
                              builder: (context, constraints) {
                                return GridView.builder(
                                  shrinkWrap: true,
                                  physics: const NeverScrollableScrollPhysics(),
                                  gridDelegate:
                                      SliverGridDelegateWithFixedCrossAxisCount(
                                    crossAxisCount: 4,
                                    childAspectRatio: 0.8,
                                    crossAxisSpacing: 24,
                                    mainAxisSpacing: 24,
                                  ),
                                  itemCount: topCategories.length,
                                  itemBuilder: (context, index) {
                                    final category = topCategories[index];
                                    return _buildTopCategoryCard(
                                        category, index);
                                  },
                                );
                              },
                            );
                          },
                        ),
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 80),

                // Our Bundles Section
                Container(
                  color: Colors.grey[50],
                  padding:
                      const EdgeInsets.symmetric(vertical: 80, horizontal: 60),
                  child: Column(
                    children: [
                      Text(
                        'COMPLETE SETS',
                        style: TextStyle(
                          fontFamily: 'WorkSans',
                          fontSize: 12,
                          fontWeight: FontWeight.w500,
                          color: const Color(0xFFB8860B),
                          letterSpacing: 3,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Our Bundles',
                        style: TextStyle(
                          fontFamily: 'WorkSans',
                          fontSize: 40,
                          fontWeight: FontWeight.w300,
                          color: Colors.black,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 12),
                      Text(
                        'Curated collections for the modern kitchen',
                        style: TextStyle(
                          fontFamily: 'WorkSans',
                          fontSize: 14,
                          fontWeight: FontWeight.w300,
                          color: Colors.grey[600],
                          letterSpacing: 0.3,
                        ),
                      ),
                      const SizedBox(height: 60),
                      LayoutBuilder(
                        builder: (context, constraints) {
                          return GridView.builder(
                            shrinkWrap: true,
                            physics: const NeverScrollableScrollPhysics(),
                            gridDelegate:
                                SliverGridDelegateWithFixedCrossAxisCount(
                              crossAxisCount: 2,
                              childAspectRatio: 1.1,
                              crossAxisSpacing: 30,
                              mainAxisSpacing: 30,
                            ),
                            itemCount: 4,
                            itemBuilder: (context, index) {
                              final bundles = [
                                {
                                  'title': 'Essential Chef Bundle',
                                  'description':
                                      'Complete knife set with cutting board',
                                  'price': 299.00,
                                  'originalPrice': 399.00,
                                  'image':
                                      'https://eu.josephjoseph.com/cdn/shop/files/10563_2.jpg?v=1689238638&width=800',
                                },
                                {
                                  'title': 'Baking Master Set',
                                  'description':
                                      'Everything for perfect pastries',
                                  'price': 189.00,
                                  'originalPrice': 245.00,
                                  'image':
                                      'https://eu.josephjoseph.com/cdn/shop/files/45037_002_Media_Rollover.jpg?v=1712321574&width=800',
                                },
                                {
                                  'title': 'Professional Cookware Bundle',
                                  'description':
                                      'Premium pots and pans collection',
                                  'price': 549.00,
                                  'originalPrice': 699.00,
                                  'image':
                                      'https://eu.josephjoseph.com/cdn/shop/files/45049_002_Media_Rollover.jpg?v=1718798477&width=800',
                                },
                                {
                                  'title': 'Barista Essentials',
                                  'description':
                                      'Complete coffee station setup',
                                  'price': 459.00,
                                  'originalPrice': 599.00,
                                  'image':
                                      'https://eu.josephjoseph.com/cdn/shop/products/95025_Media_02_b9227a62-5d15-4ba8-b58f-c51d339987f5.jpg?v=1662650475&width=800',
                                },
                              ];
                              final bundle = bundles[index];
                              return _buildBundleCard(bundle);
                            },
                          );
                        },
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 60),

                // Featured Brands Section
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 40, vertical: 80),
                  color: Colors.white,
                  child: Column(
                    children: [
                      Text(
                        'FEATURED BRANDS',
                        style: TextStyle(
                          fontFamily: 'WorkSans',
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.black.withOpacity(0.5),
                          letterSpacing: 3,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Premium Kitchenware Brands We Carry',
                        style: TextStyle(
                          fontFamily: 'WorkSans',
                          fontSize: 28,
                          fontWeight: FontWeight.w300,
                          color: Colors.black,
                          letterSpacing: 0.5,
                        ),
                      ),
                      const SizedBox(height: 60),
                      LayoutBuilder(
                        builder: (context, constraints) {
                          final brands = [
                            {'name': 'Joseph Joseph', 'logo': null},
                            {'name': 'OXO', 'logo': null},
                            {'name': 'Le Creuset', 'logo': null},
                            {'name': 'KitchenAid', 'logo': null},
                            {'name': 'All-Clad', 'logo': null},
                            {'name': 'Cuisinart', 'logo': null},
                            {'name': 'Lodge', 'logo': null},
                            {'name': 'Pyrex', 'logo': null},
                          ];

                          return Wrap(
                            spacing: 40,
                            runSpacing: 40,
                            alignment: WrapAlignment.center,
                            children: brands.map((brand) {
                              return MouseRegion(
                                cursor: SystemMouseCursors.click,
                                child: GestureDetector(
                                  onTap: () {
                                    // TODO: Navigate to brand page
                                  },
                                  child: Container(
                                    width: 150,
                                    height: 120,
                                    padding: const EdgeInsets.all(20),
                                    decoration: BoxDecoration(
                                      color: Colors.white,
                                      border: Border.all(
                                        color: Colors.grey.withOpacity(0.2),
                                        width: 1,
                                      ),
                                      boxShadow: [
                                        BoxShadow(
                                          color: Colors.black.withOpacity(0.03),
                                          blurRadius: 10,
                                          offset: const Offset(0, 2),
                                        ),
                                      ],
                                    ),
                                    child: Center(
                                      child: brand['logo'] != null
                                          ? Image.network(
                                              brand['logo']!,
                                              fit: BoxFit.contain,
                                              errorBuilder:
                                                  (context, error, stackTrace) {
                                                return _buildBrandPlaceholder(
                                                    brand['name']!);
                                              },
                                            )
                                          : _buildBrandPlaceholder(
                                              brand['name']!),
                                    ),
                                  ),
                                ),
                              );
                            }).toList(),
                          );
                        },
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 60),

                // Loyalty Program Banner (Database-Driven - HOME_MID placement)
                const LoyaltyProgramBanner(),

                const SizedBox(height: 80),

                // Newsletter Section
                Container(
                  color: Colors.grey[100],
                  padding:
                      const EdgeInsets.symmetric(vertical: 80, horizontal: 40),
                  child: Center(
                    child: Container(
                      constraints: const BoxConstraints(maxWidth: 600),
                      child: Column(
                        children: [
                          Text(
                            'STAY CONNECTED',
                            style: TextStyle(
                              fontFamily: 'WorkSans',
                              fontSize: 12,
                              fontWeight: FontWeight.w500,
                              color: const Color(0xFFB8860B),
                              letterSpacing: 3,
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            'Join Our Newsletter',
                            style: TextStyle(
                              fontFamily: 'WorkSans',
                              fontSize: 36,
                              fontWeight: FontWeight.w300,
                              color: Colors.black,
                              letterSpacing: 0.5,
                            ),
                          ),
                          const SizedBox(height: 12),
                          Text(
                            'Subscribe for exclusive offers, new arrivals, and professional tips',
                            style: TextStyle(
                              fontFamily: 'WorkSans',
                              fontSize: 14,
                              fontWeight: FontWeight.w300,
                              color: Colors.grey[600],
                              letterSpacing: 0.3,
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 32),
                          Container(
                            decoration: BoxDecoration(
                              color: Colors.white,
                              border: Border.all(color: Colors.grey[300]!),
                            ),
                            child: Row(
                              children: [
                                Expanded(
                                  child: TextField(
                                    decoration: InputDecoration(
                                      hintText: 'Enter your email address',
                                      hintStyle: TextStyle(
                                        fontFamily: 'WorkSans',
                                        fontSize: 14,
                                        color: Colors.grey[400],
                                        letterSpacing: 0.3,
                                      ),
                                      border: InputBorder.none,
                                      contentPadding:
                                          const EdgeInsets.symmetric(
                                        horizontal: 24,
                                        vertical: 18,
                                      ),
                                    ),
                                  ),
                                ),
                                ElevatedButton(
                                  onPressed: () {
                                    // TODO: Handle newsletter subscription
                                  },
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF1A1A1A),
                                    foregroundColor: Colors.white,
                                    padding: const EdgeInsets.symmetric(
                                      horizontal: 40,
                                      vertical: 18,
                                    ),
                                    shape: const RoundedRectangleBorder(
                                      borderRadius: BorderRadius.zero,
                                    ),
                                    elevation: 0,
                                  ),
                                  child: Text(
                                    'SUBSCRIBE',
                                    style: TextStyle(
                                      fontFamily: 'WorkSans',
                                      fontSize: 12,
                                      fontWeight: FontWeight.w600,
                                      letterSpacing: 1.5,
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                ),

                // Footer
                Container(
                  width: double.infinity,
                  color: const Color(0xFF1A1A1A),
                  padding:
                      const EdgeInsets.symmetric(vertical: 80, horizontal: 60),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Footer Grid
                      LayoutBuilder(
                        builder: (context, constraints) {
                          return Wrap(
                            spacing: 60,
                            runSpacing: 40,
                            children: [
                              // Company Info
                              SizedBox(
                                width: 280,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // CFC Logo
                                    Padding(
                                      padding: const EdgeInsets.only(bottom: 20),
                                      child: BrandLogo(height: 70),
                                    ),
                                    const SizedBox(height: 20),
                                    Text(
                                      'Your destination for professional-grade kitchen equipment. Quality tools for passionate cooks.',
                                      style: TextStyle(
                                        fontFamily: 'WorkSans',
                                        fontSize: 13,
                                        fontWeight: FontWeight.w300,
                                        color: Colors.white.withOpacity(0.7),
                                        letterSpacing: 0.3,
                                        height: 1.6,
                                      ),
                                    ),
                                    const SizedBox(height: 24),
                                    Row(
                                      children: [
                                        Icon(Icons.location_on_outlined,
                                            color: Color(0xFFB8860B), size: 18),
                                        const SizedBox(width: 8),
                                        Expanded(
                                          child: Text(
                                            '123 Kitchen Avenue\nNew York, NY 10001\nUnited States',
                                            style: TextStyle(
                                              fontFamily: 'WorkSans',
                                              fontSize: 12,
                                              fontWeight: FontWeight.w300,
                                              color:
                                                  Colors.white.withOpacity(0.7),
                                              letterSpacing: 0.3,
                                              height: 1.5,
                                            ),
                                          ),
                                        ),
                                      ],
                                    ),
                                    const SizedBox(height: 24),
                                  ],
                                ),
                              ),
                              // Shop Links - Dynamic from API
                              SizedBox(
                                width: 180,
                                child: Consumer<CatalogProvider>(
                                  builder: (context, catalogProvider, child) {
                                    final categories = catalogProvider
                                        .categories
                                        .take(6)
                                        .toList();
                                    return Column(
                                      crossAxisAlignment:
                                          CrossAxisAlignment.start,
                                      children: [
                                        Text(
                                          'SHOP',
                                          style: TextStyle(
                                            fontFamily: 'WorkSans',
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600,
                                            color: Colors.white,
                                            letterSpacing: 2,
                                          ),
                                        ),
                                        const SizedBox(height: 20),
                                        if (categories.isEmpty)
                                          _buildFooterLink('All Products')
                                        else
                                          ...categories.map((cat) => Padding(
                                                padding: const EdgeInsets.only(
                                                    bottom: 12),
                                                child:
                                                    _buildFooterLink(cat.name),
                                              )),
                                      ],
                                    );
                                  },
                                ),
                              ),
                              // Customer Service
                              SizedBox(
                                width: 180,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'CUSTOMER SERVICE',
                                      style: TextStyle(
                                        fontFamily: 'WorkSans',
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.white,
                                        letterSpacing: 2,
                                      ),
                                    ),
                                    const SizedBox(height: 20),
                                    _buildFooterLink('Contact Us'),
                                    const SizedBox(height: 12),
                                    _buildFooterLink('Shipping Info'),
                                    const SizedBox(height: 12),
                                    _buildFooterLink('Returns & Exchanges'),
                                    const SizedBox(height: 12),
                                    _buildFooterLink('Track Order'),
                                    const SizedBox(height: 12),
                                    _buildFooterLink('FAQs'),
                                    const SizedBox(height: 12),
                                    _buildFooterLink('Size Guide'),
                                    const SizedBox(height: 12),
                                    GestureDetector(
                                      onTap: () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) =>
                                                const BulkOrderScreen(),
                                          ),
                                        );
                                      },
                                      child: MouseRegion(
                                        cursor: SystemMouseCursors.click,
                                        child: Text(
                                          'Bulk Orders & Wholesale',
                                          style: TextStyle(
                                            fontFamily: 'WorkSans',
                                            fontSize: 13,
                                            fontWeight: FontWeight.w300,
                                            color:
                                                Colors.white.withOpacity(0.7),
                                            letterSpacing: 0.3,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              // Company
                              SizedBox(
                                width: 180,
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      'COMPANY',
                                      style: TextStyle(
                                        fontFamily: 'WorkSans',
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600,
                                        color: Colors.white,
                                        letterSpacing: 2,
                                      ),
                                    ),
                                    const SizedBox(height: 20),
                                    GestureDetector(
                                      onTap: () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) =>
                                                const AboutUsScreen(),
                                          ),
                                        );
                                      },
                                      child: MouseRegion(
                                        cursor: SystemMouseCursors.click,
                                        child: Text(
                                          'About Us',
                                          style: TextStyle(
                                            fontFamily: 'WorkSans',
                                            fontSize: 13,
                                            fontWeight: FontWeight.w300,
                                            color:
                                                Colors.white.withOpacity(0.7),
                                            letterSpacing: 0.3,
                                          ),
                                        ),
                                      ),
                                    ),
                                    const SizedBox(height: 12),
                                    _buildFooterLink('Our Story'),
                                    const SizedBox(height: 12),
                                    _buildFooterLink('Careers'),
                                    const SizedBox(height: 12),
                                    _buildFooterLink('Press'),
                                    const SizedBox(height: 12),
                                    _buildFooterLink('Sustainability'),
                                    const SizedBox(height: 12),
                                    GestureDetector(
                                      onTap: () {
                                        Navigator.push(
                                          context,
                                          MaterialPageRoute(
                                            builder: (context) =>
                                                const LoyaltyProgramScreen(),
                                          ),
                                        );
                                      },
                                      child: MouseRegion(
                                        cursor: SystemMouseCursors.click,
                                        child: Text(
                                          'Loyalty Program',
                                          style: TextStyle(
                                            fontFamily: 'WorkSans',
                                            fontSize: 13,
                                            fontWeight: FontWeight.w300,
                                            color:
                                                Colors.white.withOpacity(0.7),
                                            letterSpacing: 0.3,
                                          ),
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            ],
                          );
                        },
                      ),
                      const SizedBox(height: 60),
                      Container(
                        height: 1,
                        color: Colors.white.withOpacity(0.1),
                      ),
                      const SizedBox(height: 30),
                      // Bottom Footer
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            '© 2025 Solo. All rights reserved.',
                            style: TextStyle(
                              fontFamily: 'WorkSans',
                              fontSize: 11,
                              color: Colors.white.withOpacity(0.5),
                              letterSpacing: 0.5,
                            ),
                          ),
                          Row(
                            children: [
                              _buildFooterLink('Privacy Policy'),
                              const SizedBox(width: 24),
                              _buildFooterLink('Terms of Service'),
                              const SizedBox(width: 24),
                              _buildFooterLink('Cookies'),
                            ],
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
      floatingActionButton: null,
    )
  }

  Widget _buildBrandPlaceholder(String brandName) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          Icons.store,
          size: 40,
          color: Colors.grey.withOpacity(0.5),
        ),
        const SizedBox(height: 8),
        Text(
          brandName,
          textAlign: TextAlign.center,
          style: TextStyle(
            fontFamily: 'WorkSans',
            fontSize: 12,
            fontWeight: FontWeight.w500,
            color: Colors.black.withOpacity(0.7),
            letterSpacing: 0.5,
          ),
        ),
      ],
    );
  }

  Widget _buildCategoryCard(category) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => CategoryScreen(category: category),
            ),
          );
        },
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            border: Border.all(
              color: Colors.grey[200]!,
              width: 1,
            ),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 20,
                offset: const Offset(0, 8),
              ),
            ],
          ),
          child: Column(
            children: [
              // Image Container
              Expanded(
                flex: 6,
                child: Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Colors.white,
                    border: Border(
                      bottom: BorderSide(
                        color: Colors.grey[100]!,
                        width: 1,
                      ),
                    ),
                  ),
                  child: Stack(
                    children: [
                      // Product Image with error handling
                      Positioned.fill(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: category.imageUrl.isNotEmpty
                              ? Image.network(
                                  category.imageUrl,
                                  fit: BoxFit.contain,
                                  loadingBuilder:
                                      (context, child, loadingProgress) {
                                    if (loadingProgress == null) return child;
                                    return Center(
                                      child: CircularProgressIndicator(
                                        value: loadingProgress
                                                    .expectedTotalBytes !=
                                                null
                                            ? loadingProgress
                                                    .cumulativeBytesLoaded /
                                                loadingProgress
                                                    .expectedTotalBytes!
                                            : null,
                                        strokeWidth: 2,
                                        color: const Color(0xFFB8860B),
                                      ),
                                    );
                                  },
                                  errorBuilder: (context, error, stackTrace) {
                                    return Container(
                                      color: Colors.grey[100],
                                      child: Center(
                                        child: Icon(
                                          Icons.category_outlined,
                                          size: 48,
                                          color: Colors.grey[400],
                                        ),
                                      ),
                                    );
                                  },
                                )
                              : Container(
                                  color: Colors.grey[100],
                                  child: Center(
                                    child: Icon(
                                      Icons.category_outlined,
                                      size: 48,
                                      color: Colors.grey[400],
                                    ),
                                  ),
                                ),
                        ),
                      ),
                      // Gold corner accent
                      Positioned(
                        top: 0,
                        right: 0,
                        child: Container(
                          width: 40,
                          height: 40,
                          decoration: BoxDecoration(
                            gradient: LinearGradient(
                              begin: Alignment.topRight,
                              end: Alignment.bottomLeft,
                              colors: [
                                const Color(0xFFB8860B).withOpacity(0.15),
                                Colors.transparent,
                              ],
                            ),
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
              // Info Container
              Expanded(
                flex: 4,
                child: Container(
                  width: double.infinity,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Flexible(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Text(
                              category.name.toUpperCase(),
                              style: TextStyle(
                                fontFamily: 'WorkSans',
                                fontSize: 13,
                                fontWeight: FontWeight.w500,
                                letterSpacing: 1.5,
                                color: Colors.black,
                              ),
                              overflow: TextOverflow.ellipsis,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${category.productCount} items',
                              style: TextStyle(
                                fontFamily: 'WorkSans',
                                fontSize: 10,
                                fontWeight: FontWeight.w300,
                                color: Colors.grey[500],
                                letterSpacing: 0.5,
                              ),
                            ),
                          ],
                        ),
                      ),
                      // Explore link
                      Row(
                        children: [
                          Text(
                            'EXPLORE',
                            style: TextStyle(
                              fontFamily: 'WorkSans',
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              letterSpacing: 1.5,
                              color: const Color(0xFFB8860B),
                            ),
                          ),
                          const SizedBox(width: 8),
                          Container(
                            width: 20,
                            height: 1,
                            color: const Color(0xFFB8860B),
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

  Widget _buildTopCategoryCard(category, int index) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: const Color(0xFFE5E5E5), width: 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Expanded(
            child: Container(
              decoration: BoxDecoration(
                image: DecorationImage(
                  image: NetworkImage(index == 0
                      ? 'https://eu.josephjoseph.com/cdn/shop/files/45049_002_Media_Rollover.jpg?v=1718798477&width=800'
                      : index == 1
                          ? 'https://eu.josephjoseph.com/cdn/shop/files/10563_2.jpg?v=1689238638&width=800'
                          : index == 2
                              ? 'https://eu.josephjoseph.com/cdn/shop/files/45037_002_Media_Rollover.jpg?v=1712321574&width=800'
                              : 'https://eu.josephjoseph.com/cdn/shop/files/Media_Rollover_900x730_c698f0b8-2d59-4776-8197-4c91037f134d.jpg?v=1727176268&width=800'),
                  fit: BoxFit.cover,
                ),
              ),
              child: Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.black.withOpacity(0.0),
                      Colors.black.withOpacity(0.3),
                    ],
                  ),
                ),
              ),
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  category.name.toUpperCase(),
                  style: TextStyle(
                    fontFamily: 'WorkSans',
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                    letterSpacing: 1.5,
                    color: Colors.black,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  '${category.productCount} items',
                  style: TextStyle(
                    fontFamily: 'WorkSans',
                    fontSize: 12,
                    fontWeight: FontWeight.w300,
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 16),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) =>
                              CategoryScreen(category: category),
                        ),
                      );
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1A1A1A),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 12),
                      shape: const RoundedRectangleBorder(
                        borderRadius: BorderRadius.zero,
                      ),
                      elevation: 0,
                    ),
                    child: Text(
                      'SHOP NOW',
                      style: TextStyle(
                        fontFamily: 'WorkSans',
                        fontSize: 12,
                        fontWeight: FontWeight.w500,
                        letterSpacing: 1.5,
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

  Widget _buildBundleCard(Map<String, dynamic> bundle) {
    final discount = ((bundle['originalPrice'] - bundle['price']) /
            bundle['originalPrice'] *
            100)
        .round();
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        border: Border.all(color: Colors.grey[200]!),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.04),
            blurRadius: 15,
            offset: const Offset(0, 5),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(
            child: Stack(
              children: [
                Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: Colors.grey[50],
                    border: Border(
                      bottom: BorderSide(color: Colors.grey[200]!),
                    ),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(30),
                    child: Image.network(
                      bundle['image'],
                      fit: BoxFit.contain,
                    ),
                  ),
                ),
                Positioned(
                  top: 16,
                  right: 16,
                  child: Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.red,
                    ),
                    child: Text(
                      'SAVE $discount%',
                      style: const TextStyle(
                        fontFamily: 'WorkSans',
                        fontSize: 11,
                        fontWeight: FontWeight.w600,
                        color: Colors.white,
                        letterSpacing: 1,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
          Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  bundle['title'].toUpperCase(),
                  style: const TextStyle(
                    fontFamily: 'WorkSans',
                    fontSize: 16,
                    fontWeight: FontWeight.w500,
                    letterSpacing: 1.5,
                  ),
                ),
                const SizedBox(height: 8),
                Text(
                  bundle['description'],
                  style: TextStyle(
                    fontFamily: 'WorkSans',
                    fontSize: 13,
                    fontWeight: FontWeight.w300,
                    color: Colors.grey[600],
                    letterSpacing: 0.3,
                  ),
                ),
                const SizedBox(height: 16),
                Row(
                  children: [
                    Text(
                      'AED ${bundle['originalPrice'].toStringAsFixed(2)}',
                      style: TextStyle(
                        fontFamily: 'WorkSans',
                        fontSize: 14,
                        color: Colors.grey[400],
                        decoration: TextDecoration.lineThrough,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Text(
                      'AED ${bundle['price'].toStringAsFixed(2)}',
                      style: const TextStyle(
                        fontFamily: 'WorkSans',
                        fontSize: 22,
                        fontWeight: FontWeight.w600,
                        color: Colors.red,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: () {},
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF1A1A1A),
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                      shape: const RoundedRectangleBorder(
                        borderRadius: BorderRadius.zero,
                      ),
                      elevation: 0,
                    ),
                    child: const Text(
                      'VIEW BUNDLE',
                      style: TextStyle(
                        fontFamily: 'WorkSans',
                        fontSize: 12,
                        fontWeight: FontWeight.w600,
                        letterSpacing: 1.5,
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

  Widget _buildFooterLink(String text) {
    return InkWell(
      onTap: () {},
      child: Text(
        text,
        style: TextStyle(
          fontFamily: 'WorkSans',
          fontSize: 12,
          fontWeight: FontWeight.w300,
          color: Colors.white.withOpacity(0.7),
          letterSpacing: 0.3,
        ),
      ),
    );
  }

  Widget _buildFeaturedCategoryBox(String title, String imageUrl) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        onTap: () {
          // Create a temporary category for navigation
          final category = Category(
            id: title.toLowerCase().replaceAll(' ', '-'),
            name: title,
            icon: '📦',
            imageUrl: imageUrl,
            productCount: 0,
          );

          // Navigate to category
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => CategoryScreen(
                category: category,
              ),
            ),
          );
        },
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(0),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Image
              Expanded(
                flex: 3,
                child: Container(
                  decoration: BoxDecoration(
                    color: Colors.grey[100],
                  ),
                  child: Image.network(
                    imageUrl,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) {
                      return Container(
                        color: Colors.grey[200],
                        child: Icon(
                          Icons.image_not_supported,
                          size: 40,
                          color: Colors.grey[400],
                        ),
                      );
                    },
                    loadingBuilder: (context, child, loadingProgress) {
                      if (loadingProgress == null) return child;
                      return Center(
                        child: CircularProgressIndicator(
                          value: loadingProgress.expectedTotalBytes != null
                              ? loadingProgress.cumulativeBytesLoaded /
                                  loadingProgress.expectedTotalBytes!
                              : null,
                        ),
                      );
                    },
                  ),
                ),
              ),
              // Title
              Expanded(
                flex: 1,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  alignment: Alignment.center,
                  child: Text(
                    title.toUpperCase(),
                    style: const TextStyle(
                      fontFamily: 'WorkSans',
                      fontSize: 14,
                      fontWeight: FontWeight.w600,
                      color: Color(0xFF1A1A1A),
                      letterSpacing: 1.2,
                    ),
                    textAlign: TextAlign.center,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Build CMS Section widget from section data
  Widget _buildCmsSection(dynamic section) {
    final type = section['type'] as String? ?? '';
    final isEnabled = section['isEnabled'] as bool? ?? true;
    final title = section['title'] as String?;
    final config = section['config'] as Map<String, dynamic>? ?? {};

    if (!isEnabled) return const SizedBox.shrink();

    switch (type) {
      case 'HERO_SLIDER':
        return Padding(
          padding: const EdgeInsets.only(bottom: 32),
          child: _buildCmsHeroSlider(config),
        );

      case 'CATEGORY_TILES':
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 32),
          child: _buildCmsCategoryTiles(title, config),
        );

      default:
        return const SizedBox.shrink();
    }
  }

  /// Build CMS Hero Slider
  Widget _buildCmsHeroSlider(Map<String, dynamic> config) {
    final slides = (config['slides'] as List?)
        ?.map((s) => Map<String, dynamic>.from(s))
        .toList() ?? [];
    
    if (slides.isEmpty) return const SizedBox.shrink();

    final isMobile = MediaQuery.of(context).size.width < 600;
    final sliderHeight = isMobile ? 280.0 : 480.0;

    return SizedBox(
      height: sliderHeight,
      child: PageView.builder(
        itemCount: slides.length,
        itemBuilder: (context, index) {
          final slide = slides[index];
          final imageUrl = isMobile
              ? (slide['mobileImageUrl'] ?? slide['imageUrl'] ?? '')
              : (slide['imageUrl'] ?? '');
          final slideTitle = slide['title'] ?? '';
          final subtitle = slide['subtitle'] ?? '';
          final ctaLabel = slide['ctaLabel'] ?? '';
          final ctaTargetType = slide['ctaTargetType'] ?? '';
          final ctaTargetValue = slide['ctaTargetValue'] ?? '';

          return Stack(
            fit: StackFit.expand,
            children: [
              if (imageUrl.isNotEmpty)
                Image.network(
                  imageUrl,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    color: Colors.grey[200],
                    child: const Icon(Icons.image_not_supported, size: 48),
                  ),
                )
              else
                Container(color: Colors.grey[300]),

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

              Positioned(
                left: isMobile ? 20 : 60,
                bottom: isMobile ? 40 : 80,
                right: isMobile ? 20 : null,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    if (slideTitle.isNotEmpty)
                      Text(
                        slideTitle,
                        style: TextStyle(
                          fontFamily: 'WorkSans',
                          fontSize: isMobile ? 28 : 42,
                          fontWeight: FontWeight.w600,
                          color: Colors.white,
                          height: 1.2,
                        ),
                      ),
                    if (subtitle.isNotEmpty) ...[
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
                    if (ctaLabel.isNotEmpty) ...[
                      const SizedBox(height: 20),
                      ElevatedButton(
                        onPressed: () => _handleCmsNavigation(ctaTargetType, ctaTargetValue),
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
          );
        },
      ),
    );
  }

  /// Build CMS Category Tiles
  Widget _buildCmsCategoryTiles(String? title, Map<String, dynamic> config) {
    final tiles = (config['tiles'] as List?)
        ?.where((t) => t['isEnabled'] == true)
        .map((t) => Map<String, dynamic>.from(t))
        .toList() ?? [];
    
    if (tiles.isEmpty) return const SizedBox.shrink();

    final isMobile = MediaQuery.of(context).size.width < 600;
    final padding = isMobile ? 16.0 : 60.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title != null && title.isNotEmpty) ...[
          Padding(
            padding: EdgeInsets.symmetric(horizontal: padding),
            child: Text(
              title,
              style: TextStyle(
                fontFamily: 'WorkSans',
                fontSize: isMobile ? 24 : 32,
                fontWeight: FontWeight.w400,
                color: Colors.black,
              ),
            ),
          ),
          const SizedBox(height: 24),
        ],
        Padding(
          padding: EdgeInsets.symmetric(horizontal: padding),
          child: LayoutBuilder(
            builder: (context, constraints) {
              int crossAxisCount;
              if (constraints.maxWidth < 600) {
                crossAxisCount = 2;
              } else {
                crossAxisCount = 4;
              }

              return GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: crossAxisCount,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: 0.85,
                ),
                itemCount: tiles.length,
                itemBuilder: (context, index) {
                  final tile = tiles[index];
                  return _buildCmsTile(tile);
                },
              );
            },
          ),
        ),
      ],
    );
  }

  /// Build a single CMS tile
  Widget _buildCmsTile(Map<String, dynamic> tile) {
    final tileTitle = tile['title'] ?? '';
    final subtitle = tile['subtitle'] ?? '';
    final imageUrl = tile['imageUrl'] ?? '';
    final targetType = tile['targetType'] ?? '';
    final targetValue = tile['targetValue'] ?? '';

    return MouseRegion(
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        onTap: () => _handleCmsNavigation(targetType, targetValue),
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              Expanded(
                flex: 3,
                child: Container(
                  color: Colors.grey[100],
                  child: imageUrl.isNotEmpty
                      ? Image.network(
                          imageUrl,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Icon(
                            Icons.image_not_supported,
                            size: 40,
                            color: Colors.grey[400],
                          ),
                        )
                      : Icon(
                          Icons.category,
                          size: 40,
                          color: Colors.grey[400],
                        ),
                ),
              ),
              Expanded(
                flex: 1,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  alignment: Alignment.center,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        tileTitle.toUpperCase(),
                        style: const TextStyle(
                          fontFamily: 'WorkSans',
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF1A1A1A),
                          letterSpacing: 1,
                        ),
                        textAlign: TextAlign.center,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (subtitle.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          subtitle,
                          style: TextStyle(
                            fontFamily: 'WorkSans',
                            fontSize: 11,
                            fontWeight: FontWeight.w300,
                            color: Colors.grey[600],
                          ),
                          textAlign: TextAlign.center,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
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

  /// Handle CMS navigation
  void _handleCmsNavigation(String targetType, String targetValue) {
    if (targetValue.isEmpty) return;

    switch (targetType) {
      case 'category':
        Navigator.pushNamed(
          context,
          '/category-landing',
          arguments: {'categoryId': targetValue},
        );
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
        debugPrint('Unknown target type: $targetType');
    }
  }
}
