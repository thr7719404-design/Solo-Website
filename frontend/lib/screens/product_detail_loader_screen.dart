import 'package:flutter/material.dart';
import '../models/product.dart';
import '../models/product_dto_extension.dart';
import '../services/api_service.dart';
import 'product_detail_screen.dart';

/// Wrapper screen that loads a product by ID and then shows ProductDetailScreen
class ProductDetailLoaderScreen extends StatefulWidget {
  final String productId;

  const ProductDetailLoaderScreen({
    super.key,
    required this.productId,
  });

  @override
  State<ProductDetailLoaderScreen> createState() =>
      _ProductDetailLoaderScreenState();
}

class _ProductDetailLoaderScreenState extends State<ProductDetailLoaderScreen> {
  late Future<Product> _productFuture;

  @override
  void initState() {
    super.initState();
    _productFuture = _loadProduct();
  }

  Future<Product> _loadProduct() async {
    final productDto = await ApiService.products.getProduct(widget.productId);
    return productDto.toProduct();
  }

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<Product>(
      future: _productFuture,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return Scaffold(
            appBar: AppBar(
              title: const Text('Loading...'),
              backgroundColor: Colors.white,
              foregroundColor: Colors.black,
            ),
            body: const Center(
              child: CircularProgressIndicator(),
            ),
          );
        }

        if (snapshot.hasError) {
          return Scaffold(
            appBar: AppBar(
              title: const Text('Error'),
              backgroundColor: Colors.white,
              foregroundColor: Colors.black,
            ),
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(
                    Icons.error_outline,
                    size: 64,
                    color: Colors.red,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Failed to load product',
                    style: Theme.of(context).textTheme.titleLarge,
                  ),
                  const SizedBox(height: 8),
                  Text(
                    snapshot.error.toString(),
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: Colors.grey,
                        ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () => Navigator.pop(context),
                    child: const Text('Go Back'),
                  ),
                ],
              ),
            ),
          );
        }

        final product = snapshot.data!;
        return ProductDetailScreen(product: product);
      },
    );
  }
}
