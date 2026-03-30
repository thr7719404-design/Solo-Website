import 'package:flutter/foundation.dart';
import '../services/api_service.dart';
import '../models/dto/product_dto.dart';

enum ProductListStatus { idle, loading, success, error }

class ProductListProvider extends ChangeNotifier {
  ProductListStatus _status = ProductListStatus.idle;
  List<ProductDto> _products = [];
  PaginationMetaDto? _pagination;
  String? _errorMessage;

  // Current filters
  int _page = 1;
  int _limit = 20;
  String? _sortBy;
  String? _categoryId;
  String? _subcategoryId;
  String? _brandId;
  List<String>? _brandIds;
  double? _minPrice;
  double? _maxPrice;
  String? _search;
  bool? _isFeatured;
  bool? _isNew;
  bool? _isBestSeller;
  bool? _inStock;
  bool? _isOnSale;

  // Getters
  ProductListStatus get status => _status;
  List<ProductDto> get products => _products;
  PaginationMetaDto? get pagination => _pagination;
  String? get errorMessage => _errorMessage;
  bool get isLoading => _status == ProductListStatus.loading;
  bool get hasError => _status == ProductListStatus.error;
  bool get isEmpty => _products.isEmpty && _status == ProductListStatus.success;
  int get currentPage => _page;
  int get limit => _limit;
  String? get sortBy => _sortBy;

  /// Load products with current filters
  Future<void> loadProducts({
    int? page,
    int? limit,
    String? sortBy,
    String? categoryId,
    String? subcategoryId,
    String? brandId,
    List<String>? brandIds,
    double? minPrice,
    double? maxPrice,
    String? search,
    bool? isFeatured,
    bool? isNew,
    bool? isBestSeller,
    bool? inStock,
    bool? isOnSale,
    bool refresh = false,
  }) async {
    // Update filters
    if (page != null) _page = page;
    if (limit != null) _limit = limit;
    if (sortBy != null) _sortBy = sortBy;
    if (categoryId != null) _categoryId = categoryId;
    if (subcategoryId != null) _subcategoryId = subcategoryId;
    if (brandId != null) _brandId = brandId;
    if (brandIds != null) _brandIds = brandIds;
    if (minPrice != null) _minPrice = minPrice;
    if (maxPrice != null) _maxPrice = maxPrice;
    if (search != null) _search = search;
    if (isFeatured != null) _isFeatured = isFeatured;
    if (isNew != null) _isNew = isNew;
    if (isBestSeller != null) _isBestSeller = isBestSeller;
    if (inStock != null) _inStock = inStock;
    if (isOnSale != null) _isOnSale = isOnSale;

    // If refresh, reset to page 1
    if (refresh) {
      _page = 1;
      _products = [];
    }

    _status = ProductListStatus.loading;
    _errorMessage = null;
    notifyListeners();

    try {
      final result = await ApiService.products.getProducts(
        page: _page,
        limit: _limit,
        sortBy: _sortBy,
        categoryId: _categoryId,
        subcategoryId: _subcategoryId,
        brandId: _brandId,
        brandIds: _brandIds,
        minPrice: _minPrice,
        maxPrice: _maxPrice,
        search: _search,
        isFeatured: _isFeatured,
        isNew: _isNew,
        isBestSeller: _isBestSeller,
        inStock: _inStock,
      );

      _products = result.data;
      _pagination = result.meta;
      _status = ProductListStatus.success;
    } catch (e) {
      _status = ProductListStatus.error;
      _errorMessage = e.toString();
      debugPrint('ProductListProvider: Error loading products: $e');
    }

    notifyListeners();
  }

  /// Load next page (append to existing products)
  Future<void> loadNextPage() async {
    if (_pagination == null || _page >= _pagination!.totalPages) {
      return; // No more pages
    }

    if (_status == ProductListStatus.loading) {
      return; // Already loading
    }

    final nextPage = _page + 1;
    _status = ProductListStatus.loading;
    notifyListeners();

    try {
      final result = await ApiService.products.getProducts(
        page: nextPage,
        limit: _limit,
        sortBy: _sortBy,
        categoryId: _categoryId,
        brandId: _brandId,
        brandIds: _brandIds,
        minPrice: _minPrice,
        maxPrice: _maxPrice,
        search: _search,
        isFeatured: _isFeatured,
        isNew: _isNew,
        isBestSeller: _isBestSeller,
        inStock: _inStock,
      );

      _page = nextPage;
      _products.addAll(result.data);
      _pagination = result.meta;
      _status = ProductListStatus.success;
    } catch (e) {
      _status = ProductListStatus.error;
      _errorMessage = e.toString();
      debugPrint('ProductListProvider: Error loading next page: $e');
    }

    notifyListeners();
  }

  /// Clear filters and reload
  Future<void> clearFilters() async {
    _page = 1;
    _limit = 20;
    _sortBy = null;
    _categoryId = null;
    _brandId = null;
    _brandIds = null;
    _minPrice = null;
    _maxPrice = null;
    _search = null;
    _isFeatured = null;
    _isNew = null;
    _isBestSeller = null;
    _inStock = null;

    await loadProducts(refresh: true);
  }

  /// Reset provider state
  void reset() {
    _status = ProductListStatus.idle;
    _products = [];
    _pagination = null;
    _errorMessage = null;
    _page = 1;
    _limit = 20;
    _sortBy = null;
    _categoryId = null;
    _brandId = null;
    _brandIds = null;
    _minPrice = null;
    _maxPrice = null;
    _search = null;
    _isFeatured = null;
    _isNew = null;
    _isBestSeller = null;
    _inStock = null;
    notifyListeners();
  }
}
