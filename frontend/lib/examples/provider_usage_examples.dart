import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/product_list_provider.dart';
import '../providers/product_details_provider.dart';
import '../models/product_dto_extension.dart';
import '../widgets/product_card.dart';

/// Example: Using ProductListProvider for a product listing screen
class ProductListExample extends StatefulWidget {
  const ProductListExample({super.key});

  @override
  State<ProductListExample> createState() => _ProductListExampleState();
}

class _ProductListExampleState extends State<ProductListExample> {
  @override
  void initState() {
    super.initState();
    // Load products on mount
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProductListProvider>().loadProducts(
            page: 1,
            limit: 20,
            sortBy: 'newest',
            inStock: true,
          );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Products')),
      body: Consumer<ProductListProvider>(
        builder: (context, provider, child) {
          // Loading state
          if (provider.isLoading && provider.products.isEmpty) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          // Error state
          if (provider.hasError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: Colors.red),
                  const SizedBox(height: 16),
                  Text('Error: ${provider.errorMessage}'),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => provider.loadProducts(refresh: true),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          // Empty state
          if (provider.isEmpty) {
            return const Center(
              child: Text('No products found'),
            );
          }

          final products = provider.products.toProducts();

          // Success state - show products
          return Column(
            children: [
              // Filters and Sort
              Padding(
                padding: const EdgeInsets.all(16.0),
                child: Row(
                  children: [
                    DropdownButton<String>(
                      value: provider.sortBy ?? 'newest',
                      items: const [
                        DropdownMenuItem(
                            value: 'newest', child: Text('Newest')),
                        DropdownMenuItem(
                            value: 'price_low',
                            child: Text('Price: Low to High')),
                        DropdownMenuItem(
                            value: 'price_high',
                            child: Text('Price: High to Low')),
                        DropdownMenuItem(value: 'name', child: Text('Name')),
                      ],
                      onChanged: (value) {
                        provider.loadProducts(sortBy: value, refresh: true);
                      },
                    ),
                  ],
                ),
              ),

              // Product Grid
              Expanded(
                child: GridView.builder(
                  padding: const EdgeInsets.all(16),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    childAspectRatio: 0.7,
                    crossAxisSpacing: 16,
                    mainAxisSpacing: 16,
                  ),
                  itemCount: products.length +
                      (provider.pagination != null &&
                              provider.currentPage <
                                  provider.pagination!.totalPages
                          ? 1
                          : 0),
                  itemBuilder: (context, index) {
                    // Load more indicator
                    if (index >= products.length) {
                      return Center(
                        child: ElevatedButton(
                          onPressed: provider.isLoading
                              ? null
                              : () => provider.loadNextPage(),
                          child: provider.isLoading
                              ? const CircularProgressIndicator()
                              : const Text('Load More'),
                        ),
                      );
                    }

                    return ProductCard(
                      product: products[index],
                      onTap: () {
                        // Navigate to product details
                      },
                      onAddToCart: () {
                        // Add to cart
                      },
                    );
                  },
                ),
              ),

              // Pagination info
              if (provider.pagination != null)
                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Text(
                    'Page ${provider.currentPage} of ${provider.pagination!.totalPages} (${provider.pagination!.total} total)',
                    style: const TextStyle(fontSize: 12, color: Colors.grey),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }
}

/// Example: Using ProductDetailsProvider for a product detail screen
class ProductDetailExample extends StatefulWidget {
  final String productId;

  const ProductDetailExample({
    super.key,
    required this.productId,
  });

  @override
  State<ProductDetailExample> createState() => _ProductDetailExampleState();
}

class _ProductDetailExampleState extends State<ProductDetailExample> {
  @override
  void initState() {
    super.initState();
    // Load product on mount
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProductDetailsProvider>().loadProduct(widget.productId);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Product Details')),
      body: Consumer<ProductDetailsProvider>(
        builder: (context, provider, child) {
          // Loading state
          if (provider.isLoading) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          // Error state
          if (provider.hasError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: Colors.red),
                  const SizedBox(height: 16),
                  Text('Error: ${provider.errorMessage}'),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => provider.loadProduct(widget.productId),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            );
          }

          // No product
          if (!provider.hasProduct) {
            return const Center(
              child: Text('Product not found'),
            );
          }

          final product = provider.product!.toProduct();
          final relatedProducts = provider.relatedProducts.toProducts();

          // Success state - show product
          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Product Image
                if (product.imageUrl.isNotEmpty)
                  Image.network(
                    product.imageUrl,
                    height: 400,
                    width: double.infinity,
                    fit: BoxFit.cover,
                  ),

                Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Name
                      Text(
                        product.name,
                        style: const TextStyle(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),

                      // Brand
                      Text(
                        product.brand,
                        style: const TextStyle(
                          fontSize: 16,
                          color: Colors.grey,
                        ),
                      ),
                      const SizedBox(height: 16),

                      // Price
                      Row(
                        children: [
                          Text(
                            'AED ${product.price.toStringAsFixed(2)}',
                            style: const TextStyle(
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                              color: Colors.black,
                            ),
                          ),
                          if (product.originalPrice != null) ...[
                            const SizedBox(width: 12),
                            Text(
                              'AED ${product.originalPrice!.toStringAsFixed(2)}',
                              style: const TextStyle(
                                fontSize: 18,
                                decoration: TextDecoration.lineThrough,
                                color: Colors.grey,
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: 16),

                      // Description
                      Text(
                        product.description,
                        style: const TextStyle(fontSize: 16),
                      ),
                      const SizedBox(height: 32),

                      // Add to Cart Button
                      SizedBox(
                        width: double.infinity,
                        child: ElevatedButton(
                          onPressed: () {
                            // Add to cart
                          },
                          child: const Text('Add to Cart'),
                        ),
                      ),
                    ],
                  ),
                ),

                // Related Products
                if (relatedProducts.isNotEmpty) ...[
                  const Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Text(
                      'Related Products',
                      style: TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  SizedBox(
                    height: 300,
                    child: ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: relatedProducts.length,
                      itemBuilder: (context, index) {
                        return SizedBox(
                          width: 200,
                          child: ProductCard(
                            product: relatedProducts[index],
                            onTap: () {
                              // Navigate to related product
                            },
                            onAddToCart: () {
                              // Add to cart
                            },
                          ),
                        );
                      },
                    ),
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}

/// Example: Category Products Screen using ProductListProvider
class CategoryProductsExample extends StatefulWidget {
  final String categoryId;
  final String categoryName;

  const CategoryProductsExample({
    super.key,
    required this.categoryId,
    required this.categoryName,
  });

  @override
  State<CategoryProductsExample> createState() =>
      _CategoryProductsExampleState();
}

class _CategoryProductsExampleState extends State<CategoryProductsExample> {
  @override
  void initState() {
    super.initState();
    // Load products for this category
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ProductListProvider>().loadProducts(
            categoryId: widget.categoryId,
            page: 1,
            limit: 20,
            refresh: true,
          );
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.categoryName)),
      body: Consumer<ProductListProvider>(
        builder: (context, provider, child) {
          if (provider.isLoading && provider.products.isEmpty) {
            return const Center(child: CircularProgressIndicator());
          }

          if (provider.hasError) {
            return Center(child: Text('Error: ${provider.errorMessage}'));
          }

          if (provider.isEmpty) {
            return const Center(child: Text('No products in this category'));
          }

          final products = provider.products.toProducts();

          return GridView.builder(
            padding: const EdgeInsets.all(16),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 2,
              childAspectRatio: 0.7,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
            ),
            itemCount: products.length,
            itemBuilder: (context, index) {
              return ProductCard(
                product: products[index],
                onTap: () {},
                onAddToCart: () {},
              );
            },
          );
        },
      ),
    );
  }
}
