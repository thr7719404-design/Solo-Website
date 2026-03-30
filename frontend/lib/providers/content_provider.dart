import 'package:flutter/foundation.dart';
import '../services/api_service.dart';
import '../models/dto/content_dto.dart';

enum ContentStatus { idle, loading, success, error }

/// Provider for CMS content (banners and landing pages)
class ContentProvider extends ChangeNotifier {
  // Banner state
  ContentStatus _bannerStatus = ContentStatus.idle;
  List<BannerDto> _banners = [];
  String? _bannerError;
  String? _currentPlacement;

  // Landing page state
  ContentStatus _landingPageStatus = ContentStatus.idle;
  LandingPageDto? _landingPage;
  String? _landingPageError;
  String? _currentSlug;

  // Getters - Banners
  ContentStatus get bannerStatus => _bannerStatus;
  List<BannerDto> get banners => _banners;
  String? get bannerError => _bannerError;
  bool get isBannersLoading => _bannerStatus == ContentStatus.loading;
  bool get hasBannersError => _bannerStatus == ContentStatus.error;
  bool get hasBanners => _banners.isNotEmpty;
  String? get currentPlacement => _currentPlacement;

  // Getters - Landing Page
  ContentStatus get landingPageStatus => _landingPageStatus;
  LandingPageDto? get landingPage => _landingPage;
  String? get landingPageError => _landingPageError;
  bool get isLandingPageLoading => _landingPageStatus == ContentStatus.loading;
  bool get hasLandingPageError => _landingPageStatus == ContentStatus.error;
  bool get hasLandingPage => _landingPage != null;
  String? get currentSlug => _currentSlug;

  /// Load banners by placement
  Future<void> loadBanners({
    String? placement,
    String? categoryId,
  }) async {
    _bannerStatus = ContentStatus.loading;
    _bannerError = null;
    _currentPlacement = placement;
    notifyListeners();

    try {
      final response = await ApiService.content.getBanners(
        placement: placement,
      );
      
      // Response is List<BannerDto> directly
      _banners = response;
      _bannerStatus = ContentStatus.success;
    } catch (e) {
      _bannerStatus = ContentStatus.error;
      _bannerError = e.toString();
      debugPrint('ContentProvider: Error loading banners: $e');
    }

    notifyListeners();
  }

  /// Load HOME_HERO banners specifically
  Future<void> loadHomeHeroBanners() async {
    await loadBanners(placement: BannerPlacement.homeHero);
  }

  /// Load category top banner - Note: API doesn't support categoryId yet
  Future<void> loadCategoryTopBanner(String categoryId) async {
    await loadBanners(
      placement: BannerPlacement.categoryTop,
    );
  }

  /// Load landing page by slug
  Future<void> loadLandingPage(String slug) async {
    _landingPageStatus = ContentStatus.loading;
    _landingPageError = null;
    _landingPage = null;
    _currentSlug = slug;
    notifyListeners();

    try {
      final response = await ApiService.content.getLandingPage(slug);
      // Response is LandingPageDto directly
      _landingPage = response;
      _landingPageStatus = ContentStatus.success;
    } catch (e) {
      _landingPageStatus = ContentStatus.error;
      _landingPageError = e.toString();
      debugPrint('ContentProvider: Error loading landing page: $e');
    }

    notifyListeners();
  }

  /// Reload current banners
  Future<void> reloadBanners() async {
    if (_currentPlacement != null) {
      await loadBanners(placement: _currentPlacement);
    } else {
      await loadBanners();
    }
  }

  /// Reload current landing page
  Future<void> reloadLandingPage() async {
    if (_currentSlug != null) {
      await loadLandingPage(_currentSlug!);
    }
  }

  /// Reset banner state
  void resetBanners() {
    _bannerStatus = ContentStatus.idle;
    _banners = [];
    _bannerError = null;
    _currentPlacement = null;
    notifyListeners();
  }

  /// Reset landing page state
  void resetLandingPage() {
    _landingPageStatus = ContentStatus.idle;
    _landingPage = null;
    _landingPageError = null;
    _currentSlug = null;
    notifyListeners();
  }

  /// Reset all content state
  void reset() {
    resetBanners();
    resetLandingPage();
  }
}
