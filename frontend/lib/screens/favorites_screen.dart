import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../widgets/modern_drawer.dart';
import '../models/product.dart';
import '../providers/favorites_provider.dart';
import '../providers/auth_provider.dart';
import 'product_detail_screen.dart';

class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({super.key});

  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen> {
  @override
  void initState() {
    super.initState();
    _loadFavorites();
  }

  Future<void> _loadFavorites() async {
    final authProvider = context.read<AuthProvider>();
    if (authProvider.isAuthenticated) {
      final favoritesProvider = context.read<FavoritesProvider>();
      if (!favoritesProvider.isInitialized) {
        await favoritesProvider.loadFavorites();
      }
    }
  }

  Future<void> _removeFromFavorites(Product product) async {
    // Use FavoritesProvider to manage favorites
    final favoritesProvider = context.read<FavoritesProvider>();

    try {
      await favoritesProvider.toggleFavorite(product);

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${product.name} removed from favorites'),
            duration: const Duration(seconds: 2),
            action: SnackBarAction(
              label: 'UNDO',
              onPressed: () async {
                await favoritesProvider.toggleFavorite(product);
              },
            ),
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Error: $e')),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();

    return Scaffold(
      backgroundColor: Colors.grey[50],
      drawer: const ModernDrawer(),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        centerTitle: true,
        title: const Text(
          'MY FAVORITES',
          style: TextStyle(
            fontFamily: 'WorkSans',
            fontSize: 16,
            fontWeight: FontWeight.w600,
            color: Colors.black,
            letterSpacing: 2,
          ),
        ),
        iconTheme: const IconThemeData(color: Colors.black),
      ),
      body: !authProvider.isAuthenticated
          ? _buildLoginPrompt()
          : Consumer<FavoritesProvider>(
              builder: (context, favoritesProvider, child) {
                if (favoritesProvider.isLoading) {
                  return const Center(child: CircularProgressIndicator());
                }

                final favoriteProducts = favoritesProvider.favorites;

                if (favoriteProducts.isEmpty) {
                  return _buildEmptyState();
                }

                return RefreshIndicator(
                  onRefresh: () => favoritesProvider.loadFavorites(),
                  child: SingleChildScrollView(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        // Header Section
                        Container(
                          padding: const EdgeInsets.all(40),
                          color: Colors.white,
                          child: Column(
                            children: [
                              Container(
                                width: 70,
                                height: 70,
                                decoration: BoxDecoration(
                                  color:
                                      const Color(0xFFB8860B).withOpacity(0.1),
                                  shape: BoxShape.circle,
                                ),
                                child: const Icon(
                                  Icons.favorite,
                                  size: 35,
                                  color: Color(0xFFB8860B),
                                ),
                              ),
                              const SizedBox(height: 20),
                              const Text(
                                'Your Favorites',
                                style: TextStyle(
                                  fontFamily: 'WorkSans',
                                  fontSize: 32,
                                  fontWeight: FontWeight.w300,
                                  color: Colors.black,
                                  letterSpacing: 0.5,
                                ),
                              ),
                              const SizedBox(height: 10),
                              Text(
                                '${favoriteProducts.length} ${favoriteProducts.length == 1 ? 'item' : 'items'} saved',
                                style: TextStyle(
                                  fontFamily: 'WorkSans',
                                  fontSize: 14,
                                  fontWeight: FontWeight.w300,
                                  color: Colors.black.withOpacity(0.6),
                                ),
                              ),
                            ],
                          ),
                        ),

                        // Products Grid
                        Padding(
                          padding: EdgeInsets.all(
                              MediaQuery.of(context).size.width < 600
                                  ? 16
                                  : 40),
                          child: LayoutBuilder(
                            builder: (context, constraints) {
                              final crossAxisCount = constraints.maxWidth > 1200
                                  ? 4
                                  : constraints.maxWidth > 800
                                      ? 3
                                      : constraints.maxWidth > 500
                                          ? 2
                                          : 1;

                              return GridView.builder(
                                shrinkWrap: true,
                                physics: const NeverScrollableScrollPhysics(),
                                gridDelegate:
                                    SliverGridDelegateWithFixedCrossAxisCount(
                                  crossAxisCount: crossAxisCount,
                                  childAspectRatio:
                                      constraints.maxWidth < 500 ? 0.8 : 0.7,
                                  crossAxisSpacing:
                                      constraints.maxWidth < 600 ? 12 : 30,
                                  mainAxisSpacing:
                                      constraints.maxWidth < 600 ? 12 : 30,
                                ),
                                itemCount: favoriteProducts.length,
                                itemBuilder: (context, index) {
                                  return _buildProductCard(
                                      favoriteProducts[index]);
                                },
                              );
                            },
                          ),
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }

  Widget _buildLoginPrompt() {
    return Center(
      child: Container(
        padding: const EdgeInsets.all(40),
        constraints: const BoxConstraints(maxWidth: 500),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: Colors.grey[200],
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.person_outline,
                size: 60,
                color: Colors.grey[400],
              ),
            ),
            const SizedBox(height: 30),
            const Text(
              'Sign In Required',
              style: TextStyle(
                fontFamily: 'WorkSans',
                fontSize: 28,
                fontWeight: FontWeight.w400,
                color: Colors.black,
              ),
            ),
            const SizedBox(height: 15),
            Text(
              'Please sign in to view and manage your favorites across all devices.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontFamily: 'WorkSans',
                fontSize: 14,
                fontWeight: FontWeight.w300,
                color: Colors.black.withOpacity(0.6),
                height: 1.6,
              ),
            ),
            const SizedBox(height: 30),
            ElevatedButton(
              onPressed: () {
                Navigator.pushNamed(context, '/login');
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFB8860B),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 40,
                  vertical: 16,
                ),
                shape: const RoundedRectangleBorder(
                  borderRadius: BorderRadius.zero,
                ),
              ),
              child: const Text(
                'SIGN IN',
                style: TextStyle(
                  fontFamily: 'WorkSans',
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 1.5,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyState() {
    return Center(
      child: Container(
        padding: const EdgeInsets.all(40),
        constraints: const BoxConstraints(maxWidth: 500),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                color: Colors.grey[200],
                shape: BoxShape.circle,
              ),
              child: Icon(
                Icons.favorite_border,
                size: 60,
                color: Colors.grey[400],
              ),
            ),
            const SizedBox(height: 30),
            const Text(
              'No Favorites Yet',
              style: TextStyle(
                fontFamily: 'WorkSans',
                fontSize: 28,
                fontWeight: FontWeight.w400,
                color: Colors.black,
              ),
            ),
            const SizedBox(height: 15),
            Text(
              'Start adding products to your favorites to keep track of items you love.',
              textAlign: TextAlign.center,
              style: TextStyle(
                fontFamily: 'WorkSans',
                fontSize: 14,
                fontWeight: FontWeight.w300,
                color: Colors.black.withOpacity(0.6),
                height: 1.6,
              ),
            ),
            const SizedBox(height: 30),
            ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFB8860B),
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(
                  horizontal: 40,
                  vertical: 16,
                ),
                shape: const RoundedRectangleBorder(
                  borderRadius: BorderRadius.zero,
                ),
              ),
              child: const Text(
                'START SHOPPING',
                style: TextStyle(
                  fontFamily: 'WorkSans',
                  fontSize: 13,
                  fontWeight: FontWeight.w600,
                  letterSpacing: 1.5,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildProductCard(Product product) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => ProductDetailScreen(product: product),
            ),
          );
        },
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.08),
                blurRadius: 15,
                offset: const Offset(0, 5),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Product Image with Favorite Button
              Expanded(
                child: Stack(
                  children: [
                    Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                      ),
                      child: Image.network(
                        product.imageUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) {
                          return Container(
                            color: Colors.grey[200],
                            child: const Icon(
                              Icons.image_not_supported,
                              size: 50,
                              color: Colors.grey,
                            ),
                          );
                        },
                      ),
                    ),
                    // Favorite Button
                    Positioned(
                      top: 10,
                      right: 10,
                      child: Container(
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(
                              color: Colors.black.withOpacity(0.1),
                              blurRadius: 8,
                            ),
                          ],
                        ),
                        child: IconButton(
                          icon: const Icon(
                            Icons.favorite,
                            color: Colors.red,
                          ),
                          onPressed: () => _removeFromFavorites(product),
                        ),
                      ),
                    ),
                    // Discount Badge
                    if (product.originalPrice != null &&
                        product.discountPercent > 0)
                      Positioned(
                        top: 10,
                        left: 10,
                        child: Container(
                          padding: const EdgeInsets.symmetric(
                            horizontal: 10,
                            vertical: 6,
                          ),
                          color: Colors.red,
                          child: Text(
                            '-${product.discountPercent.toInt()}%',
                            style: const TextStyle(
                              fontFamily: 'WorkSans',
                              fontSize: 12,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              // Product Info
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      product.name,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(
                        fontFamily: 'WorkSans',
                        fontSize: 14,
                        fontWeight: FontWeight.w400,
                        color: Colors.black,
                        height: 1.4,
                      ),
                    ),
                    const SizedBox(height: 12),
                    // Price
                    Row(
                      children: [
                        if (product.originalPrice != null) ...[
                          Text(
                            'AED ${product.originalPrice!.toStringAsFixed(2)}',
                            style: TextStyle(
                              fontFamily: 'WorkSans',
                              fontSize: 13,
                              fontWeight: FontWeight.w300,
                              color: Colors.grey[400],
                              decoration: TextDecoration.lineThrough,
                            ),
                          ),
                          const SizedBox(width: 8),
                        ],
                        Text(
                          'AED ${product.price.toStringAsFixed(2)}',
                          style: TextStyle(
                            fontFamily: 'WorkSans',
                            fontSize: 16,
                            fontWeight: FontWeight.w600,
                            color: product.originalPrice != null
                                ? Colors.red
                                : Colors.black,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 15),
                    // Add to Cart Button
                    SizedBox(
                      width: double.infinity,
                      child: ElevatedButton(
                        onPressed: () {
                          // TODO: Add to cart functionality
                          ScaffoldMessenger.of(context).showSnackBar(
                            SnackBar(
                              content: Text('${product.name} added to cart'),
                              duration: const Duration(seconds: 2),
                            ),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFFB8860B),
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          shape: const RoundedRectangleBorder(
                            borderRadius: BorderRadius.zero,
                          ),
                          elevation: 0,
                        ),
                        child: const Text(
                          'ADD TO CART',
                          style: TextStyle(
                            fontFamily: 'WorkSans',
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            letterSpacing: 1,
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
      ),
    );
  }
}
