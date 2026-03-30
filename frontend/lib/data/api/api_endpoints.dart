class ApiEndpoints {
  // Auth
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String logout = '/auth/logout';
  static const String me = '/auth/me';
  static const String refreshToken = '/auth/refresh';

  // Products
  static const String products = '/products';
  static String productById(String id) => '/products/$id';
  static const String featuredProducts = '/products/featured';
  static const String bestSellers = '/products/best-sellers';
  static const String newArrivals = '/products/new-arrivals';
  static const String deals = '/products/deals';
  static String relatedProducts(String id) => '/products/$id/related';

  // Categories
  static const String categories = '/categories';
  static String categoryById(String id) => '/categories/$id';

  // Cart
  static const String cart = '/cart';
  static const String cartItems = '/cart/items';
  static String cartItem(String id) => '/cart/items/$id';

  // Orders
  static const String orders = '/orders';
  static String orderById(String id) => '/orders/$id';

  // User Account
  static const String profile = '/account/profile';
  static const String addresses = '/account/addresses';
  static String addressById(String id) => '/account/addresses/$id';

  // Search
  static const String search = '/products';
}
