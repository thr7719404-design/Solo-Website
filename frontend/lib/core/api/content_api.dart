/// Unified Content/CMS API client
/// Handles both public storefront and admin CMS endpoints
library;

import 'dart:convert';
import '../../core/dto/dto.dart';
import '../api_client.dart';

class ContentApi {
  final ApiClient _client;

  ContentApi(this._client);

  // ===========================================================================
  // PUBLIC BANNER ENDPOINTS (Storefront)
  // ===========================================================================

  /// Get active banners by placement
  Future<List<BannerDto>> getBanners({String? placement}) async {
    final queryParams = <String, dynamic>{
      if (placement != null) 'placement': placement,
    };

    final response = await _client.get(
      '/api/content/banners',
      queryParams: queryParams,
    );

    final data = response.getDataOrThrow();
    final list = data is List ? data : (data['data'] as List<dynamic>? ?? []);
    return parseList<BannerDto>(
      list,
      (e) => BannerDto.fromJson(e as Map<String, dynamic>),
    );
  }

  /// Get home hero banners
  Future<List<BannerDto>> getHeroBanners() async {
    return getBanners(placement: BannerPlacement.homeHero);
  }

  // ===========================================================================
  // PUBLIC LANDING PAGE ENDPOINTS (Storefront)
  // ===========================================================================

  /// Get landing page by slug
  Future<LandingPageDto> getLandingPage(String slug) async {
    final response = await _client.get('/api/content/pages/$slug');
    return LandingPageDto.fromJson(response.getDataOrThrow());
  }

  /// Get all published landing pages
  Future<List<LandingPageDto>> getLandingPages() async {
    final response = await _client.get('/api/content/pages');

    final data = response.getDataOrThrow();
    final list = data is List ? data : (data['data'] as List<dynamic>? ?? []);
    return parseList<LandingPageDto>(
      list,
      (e) => LandingPageDto.fromJson(e as Map<String, dynamic>),
    );
  }

  // ===========================================================================
  // ADMIN BANNER ENDPOINTS
  // ===========================================================================

  /// Get all banners (Admin - includes inactive)
  Future<List<BannerDto>> getAdminBanners({String? placement}) async {
    final queryParams = <String, dynamic>{
      if (placement != null) 'placement': placement,
    };

    final response = await _client.get(
      '/api/content/admin/banners',
      queryParams: queryParams,
      requiresAuth: true,
    );

    final data = response.getDataOrThrow();
    final list = data is List ? data : (data['data'] as List<dynamic>? ?? []);
    return parseList<BannerDto>(
      list,
      (e) => BannerDto.fromJson(e as Map<String, dynamic>),
    );
  }

  /// Get single banner by ID (Admin)
  Future<BannerDto> getAdminBanner(String bannerId) async {
    final response = await _client.get(
      '/api/content/admin/banners/$bannerId',
      requiresAuth: true,
    );
    return BannerDto.fromJson(response.getDataOrThrow());
  }

  /// Create a new banner (Admin only)
  Future<BannerDto> createBanner(BannerRequest request) async {
    final response = await _client.post(
      '/api/content/admin/banners',
      body: request.toJson(),
      requiresAuth: true,
    );

    return BannerDto.fromJson(response.getDataOrThrow());
  }

  /// Update a banner (Admin only)
  Future<BannerDto> updateBanner(String bannerId, BannerRequest request) async {
    final response = await _client.patch(
      '/api/content/admin/banners/$bannerId',
      body: request.toJson(),
      requiresAuth: true,
    );

    return BannerDto.fromJson(response.getDataOrThrow());
  }

  /// Delete a banner (Admin only)
  Future<void> deleteBanner(String bannerId) async {
    await _client.delete(
      '/api/content/admin/banners/$bannerId',
      requiresAuth: true,
    );
  }

  /// Toggle banner active status (Admin only)
  Future<BannerDto> toggleBannerActive(String bannerId, bool isActive) async {
    final response = await _client.patch(
      '/api/content/admin/banners/$bannerId',
      body: {'isActive': isActive},
      requiresAuth: true,
    );

    return BannerDto.fromJson(response.getDataOrThrow());
  }

  // ===========================================================================
  // ADMIN LANDING PAGE ENDPOINTS
  // ===========================================================================

  /// Get all landing pages (Admin - includes inactive)
  Future<List<LandingPageDto>> getAdminLandingPages() async {
    final response = await _client.get(
      '/api/content/admin/pages',
      requiresAuth: true,
    );

    final data = response.getDataOrThrow();
    final list = data is List ? data : (data['data'] as List<dynamic>? ?? []);
    return parseList<LandingPageDto>(
      list,
      (e) => LandingPageDto.fromJson(e as Map<String, dynamic>),
    );
  }

  /// Get single landing page by ID (Admin)
  Future<LandingPageDto> getAdminLandingPage(String pageId) async {
    final response = await _client.get(
      '/api/content/admin/pages/$pageId',
      requiresAuth: true,
    );
    return LandingPageDto.fromJson(response.getDataOrThrow());
  }

  /// Create a new landing page (Admin only)
  Future<LandingPageDto> createLandingPage(LandingPageRequest request) async {
    final response = await _client.post(
      '/api/content/admin/pages',
      body: request.toJson(),
      requiresAuth: true,
    );

    return LandingPageDto.fromJson(response.getDataOrThrow());
  }

  /// Update a landing page (Admin only)
  Future<LandingPageDto> updateLandingPage(
      String pageId, LandingPageRequest request) async {
    final response = await _client.patch(
      '/api/content/admin/pages/$pageId',
      body: request.toJson(),
      requiresAuth: true,
    );

    return LandingPageDto.fromJson(response.getDataOrThrow());
  }

  /// Delete a landing page (Admin only)
  Future<void> deleteLandingPage(String pageId) async {
    await _client.delete(
      '/api/content/admin/pages/$pageId',
      requiresAuth: true,
    );
  }

  /// Toggle landing page active status (Admin only)
  Future<LandingPageDto> toggleLandingPageActive(
      String pageId, bool isActive) async {
    final response = await _client.patch(
      '/api/content/admin/pages/$pageId',
      body: {'isActive': isActive},
      requiresAuth: true,
    );

    return LandingPageDto.fromJson(response.getDataOrThrow());
  }

  // ===========================================================================
  // ADMIN LANDING SECTION ENDPOINTS
  // ===========================================================================

  /// Create a new section (Admin only)
  Future<LandingSectionDto> createSection(LandingSectionRequest request) async {
    final response = await _client.post(
      '/api/content/admin/sections',
      body: {
        ...request.toJson(),
        // Encode data as JSON string if backend expects it
        'data':
            request.data is String ? request.data : jsonEncode(request.data),
      },
      requiresAuth: true,
    );

    return LandingSectionDto.fromJson(response.getDataOrThrow());
  }

  /// Update a section (Admin only)
  Future<LandingSectionDto> updateSection(
      String sectionId, LandingSectionRequest request) async {
    final response = await _client.patch(
      '/api/content/admin/sections/$sectionId',
      body: {
        ...request.toJson(),
        'data':
            request.data is String ? request.data : jsonEncode(request.data),
      },
      requiresAuth: true,
    );

    return LandingSectionDto.fromJson(response.getDataOrThrow());
  }

  /// Delete a section (Admin only)
  Future<void> deleteSection(String sectionId) async {
    await _client.delete(
      '/api/content/admin/sections/$sectionId',
      requiresAuth: true,
    );
  }

  /// Reorder sections (Admin only)
  Future<void> reorderSections(
      String pageId, List<Map<String, dynamic>> orderData) async {
    await _client.patch(
      '/api/content/admin/pages/$pageId/sections/reorder',
      body: {'sections': orderData},
      requiresAuth: true,
    );
  }
}
