import 'package:flutter/foundation.dart';
import '../models/product.dart';
import '../services/api_service.dart';

/// Provider for managing favorites (synced with backend)
class FavoritesProvider extends ChangeNotifier {
  final List<Product> _favorites = [];
  final Set<String> _favoriteIds = {};
  bool _isLoading = false;
  bool _isInitialized = false;
  String? _error;

  List<Product> get favorites => List.unmodifiable(_favorites);
  Set<String> get favoriteIds => Set.unmodifiable(_favoriteIds);
  int get count => _favorites.length;
  bool get isLoading => _isLoading;
  bool get isInitialized => _isInitialized;
  String? get error => _error;

  bool isFavorite(Product product) {
    return _favoriteIds.contains(product.id);
  }

  bool isFavoriteById(String productId) {
    return _favoriteIds.contains(productId);
  }

  /// Load favorites from the server (call when user logs in)
  Future<void> loadFavorites() async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final data = await ApiService.favorites.getFavorites();
      _favorites.clear();
      _favoriteIds.clear();

      for (final item in data) {
        final product = item['product'];
        if (product != null) {
          _favorites.add(Product(
            id: product['id']?.toString() ?? '',
            name: product['name'] ?? '',
            description: product['description'] ?? '',
            price: (product['price'] as num?)?.toDouble() ?? 0.0,
            imageUrl: product['imageUrl'] ?? '',
            category: product['category']?['name'] ?? '',
            brand: product['brand']?['name'] ?? '',
          ));
          _favoriteIds.add(product['id']?.toString() ?? '');
        }
      }

      _isInitialized = true;
    } catch (e) {
      _error = e.toString();
      debugPrint('Error loading favorites: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Load only favorite IDs (faster, for initial check)
  Future<void> loadFavoriteIds() async {
    try {
      final ids = await ApiService.favorites.getFavoriteIds();
      _favoriteIds.clear();
      _favoriteIds.addAll(ids);
      _isInitialized = true;
      notifyListeners();
    } catch (e) {
      debugPrint('Error loading favorite IDs: $e');
    }
  }

  /// Toggle favorite status with server sync
  Future<void> toggleFavorite(Product product) async {
    final wasInFavorites = _favoriteIds.contains(product.id);

    // Optimistic update
    if (wasInFavorites) {
      _favoriteIds.remove(product.id);
      _favorites.removeWhere((p) => p.id == product.id);
    } else {
      _favoriteIds.add(product.id);
      _favorites.add(product);
    }
    notifyListeners();

    try {
      await ApiService.favorites.toggleFavorite(product.id);
    } catch (e) {
      // Revert on error
      if (wasInFavorites) {
        _favoriteIds.add(product.id);
        _favorites.add(product);
      } else {
        _favoriteIds.remove(product.id);
        _favorites.removeWhere((p) => p.id == product.id);
      }
      notifyListeners();
      debugPrint('Error toggling favorite: $e');
      rethrow;
    }
  }

  /// Add to favorites with server sync
  Future<void> addFavorite(Product product) async {
    if (_favoriteIds.contains(product.id)) return;

    // Optimistic update
    _favoriteIds.add(product.id);
    _favorites.add(product);
    notifyListeners();

    try {
      await ApiService.favorites.addFavorite(product.id);
    } catch (e) {
      // Revert on error
      _favoriteIds.remove(product.id);
      _favorites.removeWhere((p) => p.id == product.id);
      notifyListeners();
      debugPrint('Error adding favorite: $e');
      rethrow;
    }
  }

  /// Remove from favorites with server sync
  Future<void> removeFavorite(Product product) async {
    if (!_favoriteIds.contains(product.id)) return;

    // Optimistic update
    _favoriteIds.remove(product.id);
    _favorites.removeWhere((p) => p.id == product.id);
    notifyListeners();

    try {
      await ApiService.favorites.removeFavorite(product.id);
    } catch (e) {
      // Revert on error
      _favoriteIds.add(product.id);
      _favorites.add(product);
      notifyListeners();
      debugPrint('Error removing favorite: $e');
      rethrow;
    }
  }

  /// Remove by ID with server sync
  Future<void> removeFavoriteById(String productId) async {
    final product = _favorites.firstWhere(
      (p) => p.id == productId,
      orElse: () => Product(
          id: productId,
          name: '',
          description: '',
          price: 0,
          imageUrl: '',
          category: '',
          brand: ''),
    );
    await removeFavorite(product);
  }

  /// Clear favorites (local only - for logout)
  void clearFavorites() {
    _favorites.clear();
    _favoriteIds.clear();
    _isInitialized = false;
    notifyListeners();
  }
}
