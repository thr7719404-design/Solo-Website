import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import '../brand_logo.dart';
import 'package:provider/provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/favorites_provider.dart';
import '../../app/theme/tokens.dart';
import 'shipping_strip.dart';
import 'icon_badge_button.dart';

class UnifiedAppHeader extends StatelessWidget implements PreferredSizeWidget {
  const UnifiedAppHeader({super.key});

  @override
  Size get preferredSize => const Size.fromHeight(AppTokens.totalHeaderHeight);

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        const AppShippingStrip(),
        _buildMainHeader(context),
      ],
    );
  }

  Widget _buildMainHeader(BuildContext context) {
    return Container(
      height: AppTokens.mainHeaderHeight,
      color: Colors.white,
      child: Row(
        children: [
          // Hamburger menu
          IconButton(
            icon: Icon(Icons.menu, color: Colors.black, size: AppTokens.iconSizeL),
            onPressed: () => Scaffold.of(context).openDrawer(),
            tooltip: 'Menu',
          ),
          
          SizedBox(width: AppTokens.spacingS),
          
          // Logo (centered)
          Expanded(
            child: BrandLogo(
              height: AppTokens.logoHeight,
              center: true,
              onTap: () => Navigator.of(context).pushNamedAndRemoveUntil('/', (route) => false),
            ),
          ),
          
          SizedBox(width: AppTokens.spacingS),
          
          // Actions
          _buildActions(context),
        ],
      ),
    );
  }

  Widget _buildActions(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        // Search
        IconBadgeButton(
          icon: Icons.search,
          onPressed: () => _handleSearch(context),
          tooltip: 'Search',
        ),
        
        // Favorites
        Selector<FavoritesProvider, int>(
          selector: (_, provider) => provider.count,
          builder: (context, count, _) {
            return IconBadgeButton(
              icon: Icons.favorite_border,
              badgeCount: count,
              onPressed: () => Navigator.of(context).pushNamed('/favorites'),
              tooltip: 'Favorites',
            );
          },
        ),
        
        // Cart
        Selector<CartProvider, int>(
          selector: (_, provider) => provider.count,
          builder: (context, count, _) {
            return IconBadgeButton(
              icon: Icons.shopping_bag_outlined,
              badgeCount: count,
              onPressed: () => Navigator.of(context).pushNamed('/cart'),
              tooltip: 'Cart',
            );
          },
        ),
        
        SizedBox(width: AppTokens.spacingS),
      ],
    );
  }

  void _handleSearch(BuildContext context) {
    // Check screen size using tokens
    if (AppTokens.isMobile(context)) {
      // Mobile: Navigate to search page
      Navigator.of(context).pushNamed('/search');
    } else {
      // Desktop: Show search overlay/dialog
      _showSearchOverlay(context);
    }
  }

  void _showSearchOverlay(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => Dialog(
        child: Container(
          width: 600,
          padding: EdgeInsets.all(AppTokens.spacingL),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                autofocus: true,
                decoration: InputDecoration(
                  hintText: 'Search products...',
                  prefixIcon: const Icon(Icons.search),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(AppTokens.radiusM),
                  ),
                ),
                onSubmitted: (query) {
                  Navigator.of(context).pop();
                  Navigator.of(context).pushNamed('/search', arguments: query);
                },
              ),
            ],
          ),
        ),
      ),
    );
  }
}
