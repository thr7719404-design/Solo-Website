import 'package:flutter/material.dart';
import 'dart:async';
import '../../layouts/admin_layout.dart';
import '../../guards/admin_route_guard.dart';
import '../../services/api_service.dart';
import '../../models/dto/admin_dto.dart';

/// Admin dashboard with real-time stats, tables, and quick actions
class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen>
    with SingleTickerProviderStateMixin {
  DashboardStatsDto? _stats;
  bool _isLoading = true;
  String? _error;
  late AnimationController _animController;
  Timer? _clockTimer;
  DateTime _currentTime = DateTime.now();

  @override
  void initState() {
    super.initState();
    _animController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1500),
    );
    _clockTimer = Timer.periodic(const Duration(seconds: 1), (timer) {
      if (mounted) {
        setState(() => _currentTime = DateTime.now());
      }
    });
    _loadStats();
  }

  @override
  void dispose() {
    _animController.dispose();
    _clockTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadStats() async {
    try {
      setState(() {
        _isLoading = true;
        _error = null;
      });

      final stats = await ApiService.admin.getDashboardStats();

      setState(() {
        _stats = stats;
        _isLoading = false;
      });

      _animController.forward(from: 0);
    } catch (error) {
      setState(() {
        _error = error.toString();
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return AdminRouteGuard(
      child: AdminLayout(
        currentRoute: '/admin',
        child: _isLoading
            ? const Center(
                child: CircularProgressIndicator(
                  strokeWidth: 2,
                  color: Colors.black,
                ),
              )
            : _error != null
                ? _buildError()
                : _buildDashboard(),
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.error_outline, size: 48, color: Colors.red),
          const SizedBox(height: 16),
          Text('Failed to load dashboard: $_error'),
          const SizedBox(height: 16),
          ElevatedButton(
            onPressed: _loadStats,
            style: ElevatedButton.styleFrom(
              backgroundColor: Colors.black,
              foregroundColor: Colors.white,
            ),
            child: const Text('Retry'),
          ),
        ],
      ),
    );
  }

  Widget _buildDashboard() {
    return RefreshIndicator(
      onRefresh: _loadStats,
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildHeader(),
            const SizedBox(height: 24),
            _buildStatsCards(),
            const SizedBox(height: 32),
            _buildRevenueStats(),
            const SizedBox(height: 32),
            _buildAnalyticsRow(),
            const SizedBox(height: 32),
            _buildTablesSection(),
            const SizedBox(height: 32),
            _buildQuickActions(),
          ],
        ),
      ),
    );
  }

  /// New analytics row with catalog summary and order status breakdown
  Widget _buildAnalyticsRow() {
    final screenWidth = MediaQuery.of(context).size.width;
    final isWide = screenWidth >= 900;

    if (isWide) {
      return Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(flex: 2, child: _buildCatalogSummary()),
          const SizedBox(width: 16),
          Expanded(flex: 1, child: _buildOrderStatusBreakdown()),
          const SizedBox(width: 16),
          Expanded(flex: 1, child: _buildRecentActivity()),
        ],
      );
    } else {
      return Column(
        children: [
          _buildCatalogSummary(),
          const SizedBox(height: 16),
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: _buildOrderStatusBreakdown()),
              const SizedBox(width: 16),
              Expanded(child: _buildRecentActivity()),
            ],
          ),
        ],
      );
    }
  }

  /// Catalog summary showing total categories, brands, products
  Widget _buildCatalogSummary() {
    final catalog = _stats!.catalogSummary;

    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.inventory_2, color: Colors.indigo),
                const SizedBox(width: 8),
                const Text(
                  'Catalog Summary',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            if (catalog == null)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Text('Catalog data not available'),
                ),
              )
            else
              Wrap(
                spacing: 24,
                runSpacing: 16,
                children: [
                  _buildCatalogMetric(
                    label: 'Categories',
                    value: catalog.totalCategories,
                    icon: Icons.category,
                    color: Colors.blue,
                    route: '/admin/categories',
                  ),
                  _buildCatalogMetric(
                    label: 'Brands',
                    value: catalog.totalBrands,
                    icon: Icons.branding_watermark,
                    color: Colors.purple,
                    route: '/admin/brands',
                  ),
                  _buildCatalogMetric(
                    label: 'Products',
                    value: catalog.totalProducts,
                    icon: Icons.shopping_bag,
                    color: Colors.orange,
                    route: '/admin/products',
                  ),
                  _buildCatalogMetric(
                    label: 'Active',
                    value: catalog.activeProducts,
                    icon: Icons.check_circle,
                    color: Colors.green,
                    route: '/admin/products',
                  ),
                  _buildCatalogMetric(
                    label: 'Featured',
                    value: catalog.featuredProducts,
                    icon: Icons.star,
                    color: Colors.amber,
                    route: '/admin/products',
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildCatalogMetric({
    required String label,
    required int value,
    required IconData icon,
    required Color color,
    required String route,
  }) {
    return InkWell(
      onTap: () => Navigator.pushNamed(context, route),
      borderRadius: BorderRadius.circular(8),
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: BoxDecoration(
          color: color.withOpacity(0.1),
          borderRadius: BorderRadius.circular(8),
          border: Border.all(color: color.withOpacity(0.3)),
        ),
        child: Column(
          children: [
            Icon(icon, color: color, size: 24),
            const SizedBox(height: 4),
            Text(
              '$value',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }

  /// Order status breakdown with visual bars
  Widget _buildOrderStatusBreakdown() {
    final ordersByStatus = _stats!.ordersByStatus;
    final totalOrders = ordersByStatus.fold<int>(0, (sum, s) => sum + s.count);

    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.pie_chart, color: Colors.deepPurple, size: 20),
                const SizedBox(width: 8),
                const Text(
                  'Order Status',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (ordersByStatus.isEmpty || totalOrders == 0)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Text('No orders yet'),
                ),
              )
            else
              ...ordersByStatus.map((status) {
                final percent =
                    totalOrders > 0 ? (status.count / totalOrders * 100) : 0.0;
                final color = _getStatusColor(status.status);

                return Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text(
                            status.status,
                            style: const TextStyle(fontSize: 12),
                          ),
                          Text(
                            '${status.count} (${percent.toStringAsFixed(0)}%)',
                            style: TextStyle(
                              fontSize: 12,
                              color: Colors.grey[600],
                              fontWeight: FontWeight.w500,
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 4),
                      LinearProgressIndicator(
                        value: percent / 100,
                        backgroundColor: Colors.grey[200],
                        valueColor: AlwaysStoppedAnimation<Color>(color),
                        minHeight: 6,
                        borderRadius: BorderRadius.circular(3),
                      ),
                    ],
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status.toUpperCase()) {
      case 'PENDING':
        return Colors.orange;
      case 'CONFIRMED':
        return Colors.blue;
      case 'PROCESSING':
        return Colors.cyan;
      case 'SHIPPED':
        return Colors.purple;
      case 'DELIVERED':
        return Colors.green;
      case 'CANCELLED':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  /// Recent activity feed
  Widget _buildRecentActivity() {
    final activities = _stats!.recentActivity ?? [];

    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.timeline, color: Colors.teal, size: 20),
                const SizedBox(width: 8),
                const Text(
                  'Recent Activity',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            if (activities.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(16),
                  child: Text('No recent activity'),
                ),
              )
            else
              ...activities
                  .take(5)
                  .map((activity) => _buildActivityItem(activity)),
          ],
        ),
      ),
    );
  }

  Widget _buildActivityItem(RecentActivityDto activity) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(6),
            decoration: BoxDecoration(
              color: activity.color.withOpacity(0.1),
              shape: BoxShape.circle,
            ),
            child: Icon(
              activity.icon,
              size: 14,
              color: activity.color,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  activity.title,
                  style: const TextStyle(
                    fontSize: 12,
                    fontWeight: FontWeight.w500,
                  ),
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                if (activity.subtitle != null)
                  Text(
                    activity.subtitle!,
                    style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey[500],
                    ),
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                Text(
                  _formatTimeAgo(activity.timestamp),
                  style: TextStyle(
                    fontSize: 10,
                    color: Colors.grey[400],
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _formatTimeAgo(DateTime timestamp) {
    final now = DateTime.now();
    final difference = now.difference(timestamp);

    if (difference.inMinutes < 1) {
      return 'Just now';
    } else if (difference.inMinutes < 60) {
      return '${difference.inMinutes}m ago';
    } else if (difference.inHours < 24) {
      return '${difference.inHours}h ago';
    } else if (difference.inDays < 7) {
      return '${difference.inDays}d ago';
    } else {
      return _formatDate(timestamp);
    }
  }

  Widget _buildHeader() {
    final timeStr =
        '${_currentTime.hour.toString().padLeft(2, '0')}:${_currentTime.minute.toString().padLeft(2, '0')}:${_currentTime.second.toString().padLeft(2, '0')}';
    final dateStr = _formatDate(_currentTime);

    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF1A1A2E), Color(0xFF16213E), Color(0xFF0F3460)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF0F3460).withOpacity(0.4),
            blurRadius: 20,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white.withOpacity(0.1),
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: const Icon(
                          Icons.dashboard_customize,
                          color: Colors.white,
                          size: 28,
                        ),
                      ),
                      const SizedBox(width: 16),
                      const Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'COMMAND CENTER',
                            style: TextStyle(
                              fontSize: 12,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFFE94560),
                              letterSpacing: 2,
                            ),
                          ),
                          SizedBox(height: 4),
                          Text(
                            'Insights Cockpit',
                            style: TextStyle(
                              fontSize: 28,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                              letterSpacing: 0.5,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Container(
                    padding:
                        const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    decoration: BoxDecoration(
                      color: Colors.white.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(8),
                      border: Border.all(color: Colors.white.withOpacity(0.2)),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: Color(0xFF00FF88),
                            shape: BoxShape.circle,
                            boxShadow: [
                              BoxShadow(
                                color: Color(0xFF00FF88),
                                blurRadius: 6,
                              ),
                            ],
                          ),
                        ),
                        const SizedBox(width: 8),
                        Text(
                          'LIVE',
                          style: TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                            color: Colors.white.withOpacity(0.9),
                            letterSpacing: 1.5,
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    timeStr,
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.w300,
                      color: Colors.white,
                      fontFamily: 'monospace',
                      letterSpacing: 2,
                    ),
                  ),
                  Text(
                    dateStr,
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.white.withOpacity(0.7),
                    ),
                  ),
                ],
              ),
            ],
          ),
          const SizedBox(height: 24),
          // Quick pulse metrics
          Row(
            children: [
              _buildPulseMetric(
                icon: Icons.flash_on,
                value: '${_stats?.ordersToday ?? 0}',
                label: 'Orders Today',
                color: const Color(0xFFFFD93D),
              ),
              const SizedBox(width: 24),
              _buildPulseMetric(
                icon: Icons.trending_up,
                value: '\$${(_stats?.revenueToday ?? 0).toStringAsFixed(0)}',
                label: 'Revenue Today',
                color: const Color(0xFF6BCB77),
              ),
              const SizedBox(width: 24),
              _buildPulseMetric(
                icon: Icons.people_alt,
                value: '+${_stats?.newCustomersToday ?? 0}',
                label: 'New Customers',
                color: const Color(0xFF4D96FF),
              ),
              const Spacer(),
              ElevatedButton.icon(
                onPressed: _loadStats,
                icon: const Icon(Icons.refresh, size: 18),
                label: const Text('Refresh'),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFFE94560),
                  foregroundColor: Colors.white,
                  padding:
                      const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(8),
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildPulseMetric({
    required IconData icon,
    required String value,
    required String label,
    required Color color,
  }) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: color.withOpacity(0.2),
            borderRadius: BorderRadius.circular(10),
          ),
          child: Icon(icon, color: color, size: 20),
        ),
        const SizedBox(width: 12),
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              value,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
                color: Colors.white,
              ),
            ),
            Text(
              label,
              style: TextStyle(
                fontSize: 11,
                color: Colors.white.withOpacity(0.6),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildStatsCards() {
    final screenWidth = MediaQuery.of(context).size.width;
    final crossAxisCount = screenWidth < 600
        ? 1
        : screenWidth < 900
            ? 2
            : 4;

    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: crossAxisCount,
      crossAxisSpacing: 16,
      mainAxisSpacing: 16,
      childAspectRatio: 1.5,
      children: [
        _buildStatCard(
          title: 'Orders Today',
          value: '${_stats!.ordersToday}',
          subtitle: '${_stats!.ordersThisWeek} this week',
          icon: Icons.shopping_cart,
          color: Colors.blue,
          onTap: () => Navigator.pushNamed(context, '/admin/orders'),
        ),
        _buildStatCard(
          title: 'Revenue Today',
          value: '\$${_stats!.revenueToday.toStringAsFixed(2)}',
          subtitle: '\$${_stats!.revenueThisWeek.toStringAsFixed(2)} this week',
          icon: Icons.attach_money,
          color: Colors.green,
          onTap: () {},
        ),
        _buildStatCard(
          title: 'Customers',
          value: '${_stats!.totalCustomers}',
          subtitle: '+${_stats!.newCustomersToday} today',
          icon: Icons.people,
          color: Colors.orange,
          onTap: () => Navigator.pushNamed(context, '/admin/customers'),
        ),
        _buildStatCard(
          title: 'Active Banners',
          value: '${_stats!.activeBanners}',
          subtitle: 'of ${_stats!.totalBanners} total',
          icon: Icons.image,
          color: Colors.purple,
          onTap: () => Navigator.pushNamed(context, '/admin/banners'),
        ),
      ],
    );
  }

  Widget _buildStatCard({
    required String title,
    required String value,
    required String subtitle,
    required IconData icon,
    required Color color,
    required VoidCallback onTap,
  }) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: BorderSide(color: Colors.grey.shade200),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            gradient: LinearGradient(
              colors: [
                Colors.white,
                color.withOpacity(0.03),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Container(
                      padding: const EdgeInsets.all(10),
                      decoration: BoxDecoration(
                        color: color.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Icon(icon, color: color, size: 24),
                    ),
                    Container(
                      padding: const EdgeInsets.symmetric(
                          horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: Colors.green.withOpacity(0.1),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: Row(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Icon(Icons.arrow_upward,
                              color: Colors.green, size: 12),
                          const SizedBox(width: 2),
                          Text(
                            '12%',
                            style: TextStyle(
                              fontSize: 11,
                              fontWeight: FontWeight.w600,
                              color: Colors.green.shade700,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
                const Spacer(),
                AnimatedBuilder(
                  animation: _animController,
                  builder: (context, child) {
                    return Text(
                      value,
                      style: const TextStyle(
                        fontSize: 32,
                        fontWeight: FontWeight.bold,
                        letterSpacing: -0.5,
                      ),
                    );
                  },
                ),
                const SizedBox(height: 4),
                Text(
                  title,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                    fontWeight: FontWeight.w500,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[400],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildRevenueStats() {
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(16),
        gradient: const LinearGradient(
          colors: [Color(0xFF667eea), Color(0xFF764ba2)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF667eea).withOpacity(0.3),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: const Icon(Icons.analytics,
                      color: Colors.white, size: 24),
                ),
                const SizedBox(width: 12),
                const Text(
                  'Revenue Intelligence',
                  style: TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.bold,
                    color: Colors.white,
                  ),
                ),
                const Spacer(),
                Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Colors.white.withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Row(
                    children: [
                      Icon(Icons.trending_up, color: Colors.white, size: 16),
                      SizedBox(width: 4),
                      Text(
                        '+23.5%',
                        style: TextStyle(
                          color: Colors.white,
                          fontWeight: FontWeight.w600,
                          fontSize: 13,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: 24),
            Row(
              children: [
                Expanded(
                  child: _buildRevenueItem(
                    'Today',
                    _stats!.revenueToday,
                    Icons.today,
                  ),
                ),
                Container(
                  width: 1,
                  height: 60,
                  color: Colors.white.withOpacity(0.3),
                ),
                Expanded(
                  child: _buildRevenueItem(
                    'This Week',
                    _stats!.revenueThisWeek,
                    Icons.date_range,
                  ),
                ),
                Container(
                  width: 1,
                  height: 60,
                  color: Colors.white.withOpacity(0.3),
                ),
                Expanded(
                  child: _buildRevenueItem(
                    'This Month',
                    _stats!.revenueThisMonth,
                    Icons.calendar_month,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),
            // Sparkline placeholder
            Container(
              height: 60,
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
              ),
              child: CustomPaint(
                size: const Size(double.infinity, 60),
                painter: SparklinePainter(),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRevenueItem(String label, double amount, IconData icon) {
    return Column(
      children: [
        Icon(icon, color: Colors.white.withOpacity(0.8), size: 28),
        const SizedBox(height: 8),
        Text(
          '\$${amount.toStringAsFixed(0)}',
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
            color: Colors.white,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.white.withOpacity(0.7),
          ),
        ),
      ],
    );
  }

  Widget _buildTablesSection() {
    return Column(
      children: [
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Expanded(child: _buildTopProductsTable()),
            const SizedBox(width: 16),
            Expanded(child: _buildLowStockTable()),
          ],
        ),
        const SizedBox(height: 16),
        _buildRecentOrdersTable(),
      ],
    );
  }

  Widget _buildTopProductsTable() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Top Products',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextButton(
                  onPressed: () =>
                      Navigator.pushNamed(context, '/admin/products'),
                  child: const Text('View All'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (_stats!.topProducts.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: Text('No data available'),
                ),
              )
            else
              ...(_stats!.topProducts.map((product) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: product.imageUrl.isNotEmpty
                        ? Image.network(
                            product.imageUrl,
                            width: 40,
                            height: 40,
                            fit: BoxFit.cover,
                          )
                        : Container(
                            width: 40,
                            height: 40,
                            color: Colors.grey[300],
                            child: const Icon(Icons.image),
                          ),
                    title: Text(
                      product.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 14),
                    ),
                    subtitle: Text(
                      '${product.totalOrders} orders • ${product.totalQuantity} sold',
                      style: const TextStyle(fontSize: 12),
                    ),
                    trailing: Text(
                      '\$${product.totalRevenue.toStringAsFixed(0)}',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.green,
                      ),
                    ),
                  ))),
          ],
        ),
      ),
    );
  }

  Widget _buildLowStockTable() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Low Stock Alert',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                Icon(Icons.warning, color: Colors.orange[700], size: 20),
              ],
            ),
            const SizedBox(height: 12),
            if (_stats!.lowStockProducts.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: Text('All products in stock'),
                ),
              )
            else
              ...(_stats!.lowStockProducts.map((product) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    leading: product.imageUrl.isNotEmpty
                        ? Image.network(
                            product.imageUrl,
                            width: 40,
                            height: 40,
                            fit: BoxFit.cover,
                          )
                        : Container(
                            width: 40,
                            height: 40,
                            color: Colors.grey[300],
                            child: const Icon(Icons.image),
                          ),
                    title: Text(
                      product.name,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: const TextStyle(fontSize: 14),
                    ),
                    subtitle: Text(
                      'SKU: ${product.sku}',
                      style: const TextStyle(fontSize: 12),
                    ),
                    trailing: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: product.stock < 5 ? Colors.red : Colors.orange,
                        borderRadius: BorderRadius.circular(4),
                      ),
                      child: Text(
                        '${product.stock} left',
                        style: const TextStyle(
                          color: Colors.white,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                  ))),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentOrdersTable() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Recent Orders',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                TextButton(
                  onPressed: () =>
                      Navigator.pushNamed(context, '/admin/orders'),
                  child: const Text('View All'),
                ),
              ],
            ),
            const SizedBox(height: 12),
            if (_stats!.recentOrders.isEmpty)
              const Center(
                child: Padding(
                  padding: EdgeInsets.all(24),
                  child: Text('No orders yet'),
                ),
              )
            else
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: DataTable(
                  columns: const [
                    DataColumn(label: Text('Order #')),
                    DataColumn(label: Text('Customer')),
                    DataColumn(label: Text('Total')),
                    DataColumn(label: Text('Status')),
                    DataColumn(label: Text('Date')),
                  ],
                  rows: _stats!.recentOrders.map((order) {
                    return DataRow(
                      onSelectChanged: (_) {
                        Navigator.pushNamed(
                          context,
                          '/admin/orders/details',
                          arguments: {'orderId': order.id},
                        );
                      },
                      cells: [
                        DataCell(Text(order.orderNumber)),
                        DataCell(Text(order.customerName)),
                        DataCell(Text('\$${order.total.toStringAsFixed(2)}')),
                        DataCell(_buildStatusChip(order.status)),
                        DataCell(Text(_formatDate(order.createdAt))),
                      ],
                    );
                  }).toList(),
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatusChip(String status) {
    Color color;
    switch (status) {
      case 'PENDING':
        color = Colors.orange;
        break;
      case 'CONFIRMED':
        color = Colors.blue;
        break;
      case 'SHIPPED':
        color = Colors.purple;
        break;
      case 'DELIVERED':
        color = Colors.green;
        break;
      case 'CANCELLED':
        color = Colors.red;
        break;
      default:
        color = Colors.grey;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: color),
      ),
      child: Text(
        status,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }

  Widget _buildQuickActions() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.grey.shade50,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.black,
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.bolt, color: Colors.amber, size: 20),
              ),
              const SizedBox(width: 12),
              const Text(
                'Quick Actions',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
          const SizedBox(height: 20),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 4,
            crossAxisSpacing: 12,
            mainAxisSpacing: 12,
            childAspectRatio: 2.5,
            children: [
              _buildQuickActionButton(
                label: 'New Product',
                icon: Icons.add_shopping_cart,
                color: const Color(0xFF4361EE),
                onPressed: () =>
                    Navigator.pushNamed(context, '/admin/products/new'),
              ),
              _buildQuickActionButton(
                label: 'New Banner',
                icon: Icons.add_photo_alternate,
                color: const Color(0xFF7209B7),
                onPressed: () =>
                    Navigator.pushNamed(context, '/admin/banners/new'),
              ),
              _buildQuickActionButton(
                label: 'View Orders',
                icon: Icons.list_alt,
                color: const Color(0xFF2EC4B6),
                onPressed: () => Navigator.pushNamed(context, '/admin/orders'),
              ),
              _buildQuickActionButton(
                label: 'Categories',
                icon: Icons.category,
                color: const Color(0xFFFF6B6B),
                onPressed: () =>
                    Navigator.pushNamed(context, '/admin/categories'),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildQuickActionButton({
    required String label,
    required IconData icon,
    required Color color,
    required VoidCallback onPressed,
  }) {
    return Material(
      color: Colors.white,
      borderRadius: BorderRadius.circular(12),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(12),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: color.withOpacity(0.3)),
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Icon(icon, color: color, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  label,
                  style: TextStyle(
                    fontSize: 13,
                    fontWeight: FontWeight.w600,
                    color: Colors.grey.shade800,
                  ),
                ),
              ),
              Icon(Icons.arrow_forward_ios,
                  size: 14, color: Colors.grey.shade400),
            ],
          ),
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}

/// Custom painter for sparkline chart
class SparklinePainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.white.withOpacity(0.5)
      ..strokeWidth = 2
      ..style = PaintingStyle.stroke
      ..strokeCap = StrokeCap.round;

    // Generate sample data points for sparkline
    final points = [0.3, 0.5, 0.4, 0.7, 0.6, 0.8, 0.75, 0.9, 0.85, 0.95];
    final path = Path();

    for (var i = 0; i < points.length; i++) {
      final x = (i / (points.length - 1)) * size.width;
      final y = size.height - (points[i] * size.height * 0.8) - 5;

      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }

    canvas.drawPath(path, paint);

    // Draw fill gradient
    final fillPaint = Paint()
      ..shader = LinearGradient(
        colors: [
          Colors.white.withOpacity(0.3),
          Colors.white.withOpacity(0.0),
        ],
        begin: Alignment.topCenter,
        end: Alignment.bottomCenter,
      ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));

    final fillPath = Path()..addPath(path, Offset.zero);
    fillPath.lineTo(size.width, size.height);
    fillPath.lineTo(0, size.height);
    fillPath.close();

    canvas.drawPath(fillPath, fillPaint);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}
