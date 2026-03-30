import 'dart:async';
import 'package:flutter/foundation.dart';
import '../models/product.dart';
import '../data/repositories/product_repository.dart';
import '../data/api/api_errors.dart';
import '../app/theme/tokens.dart';
import '../app/services/app_snackbar_service.dart';

enum SearchStatus { idle, loading, success, error }

class SearchProvider extends ChangeNotifier {
  final ProductRepository _productRepository;
  Timer? _debounceTimer;
  int _requestId = 0;

  SearchProvider(this._productRepository);

  String _query = '';
  List<Product> _results = [];
  SearchStatus _status = SearchStatus.idle;
  String? _errorMessage;
  final List<String> _searchHistory = [];

  String get query => _query;
  List<Product> get results => _results;
  SearchStatus get status => _status;
  String? get errorMessage => _errorMessage;
  List<String> get searchHistory => List.unmodifiable(_searchHistory);
  bool get isLoading => _status == SearchStatus.loading;
  bool get hasResults => _results.isNotEmpty;

  Future<void> search(String query, {Map<String, dynamic>? filters}) async {
    if (query.trim().isEmpty) {
      clear();
      return;
    }

    _query = query;
    
    // Cancel previous debounce timer
    _debounceTimer?.cancel();
    
    // Debounce the search
    _debounceTimer = Timer(AppTokens.searchDebounce, () {
      _performSearch(query, filters);
    });
    
    // Set loading immediately for UI feedback
    _status = SearchStatus.loading;
    _errorMessage = null;
    notifyListeners();
  }

  Future<void> _performSearch(String query, Map<String, dynamic>? filters) async {
    // Increment request ID to track this specific request
    final currentRequestId = ++_requestId;

    try {
      final results = await _productRepository.searchProducts(query, filters: filters);
      
      // Check if this is still the latest request
      if (currentRequestId == _requestId) {
        _results = results;
        _status = SearchStatus.success;
        _addToHistory(query);
        notifyListeners();
      }
      // If not, ignore stale results
    } catch (e) {
      // Only update error if this is still the latest request
      if (currentRequestId == _requestId) {
        _status = SearchStatus.error;
        _errorMessage = e is ApiException ? e.displayMessage : 'Search failed';
        _results = [];
        
        // Show user-friendly error notification
        AppSnackbarService.instance.showError(
          _errorMessage ?? 'Search failed',
        );
        
        notifyListeners();
      }
    }
  }

  void clear() {
    _debounceTimer?.cancel();
    _query = '';
    _results = [];
    _status = SearchStatus.idle;
    _errorMessage = null;
    notifyListeners();
  }

  @override
  void dispose() {
    _debounceTimer?.cancel();
    super.dispose();
  }

  void _addToHistory(String query) {
    if (!_searchHistory.contains(query)) {
      _searchHistory.insert(0, query);
      if (_searchHistory.length > 10) {
        _searchHistory.removeLast();
      }
    }
  }

  void clearHistory() {
    _searchHistory.clear();
    notifyListeners();
  }

  void removeFromHistory(String query) {
    _searchHistory.remove(query);
    notifyListeners();
  }
}
