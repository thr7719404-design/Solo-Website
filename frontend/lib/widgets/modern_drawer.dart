import 'package:flutter/material.dart';
import 'brand_logo.dart';
import 'package:provider/provider.dart';
import '../providers/catalog_provider.dart';
import '../providers/auth_provider.dart';
import '../providers/cart_provider.dart';
import '../screens/favorites_screen.dart';
import '../screens/about_us_screen.dart';
import '../models/category_tree.dart';

class ModernDrawer extends StatefulWidget {
  final int? cartItemCount;
  final VoidCallback? onOpenCart;

  const ModernDrawer({
    super.key,
    this.cartItemCount,
    this.onOpenCart,
  });

  @override
  State<ModernDrawer> createState() => _ModernDrawerState();
}

class _ModernDrawerState extends State<ModernDrawer>
    with SingleTickerProviderStateMixin {
  bool _categoriesExpanded = false;
  final Set<String> _expandedCategoryIds = {};
  String _categorySearchQuery = '';
  final TextEditingController _searchController = TextEditingController();
  String? _hoveredItem;
  late AnimationController _animationController;

  @override
  void initState() {
    super.initState();
    _animationController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 200),
    );
  }

  @override
  void dispose() {
    _animationController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();
    final isAuthenticated = authProvider.isAuthenticated;
    final cartProvider = context.watch<CartProvider>();
    final cartCount = widget.cartItemCount ?? cartProvider.itemCount;

    return Drawer(
      child: Container(
        color: Colors.grey[50],
        child: Column(
          children: [
            _buildModernHeader(),
            _buildQuickActions(cartCount),
            Expanded(
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  _buildSection('MAIN', [
                    _buildDrawerItem(
                      icon: Icons.home_rounded,
                      title: 'Home',
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.pushNamedAndRemoveUntil(
                            context, '/', (route) => false);
                      },
                    ),
                  ]),
                  _buildSection('SHOP', [
                    _buildExpandableCategories(),
                    _buildDrawerItem(
                      icon: Icons.star_rounded,
                      title: 'Top Sellers',
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.pushNamed(context, '/best-sellers');
                      },
                    ),
                    _buildDrawerItem(
                      icon: Icons.new_releases_rounded,
                      title: 'New Arrivals',
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.pushNamed(context, '/new-arrivals');
                      },
                    ),
                    _buildDrawerItem(
                      icon: Icons.local_offer_rounded,
                      title: 'Special Offers',
                      badge: 'NEW',
                      badgeColor: Colors.red,
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.pushNamed(context, '/sale');
                      },
                    ),
                  ]),
                  _buildSection('ACCOUNT', [
                    _buildDrawerItem(
                      icon: Icons.person_rounded,
                      title: 'My Account',
                      onTap: () {
                        Navigator.pop(context);
                        if (isAuthenticated) {
                          Navigator.pushNamed(context, '/my-account/profile');
                        } else {
                          Navigator.pushNamed(context, '/login');
                        }
                      },
                    ),
                    _buildDrawerItem(
                      icon: Icons.receipt_long_rounded,
                      title: 'My Orders',
                      onTap: () {
                        Navigator.pop(context);
                        if (isAuthenticated) {
                          Navigator.pushNamed(context, '/my-account/orders');
                        } else {
                          Navigator.pushNamed(context, '/login');
                        }
                      },
                    ),
                    _buildDrawerItem(
                      icon: Icons.location_on_rounded,
                      title: 'My Addresses',
                      onTap: () {
                        Navigator.pop(context);
                        if (isAuthenticated) {
                          Navigator.pushNamed(context, '/my-account/addresses');
                        } else {
                          Navigator.pushNamed(context, '/login');
                        }
                      },
                    ),
                    _buildDrawerItem(
                      icon: Icons.help_rounded,
                      title: 'Help & Support',
                      onTap: () {},
                    ),
                    _buildDrawerItem(
                      icon: Icons.info_rounded,
                      title: 'About Us',
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                              builder: (context) => const AboutUsScreen()),
                        );
                      },
                    ),
                    if (isAuthenticated)
                      _buildDrawerItem(
                        icon: Icons.logout_rounded,
                        title: 'Logout',
                        onTap: () => _handleLogout(context, authProvider),
                      ),
                  ]),
                ],
              ),
            ),
            _buildModernFooter(),
          ],
        ),
      ),
    );
  }

  Future<void> _handleLogout(
      BuildContext context, AuthProvider authProvider) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFB8860B),
            ),
            child: const Text('Logout', style: TextStyle(color: Colors.white)),
          ),
        ],
      ),
    );

    if (confirmed == true && context.mounted) {
      await authProvider.logout();
      if (context.mounted) {
        Navigator.pop(context); // Close drawer
        Navigator.pushNamedAndRemoveUntil(context, '/', (route) => false);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('You have been logged out'),
            backgroundColor: Color(0xFFB8860B),
          ),
        );
      }
    }
  }

  Widget _buildModernHeader() {
    final authProvider = context.watch<AuthProvider>();
    final isAuthenticated = authProvider.isAuthenticated;
    final user = authProvider.user;

    final displayName = isAuthenticated && user != null
        ? '${user.firstName ?? ''} ${user.lastName ?? ''}'.trim()
        : 'Guest User';
    final subtitle = isAuthenticated && user != null
        ? user.email ?? 'Welcome back!'
        : 'Sign in for exclusive offers';

    return GestureDetector(
      onTap: () {
        Navigator.pop(context);
        if (isAuthenticated) {
          Navigator.pushNamed(context, '/my-account');
        } else {
          Navigator.pushNamed(context, '/login');
        }
      },
      child: Container(
        height: 200,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              const Color(0xFF1A1A1A),
              const Color(0xFF2D2D2D),
              const Color(0xFF1A1A1A),
            ],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Logo
                BrandLogo(
                  height: 50,
                  center: true,
                  onTap: () {
                    Navigator.of(context).pop(); // close drawer
                    Navigator.of(context)
                        .popUntil((route) => route.isFirst); // go home
                  },
                ),
                const Spacer(),
                // User Section
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(2),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                            color: Colors.white.withOpacity(0.3), width: 2),
                      ),
                      child: CircleAvatar(
                        radius: 22,
                        backgroundColor: isAuthenticated
                            ? const Color(0xFFB8860B).withOpacity(0.3)
                            : Colors.white.withOpacity(0.1),
                        child: Text(
                          displayName.isNotEmpty
                              ? displayName[0].toUpperCase()
                              : '?',
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 20,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            displayName.isNotEmpty ? displayName : 'Guest User',
                            style: const TextStyle(
                              color: Colors.white,
                              fontSize: 16,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                          Text(
                            subtitle,
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.7),
                              fontSize: 12,
                            ),
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                          ),
                        ],
                      ),
                    ),
                    Icon(
                      Icons.arrow_forward_ios,
                      color: Colors.white.withOpacity(0.5),
                      size: 16,
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildQuickActions(int cartCount) {
    return Container(
      padding: const EdgeInsets.all(16),
      child: Row(
        children: [
          Expanded(
            child: _buildQuickActionButton(
              icon: Icons.search_rounded,
              label: 'Search',
              onTap: () {},
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _buildQuickActionButton(
              icon: Icons.favorite_rounded,
              label: 'Favorites',
              badge: 0,
              onTap: () {
                Navigator.pop(context);
                Navigator.push(
                  context,
                  MaterialPageRoute(
                      builder: (context) => const FavoritesScreen()),
                );
              },
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _buildQuickActionButton(
              icon: Icons.receipt_long_rounded,
              label: 'Orders',
              onTap: () {
                Navigator.pop(context);
                final authProvider = context.read<AuthProvider>();
                if (authProvider.isAuthenticated) {
                  Navigator.pushNamed(context, '/my-account/orders');
                } else {
                  Navigator.pushNamed(context, '/login');
                }
              },
            ),
          ),
          const SizedBox(width: 8),
          Expanded(
            child: _buildQuickActionButton(
              icon: Icons.shopping_bag_rounded,
              label: 'Cart',
              badge: cartCount,
              onTap: () {
                Navigator.pop(context);
                if (widget.onOpenCart != null) {
                  widget.onOpenCart!();
                } else {
                  Navigator.pushNamed(context, '/cart');
                }
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionButton({
    required IconData icon,
    required String label,
    int? badge,
    required VoidCallback onTap,
  }) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 12),
          child: Column(
            children: [
              Stack(
                clipBehavior: Clip.none,
                children: [
                  Icon(icon, size: 24, color: const Color(0xFF1A1A1A)),
                  if (badge != null && badge > 0)
                    Positioned(
                      right: -8,
                      top: -8,
                      child: Container(
                        padding: const EdgeInsets.all(4),
                        decoration: const BoxDecoration(
                          color: Colors.red,
                          shape: BoxShape.circle,
                        ),
                        constraints: const BoxConstraints(
                          minWidth: 18,
                          minHeight: 18,
                        ),
                        child: Text(
                          badge > 99 ? '99+' : badge.toString(),
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
              const SizedBox(height: 4),
              Text(
                label,
                style: const TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w500,
                  color: Color(0xFF1A1A1A),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 8),
          child: Text(
            title,
            style: TextStyle(
              fontSize: 11,
              fontWeight: FontWeight.w700,
              color: Colors.grey[600],
              letterSpacing: 1.2,
            ),
          ),
        ),
        ...children,
      ],
    );
  }

  Widget _buildDrawerItem({
    required IconData icon,
    required String title,
    String? badge,
    Color? badgeColor,
    required VoidCallback onTap,
  }) {
    final isHovered = _hoveredItem == title;

    return MouseRegion(
      onEnter: (_) => setState(() => _hoveredItem = title),
      onExit: (_) => setState(() => _hoveredItem = null),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
        decoration: BoxDecoration(
          color: isHovered ? Colors.white : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          boxShadow: isHovered
              ? [
                  BoxShadow(
                      color: Colors.black.withOpacity(0.05),
                      blurRadius: 8,
                      offset: const Offset(0, 2))
                ]
              : [],
        ),
        child: ListTile(
          leading: Icon(icon, color: const Color(0xFF1A1A1A), size: 22),
          title: Text(
            title,
            style: const TextStyle(
              fontSize: 15,
              fontWeight: FontWeight.w500,
              color: Color(0xFF1A1A1A),
            ),
          ),
          trailing: badge != null
              ? Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: badgeColor ?? Colors.blue,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    badge,
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 10,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                )
              : null,
          onTap: onTap,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      ),
    );
  }

  Widget _buildExpandableCategories() {
    final catalogProvider = context.watch<CatalogProvider>();
    final categoryTree = catalogProvider.categoryTree;
    final isLoading = catalogProvider.isLoading;

    // Filter categories based on search query
    List<CategoryNode> filteredCategories = categoryTree;
    if (_categorySearchQuery.isNotEmpty) {
      final query = _categorySearchQuery.toLowerCase();
      filteredCategories = categoryTree.where((node) {
        // Match parent name
        if (node.name.toLowerCase().contains(query)) return true;
        // Match any child name
        return node.children
            .any((sub) => sub.name.toLowerCase().contains(query));
      }).toList();
    }

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
      decoration: BoxDecoration(
        color: _hoveredItem == 'Categories' ? Colors.white : Colors.transparent,
        borderRadius: BorderRadius.circular(12),
      ),
      child: MouseRegion(
        onEnter: (_) => setState(() => _hoveredItem = 'Categories'),
        onExit: (_) => setState(() => _hoveredItem = null),
        child: Theme(
          data: Theme.of(context).copyWith(dividerColor: Colors.transparent),
          child: ExpansionTile(
            leading: const Icon(Icons.grid_view_rounded,
                color: Color(0xFF1A1A1A), size: 22),
            title: const Text(
              'Categories',
              style: TextStyle(
                fontSize: 15,
                fontWeight: FontWeight.w500,
                color: Color(0xFF1A1A1A),
              ),
            ),
            trailing: AnimatedRotation(
              turns: _categoriesExpanded ? 0.5 : 0,
              duration: const Duration(milliseconds: 200),
              child: const Icon(Icons.expand_more, color: Color(0xFF1A1A1A)),
            ),
            onExpansionChanged: (expanded) {
              setState(() {
                _categoriesExpanded = expanded;
                if (!expanded) {
                  _categorySearchQuery = '';
                  _searchController.clear();
                }
              });
            },
            children: [
              // Search input
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: SizedBox(
                  height: 40,
                  child: TextField(
                    controller: _searchController,
                    onChanged: (value) {
                      setState(() {
                        _categorySearchQuery = value;
                      });
                    },
                    style: const TextStyle(fontSize: 14),
                    decoration: InputDecoration(
                      hintText: 'Search categories…',
                      hintStyle:
                          TextStyle(color: Colors.grey[400], fontSize: 14),
                      prefixIcon:
                          Icon(Icons.search, size: 20, color: Colors.grey[400]),
                      suffixIcon: _categorySearchQuery.isNotEmpty
                          ? IconButton(
                              icon: Icon(Icons.clear,
                                  size: 18, color: Colors.grey[400]),
                              onPressed: () {
                                setState(() {
                                  _categorySearchQuery = '';
                                  _searchController.clear();
                                });
                              },
                            )
                          : null,
                      filled: true,
                      fillColor: Colors.grey[100],
                      contentPadding:
                          const EdgeInsets.symmetric(horizontal: 12),
                      border: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide.none,
                      ),
                      focusedBorder: OutlineInputBorder(
                        borderRadius: BorderRadius.circular(8),
                        borderSide: BorderSide(
                            color: Theme.of(context).primaryColor, width: 1),
                      ),
                    ),
                  ),
                ),
              ),

              // Loading state
              if (isLoading && categoryTree.isEmpty)
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        'Loading categories…',
                        style: TextStyle(color: Colors.grey[500], fontSize: 13),
                      ),
                    ],
                  ),
                ),

              // Empty state
              if (!isLoading && categoryTree.isEmpty)
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Center(
                    child: Text(
                      'No categories',
                      style: TextStyle(color: Colors.grey[500], fontSize: 14),
                    ),
                  ),
                ),

              // No search results
              if (!isLoading &&
                  categoryTree.isNotEmpty &&
                  filteredCategories.isEmpty)
                Padding(
                  padding: const EdgeInsets.all(16),
                  child: Center(
                    child: Text(
                      'No matching categories',
                      style: TextStyle(color: Colors.grey[500], fontSize: 14),
                    ),
                  ),
                ),

              // Category list
              ...filteredCategories.map((node) => _buildCategoryNodeItem(node)),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCategoryNodeItem(CategoryNode node) {
    final isExpanded = _expandedCategoryIds.contains(node.id);
    final query = _categorySearchQuery.toLowerCase();

    // Filter children based on search query
    List<SubcategoryNode> visibleChildren = node.children;
    if (query.isNotEmpty) {
      final parentMatches = node.name.toLowerCase().contains(query);
      if (!parentMatches) {
        visibleChildren = node.children
            .where((sub) => sub.name.toLowerCase().contains(query))
            .toList();
      }
    }

    void navigateToCategory() {
      Navigator.pop(context); // closes drawer first
      Navigator.pushNamed(
        context,
        '/category-landing',
        arguments: {'categoryId': node.id.toString()},
      );
    }

    void navigateToSubcategory(SubcategoryNode sub) {
      Navigator.pop(context); // closes drawer first
      Navigator.pushNamed(
        context,
        '/products',
        arguments: {
          'categoryId': node.id.toString(), // parent category
          'subcategoryId': sub.id.toString(), // selected subcategory
          'title': sub.name.toString(),
        },
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Parent category row
        InkWell(
          onTap: navigateToCategory,
          child: Container(
            constraints: const BoxConstraints(minHeight: 48),
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Row(
              children: [
                // Chevron for expand/collapse (if has children)
                if (node.hasChildren)
                  GestureDetector(
                    onTap: () {
                      setState(() {
                        if (isExpanded) {
                          _expandedCategoryIds.remove(node.id);
                        } else {
                          _expandedCategoryIds.add(node.id);
                        }
                      });
                    },
                    behavior: HitTestBehavior.opaque,
                    child: Container(
                      width: 32,
                      height: 32,
                      alignment: Alignment.center,
                      child: AnimatedRotation(
                        turns: isExpanded ? 0.25 : 0,
                        duration: const Duration(milliseconds: 200),
                        child: Icon(
                          Icons.chevron_right,
                          size: 20,
                          color: Colors.grey[600],
                        ),
                      ),
                    ),
                  )
                else
                  const SizedBox(width: 32),

                const SizedBox(width: 8),

                // Category name
                Expanded(
                  child: Text(
                    node.name,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                    style: const TextStyle(
                      fontSize: 14,
                      fontWeight: FontWeight.w500,
                      color: Color(0xFF1A1A1A),
                    ),
                  ),
                ),

                // Count badge
                if (node.hasChildren)
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: const Color(0xFFB8860B).withOpacity(0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      '${node.childCount}',
                      style: const TextStyle(
                        fontSize: 11,
                        color: Color(0xFFB8860B),
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),

        // Expanded subcategories
        AnimatedCrossFade(
          duration: const Duration(milliseconds: 200),
          crossFadeState:
              isExpanded ? CrossFadeState.showSecond : CrossFadeState.showFirst,
          firstChild: const SizedBox.shrink(),
          secondChild: visibleChildren.isNotEmpty
              ? Padding(
                  padding:
                      const EdgeInsets.only(left: 56, right: 16, bottom: 8),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // "View all in {Category}" row
                      InkWell(
                        onTap: navigateToCategory,
                        borderRadius: BorderRadius.circular(6),
                        child: Container(
                          constraints: const BoxConstraints(minHeight: 36),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 6),
                          child: Row(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              Icon(
                                Icons.grid_view_rounded,
                                size: 14,
                                color: Theme.of(context).primaryColor,
                              ),
                              const SizedBox(width: 6),
                              Flexible(
                                child: Text(
                                  'View all in ${node.name}',
                                  maxLines: 1,
                                  overflow: TextOverflow.ellipsis,
                                  style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w500,
                                    color: Theme.of(context).primaryColor,
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      ),
                      const SizedBox(height: 6),

                      // Subcategory chips
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: visibleChildren.map((sub) {
                          return InkWell(
                            onTap: () => navigateToSubcategory(sub),
                            borderRadius: BorderRadius.circular(6),
                            child: Container(
                              constraints: const BoxConstraints(minHeight: 32),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: Colors.grey[100],
                                borderRadius: BorderRadius.circular(6),
                                border: Border.all(color: Colors.grey[300]!),
                              ),
                              child: Text(
                                sub.name,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: Colors.grey[700],
                                  fontWeight: FontWeight.w400,
                                ),
                              ),
                            ),
                          );
                        }).toList(),
                      ),
                    ],
                  ),
                )
              : const SizedBox.shrink(),
        ),
      ],
    );
  }

  void _navigateToCategory(dynamic category) {
    Navigator.pop(context); // closes drawer first
    Navigator.pushNamed(
      context,
      '/category-landing',
      arguments: {'categoryId': category.id.toString()},
    );
  }

  Widget _buildModernFooter() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 10,
            offset: const Offset(0, -5),
          ),
        ],
      ),
      child: Column(
        children: [
          Text(
            '© 2025 Solo. All rights reserved.',
            style: TextStyle(
              fontSize: 10,
              color: Colors.grey[500],
            ),
          ),
        ],
      ),
    );
  }
}
