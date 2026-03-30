import 'package:flutter/foundation.dart';
import '../services/api_service.dart';
import '../models/dto/product_dto.dart';

enum ProductDetailsStatus { idle, loading, success, error }

class ProductDetailsProvider extends ChangeNotifier {
  ProductDetailsStatus _status = ProductDetailsStatus.idle;
  ProductDto? _product;
  List<ProductDto> _relatedProducts = [];
  String? _errorMessage;

  // Getters
  ProductDetailsStatus get status => _status;
  ProductDto? get product => _product;
  List<ProductDto> get relatedProducts => _relatedProducts;
  String? get errorMessage => _errorMessage;
  bool get isLoading => _status == ProductDetailsStatus.loading;
  bool get hasError => _status == ProductDetailsStatus.error;
  bool get hasProduct => _product != null;

  /// Load product details by ID
  Future<void> loadProduct(String productId) async {
    _status = ProductDetailsStatus.loading;
    _errorMessage = null;
    _product = null;
    _relatedProducts = [];
    notifyListeners();

    try {
      // Load product details
      final productResponse = await ApiService.products.getProduct(productId);
      _product = productResponse;

      // Load related products in parallel
      _loadRelatedProducts(productId);

      _status = ProductDetailsStatus.success;
    } catch (e) {
      _status = ProductDetailsStatus.error;
      _errorMessage = e.toString();
      debugPrint('ProductDetailsProvider: Error loading product: $e');
    }

    notifyListeners();
  }

  /// Load related products (called automatically after loadProduct)
  Future<void> _loadRelatedProducts(String productId) async {
    try {
      final response = await ApiService.products.getRelatedProducts(
        productId,
        limit: 6,
      );
      _relatedProducts = response;
      notifyListeners();
    } catch (e) {
      // Non-critical error, just log it
      debugPrint('ProductDetailsProvider: Error loading related products: $e');
    }
  }

  /// Reload related products manually
  Future<void> reloadRelatedProducts({int limit = 6}) async {
    if (_product == null) return;

    try {
      final response = await ApiService.products.getRelatedProducts(
        _product!.id,
        limit: limit,
      );
      _relatedProducts = response;
      notifyListeners();
    } catch (e) {
      debugPrint('ProductDetailsProvider: Error reloading related products: $e');
    }
  }

  /// Reset provider state
  void reset() {
    _status = ProductDetailsStatus.idle;
    _product = null;
    _relatedProducts = [];
    _errorMessage = null;
    notifyListeners();
  }
}
