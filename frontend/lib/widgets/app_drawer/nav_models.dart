import 'package:flutter/material.dart';
import '../../models/category.dart';

class NavItem {
  final String id;
  final String title;
  final IconData icon;
  final String? route;
  final List<NavItem>? children;
  final int? count;

  const NavItem({
    required this.id,
    required this.title,
    required this.icon,
    this.route,
    this.children,
    this.count,
  });

  factory NavItem.fromCategory(Category category) {
    return NavItem(
      id: category.id,
      title: category.name,
      icon: Icons.category_outlined,
      route: '/category/${category.id}',
      count: category.productCount,
    );
  }
}

class NavSection {
  final String title;
  final List<NavItem> items;

  const NavSection({
    required this.title,
    required this.items,
  });
}

class NavModel {
  // MAIN Section
  static const NavSection mainSection = NavSection(
    title: 'MAIN',
    items: [
      NavItem(
        id: 'home',
        title: 'Home',
        icon: Icons.home_outlined,
        route: '/',
      ),
    ],
  );

  // SHOP Section
  static const NavSection shopSection = NavSection(
    title: 'SHOP',
    items: [
      NavItem(
        id: 'categories',
        title: 'Categories',
        icon: Icons.category_outlined,
      ),
      NavItem(
        id: 'top-sellers',
        title: 'Top Sellers',
        icon: Icons.star_outline,
        route: '/top-sellers',
      ),
      NavItem(
        id: 'new-arrivals',
        title: 'New Arrivals',
        icon: Icons.fiber_new_outlined,
        route: '/new-arrivals',
      ),
      NavItem(
        id: 'special-offers',
        title: 'Special Offers',
        icon: Icons.local_offer_outlined,
        route: '/special-offers',
      ),
    ],
  );

  // ACCOUNT Section
  static const NavSection accountSection = NavSection(
    title: 'ACCOUNT',
    items: [
      NavItem(
        id: 'favorites',
        title: 'Favorites',
        icon: Icons.favorite_outline,
        route: '/favorites',
      ),
      NavItem(
        id: 'my-cart',
        title: 'My Cart',
        icon: Icons.shopping_cart_outlined,
        route: '/cart',
      ),
      NavItem(
        id: 'my-account',
        title: 'Account',
        icon: Icons.person_outline,
        route: '/account',
      ),
      NavItem(
        id: 'settings',
        title: 'Settings',
        icon: Icons.settings_outlined,
        route: '/settings',
      ),
      NavItem(
        id: 'about',
        title: 'About Us',
        icon: Icons.info_outline,
        route: '/about',
      ),
    ],
  );

  static const List<NavSection> allSections = [
    mainSection,
    shopSection,
    accountSection,
  ];
}
