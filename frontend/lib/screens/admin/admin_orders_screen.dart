import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../layouts/admin_layout.dart';
import '../../guards/admin_route_guard.dart';
import '../../services/api_service.dart';
import 'dart:async';

/// Admin Orders Screen - Lists all orders from database with auth
class AdminOrdersScreen extends StatefulWidget {
  const AdminOrdersScreen({super.key});

  @override
  State<AdminOrdersScreen> createState() => _AdminOrdersScreenState();
}

class _AdminOrdersScreenState extends State<AdminOrdersScreen> {
  bool _isLoading = true;
  List<AdminOrderDto> _orders = [];
  int _totalOrders = 0;
  int _totalPages = 1;
  String? _error;
  bool _isUnauthorized = false;
  int _currentPage = 1;
  final int _pageSize = 20;
  String _searchQuery = '';
  String? _statusFilter;
  final TextEditingController _searchController = TextEditingController();
  Timer? _debounceTimer;

  final List<String> _orderStatuses = [
    'PENDING',
    'PAYMENT_PENDING',
    'PAID',
    'PROCESSING',
    'CONFIRMED',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
  ];

  String? _updatingOrderId;

  @override
  void initState() {
    super.initState();
    _loadOrders();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _debounceTimer?.cancel();
    super.dispose();
  }

  void _onSearchChanged(String value) {
    _debounceTimer?.cancel();
    _debounceTimer = Timer(const Duration(milliseconds: 500), () {
      if (_searchQuery != value) {
        setState(() {
          _searchQuery = value;
          _currentPage = 1;
        });
        _loadOrders();
      }
    });
  }

  Future<void> _loadOrders() async {
    setState(() {
      _isLoading = true;
      _error = null;
      _isUnauthorized = false;
    });

    try {
      final data = await ApiService.admin.getOrders(
        page: _currentPage,
        limit: _pageSize,
        search: _searchQuery.isNotEmpty ? _searchQuery : null,
        status: _statusFilter,
      );

      final List<dynamic> ordersJson = data['data'] ?? [];
      final meta = data['meta'] as Map<String, dynamic>? ?? {};

      setState(() {
        _orders = ordersJson
            .map((e) => AdminOrderDto.fromJson(e as Map<String, dynamic>))
            .toList();
        _totalOrders = meta['total'] ?? ordersJson.length;
        _totalPages = meta['totalPages'] ?? 1;
        _isLoading = false;
      });
    } catch (e) {
      final errorMessage = e.toString();

      // Check if it's an auth error
      if (errorMessage.contains('401') ||
          errorMessage.contains('Unauthorized') ||
          errorMessage.contains('Authentication required')) {
        setState(() {
          _isUnauthorized = true;
          _error = 'Session expired. Please sign in again.';
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = errorMessage;
          _isLoading = false;
        });
      }
    }
  }

  void _goToPage(int page) {
    if (page >= 1 && page <= _totalPages) {
      setState(() => _currentPage = page);
      _loadOrders();
    }
  }

  void _navigateToLogin() {
    Navigator.of(context).pushReplacementNamed('/admin/login');
  }

  void _viewOrderDetails(AdminOrderDto order) {
    Navigator.of(context).pushNamed(
      '/admin/orders/details',
      arguments: {'orderId': order.id},
    );
  }

  Future<void> _quickUpdateStatus(AdminOrderDto order, String newStatus) async {
    setState(() => _updatingOrderId = order.id);
    try {
      await ApiService.admin.updateOrderStatus(
        order.id,
        status: newStatus,
      );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Order ${order.orderNumber} updated to $newStatus'),
          backgroundColor: const Color(0xFF10B981),
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          margin: const EdgeInsets.all(16),
        ));
      }
      await _loadOrders(); // Refresh list
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text('Failed to update status: $e'),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
          shape:
              RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
          margin: const EdgeInsets.all(16),
        ));
      }
    } finally {
      if (mounted) setState(() => _updatingOrderId = null);
    }
  }

  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return Colors.orange;
      case 'PAYMENT_PENDING':
        return Colors.amber;
      case 'PAID':
        return Colors.teal;
      case 'PROCESSING':
        return Colors.blue;
      case 'CONFIRMED':
        return Colors.teal;
      case 'SHIPPED':
        return Colors.indigo;
      case 'DELIVERED':
        return Colors.green;
      case 'CANCELLED':
        return Colors.red;
      case 'REFUNDED':
        return Colors.purple;
      default:
        return Colors.grey;
    }
  }

  @override
  Widget build(BuildContext context) {
    return AdminRouteGuard(
      child: AdminLayout(
        currentRoute: '/admin/orders',
        child: Column(
          children: [
            _buildHeader(context),
            _buildFilters(context),
            Expanded(child: _buildBody(context)),
            if (!_isLoading && _orders.isNotEmpty) _buildPagination(),
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
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Text(
                'Orders',
                style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 4),
              Text(
                '$_totalOrders total orders',
                style: TextStyle(color: Colors.grey[600], fontSize: 14),
              ),
            ],
          ),
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadOrders,
            tooltip: 'Refresh',
          ),
        ],
      ),
    );
  }

  Widget _buildFilters(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
      color: Colors.grey[50],
      child: Row(
        children: [
          // Search field
          Expanded(
            flex: 2,
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search by order #, customer name, or email...',
                prefixIcon: const Icon(Icons.search),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: Colors.grey[300]!),
                ),
                filled: true,
                fillColor: Colors.white,
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
              onChanged: _onSearchChanged,
            ),
          ),
          const SizedBox(width: 16),
          // Status filter
          Expanded(
            child: DropdownButtonFormField<String>(
              initialValue: _statusFilter,
              decoration: InputDecoration(
                hintText: 'All Statuses',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(8),
                  borderSide: BorderSide(color: Colors.grey[300]!),
                ),
                filled: true,
                fillColor: Colors.white,
                contentPadding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              ),
              items: [
                const DropdownMenuItem<String>(
                  value: null,
                  child: Text('All Statuses'),
                ),
                ..._orderStatuses.map((status) => DropdownMenuItem(
                      value: status,
                      child: Text(status),
                    )),
              ],
              onChanged: (value) {
                setState(() {
                  _statusFilter = value;
                  _currentPage = 1;
                });
                _loadOrders();
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBody(BuildContext context) {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_isUnauthorized) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.lock_outline, size: 80, color: Colors.orange[300]),
            const SizedBox(height: 16),
            const Text(
              'Session Expired',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              _error ?? 'Please sign in again to view orders.',
              style: TextStyle(color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            ElevatedButton.icon(
              onPressed: _navigateToLogin,
              icon: const Icon(Icons.login),
              label: const Text('Sign In'),
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.black,
                foregroundColor: Colors.white,
                padding:
                    const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              ),
            ),
          ],
        ),
      );
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.red[300]),
            const SizedBox(height: 16),
            const Text('Error loading orders'),
            const SizedBox(height: 8),
            Text(
              _error!,
              style: TextStyle(color: Colors.grey[600], fontSize: 12),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadOrders,
              child: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_orders.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.shopping_bag_outlined,
                size: 80, color: Colors.grey[400]),
            const SizedBox(height: 16),
            const Text(
              'No Orders Found',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 8),
            Text(
              _searchQuery.isNotEmpty || _statusFilter != null
                  ? 'Try adjusting your search or filters'
                  : 'Orders will appear here when customers place them',
              style: TextStyle(color: Colors.grey[600]),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadOrders,
      child: ListView.builder(
        padding: const EdgeInsets.all(16),
        itemCount: _orders.length,
        itemBuilder: (context, index) {
          final order = _orders[index];
          return _buildOrderCard(order);
        },
      ),
    );
  }

  Widget _buildOrderCard(AdminOrderDto order) {
    final dateFormat = DateFormat('MMM d, yyyy h:mm a');
    final currencyFormat =
        NumberFormat.currency(symbol: 'AED ', decimalDigits: 2);
    final statusColor = _getStatusColor(order.status);
    final isUpdating = _updatingOrderId == order.id;

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(12),
        side: BorderSide(color: Colors.grey[200]!),
      ),
      child: InkWell(
        onTap: () => _viewOrderDetails(order),
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header row: Order number + Status
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    order.orderNumber,
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  // Status badge + quick update
                  Row(mainAxisSize: MainAxisSize.min, children: [
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        color: statusColor.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Text(
                        order.status,
                        style: TextStyle(
                          color: statusColor,
                          fontWeight: FontWeight.w600,
                          fontSize: 12,
                        ),
                      ),
                    ),
                    const SizedBox(width: 4),
                    if (isUpdating)
                      const SizedBox(
                          width: 24,
                          height: 24,
                          child: CircularProgressIndicator(strokeWidth: 2))
                    else
                      PopupMenuButton<String>(
                        tooltip: 'Quick update status',
                        icon: Icon(Icons.swap_vert_rounded,
                            size: 18, color: Colors.grey[400]),
                        splashRadius: 18,
                        shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(12)),
                        onSelected: (newStatus) =>
                            _quickUpdateStatus(order, newStatus),
                        itemBuilder: (_) => _orderStatuses
                            .where((s) => s != order.status)
                            .map((s) => PopupMenuItem(
                                  value: s,
                                  child: Row(children: [
                                    Container(
                                      width: 8,
                                      height: 8,
                                      decoration: BoxDecoration(
                                          shape: BoxShape.circle,
                                          color: _getStatusColor(s)),
                                    ),
                                    const SizedBox(width: 10),
                                    Text(s,
                                        style: const TextStyle(fontSize: 13)),
                                  ]),
                                ))
                            .toList(),
                      ),
                  ]),
                ],
              ),
              const SizedBox(height: 12),
              // Customer info
              Row(
                children: [
                  Icon(Icons.person_outline, size: 18, color: Colors.grey[500]),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      order.customerName,
                      style: const TextStyle(fontWeight: FontWeight.w500),
                    ),
                  ),
                ],
              ),
              if (order.customerEmail != null) ...[
                const SizedBox(height: 4),
                Row(
                  children: [
                    Icon(Icons.email_outlined,
                        size: 18, color: Colors.grey[500]),
                    const SizedBox(width: 8),
                    Text(
                      order.customerEmail!,
                      style: TextStyle(color: Colors.grey[600], fontSize: 13),
                    ),
                  ],
                ),
              ],
              const SizedBox(height: 12),
              // Footer: Items, Total, Date
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      Icon(Icons.inventory_2_outlined,
                          size: 16, color: Colors.grey[500]),
                      const SizedBox(width: 4),
                      Text(
                        '${order.itemCount} item${order.itemCount != 1 ? 's' : ''}',
                        style: TextStyle(color: Colors.grey[600], fontSize: 13),
                      ),
                      const SizedBox(width: 16),
                      Icon(Icons.calendar_today_outlined,
                          size: 16, color: Colors.grey[500]),
                      const SizedBox(width: 4),
                      Text(
                        dateFormat.format(order.createdAt),
                        style: TextStyle(color: Colors.grey[600], fontSize: 13),
                      ),
                    ],
                  ),
                  Text(
                    currencyFormat.format(order.total),
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPagination() {
    return Container(
      padding: const EdgeInsets.all(16),
      color: Colors.grey[50],
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          IconButton(
            icon: const Icon(Icons.chevron_left),
            onPressed:
                _currentPage > 1 ? () => _goToPage(_currentPage - 1) : null,
          ),
          const SizedBox(width: 8),
          Text(
            'Page $_currentPage of $_totalPages',
            style: const TextStyle(fontWeight: FontWeight.w500),
          ),
          const SizedBox(width: 8),
          IconButton(
            icon: const Icon(Icons.chevron_right),
            onPressed: _currentPage < _totalPages
                ? () => _goToPage(_currentPage + 1)
                : null,
          ),
        ],
      ),
    );
  }
}

/// Admin Order DTO for list view
class AdminOrderDto {
  final String id;
  final String orderNumber;
  final String customerName;
  final String? customerEmail;
  final int itemCount;
  final double total;
  final String status;
  final String? paymentStatus;
  final DateTime createdAt;

  AdminOrderDto({
    required this.id,
    required this.orderNumber,
    required this.customerName,
    this.customerEmail,
    required this.itemCount,
    required this.total,
    required this.status,
    this.paymentStatus,
    required this.createdAt,
  });

  factory AdminOrderDto.fromJson(Map<String, dynamic> json) {
    // Handle customer as nested object from backend
    final customer = json['customer'] as Map<String, dynamic>?;
    final customerName = customer?['name'] as String? ??
        json['customerName'] as String? ??
        'Unknown Customer';
    final customerEmail =
        customer?['email'] as String? ?? json['customerEmail'] as String?;

    // Handle itemCount - backend may return as int or string
    int itemCount = 0;
    if (json['itemCount'] != null) {
      itemCount = json['itemCount'] is int
          ? json['itemCount'] as int
          : int.tryParse(json['itemCount'].toString()) ?? 0;
    }

    return AdminOrderDto(
      id: json['id'] as String,
      orderNumber: json['orderNumber'] as String,
      customerName: customerName,
      customerEmail: customerEmail,
      itemCount: itemCount,
      total: double.tryParse(json['total'].toString()) ?? 0.0,
      status: json['status'] as String? ?? 'PENDING',
      paymentStatus: json['paymentStatus'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : DateTime.now(),
    );
  }
}
