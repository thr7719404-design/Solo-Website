import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/catalog_provider.dart';
import '../../providers/cart_provider.dart';
import '../../providers/favorites_provider.dart';
import '../../app/theme/tokens.dart';
import '../../app/routing/route_observer.dart';
import '../../models/category.dart';
import '../../models/category_tree.dart';
import 'nav_models.dart';
import 'drawer_header.dart';
import 'drawer_quick_actions.dart';
import 'drawer_section.dart';
import 'drawer_item_tile.dart';
import 'drawer_footer.dart';
import '../../screens/category_screen.dart';

class UnifiedAppDrawer extends StatefulWidget {
  const UnifiedAppDrawer({super.key});

  @override
  State<UnifiedAppDrawer> createState() => _UnifiedAppDrawerState();
}

class _UnifiedAppDrawerState extends State<UnifiedAppDrawer>
    with AppRouteAwareMixin {
  bool _categoriesExpanded = false;
  final Set<String> _expandedCategoryIds = {};
  String _categorySearchQuery = '';
  final TextEditingController _searchController = TextEditingController();

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  void onRouteChanged() {
    super.onRouteChanged();
    // Route changed, widget will rebuild with new currentRoute value
  }

  @override
  Widget build(BuildContext context) {
    return Drawer(
      width: AppTokens.drawerWidth,
      child: Column(
        children: [
          // Header with logo and user info
          const DrawerHeaderWidget(),

          // Quick actions row
          const DrawerQuickActions(),

          // Scrollable navigation sections
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                const SizedBox(height: AppTokens.spacing8),

                // MAIN Section
                _buildMainSection(),

                const SizedBox(height: AppTokens.spacing8),

                // SHOP Section
                _buildShopSection(),

                const SizedBox(height: AppTokens.spacing8),

                // ACCOUNT Section
                _buildAccountSection(),

                const SizedBox(height: AppTokens.spacing24),
              ],
            ),
          ),

          // Sticky footer with social links
          const DrawerFooter(),
        ],
      ),
    );
  }

  Widget _buildMainSection() {
    return DrawerSection(
      title: NavModel.mainSection.title,
      children: NavModel.mainSection.items.map((item) {
        return _buildNavItem(item);
      }).toList(),
    );
  }

  Widget _buildShopSection() {
    final shopItems = NavModel.shopSection.items;

    return DrawerSection(
      title: NavModel.shopSection.title,
      children: [
        // Categories with expansion
        _buildCategoriesSection(),

        // Other shop items
        ...shopItems
            .where((item) => item.id != 'categories')
            .map(_buildNavItem),
      ],
    );
  }

  Widget _buildAccountSection() {
    return DrawerSection(
      title: NavModel.accountSection.title,
      children: NavModel.accountSection.items.map((item) {
        // Add badge counts for favorites and cart
        if (item.id == 'favorites') {
          return Selector<FavoritesProvider, int>(
            selector: (_, provider) => provider.count,
            builder: (context, count, _) {
              return _buildNavItemWithBadge(item, count);
            },
          );
        } else if (item.id == 'my-cart') {
          return Selector<CartProvider, int>(
            selector: (_, provider) => provider.count,
            builder: (context, count, _) {
              return _buildNavItemWithBadge(item, count);
            },
          );
        }
        return _buildNavItem(item);
      }).toList(),
    );
  }

  Widget _buildCategoriesSection() {
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

    return AnimatedSize(
      duration: AppTokens.durationMedium,
      curve: Curves.easeInOut,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Categories header row
          DrawerItemTile(
            icon: Icons.category_outlined,
            title: 'Categories',
            isActive: false,
            onTap: () {
              setState(() {
                _categoriesExpanded = !_categoriesExpanded;
                if (!_categoriesExpanded) {
                  _categorySearchQuery = '';
                  _searchController.clear();
                }
              });
            },
            trailing: AnimatedRotation(
              turns: _categoriesExpanded ? 0.5 : 0,
              duration: AppTokens.durationMedium,
              child: Icon(
                Icons.expand_more,
                size: AppTokens.iconSizeMedium,
                color: Colors.grey[600],
              ),
            ),
          ),

          // Expanded content
          if (_categoriesExpanded) ...[
            // Search input
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: AppTokens.spacing16,
                vertical: AppTokens.spacing8,
              ),
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
                    hintStyle: TextStyle(color: Colors.grey[400], fontSize: 14),
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
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(AppTokens.radiusM),
                      borderSide: BorderSide.none,
                    ),
                    focusedBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(AppTokens.radiusM),
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
                padding: const EdgeInsets.all(AppTokens.spacing16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const SizedBox(
                      width: 16,
                      height: 16,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    ),
                    const SizedBox(width: AppTokens.spacing8),
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
                padding: const EdgeInsets.all(AppTokens.spacing16),
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
                padding: const EdgeInsets.all(AppTokens.spacing16),
                child: Center(
                  child: Text(
                    'No matching categories',
                    style: TextStyle(color: Colors.grey[500], fontSize: 14),
                  ),
                ),
              ),

            // Category list
            ...filteredCategories.map((node) => _buildCategoryNodeItem(
                  node,
                  highlightQuery: _categorySearchQuery,
                )),

            // View All Categories button
            if (categoryTree.isNotEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(
                  horizontal: AppTokens.spacing16,
                  vertical: AppTokens.spacing8,
                ),
                child: TextButton.icon(
                  onPressed: () {
                    Navigator.of(context).pop();
                    Navigator.of(context).pushNamed('/categories');
                  },
                  icon: Icon(
                    Icons.grid_view_outlined,
                    size: AppTokens.iconSizeSmall,
                  ),
                  label: const Text('View All Categories'),
                  style: TextButton.styleFrom(
                    foregroundColor: Theme.of(context).primaryColor,
                  ),
                ),
              ),
          ],
        ],
      ),
    );
  }

  /// Build a parent category item from CategoryNode
  Widget _buildCategoryNodeItem(CategoryNode node,
      {String highlightQuery = ''}) {
    final isActive = currentRoute == '/category/${node.id}';
    final isExpanded = _expandedCategoryIds.contains(node.id);
    final query = highlightQuery.toLowerCase();

    // Filter children based on search query
    List<SubcategoryNode> visibleChildren = node.children;
    if (query.isNotEmpty) {
      // If parent matches, show all children; otherwise show only matching children
      final parentMatches = node.name.toLowerCase().contains(query);
      if (!parentMatches) {
        visibleChildren = node.children
            .where((sub) => sub.name.toLowerCase().contains(query))
            .toList();
      }
    }

    // Convert CategoryNode to Category for navigation
    Category nodeToCategory(CategoryNode n) => Category(
          id: n.id,
          name: n.name,
          slug: n.slug,
          icon: n.icon ?? '',
          imageUrl: n.imageUrl ?? '',
          productCount: n.productCount ?? 0,
        );

    void navigateToCategory() {
      Navigator.pop(context); // closes drawer first
      Navigator.pushNamed(
        context,
        '/category-landing',
        arguments: {'categoryId': node.id.toString()},
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Parent category row
        Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: navigateToCategory,
            child: Container(
              constraints: const BoxConstraints(minHeight: 48),
              margin: const EdgeInsets.symmetric(
                horizontal: AppTokens.spacing12,
                vertical: AppTokens.spacing2,
              ),
              padding: const EdgeInsets.symmetric(
                horizontal: AppTokens.spacing12,
                vertical: AppTokens.spacing8,
              ),
              decoration: BoxDecoration(
                color: isActive
                    ? Theme.of(context).primaryColor.withOpacity(0.1)
                    : null,
                borderRadius: BorderRadius.circular(AppTokens.radiusM),
              ),
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
                          duration: AppTokens.durationMedium,
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

                  const SizedBox(width: AppTokens.spacing8),

                  // Category name
                  Expanded(
                    child: Text(
                      node.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight:
                            isActive ? FontWeight.w600 : FontWeight.w500,
                        color: isActive
                            ? Theme.of(context).primaryColor
                            : Colors.grey[800],
                      ),
                    ),
                  ),

                  // Count badge
                  if (node.hasChildren)
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: isActive
                            ? Theme.of(context).primaryColor.withOpacity(0.15)
                            : Colors.grey[200],
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        '${node.childCount}',
                        style: TextStyle(
                          fontSize: 11,
                          color: isActive
                              ? Theme.of(context).primaryColor
                              : Colors.grey[600],
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                ],
              ),
            ),
          ),
        ),

        // Expanded subcategories
        AnimatedCrossFade(
          duration: AppTokens.durationMedium,
          crossFadeState:
              isExpanded ? CrossFadeState.showSecond : CrossFadeState.showFirst,
          firstChild: const SizedBox.shrink(),
          secondChild: visibleChildren.isNotEmpty
              ? Padding(
                  padding: const EdgeInsets.only(
                    left: AppTokens.spacing12 + 32 + AppTokens.spacing8,
                    right: AppTokens.spacing12,
                    bottom: AppTokens.spacing8,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // "View all in {Category}" row
                      InkWell(
                        onTap: navigateToCategory,
                        borderRadius: BorderRadius.circular(AppTokens.radiusS),
                        child: Container(
                          constraints: const BoxConstraints(minHeight: 36),
                          padding: const EdgeInsets.symmetric(
                            horizontal: AppTokens.spacing8,
                            vertical: AppTokens.spacing6,
                          ),
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
                      const SizedBox(height: AppTokens.spacing6),

                      // Subcategory chips
                      Wrap(
                        spacing: 6,
                        runSpacing: 6,
                        children: visibleChildren.map((sub) {
                          final subIsActive =
                              currentRoute == '/subcategory/${sub.id}';
                          return InkWell(
                            onTap: () {
                              Navigator.pop(context);
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  settings: RouteSettings(
                                      name: '/subcategory/${sub.id}'),
                                  builder: (context) => CategoryScreen(
                                    category: nodeToCategory(node),
                                  ),
                                ),
                              );
                            },
                            borderRadius:
                                BorderRadius.circular(AppTokens.radiusS),
                            child: Container(
                              constraints: const BoxConstraints(minHeight: 32),
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 10, vertical: 6),
                              decoration: BoxDecoration(
                                color: subIsActive
                                    ? Theme.of(context)
                                        .primaryColor
                                        .withOpacity(0.15)
                                    : Colors.grey[100],
                                borderRadius:
                                    BorderRadius.circular(AppTokens.radiusS),
                                border: Border.all(
                                  color: subIsActive
                                      ? Theme.of(context)
                                          .primaryColor
                                          .withOpacity(0.3)
                                      : Colors.grey[300]!,
                                ),
                              ),
                              child: Text(
                                sub.name,
                                style: TextStyle(
                                  fontSize: 12,
                                  color: subIsActive
                                      ? Theme.of(context).primaryColor
                                      : Colors.grey[700],
                                  fontWeight: subIsActive
                                      ? FontWeight.w600
                                      : FontWeight.w400,
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

  Widget _buildNavItem(NavItem item) {
    final isActive = currentRoute == item.route;

    return DrawerItemTile(
      icon: item.icon,
      title: item.title,
      isActive: isActive,
      onTap: () => _handleNavigation(item),
    );
  }

  Widget _buildNavItemWithBadge(NavItem item, int badge) {
    final isActive = currentRoute == item.route;

    return DrawerItemTile(
      icon: item.icon,
      title: item.title,
      isActive: isActive,
      badge: badge,
      onTap: () => _handleNavigation(item),
    );
  }

  void _handleNavigation(NavItem item) {
    if (item.route != null) {
      Navigator.pop(context);
      if (item.route == '/') {
        Navigator.of(context).pushNamedAndRemoveUntil('/', (route) => false);
      } else {
        Navigator.of(context).pushNamed(item.route!);
      }
    }
  }
}
