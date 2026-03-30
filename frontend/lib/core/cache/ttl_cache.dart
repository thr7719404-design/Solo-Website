/// TTL Cache for cross-session freshness
/// Provides time-based cache invalidation for API data
library;

import 'dart:async';

/// Cache entry with TTL
class CacheEntry<T> {
  final T data;
  final DateTime cachedAt;
  final Duration ttl;
  final DateTime? updatedAt;

  CacheEntry({
    required this.data,
    required this.cachedAt,
    required this.ttl,
    this.updatedAt,
  });

  /// Check if cache entry is still valid
  bool get isValid => DateTime.now().difference(cachedAt) < ttl;

  /// Check if cache entry is expired
  bool get isExpired => !isValid;

  /// Time remaining until expiration
  Duration get timeRemaining {
    final remaining = ttl - DateTime.now().difference(cachedAt);
    return remaining.isNegative ? Duration.zero : remaining;
  }
}

/// TTL Cache implementation
class TtlCache<K, V> {
  final Duration defaultTtl;
  final Map<K, CacheEntry<V>> _cache = {};
  Timer? _cleanupTimer;

  TtlCache({
    this.defaultTtl = const Duration(seconds: 60),
    bool enableAutoCleanup = true,
  }) {
    if (enableAutoCleanup) {
      _startCleanupTimer();
    }
  }

  /// Get value from cache
  V? get(K key) {
    final entry = _cache[key];
    if (entry == null) return null;
    if (entry.isExpired) {
      _cache.remove(key);
      return null;
    }
    return entry.data;
  }

  /// Get cache entry (includes metadata)
  CacheEntry<V>? getEntry(K key) {
    final entry = _cache[key];
    if (entry == null) return null;
    if (entry.isExpired) {
      _cache.remove(key);
      return null;
    }
    return entry;
  }

  /// Set value in cache
  void set(K key, V value, {Duration? ttl, DateTime? updatedAt}) {
    _cache[key] = CacheEntry<V>(
      data: value,
      cachedAt: DateTime.now(),
      ttl: ttl ?? defaultTtl,
      updatedAt: updatedAt,
    );
  }

  /// Check if cache has valid entry for key
  bool has(K key) => get(key) != null;

  /// Remove entry from cache
  void remove(K key) => _cache.remove(key);

  /// Clear all cache entries
  void clear() => _cache.clear();

  /// Clear entries matching a pattern
  void clearMatching(bool Function(K key) predicate) {
    _cache.removeWhere((key, _) => predicate(key));
  }

  /// Get or fetch value with caching
  Future<V> getOrFetch(
    K key,
    Future<V> Function() fetcher, {
    Duration? ttl,
    bool forceRefresh = false,
  }) async {
    if (!forceRefresh) {
      final cached = get(key);
      if (cached != null) return cached;
    }

    final value = await fetcher();
    set(key, value, ttl: ttl);
    return value;
  }

  /// Get number of entries
  int get length => _cache.length;

  /// Get all keys
  Iterable<K> get keys => _cache.keys;

  /// Start periodic cleanup timer
  void _startCleanupTimer() {
    _cleanupTimer?.cancel();
    _cleanupTimer = Timer.periodic(
      const Duration(minutes: 1),
      (_) => _cleanup(),
    );
  }

  /// Remove expired entries
  void _cleanup() {
    _cache.removeWhere((_, entry) => entry.isExpired);
  }

  /// Dispose cache and timer
  void dispose() {
    _cleanupTimer?.cancel();
    _cache.clear();
  }
}

/// API response cache with updatedAt awareness
class ApiCache {
  static final ApiCache _instance = ApiCache._internal();

  factory ApiCache() => _instance;

  ApiCache._internal();

  /// Short TTL for frequently changing data (banners, home content)
  final contentCache = TtlCache<String, dynamic>(
    defaultTtl: const Duration(seconds: 30),
  );

  /// Medium TTL for catalog data (categories, brands)
  final catalogCache = TtlCache<String, dynamic>(
    defaultTtl: const Duration(seconds: 60),
  );

  /// Longer TTL for static-ish data (brands)
  final staticCache = TtlCache<String, dynamic>(
    defaultTtl: const Duration(minutes: 5),
  );

  /// Invalidate all caches
  void invalidateAll() {
    contentCache.clear();
    catalogCache.clear();
    staticCache.clear();
  }

  /// Invalidate content-related caches
  void invalidateContent() {
    contentCache.clear();
  }

  /// Invalidate catalog-related caches
  void invalidateCatalog() {
    catalogCache.clear();
    contentCache.clearMatching(
        (key) => key.contains('featured') || key.contains('products'));
  }

  /// Invalidate categories cache
  void invalidateCategories() {
    catalogCache.clearMatching((key) => key.contains('categor'));
  }

  /// Invalidate brands cache
  void invalidateBrands() {
    catalogCache.clearMatching((key) => key.contains('brand'));
  }

  /// Dispose all caches
  void dispose() {
    contentCache.dispose();
    catalogCache.dispose();
    staticCache.dispose();
  }
}

/// Global cache instance
final apiCache = ApiCache();
