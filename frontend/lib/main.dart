import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'app.dart';
import 'providers/auth_provider.dart';
import 'providers/cart_provider.dart';
import 'providers/home_provider.dart';
import 'providers/product_list_provider.dart';
import 'providers/product_details_provider.dart';
import 'providers/content_provider.dart';
import 'providers/catalog_provider.dart';
import 'providers/favorites_provider.dart';
import 'providers/account_provider.dart';
import 'providers/home_cms_provider.dart';
import 'services/api_service.dart';
import 'services/api/cms_api.dart';
import 'config/app_config.dart';

void main() {
  // Global error handling
  FlutterError.onError = (FlutterErrorDetails details) {
    FlutterError.presentError(details);
  };

  // Initialize API services
  ApiService.initialize();

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (context) => AuthProvider()..init()),
        ChangeNotifierProvider(create: (context) => CartProvider()),
        ChangeNotifierProvider(create: (context) => HomeProvider()),
        ChangeNotifierProvider(create: (context) => ProductListProvider()),
        ChangeNotifierProvider(create: (context) => ProductDetailsProvider()),
        ChangeNotifierProvider(create: (context) => ContentProvider()),
        ChangeNotifierProvider(create: (context) => CatalogProvider()),
        ChangeNotifierProvider(create: (context) => FavoritesProvider()),
        ChangeNotifierProvider(create: (context) => AccountProvider()),
        ChangeNotifierProvider(
          create: (_) => HomeCmsProvider(
            cmsApi: CmsApi(baseUrl: AppConfig.apiBaseUrl),
          )..loadHomeCms(),
        ),
      ],
      child: const SoloApp(),
    ),
  );
}
