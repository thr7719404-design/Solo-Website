import 'dart:async';
import 'package:flutter/foundation.dart';
import '../services/api_service.dart';
import '../models/dto/product_dto.dart';
import '../models/dto/content_dto.dart';
import '../core/events/app_event_bus.dart';

enum HomeSectionStatus { idle, loading, success, error }

/// Provider for home screen - CMS-driven with product sections
/// Loads homepage layout from CMS and fetches products as needed
class HomeProvider extends ChangeNotifier {
  StreamSubscription<AppEventData>? _eventSubscription;

  HomeProvider() {
    _subscribeToEvents();
  }

  /// Subscribe to product/catalog change events for auto-refresh
  void _subscribeToEvents() {
    _eventSubscription = AppEventBus().subscribe(
      [
        AppEvent.productsChanged,
        AppEvent.catalogChanged,
        AppEvent.landingPagesChanged
      ],
      (_) {
        // Refresh all sections when products or content change
        refresh();
      },
    );
  }

  // CMS Home Page Layout
  HomeSectionStatus _homePageStatus = HomeSectionStatus.idle;
  LandingPageDto? _homePage;
  String? _homePageError;

  // Featured Products
  HomeSectionStatus _featuredStatus = HomeSectionStatus.idle;
  List<ProductDto> _featuredProducts = [];
  String? _featuredError;

  // Best Sellers
  HomeSectionStatus _bestSellersStatus = HomeSectionStatus.idle;
  List<ProductDto> _bestSellers = [];
  String? _bestSellersError;

  // New Arrivals
  HomeSectionStatus _newArrivalsStatus = HomeSectionStatus.idle;
  List<ProductDto> _newArrivals = [];
  String? _newArrivalsError;

  // Getters - Home Page
  HomeSectionStatus get homePageStatus => _homePageStatus;
  LandingPageDto? get homePage => _homePage;
  List<LandingSectionDto> get sections => _homePage?.sections ?? [];
  String? get homePageError => _homePageError;
  bool get isHomePageLoading => _homePageStatus == HomeSectionStatus.loading;
  bool get hasHomePageError => _homePageStatus == HomeSectionStatus.error;
  bool get hasHomePage => _homePage != null;

  // Getters - Featured
  HomeSectionStatus get featuredStatus => _featuredStatus;
  List<ProductDto> get featuredProducts => _featuredProducts;
  String? get featuredError => _featuredError;
  bool get isFeaturedLoading => _featuredStatus == HomeSectionStatus.loading;
  bool get hasFeaturedError => _featuredStatus == HomeSectionStatus.error;

  // Getters - Best Sellers
  HomeSectionStatus get bestSellersStatus => _bestSellersStatus;
  List<ProductDto> get bestSellers => _bestSellers;
  String? get bestSellersError => _bestSellersError;
  bool get isBestSellersLoading =>
      _bestSellersStatus == HomeSectionStatus.loading;
  bool get hasBestSellersError => _bestSellersStatus == HomeSectionStatus.error;

  // Getters - New Arrivals
  HomeSectionStatus get newArrivalsStatus => _newArrivalsStatus;
  List<ProductDto> get newArrivals => _newArrivals;
  String? get newArrivalsError => _newArrivalsError;
  bool get isNewArrivalsLoading =>
      _newArrivalsStatus == HomeSectionStatus.loading;
  bool get hasNewArrivalsError => _newArrivalsStatus == HomeSectionStatus.error;

  // Overall status
  bool get isAnyLoading =>
      isHomePageLoading ||
      isFeaturedLoading ||
      isBestSellersLoading ||
      isNewArrivalsLoading;
  bool get hasAnyError =>
      hasHomePageError ||
      hasFeaturedError ||
      hasBestSellersError ||
      hasNewArrivalsError;
  bool get isAllLoaded =>
      _homePageStatus == HomeSectionStatus.success &&
      _featuredStatus == HomeSectionStatus.success &&
      _bestSellersStatus == HomeSectionStatus.success &&
      _newArrivalsStatus == HomeSectionStatus.success;

  /// Load homepage layout from CMS
  Future<void> loadHomePage() async {
    _homePageStatus = HomeSectionStatus.loading;
    _homePageError = null;
    _safeNotifyListeners();

    try {
      final homePage = await ApiService.content.getHomePage();

      _homePage = homePage;
      _homePageStatus = HomeSectionStatus.success;

      // After loading home page, check which product sections we need
      if (homePage != null) {
        try {
          await _loadProductsForSections(homePage.sections);
        } catch (e) {
          debugPrint('[HomeProvider] Error loading product sections: $e');
          // Don't fail the whole page load if products fail
        }
      }
    } catch (e, stackTrace) {
      _homePageStatus = HomeSectionStatus.error;
      _homePageError = e.toString();
      debugPrint('HomeProvider: Error loading home page: $e');
      debugPrint('HomeProvider: Stack trace: $stackTrace');
      rethrow;
    }

    _safeNotifyListeners();
  }

  /// Safe notify listeners that catches errors
  void _safeNotifyListeners() {
    try {
      notifyListeners();
    } catch (e) {
      debugPrint('HomeProvider: Error notifying listeners: $e');
    }
  }

  /// Load products needed for the CMS sections
  Future<void> _loadProductsForSections(
      List<LandingSectionDto> sections) async {
    final futures = <Future<void>>[];

    for (final section in sections) {
      if (section.type == LandingSectionType.productCarousel ||
          section.type == LandingSectionType.productGrid) {
        final source = section.data['source'] as String?;
        final limit = (section.data['limit'] as num?)?.toInt() ?? 12;

        switch (source) {
          case 'featured':
            futures.add(loadFeatured(limit: limit));
            break;
          case 'best_sellers':
            futures.add(loadBestSellers(limit: limit));
            break;
          case 'new_arrivals':
            futures.add(loadNewArrivals(limit: limit));
            break;
        }
      }
    }

    if (futures.isNotEmpty) {
      await Future.wait(futures);
    }
  }

  /// Get products for a specific section based on its source config
  List<ProductDto> getProductsForSection(LandingSectionDto section) {
    final source = section.data['source'] as String?;
    final limit = (section.data['limit'] as num?)?.toInt() ?? 12;

    switch (source) {
      case 'featured':
        return _featuredProducts.take(limit).toList();
      case 'best_sellers':
        return _bestSellers.take(limit).toList();
      case 'new_arrivals':
        return _newArrivals.take(limit).toList();
      default:
        return [];
    }
  }

  /// Check if products for a section are still loading
  bool isLoadingForSection(LandingSectionDto section) {
    final source = section.data['source'] as String?;
    switch (source) {
      case 'featured':
        return isFeaturedLoading;
      case 'best_sellers':
        return isBestSellersLoading;
      case 'new_arrivals':
        return isNewArrivalsLoading;
      default:
        return false;
    }
  }

  /// Load all home sections in parallel
  Future<void> loadAllSections({
    int featuredLimit = 8,
    int bestSellersLimit = 8,
    int newArrivalsLimit = 8,
  }) async {
    // First load CMS layout, then load products
    await loadHomePage();

    // If no CMS home page, fall back to loading products directly
    if (_homePage == null) {
      // Set all to loading
      _featuredStatus = HomeSectionStatus.loading;
      _bestSellersStatus = HomeSectionStatus.loading;
      _newArrivalsStatus = HomeSectionStatus.loading;
      notifyListeners();

      // Load all sections in parallel
      await Future.wait([
        loadFeatured(limit: featuredLimit),
        loadBestSellers(limit: bestSellersLimit),
        loadNewArrivals(limit: newArrivalsLimit),
      ]);
    }
  }

  /// Load featured products
  Future<void> loadFeatured({int limit = 8}) async {
    _featuredStatus = HomeSectionStatus.loading;
    _featuredError = null;
    _safeNotifyListeners();

    try {
      final response = await ApiService.products.getFeatured(limit: limit);
      _featuredProducts = response;
      _featuredStatus = HomeSectionStatus.success;
    } catch (e) {
      _featuredStatus = HomeSectionStatus.error;
      _featuredError = e.toString();
      debugPrint('HomeProvider: Error loading featured products: $e');
    }

    _safeNotifyListeners();
  }

  /// Load best sellers
  Future<void> loadBestSellers({int limit = 8}) async {
    _bestSellersStatus = HomeSectionStatus.loading;
    _bestSellersError = null;
    _safeNotifyListeners();

    try {
      final response = await ApiService.products.getBestSellers(limit: limit);
      _bestSellers = response;
      _bestSellersStatus = HomeSectionStatus.success;
    } catch (e) {
      _bestSellersStatus = HomeSectionStatus.error;
      _bestSellersError = e.toString();
      debugPrint('HomeProvider: Error loading best sellers: $e');
    }

    _safeNotifyListeners();
  }

  /// Load new arrivals
  Future<void> loadNewArrivals({int limit = 8}) async {
    _newArrivalsStatus = HomeSectionStatus.loading;
    _newArrivalsError = null;
    _safeNotifyListeners();

    try {
      final response = await ApiService.products.getNewArrivals(limit: limit);
      _newArrivals = response;
      _newArrivalsStatus = HomeSectionStatus.success;
    } catch (e) {
      _newArrivalsStatus = HomeSectionStatus.error;
      _newArrivalsError = e.toString();
      debugPrint('HomeProvider: Error loading new arrivals: $e');
    }

    _safeNotifyListeners();
  }

  /// Refresh all sections
  Future<void> refresh({
    int featuredLimit = 8,
    int bestSellersLimit = 8,
    int newArrivalsLimit = 8,
  }) async {
    await loadAllSections(
      featuredLimit: featuredLimit,
      bestSellersLimit: bestSellersLimit,
      newArrivalsLimit: newArrivalsLimit,
    );
  }

  /// Reset provider state
  void reset() {
    _featuredStatus = HomeSectionStatus.idle;
    _featuredProducts = [];
    _featuredError = null;

    _bestSellersStatus = HomeSectionStatus.idle;
    _bestSellers = [];
    _bestSellersError = null;

    _newArrivalsStatus = HomeSectionStatus.idle;
    _newArrivals = [];
    _newArrivalsError = null;

    notifyListeners();
  }

  @override
  void dispose() {
    _eventSubscription?.cancel();
    super.dispose();
  }
}
