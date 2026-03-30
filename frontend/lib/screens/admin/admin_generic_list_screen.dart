import 'package:flutter/material.dart';
import '../../layouts/admin_layout.dart';
import '../../guards/admin_route_guard.dart';
import '../../services/api_service.dart';
import '../../models/dto/product_dto.dart';

/// Generic admin list screen for Categories/Brands/Orders/Customers
class AdminGenericListScreen extends StatefulWidget {
  final String title;
  final String route;
  final IconData icon;
  final String emptyMessage;

  const AdminGenericListScreen({
    super.key,
    required this.title,
    required this.route,
    required this.icon,
    required this.emptyMessage,
  });

  @override
  State<AdminGenericListScreen> createState() => _AdminGenericListScreenState();
}

class _AdminGenericListScreenState extends State<AdminGenericListScreen> {
  List<dynamic> _items = [];
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });

    try {
      List<dynamic> items = [];

      if (widget.route == '/admin/categories') {
        items = await ApiService.categories.getCategories();
      } else if (widget.route == '/admin/brands') {
        items = await ApiService.brands.getBrands();
      }

      setState(() {
        _items = items;
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AdminRouteGuard(
      child: AdminLayout(
        currentRoute: widget.route,
        child: Column(
          children: [
            _buildHeader(context),
            Expanded(child: _buildBody(context)),
          ],
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(24),
      color: Colors.white,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            widget.title,
            style: const TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
          ),
          Row(
            children: [
              IconButton(
                icon: const Icon(Icons.refresh),
                onPressed: _loadData,
                tooltip: 'Refresh',
              ),
              const SizedBox(width: 8),
              ElevatedButton.icon(
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                        content:
                            Text('${widget.title} management coming soon')),
                  );
                },
                icon: const Icon(Icons.add),
                label: Text(
                    'New ${widget.title.substring(0, widget.title.length - 1)}'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.black,
                  foregroundColor: Colors.white,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildBody(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
            const SizedBox(height: 16),
            Text('Error loading ${widget.title.toLowerCase()}'),
            const SizedBox(height: 8),
            Text(_error!,
                style: TextStyle(color: Colors.grey[600], fontSize: 12)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadData,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_items.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(widget.icon, size: 80, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(
              widget.title,
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              widget.emptyMessage,
              style: TextStyle(color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadData,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _items.length,
        itemBuilder: (context, index) {
          final item = _items[index];
          return _buildListItem(item);
        },
      ),
    );
  }

  Widget _buildListItem(dynamic item) {
    if (item is CategoryDto) {
      return Card(
        margin: const EdgeInsets.only(bottom: 8),
        child: ListTile(
          leading: CircleAvatar(
            backgroundColor:
                item.isActive ? Colors.green[100] : Colors.grey[200],
            child: Icon(
              Icons.category,
              color: item.isActive ? Colors.green : Colors.grey,
            ),
          ),
          title: Text(item.name,
              style: const TextStyle(fontWeight: FontWeight.w600)),
          subtitle: Text(
            '${item.productCount ?? 0} products • Display Order: ${item.displayOrder ?? 0}',
          ),
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (!item.isActive)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.orange[100],
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text('Inactive',
                      style:
                          TextStyle(color: Colors.orange[800], fontSize: 12)),
                ),
              const SizedBox(width: 8),
              IconButton(
                icon: const Icon(Icons.edit, size: 20),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Edit category coming soon')),
                  );
                },
              ),
            ],
          ),
        ),
      );
    } else if (item is BrandDto) {
      return Card(
        margin: const EdgeInsets.only(bottom: 8),
        child: ListTile(
          leading: CircleAvatar(
            backgroundColor:
                item.isActive ? Colors.blue[100] : Colors.grey[200],
            child: Icon(
              Icons.business,
              color: item.isActive ? Colors.blue : Colors.grey,
            ),
          ),
          title: Text(item.name,
              style: const TextStyle(fontWeight: FontWeight.w600)),
          subtitle: Text(
            '${item.productCount ?? 0} products${item.website != null ? ' • ${item.website}' : ''}',
          ),
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (!item.isActive)
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: Colors.orange[100],
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Text('Inactive',
                      style:
                          TextStyle(color: Colors.orange[800], fontSize: 12)),
                ),
              const SizedBox(width: 8),
              IconButton(
                icon: const Icon(Icons.edit, size: 20),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Edit brand coming soon')),
                  );
                },
              ),
            ],
          ),
        ),
      );
    }

    return const SizedBox();
  }
}
