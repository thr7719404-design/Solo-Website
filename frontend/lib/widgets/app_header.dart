import 'package:flutter/material.dart';
import 'brand_logo.dart';
import 'package:provider/provider.dart';
import '../providers/cart_provider.dart';

class AppHeader extends StatelessWidget implements PreferredSizeWidget {
  final VoidCallback? onCartPressed;
  final VoidCallback? onSearchPressed;
  final VoidCallback? onFavoritesPressed;

  const AppHeader({
    super.key,
    this.onCartPressed,
    this.onSearchPressed,
    this.onFavoritesPressed,
  });

  @override
  Size get preferredSize => const Size.fromHeight(60);

  @override
  Widget build(BuildContext context) {
    final cartItemCount = context.watch<CartProvider>().itemCount;

    return AppBar(
      backgroundColor: Colors.white,
      elevation: 0,
      surfaceTintColor: Colors.transparent,
      centerTitle: true,
      title: const BrandLogo(height: 40),
      leading: IconButton(
        icon: const Icon(Icons.menu, color: Colors.black),
        onPressed: () {
          Scaffold.of(context).openDrawer();
        },
      ),
      actions: [
        IconButton(
          icon: const Icon(Icons.search, color: Colors.black),
          onPressed: onSearchPressed,
        ),
        IconButton(
          icon: const Icon(Icons.favorite_border, color: Colors.black),
          onPressed: onFavoritesPressed,
        ),
        Stack(
          children: [
            IconButton(
              icon:
                  const Icon(Icons.shopping_bag_outlined, color: Colors.black),
              onPressed: onCartPressed,
            ),
            if (cartItemCount > 0)
              Positioned(
                right: 8,
                top: 8,
                child: Container(
                  padding: const EdgeInsets.all(4),
                  decoration: const BoxDecoration(
                    color: Colors.black,
                    shape: BoxShape.circle,
                  ),
                  constraints: const BoxConstraints(
                    minWidth: 16,
                    minHeight: 16,
                  ),
                  child: Text(
                    '$cartItemCount',
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ),
          ],
        ),
        const SizedBox(width: 8),
      ],
    );
  }
}
