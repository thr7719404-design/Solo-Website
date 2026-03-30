import 'package:flutter/material.dart';
import 'brand_logo.dart';
import 'package:provider/provider.dart';
import '../providers/catalog_provider.dart';
import '../screens/category_screen.dart';
import '../screens/signup_screen.dart';

class AppDrawer extends StatefulWidget {
  const AppDrawer({super.key});

  @override
  State<AppDrawer> createState() => _AppDrawerState();
}

class _AppDrawerState extends State<AppDrawer> {
  bool _categoriesExpanded = false;
  bool _topSellersExpanded = false;
  bool _newArrivalsExpanded = false;
  bool _specialOffersExpanded = false;

  @override
  Widget build(BuildContext context) {
    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration: const BoxDecoration(
              color: Color(0xFF1A1A1A),
            ),
            child: BrandLogo(
              height: 80,
              center: true,
              onTap: () {
                Navigator.of(context).pop();
                Navigator.of(context).popUntil((route) => route.isFirst);
              },
            ),
          ),
          ListTile(
            leading: const Icon(Icons.home_outlined),
            title: const Text('Home'),
            onTap: () {
              Navigator.pop(context);
              // Navigate to home if not already there
              if (ModalRoute.of(context)?.settings.name != '/') {
                Navigator.pushNamedAndRemoveUntil(
                    context, '/', (route) => false);
              }
            },
          ),
          ExpansionTile(
            leading: const Icon(Icons.category_outlined),
            title: const Text('Categories'),
            initiallyExpanded: _categoriesExpanded,
            onExpansionChanged: (expanded) {
              setState(() {
                _categoriesExpanded = expanded;
              });
            },
            children:
                context.watch<CatalogProvider>().categories.map((category) {
              return ListTile(
                contentPadding: const EdgeInsets.only(left: 72, right: 16),
                leading: Text(
                  category.icon,
                  style: const TextStyle(fontSize: 20),
                ),
                title: Text(category.name),
                trailing: Text(
                  '${category.productCount}',
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
                onTap: () {
                  Navigator.pop(context);
                  Navigator.push(
                    context,
                    MaterialPageRoute(
                      builder: (context) => CategoryScreen(category: category),
                    ),
                  );
                },
              );
            }).toList(),
          ),
          ExpansionTile(
            leading: const Icon(Icons.stars_outlined),
            title: const Text('Top Sellers'),
            initiallyExpanded: _topSellersExpanded,
            onExpansionChanged: (expanded) {
              setState(() {
                _topSellersExpanded = expanded;
              });
            },
            children: [
              ListTile(
                contentPadding: const EdgeInsets.only(left: 72, right: 16),
                title: const Text('Best Rated'),
                onTap: () {
                  Navigator.pop(context);
                },
              ),
              ListTile(
                contentPadding: const EdgeInsets.only(left: 72, right: 16),
                title: const Text('Most Popular'),
                onTap: () {
                  Navigator.pop(context);
                },
              ),
            ],
          ),
          ExpansionTile(
            leading: const Icon(Icons.new_releases_outlined),
            title: const Text('New Arrivals'),
            initiallyExpanded: _newArrivalsExpanded,
            onExpansionChanged: (expanded) {
              setState(() {
                _newArrivalsExpanded = expanded;
              });
            },
            children: [
              ListTile(
                contentPadding: const EdgeInsets.only(left: 72, right: 16),
                title: const Text('This Week'),
                onTap: () {
                  Navigator.pop(context);
                },
              ),
              ListTile(
                contentPadding: const EdgeInsets.only(left: 72, right: 16),
                title: const Text('This Month'),
                onTap: () {
                  Navigator.pop(context);
                },
              ),
            ],
          ),
          ExpansionTile(
            leading: const Icon(Icons.local_offer_outlined),
            title: const Text('Special Offers'),
            initiallyExpanded: _specialOffersExpanded,
            onExpansionChanged: (expanded) {
              setState(() {
                _specialOffersExpanded = expanded;
              });
            },
            children: [
              ListTile(
                contentPadding: const EdgeInsets.only(left: 72, right: 16),
                title: const Text('Clearance'),
                onTap: () {
                  Navigator.pop(context);
                },
              ),
              ListTile(
                contentPadding: const EdgeInsets.only(left: 72, right: 16),
                title: const Text('Bundle Deals'),
                onTap: () {
                  Navigator.pop(context);
                },
              ),
            ],
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.favorite_border),
            title: const Text('My Favorites'),
            onTap: () {
              Navigator.pop(context);
            },
          ),
          ListTile(
            leading: const Icon(Icons.history),
            title: const Text('Order History'),
            onTap: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, '/my-account/orders');
            },
          ),
          ListTile(
            leading: const Icon(Icons.location_on_outlined),
            title: const Text('My Addresses'),
            onTap: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, '/my-account/addresses');
            },
          ),
          ListTile(
            leading: const Icon(Icons.person_outline),
            title: const Text('My Account'),
            onTap: () {
              Navigator.pop(context);
              Navigator.pushNamed(context, '/my-account');
            },
          ),
          ListTile(
            leading: const Icon(Icons.person_add_outlined),
            title: const Text('Create Account'),
            onTap: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (context) => const SignUpScreen(),
                ),
              );
            },
          ),
          const Divider(),
          ListTile(
            leading: const Icon(Icons.help_outline),
            title: const Text('Help & Support'),
            onTap: () {
              Navigator.pop(context);
            },
          ),
          ListTile(
            leading: const Icon(Icons.settings_outlined),
            title: const Text('Settings'),
            onTap: () {
              Navigator.pop(context);
            },
          ),
        ],
      ),
    );
  }
}
