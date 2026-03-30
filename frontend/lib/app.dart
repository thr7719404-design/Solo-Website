import 'package:flutter/material.dart';
import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:provider/provider.dart';
import 'dart:html' as html;
import 'theme/app_theme.dart';
import 'providers/auth_provider.dart';
import 'providers/favorites_provider.dart';
import 'providers/cart_provider.dart';
import 'screens/home_screen_cms.dart';
import 'screens/login_screen.dart';
import 'screens/signup_screen.dart';
import 'screens/verify_email_screen.dart';
import 'screens/forgot_password_screen.dart';
import 'screens/account/account_shell.dart';
import 'screens/admin/admin_dashboard_screen.dart';
import 'screens/admin/admin_products_screen.dart';
import 'screens/admin/admin_product_form_screen.dart';
import 'screens/admin/admin_banners_screen.dart';
import 'screens/admin/admin_landing_pages_screen.dart';
import 'screens/admin/admin_categories_screen.dart';
import 'screens/admin/admin_category_form_screen.dart';
import 'screens/admin/admin_brands_screen.dart';
import 'screens/admin/admin_customers_screen.dart';
import 'screens/admin/admin_customer_details_screen.dart';
import 'screens/admin/admin_order_details_screen.dart';
import 'screens/admin/admin_orders_screen.dart';
import 'screens/admin/admin_stripe_config_screen.dart';
import 'screens/admin/admin_promo_codes_screen.dart';
import 'screens/admin/admin_vat_config_screen.dart';
import 'screens/admin/admin_reports_screen.dart';
import 'screens/landing_page_screen.dart';
import 'screens/cart_screen.dart';
import 'screens/favorites_screen.dart';
import 'screens/product_list_screen.dart';
import 'screens/product_detail_loader_screen.dart';
import 'screens/loyalty/loyalty_program_screen.dart';
import 'screens/category_landing_screen.dart';

class SoloApp extends StatefulWidget {
  const SoloApp({super.key});

  @override
  State<SoloApp> createState() => _SoloAppState();
}

class _SoloAppState extends State<SoloApp> {
  bool _prevAuthenticated = false;

  /// Get the initial route from the browser URL for web
  String _getInitialRoute() {
    if (kIsWeb) {
      final uri = Uri.parse(html.window.location.href);
      final path = uri.path;
      final query = uri.query.isNotEmpty ? '?${uri.query}' : '';
      if (path.isNotEmpty && path != '/') {
        return '$path$query';
      }
    }
    return '/';
  }

  @override
  Widget build(BuildContext context) {
    // Listen to auth changes and auto-load/clear favorites & cart
    final authProvider = context.watch<AuthProvider>();
    final favoritesProvider = context.read<FavoritesProvider>();
    final cartProvider = context.read<CartProvider>();

    if (authProvider.isAuthenticated && !_prevAuthenticated) {
      // User just logged in (or app started with saved token)
      if (!favoritesProvider.isInitialized) {
        favoritesProvider.loadFavoriteIds();
      }
      cartProvider.loadCart();
    } else if (!authProvider.isAuthenticated && _prevAuthenticated) {
      // User just logged out
      favoritesProvider.clearFavorites();
      cartProvider.clearLocal();
    }
    _prevAuthenticated = authProvider.isAuthenticated;

    final initialRoute = _getInitialRoute();

    return MaterialApp(
      title: 'Solo',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      initialRoute: initialRoute,
      routes: {
        '/': (context) => const HomeScreenCMS(),
        '/cart': (context) => const CartScreen(),
        '/favorites': (context) => const FavoritesScreen(),
        // Auth routes
        '/login': (context) => const LoginScreen(),
        '/signup': (context) => const SignUpScreen(),
        '/forgot-password': (context) => const ForgotPasswordScreen(),
        '/resend-verification': (context) => const ResendVerificationScreen(),
        // Loyalty route
        '/loyalty': (context) => const LoyaltyProgramScreen(),
        // Account routes
        '/my-account': (context) => const AccountShell(),
        '/my-account/profile': (context) => const AccountShell(initialIndex: 0),
        '/my-account/orders': (context) => const AccountShell(initialIndex: 1),
        '/my-account/loyalty': (context) => const AccountShell(initialIndex: 2),
        '/my-account/addresses': (context) =>
            const AccountShell(initialIndex: 3),
        '/my-account/payments': (context) =>
            const AccountShell(initialIndex: 4),
        '/my-account/security': (context) =>
            const AccountShell(initialIndex: 5),
        // Admin routes
        '/admin': (context) => const AdminDashboardScreen(),
        '/admin/products': (context) => const AdminProductsScreen(),
        '/admin/products/new': (context) => const AdminProductFormScreen(),
        '/admin/banners': (context) => const AdminBannersScreen(),
        '/admin/landing-pages': (context) => const AdminLandingPagesScreen(),
        '/admin/categories': (context) => const AdminCategoriesScreen(),
        '/admin/brands': (context) => const AdminBrandsScreen(),
        '/admin/orders': (context) => const AdminOrdersScreen(),
        '/admin/customers': (context) => const AdminCustomersScreen(),
        '/admin/stripe': (context) => const AdminStripeConfigScreen(),
        '/admin/promo-codes': (context) => const AdminPromoCodesScreen(),
        '/admin/vat-config': (context) => const AdminVatConfigScreen(),
        '/admin/reports': (context) => const AdminReportsScreen(),
      },
      onGenerateRoute: (settings) {
        // Handle customer details route
        if (settings.name == '/admin/customers/details') {
          final args = settings.arguments as Map<String, dynamic>;
          final customerId = args['customerId'].toString();
          return MaterialPageRoute(
            builder: (context) =>
                AdminCustomerDetailsScreen(customerId: customerId),
          );
        }

        // Handle admin order details route
        if (settings.name == '/admin/orders/details') {
          final args = settings.arguments as Map<String, dynamic>;
          final orderId = args['orderId'].toString();
          return MaterialPageRoute(
            builder: (context) => AdminOrderDetailsScreen(orderId: orderId),
          );
        }

        // Handle category landing route
        if (settings.name == '/category-landing') {
          final args = settings.arguments as Map<String, dynamic>;
          final categoryId = args['categoryId'].toString();
          return MaterialPageRoute(
            builder: (context) => CategoryLandingScreen(categoryId: categoryId),
          );
        }

        // Handle products route with category/subcategory
        if (settings.name == '/products') {
          final args = settings.arguments as Map<String, dynamic>?;
          final categoryId = args?['categoryId']?.toString();
          final subcategoryId = args?['subcategoryId']?.toString();
          final title = args?['title']?.toString();
          return MaterialPageRoute(
            builder: (context) => ProductListScreen(
              categorySlug: categoryId,
              subcategoryId: subcategoryId,
              title: title,
            ),
          );
        }

        // Handle email verification with token
        if (settings.name?.startsWith('/verify-email') == true) {
          final uri = Uri.parse(settings.name!);
          final token = uri.queryParameters['token'];
          return MaterialPageRoute(
            builder: (context) => VerifyEmailScreen(token: token),
          );
        }

        // Handle password reset with token
        if (settings.name?.startsWith('/reset-password') == true) {
          final uri = Uri.parse(settings.name!);
          final token = uri.queryParameters['token'] ?? '';
          return MaterialPageRoute(
            builder: (context) => ResetPasswordScreen(token: token),
          );
        }

        // Handle dynamic routes (e.g., /admin/products/edit/:id)
        if (settings.name?.startsWith('/admin/products/edit') == true) {
          final productId = settings.arguments as String?;
          return MaterialPageRoute(
            builder: (context) => AdminProductFormScreen(productId: productId),
          );
        }

        // Handle category form routes
        if (settings.name?.startsWith('/admin/categories/edit') == true) {
          final categoryId = settings.arguments as String?;
          return MaterialPageRoute(
            builder: (context) =>
                AdminCategoryFormScreen(categoryId: categoryId),
          );
        }

        if (settings.name == '/admin/categories/new') {
          return MaterialPageRoute(
            builder: (context) => const AdminCategoryFormScreen(),
          );
        }

        // Handle landing page routes
        if (settings.name?.startsWith('/pages/') == true) {
          final slug = settings.name!.substring('/pages/'.length);
          return MaterialPageRoute(
            builder: (context) => LandingPageScreen(slug: slug),
          );
        }

        // Handle category routes
        if (settings.name?.startsWith('/category/') == true) {
          final categorySlug = settings.name!.substring('/category/'.length);
          return MaterialPageRoute(
            builder: (context) => ProductListScreen(categorySlug: categorySlug),
          );
        }

        // Handle product detail routes
        if (settings.name?.startsWith('/product/') == true) {
          final productId = settings.name!.substring('/product/'.length);
          return MaterialPageRoute(
            builder: (context) =>
                ProductDetailLoaderScreen(productId: productId),
          );
        }

        // Handle collection routes
        if (settings.name?.startsWith('/new-arrivals') == true ||
            settings.name?.startsWith('/best-sellers') == true ||
            settings.name?.startsWith('/sale') == true ||
            settings.name?.startsWith('/featured') == true) {
          final collectionType =
              settings.name!.substring(1); // Remove leading /
          return MaterialPageRoute(
            builder: (context) => ProductListScreen(collection: collectionType),
          );
        }

        // Handle search routes
        if (settings.name?.startsWith('/search') == true) {
          final uri = Uri.parse(settings.name!);
          final query = uri.queryParameters['q'] ?? '';
          return MaterialPageRoute(
            builder: (context) => ProductListScreen(searchQuery: query),
          );
        }

        // Handle brand routes
        if (settings.name?.startsWith('/brand/') == true) {
          final brandId = settings.name!.substring('/brand/'.length);
          return MaterialPageRoute(
            builder: (context) => ProductListScreen(brandId: brandId),
          );
        }

        return null;
      },
      onUnknownRoute: (settings) {
        // Fallback for unknown routes
        return MaterialPageRoute(
          builder: (context) => Scaffold(
            appBar: AppBar(title: const Text('Page Not Found')),
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 64, color: Colors.grey),
                  const SizedBox(height: 16),
                  Text(
                    'Page not found: ${settings.name}',
                    style: const TextStyle(fontSize: 18, color: Colors.grey),
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () =>
                        Navigator.pushReplacementNamed(context, '/'),
                    child: const Text('Go Home'),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }
}
