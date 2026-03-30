import 'api_client.dart';
import 'api/auth_api.dart';
import 'api/products_api.dart';
import '../core/api/categories_api.dart';
import 'api/brands_api.dart';
import 'api/content_api.dart';
import 'api/admin_api.dart';
import 'api/media_api.dart';
import 'api/orders_api.dart';
import 'api/account_api.dart';
import 'api/customers_api.dart';
import 'api/favorites_api.dart';
import 'api/stripe_api.dart';
import 'api/promo_codes_api.dart';
import 'api/cart_api.dart';
import '../config/app_config.dart';

/// Centralized API service factory
class ApiService {
  static ApiClient? _client;
  static AuthApi? _authApi;
  static ProductsApi? _productsApi;
  static CategoriesApi? _categoriesApi;
  static BrandsApi? _brandsApi;
  static ContentApi? _contentApi;
  static AdminApi? _adminApi;
  static MediaApi? _mediaApi;
  static OrdersApi? _ordersApi;
  static AccountApi? _accountApi;
  static CustomersApi? _customersApi;
  static FavoritesApi? _favoritesApi;
  static StripeApi? _stripeApi;
  static PromoCodesApi? _promoCodesApi;
  static CartApi? _cartApi;

  /// Initialize API services (call once at app startup)
  static void initialize({String? baseUrl}) {
    _client = ApiClient(
      baseUrl: baseUrl ?? AppConfig.apiBaseUrl,
    );
  }

  /// Get API client instance
  static ApiClient get client {
    if (_client == null) {
      throw StateError(
          'ApiService not initialized. Call ApiService.initialize() first.');
    }
    return _client!;
  }

  /// Get Auth API service
  static AuthApi get auth {
    _authApi ??= AuthApi(client);
    return _authApi!;
  }

  /// Get Products API service
  static ProductsApi get products {
    _productsApi ??= ProductsApi(client);
    return _productsApi!;
  }

  /// Get Categories API service
  static CategoriesApi get categories {
    _categoriesApi ??= CategoriesApi(client);
    return _categoriesApi!;
  }

  /// Get Brands API service
  static BrandsApi get brands {
    _brandsApi ??= BrandsApi(client);
    return _brandsApi!;
  }

  /// Get Content API service
  static ContentApi get content {
    _contentApi ??= ContentApi(client);
    return _contentApi!;
  }

  /// Get Admin API service
  static AdminApi get admin {
    _adminApi ??= AdminApi(client);
    return _adminApi!;
  }

  /// Get Media API service
  static MediaApi get media {
    _mediaApi ??= MediaApi(client);
    return _mediaApi!;
  }

  /// Get Orders API service
  static OrdersApi get orders {
    _ordersApi ??= OrdersApi(client);
    return _ordersApi!;
  }

  /// Get Account API service
  static AccountApi get account {
    _accountApi ??= AccountApi(client);
    return _accountApi!;
  }

  /// Get Customers API service
  static CustomersApi get customers {
    _customersApi ??= CustomersApi(client);
    return _customersApi!;
  }

  /// Get Favorites API service
  static FavoritesApi get favorites {
    _favoritesApi ??= FavoritesApi(client);
    return _favoritesApi!;
  }

  /// Get Stripe API service
  static StripeApi get stripe {
    _stripeApi ??= StripeApi(client);
    return _stripeApi!;
  }

  /// Get Promo Codes API service
  static PromoCodesApi get promoCodes {
    _promoCodesApi ??= PromoCodesApi(client);
    return _promoCodesApi!;
  }

  /// Get Cart API service
  static CartApi get cart {
    _cartApi ??= CartApi(client);
    return _cartApi!;
  }

  /// Reset all services (useful for testing or logout)
  static void reset() {
    _client = null;
    _authApi = null;
    _productsApi = null;
    _categoriesApi = null;
    _brandsApi = null;
    _contentApi = null;
    _adminApi = null;
    _mediaApi = null;
    _ordersApi = null;
    _accountApi = null;
    _customersApi = null;
    _favoritesApi = null;
    _stripeApi = null;
    _promoCodesApi = null;
    _cartApi = null;
  }
}
