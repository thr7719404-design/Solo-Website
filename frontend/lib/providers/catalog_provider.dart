import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/category.dart' as models;
import '../models/category_tree.dart';
import '../services/api_service.dart';
import '../core/events/app_event_bus.dart';

/// Brand model for catalog display
class Brand {
  final String id;
  final String name;
  final String? logoUrl;

  const Brand({required this.id, required this.name, this.logoUrl});
}

class CatalogProvider extends ChangeNotifier {
  StreamSubscription<AppEventData>? _eventSubscription;

  CatalogProvider() {
    _subscribeToEvents();
  }

  List<models.Category> _categories = [];
  List<CategoryNode> _categoryTree = [];
  List<Brand> _brands = [];
  bool _isLoading = false;
  bool _isBrandsLoading = false;
  String? _errorMessage;
  DateTime? _lastFetchTime;
  DateTime? _lastBrandsFetchTime;
  static const _cacheDuration = Duration(minutes: 5);

  // Request deduplication - track in-flight requests
  Future<void>? _categoriesLoadingFuture;
  Future<void>? _brandsLoadingFuture;

  // Track if we've already attempted loading (to prevent infinite retries on error)
  bool _categoriesAttempted = false;
  bool _brandsAttempted = false;

  List<models.Category> get categories => _categories;
  List<CategoryNode> get categoryTree => _categoryTree;
  List<Brand> get brands => _brands;
  bool get isLoading => _isLoading;
  bool get isBrandsLoading => _isBrandsLoading;
  String? get errorMessage => _errorMessage;
  bool get hasCategories => _categories.isNotEmpty;
  bool get hasBrands => _brands.isNotEmpty;

  /// Subscribe to category change events for auto-refresh
  void _subscribeToEvents() {
    _eventSubscription = AppEventBus().on(AppEvent.categoriesChanged, (_) {
      // Force refresh when categories change
      refresh();
    });
  }

  /// Check if cache is still valid
  bool get _isCacheValid {
    if (_lastFetchTime == null || _categories.isEmpty) return false;
    return DateTime.now().difference(_lastFetchTime!) < _cacheDuration;
  }

  /// Check if brands cache is still valid
  bool get _isBrandsCacheValid {
    if (_lastBrandsFetchTime == null || _brands.isEmpty) return false;
    return DateTime.now().difference(_lastBrandsFetchTime!) < _cacheDuration;
  }

  Future<void> loadCategories({bool forceRefresh = false}) async {
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && _isCacheValid) {
      return;
    }

    // Don't retry if we already attempted and failed (unless forceRefresh)
    if (!forceRefresh && _categoriesAttempted && _categories.isEmpty) {
      return;
    }

    // If already loading, wait for the existing request to complete (deduplication)
    if (_categoriesLoadingFuture != null) {
      return _categoriesLoadingFuture;
    }

    _categoriesLoadingFuture = _doLoadCategories();
    try {
      await _categoriesLoadingFuture;
    } finally {
      _categoriesLoadingFuture = null;
    }
  }

  Future<void> _doLoadCategories() async {
    _isLoading = true;
    _errorMessage = null;
    _categoriesAttempted = true;
    notifyListeners();

    try {
      final dtos = await ApiService.categories.getCategories();
      _categories = dtos
          .map((dto) => models.Category(
                id: dto.id,
                name: dto.name,
                icon: '', // Not provided by API
                imageUrl: dto.image ?? '',
                productCount: dto.productCount ?? 0,
              ))
          .toList();
      // Build hierarchical category tree for navigation
      _categoryTree = dtos.map((dto) => CategoryNode.fromDto(dto)).toList();
      _lastFetchTime = DateTime.now();
      _isLoading = false;
    } catch (e) {
      _isLoading = false;
      _categoryTree = [];

      // Silently fail for 404 errors (endpoint not implemented yet)
      if (e.toString().contains('404')) {
        // Don't show error for 404, just keep categories empty
        _categories = [];
      } else {
        _errorMessage = 'Failed to load categories: $e';
        debugPrint(_errorMessage);
      }
    }

    notifyListeners();
  }

  models.Category? getCategoryById(String id) {
    try {
      return _categories.firstWhere((cat) => cat.id == id);
    } catch (e) {
      return null;
    }
  }

  /// Find a CategoryNode by its ID in the category tree
  CategoryNode? findCategoryNodeById(String id) {
    for (final node in _categoryTree) {
      if (node.id == id) return node;
    }
    return null;
  }

  /// Load brands from API
  Future<void> loadBrands({bool forceRefresh = false}) async {
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && _isBrandsCacheValid) {
      return;
    }

    // Don't retry if we already attempted and failed (unless forceRefresh)
    if (!forceRefresh && _brandsAttempted && _brands.isEmpty) {
      return;
    }

    // If already loading, wait for the existing request to complete (deduplication)
    if (_brandsLoadingFuture != null) {
      return _brandsLoadingFuture;
    }

    _brandsLoadingFuture = _doLoadBrands();
    try {
      await _brandsLoadingFuture;
    } finally {
      _brandsLoadingFuture = null;
    }
  }

  Future<void> _doLoadBrands() async {
    _isBrandsLoading = true;
    _brandsAttempted = true;
    notifyListeners();

    try {
      final dtos = await ApiService.brands.getBrands();
      _brands = dtos
          .map((dto) => Brand(
                id: dto.id,
                name: dto.name,
                logoUrl: dto.logo,
              ))
          .toList();
      _lastBrandsFetchTime = DateTime.now();
      _isBrandsLoading = false;
    } catch (e) {
      _isBrandsLoading = false;

      // Silently fail for 404 errors (endpoint not implemented yet)
      if (e.toString().contains('404')) {
        _brands = [];
      } else {
        debugPrint('Failed to load brands: $e');
      }
    }

    notifyListeners();
  }

  /// Clear cache and force reload
  Future<void> refresh() async {
    _categories = [];
    _categoryTree = [];
    _brands = [];
    _lastFetchTime = null;
    _lastBrandsFetchTime = null;
    _categoriesAttempted = false;
    _brandsAttempted = false;
    await Future.wait([
      loadCategories(forceRefresh: true),
      loadBrands(forceRefresh: true),
    ]);
  }

  @override
  void dispose() {
    _eventSubscription?.cancel();
    super.dispose();
  }
}
