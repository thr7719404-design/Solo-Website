/// Catalog Version Service
/// Tracks catalog version and provides cache invalidation
/// when the backend catalog is updated
library;

import 'dart:async';
import 'package:flutter/foundation.dart';
import '../../services/api_service.dart';
import '../../core/events/app_event_bus.dart';

/// Represents a catalog version from the backend
class CatalogVersion {
  final int version;
  final DateTime updatedAt;
  final Map<String, int>? entityVersions;

  CatalogVersion({
    required this.version,
    required this.updatedAt,
    this.entityVersions,
  });

  factory CatalogVersion.fromJson(Map<String, dynamic> json) {
    return CatalogVersion(
      version: json['version'] as int? ?? 0,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : DateTime.now(),
      entityVersions: json['entityVersions'] != null
          ? Map<String, int>.from(json['entityVersions'] as Map)
          : null,
    );
  }

  @override
  String toString() => 'CatalogVersion(v$version, updated: $updatedAt)';
}

/// Service for tracking catalog version and auto-invalidating caches
class CatalogVersionService extends ChangeNotifier {
  static final CatalogVersionService _instance =
      CatalogVersionService._internal();
  factory CatalogVersionService() => _instance;
  CatalogVersionService._internal();

  CatalogVersion? _currentVersion;
  Timer? _pollingTimer;
  bool _isPolling = false;
  DateTime? _lastCheck;

  /// Polling interval for version checks
  static const _pollingInterval = Duration(seconds: 30);

  /// Minimum time between version checks
  static const _minCheckInterval = Duration(seconds: 5);

  CatalogVersion? get currentVersion => _currentVersion;
  bool get isPolling => _isPolling;
  DateTime? get lastCheck => _lastCheck;

  /// Start polling for catalog version changes
  void startPolling() {
    if (_isPolling) return;
    _isPolling = true;

    // Check immediately
    checkForUpdates();

    // Start periodic polling
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(_pollingInterval, (_) {
      checkForUpdates();
    });
  }

  /// Stop polling for catalog version changes
  void stopPolling() {
    _isPolling = false;
    _pollingTimer?.cancel();
    _pollingTimer = null;
  }

  /// Check for catalog updates
  Future<bool> checkForUpdates({bool force = false}) async {
    // Throttle checks
    if (!force && _lastCheck != null) {
      final timeSinceLastCheck = DateTime.now().difference(_lastCheck!);
      if (timeSinceLastCheck < _minCheckInterval) {
        return false;
      }
    }

    try {
      _lastCheck = DateTime.now();
      final newVersion = await _fetchCatalogVersion();

      if (newVersion == null) return false;

      final hasUpdate = _currentVersion == null ||
          newVersion.version > _currentVersion!.version;

      if (hasUpdate) {
        _currentVersion = newVersion;
        notifyListeners();

        // Emit events for cache invalidation
        _emitCacheInvalidationEvents(newVersion);

        return true;
      }

      return false;
    } catch (e) {
      debugPrint('CatalogVersionService: Error checking for updates: $e');
      return false;
    }
  }

  /// Fetch current catalog version from backend
  Future<CatalogVersion?> _fetchCatalogVersion() async {
    try {
      // Try to fetch catalog version from the API
      // This endpoint should be fast and not require auth
      final response = await ApiService.client.get('/catalog/version');

      if (response.isSuccess) {
        return CatalogVersion.fromJson(response.data);
      }
      return null;
    } catch (e) {
      // If the endpoint doesn't exist, return null silently
      return null;
    }
  }

  /// Emit cache invalidation events based on version changes
  void _emitCacheInvalidationEvents(CatalogVersion newVersion) {
    final eventBus = AppEventBus();

    // Check entity-specific versions if available
    final entityVersions = newVersion.entityVersions;
    if (entityVersions != null) {
      if (_hasEntityUpdate('categories', entityVersions)) {
        eventBus.emitCategoriesChanged();
      }
      if (_hasEntityUpdate('brands', entityVersions)) {
        eventBus.emitBrandsChanged();
      }
      if (_hasEntityUpdate('products', entityVersions)) {
        eventBus.emitProductsChanged();
      }
    } else {
      // No granular info - invalidate everything
      eventBus.emitCategoriesChanged();
      eventBus.emitBrandsChanged();
      eventBus.emitProductsChanged();
    }
  }

  bool _hasEntityUpdate(String entity, Map<String, int> entityVersions) {
    final newEntityVersion = entityVersions[entity];
    if (newEntityVersion == null) return false;

    final currentEntityVersion = _currentVersion?.entityVersions?[entity] ?? 0;
    return newEntityVersion > currentEntityVersion;
  }

  /// Force refresh all catalog data
  Future<void> forceRefreshAll() async {
    final eventBus = AppEventBus();
    eventBus.emitCategoriesChanged();
    eventBus.emitBrandsChanged();
    eventBus.emitProductsChanged();

    // Also fetch new version
    await checkForUpdates(force: true);
  }

  /// Dispose resources
  @override
  void dispose() {
    stopPolling();
    super.dispose();
  }
}
