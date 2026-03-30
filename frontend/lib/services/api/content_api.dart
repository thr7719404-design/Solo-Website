import '../api_client.dart';
import '../../models/dto/content_dto.dart';
import '../../core/events/app_event_bus.dart';

/// Content/CMS API service
class ContentApi {
  final ApiClient _client;

  ContentApi(this._client);

  /// Event bus for cross-component sync
  final _eventBus = AppEventBus();

  // ========== Public Endpoints ==========

  /// Get homepage layout with all active sections
  /// Returns the landing page with slug "home" including ordered active sections
  Future<LandingPageDto?> getHomePage() async {
    try {
      final response = await _client.get('/content/home');
      final data = response.getDataOrThrow();
      
      // Handle empty home page (not created yet)
      if (data['id'] == null) {
        return null;
      }
      
      return LandingPageDto.fromJson(data);
    } catch (e, stackTrace) {
      print('ContentApi.getHomePage ERROR: $e');
      print('ContentApi.getHomePage STACKTRACE: $stackTrace');
      rethrow; // Re-throw so HomeProvider can see the real error
    }
  }

  /// Get active banners by placement
  Future<List<BannerDto>> getBanners({String? placement}) async {
    final queryParams = <String, dynamic>{
      if (placement != null) 'placement': placement,
    };

    final response = await _client.get(
      '/content/banners',
      queryParams: queryParams,
    );

    final data = response.getDataOrThrow();
    final list = data is List ? data : (data['data'] as List<dynamic>? ?? []);
    return (list)
        .map((e) => BannerDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Get all banners (admin only - includes inactive)
  Future<List<BannerDto>> getAllBanners() async {
    final response = await _client.get('/content/banners/all', requiresAuth: true);

    final data = response.getDataOrThrow();
    final list = data is List ? data : (data['data'] as List<dynamic>? ?? []);
    return (list)
        .map((e) => BannerDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// Get landing page by slug
  Future<LandingPageDto> getLandingPage(String slug) async {
    final response = await _client.get('/content/pages/$slug');
    return LandingPageDto.fromJson(response.getDataOrThrow());
  }

  /// Get all landing pages (admin only)
  Future<List<LandingPageDto>> getLandingPages() async {
    final response = await _client.get('/content/pages', requiresAuth: true);

    final data = response.getDataOrThrow();
    final list = data is List ? data : (data['data'] as List<dynamic>? ?? []);
    return (list)
        .map((e) => LandingPageDto.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  // ========== Banner Admin Endpoints ==========

  /// Create a new banner (Admin only)
  Future<BannerDto> createBanner(Map<String, dynamic> data) async {
    final response = await _client.post(
      '/content/banners',
      body: data,
      requiresAuth: true,
    );

    final banner = BannerDto.fromJson(response.getDataOrThrow());
    _eventBus.emitBannersChanged();
    return banner;
  }

  /// Update a banner (Admin only)
  Future<BannerDto> updateBanner(String bannerId, Map<String, dynamic> data) async {
    final response = await _client.patch(
      '/content/banners/$bannerId',
      body: data,
      requiresAuth: true,
    );

    final banner = BannerDto.fromJson(response.getDataOrThrow());
    _eventBus.emitBannersChanged();
    return banner;
  }

  /// Delete a banner (Admin only)
  Future<void> deleteBanner(String bannerId) async {
    await _client.delete('/content/banners/$bannerId', requiresAuth: true);
    _eventBus.emitBannersChanged();
  }

  /// Toggle banner active status (Admin only)
  Future<BannerDto> toggleBannerActive(String bannerId, bool isActive) async {
    final response = await _client.patch(
      '/content/banners/$bannerId',
      body: {'isActive': isActive},
      requiresAuth: true,
    );

    final banner = BannerDto.fromJson(response.getDataOrThrow());
    _eventBus.emitBannersChanged();
    return banner;
  }

  // ========== Landing Page Admin Endpoints ==========

  /// Create a new landing page (Admin only)
  Future<LandingPageDto> createLandingPage(Map<String, dynamic> data) async {
    final response = await _client.post(
      '/content/pages',
      body: data,
      requiresAuth: true,
    );

    final page = LandingPageDto.fromJson(response.getDataOrThrow());
    _eventBus.emitLandingPagesChanged();
    return page;
  }

  /// Update a landing page (Admin only)
  Future<LandingPageDto> updateLandingPage(String pageId, Map<String, dynamic> data) async {
    final response = await _client.patch(
      '/content/pages/$pageId',
      body: data,
      requiresAuth: true,
    );

    final page = LandingPageDto.fromJson(response.getDataOrThrow());
    _eventBus.emitLandingPagesChanged();
    return page;
  }

  /// Delete a landing page (Admin only)
  Future<void> deleteLandingPage(String pageId) async {
    await _client.delete('/content/pages/$pageId', requiresAuth: true);
    _eventBus.emitLandingPagesChanged();
  }

  /// Toggle landing page active status (Admin only)
  Future<LandingPageDto> toggleLandingPageActive(String pageId, bool isActive) async {
    final response = await _client.patch(
      '/content/pages/$pageId',
      body: {'isActive': isActive},
      requiresAuth: true,
    );

    final page = LandingPageDto.fromJson(response.getDataOrThrow());
    _eventBus.emitLandingPagesChanged();
    return page;
  }

  // ========== Landing Section Admin Endpoints ==========

  /// Create a section in a landing page (Admin only)
  Future<LandingSectionDto> createSection(String pageId, Map<String, dynamic> data) async {
    final response = await _client.post(
      '/content/pages/$pageId/sections',
      body: data,
      requiresAuth: true,
    );

    final section = LandingSectionDto.fromJson(response.getDataOrThrow());
    _eventBus.emitLandingPagesChanged();
    return section;
  }

  /// Update a section (Admin only)
  Future<LandingSectionDto> updateSection(String sectionId, Map<String, dynamic> data) async {
    final response = await _client.patch(
      '/content/sections/$sectionId',
      body: data,
      requiresAuth: true,
    );

    final section = LandingSectionDto.fromJson(response.getDataOrThrow());
    _eventBus.emitLandingPagesChanged();
    return section;
  }

  /// Delete a section (Admin only)
  Future<void> deleteSection(String sectionId) async {
    await _client.delete('/content/sections/$sectionId', requiresAuth: true);
    _eventBus.emitLandingPagesChanged();
  }

  /// Reorder sections (Admin only)
  Future<void> reorderSections(String pageId, List<Map<String, dynamic>> orders) async {
    await _client.post(
      '/content/pages/$pageId/sections/reorder',
      body: {'orders': orders},
      requiresAuth: true,
    );
    _eventBus.emitLandingPagesChanged();
  }
}

// BannerPlacement and LandingSectionType are now defined in content_dto.dart
// Import from '../../models/dto/content_dto.dart' to use them
