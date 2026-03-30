import 'package:flutter/material.dart';
import 'dart:async';
import 'dart:math' as math;
import '../../layouts/admin_layout.dart';
import '../../guards/admin_route_guard.dart';
import '../../services/api_service.dart';
import '../../models/dto/admin_dto.dart';

/// ═══════════════════════════════════════════════════════════════════
/// PREMIUM ADMIN DASHBOARD — Command Center
/// State-of-the-art, data-rich business intelligence dashboard
/// ═══════════════════════════════════════════════════════════════════
class AdminDashboardScreen extends StatefulWidget {
  const AdminDashboardScreen({super.key});

  @override
  State<AdminDashboardScreen> createState() => _AdminDashboardScreenState();
}

class _AdminDashboardScreenState extends State<AdminDashboardScreen>
    with TickerProviderStateMixin {
  DashboardStatsDto? _stats;
  bool _isLoading = true;
  String? _error;
  late AnimationController _fadeController;
  late Animation<double> _fadeAnim;
  Timer? _refreshTimer;

  // ── Design tokens ──────────────────────────────────────────
  static const _accent = Color(0xFF1A1A2E);
  static const _surface = Color(0xFFF8F9FC);
  static const _cardBg = Colors.white;
  static const _success = Color(0xFF10B981);
  static const _warning = Color(0xFFF59E0B);
  static const _danger = Color(0xFFEF4444);
  static const _info = Color(0xFF3B82F6);
  static const _purple = Color(0xFF8B5CF6);
  static const _pink = Color(0xFFEC4899);
  static const _cyan = Color(0xFF06B6D4);

  @override
  void initState() {
    super.initState();
    _fadeController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 700),
    );
    _fadeAnim = CurvedAnimation(parent: _fadeController, curve: Curves.easeOut);
    _loadStats();
    _refreshTimer = Timer.periodic(
      const Duration(seconds: 60),
      (_) => _loadStats(silent: true),
    );
  }

  @override
  void dispose() {
    _fadeController.dispose();
    _refreshTimer?.cancel();
    super.dispose();
  }

  Future<void> _loadStats({bool silent = false}) async {
    if (!silent && mounted) setState(() => _isLoading = true);
    try {
      final stats = await ApiService.admin.getDashboardStats();
      if (mounted) {
        setState(() {
          _stats = stats;
          _isLoading = false;
          _error = null;
        });
        _fadeController.forward(from: 0);
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return AdminRouteGuard(
      child: AdminLayout(
        currentRoute: '/admin',
        child: Container(
          color: _surface,
          child: _isLoading
              ? _buildLoading()
              : _error != null
                  ? _buildError()
                  : FadeTransition(opacity: _fadeAnim, child: _buildBody()),
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  LOADING
  // ═══════════════════════════════════════════════════════════
  Widget _buildLoading() {
    return Center(
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          SizedBox(
            width: 44,
            height: 44,
            child: CircularProgressIndicator(
              strokeWidth: 2.5,
              color: _accent,
            ),
          ),
          const SizedBox(height: 18),
          Text('Loading dashboard…',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey[400],
                fontWeight: FontWeight.w500,
              )),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  ERROR
  // ═══════════════════════════════════════════════════════════
  Widget _buildError() {
    return Center(
      child: Container(
        constraints: const BoxConstraints(maxWidth: 380),
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 60,
              height: 60,
              decoration: BoxDecoration(
                color: _danger.withOpacity(0.08),
                shape: BoxShape.circle,
              ),
              child: Icon(Icons.error_outline, color: _danger, size: 28),
            ),
            const SizedBox(height: 18),
            Text('Failed to load dashboard',
                style: TextStyle(
                  fontSize: 17,
                  fontWeight: FontWeight.w600,
                  color: Colors.grey[800],
                )),
            const SizedBox(height: 8),
            Text(_error ?? '',
                style: TextStyle(fontSize: 13, color: Colors.grey[500]),
                textAlign: TextAlign.center),
            const SizedBox(height: 22),
            FilledButton.icon(
              onPressed: _loadStats,
              icon: const Icon(Icons.refresh, size: 18),
              label: const Text('Retry'),
              style: FilledButton.styleFrom(
                backgroundColor: _accent,
                padding:
                    const EdgeInsets.symmetric(horizontal: 28, vertical: 14),
                shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(10)),
              ),
            ),
          ],
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  BODY
  // ═══════════════════════════════════════════════════════════
  Widget _buildBody() {
    final s = _stats!;
    final w = MediaQuery.of(context).size.width;
    final isMobile = w < 900;
    final isWide = w > 1400;
    final pad = isMobile ? 16.0 : 28.0;

    return RefreshIndicator(
      onRefresh: _loadStats,
      child: ListView(
        padding: EdgeInsets.all(pad),
        children: [
          _header(),
          SizedBox(height: pad),
          _kpiRow(s, isMobile),
          SizedBox(height: pad),
          if (isMobile)
            ..._mobileSections(s)
          else
            ..._desktopSections(s, isWide),
          const SizedBox(height: 40),
        ],
      ),
    );
  }

  List<Widget> _mobileSections(DashboardStatsDto s) {
    return [
      _orderPipeline(s),
      const SizedBox(height: 16),
      _revenueBreakdown(s),
      const SizedBox(height: 16),
      _recentOrdersCard(s),
      const SizedBox(height: 16),
      _topProducts(s),
      const SizedBox(height: 16),
      _catalogOverview(s),
      const SizedBox(height: 16),
      _activityFeed(s),
      const SizedBox(height: 16),
      _quickActions(),
    ];
  }

  List<Widget> _desktopSections(DashboardStatsDto s, bool isWide) {
    return [
      // Row 1: Pipeline + Revenue
      Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Expanded(flex: 3, child: _orderPipeline(s)),
        const SizedBox(width: 20),
        Expanded(flex: 2, child: _revenueBreakdown(s)),
      ]),
      const SizedBox(height: 20),
      // Row 2: Recent Orders + Top Products
      Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Expanded(flex: 3, child: _recentOrdersCard(s)),
        const SizedBox(width: 20),
        Expanded(flex: 2, child: _topProducts(s)),
      ]),
      const SizedBox(height: 20),
      // Row 3: Catalog + Activity + Quick Actions
      Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Expanded(flex: 2, child: _catalogOverview(s)),
        const SizedBox(width: 20),
        Expanded(flex: 2, child: _activityFeed(s)),
        if (isWide) ...[
          const SizedBox(width: 20),
          Expanded(child: _quickActions())
        ],
      ]),
      if (!isWide) ...[const SizedBox(height: 20), _quickActions()],
    ];
  }

  // ═══════════════════════════════════════════════════════════
  //  HEADER
  // ═══════════════════════════════════════════════════════════
  Widget _header() {
    final h = DateTime.now().hour;
    final greet = h < 12
        ? 'Good Morning'
        : h < 17
            ? 'Good Afternoon'
            : 'Good Evening';

    return Row(
      children: [
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(greet,
                  style: const TextStyle(
                    fontSize: 26,
                    fontWeight: FontWeight.w700,
                    color: _accent,
                    letterSpacing: -0.5,
                  )),
              const SizedBox(height: 4),
              Text("Here's what's happening with your store today",
                  style: TextStyle(fontSize: 14, color: Colors.grey[500])),
            ],
          ),
        ),
        _pillChip(
          icon: Icons.calendar_today_outlined,
          label: _fmtDate(DateTime.now()),
          onTrailing: _loadStats,
        ),
      ],
    );
  }

  Widget _pillChip({
    required IconData icon,
    required String label,
    VoidCallback? onTrailing,
  }) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: Colors.grey.shade200),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 15, color: Colors.grey[500]),
          const SizedBox(width: 8),
          Text(label,
              style: TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: Colors.grey[700],
              )),
          if (onTrailing != null) ...[
            const SizedBox(width: 10),
            InkWell(
              borderRadius: BorderRadius.circular(6),
              onTap: onTrailing,
              child: Icon(Icons.refresh, size: 17, color: Colors.grey[400]),
            ),
          ]
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  KPI CARDS
  // ═══════════════════════════════════════════════════════════
  Widget _kpiRow(DashboardStatsDto s, bool isMobile) {
    final cards = [
      _Kpi(
          "Today's Revenue",
          'AED ${_fmtCur(s.revenueToday)}',
          '${s.ordersToday} orders',
          Icons.trending_up_rounded,
          _success,
          const Color(0xFFECFDF5)),
      _Kpi(
          'This Week',
          'AED ${_fmtCur(s.revenueThisWeek)}',
          '${s.ordersThisWeek} orders',
          Icons.bar_chart_rounded,
          _info,
          const Color(0xFFEFF6FF)),
      _Kpi(
          'This Month',
          'AED ${_fmtCur(s.revenueThisMonth)}',
          '${s.ordersThisMonth} orders',
          Icons.show_chart_rounded,
          _purple,
          const Color(0xFFF5F3FF)),
      _Kpi(
          'Customers',
          _fmtNum(s.totalCustomers),
          '+${s.newCustomersToday} today',
          Icons.people_alt_rounded,
          _warning,
          const Color(0xFFFFFBEB)),
    ];

    if (isMobile) {
      return GridView.count(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.5,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        children: cards.map(_kpiCard).toList(),
      );
    }

    return Row(
      children: [
        for (int i = 0; i < cards.length; i++) ...[
          if (i > 0) const SizedBox(width: 16),
          Expanded(child: _kpiCard(cards[i])),
        ]
      ],
    );
  }

  Widget _kpiCard(_Kpi d) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: _cardDeco(),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(children: [
            _iconBox(d.icon, d.color, d.bg, size: 38),
            const Spacer(),
            CustomPaint(
                size: const Size(48, 22),
                painter: _Spark(d.color.withOpacity(0.35))),
          ]),
          const SizedBox(height: 14),
          Text(d.label,
              style: TextStyle(
                  fontSize: 12,
                  fontWeight: FontWeight.w500,
                  color: Colors.grey[500],
                  letterSpacing: 0.2)),
          const SizedBox(height: 4),
          Text(d.value,
              style: const TextStyle(
                  fontSize: 21,
                  fontWeight: FontWeight.w700,
                  color: _accent,
                  letterSpacing: -0.4)),
          const SizedBox(height: 3),
          Text(d.sub, style: TextStyle(fontSize: 12, color: Colors.grey[400])),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  ORDER PIPELINE
  // ═══════════════════════════════════════════════════════════
  Widget _orderPipeline(DashboardStatsDto s) {
    final statuses = s.ordersByStatus;
    final total = statuses.fold<int>(0, (a, b) => a + b.count);

    return _card(
      title: 'Order Pipeline',
      icon: Icons.local_shipping_outlined,
      child: Column(children: [
        if (total > 0) ...[
          Container(
            height: 8,
            clipBehavior: Clip.antiAlias,
            decoration: BoxDecoration(borderRadius: BorderRadius.circular(4)),
            child: Row(
              children: statuses.map((st) {
                return Expanded(
                  flex: math.max(1, (st.count / total * 100).round()),
                  child: Container(color: _statusColor(st.status)),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 20),
        ],
        ...statuses.map((st) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(children: [
                Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(
                    color: _statusColor(st.status),
                    borderRadius: BorderRadius.circular(3),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(_statusLabel(st.status),
                      style: TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          color: Colors.grey[700])),
                ),
                Text('${st.count}',
                    style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        color: _accent)),
                const SizedBox(width: 8),
                SizedBox(
                  width: 42,
                  child: Text('${st.percentage.toStringAsFixed(0)}%',
                      textAlign: TextAlign.right,
                      style: TextStyle(fontSize: 12, color: Colors.grey[400])),
                ),
              ]),
            )),
        if (statuses.isEmpty) _empty('No orders yet', Icons.inbox_outlined),
      ]),
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  REVENUE BREAKDOWN
  // ═══════════════════════════════════════════════════════════
  Widget _revenueBreakdown(DashboardStatsDto s) {
    final items = [
      ('Today', s.revenueToday, _success),
      ('This Week', s.revenueThisWeek, _info),
      ('This Month', s.revenueThisMonth, _purple),
    ];
    final maxV = items.map((e) => e.$2).fold<double>(1, math.max);

    return _card(
      title: 'Revenue Breakdown',
      icon: Icons.monetization_on_outlined,
      child: Column(
        children: items.map((item) {
          final frac = (item.$2 / maxV).clamp(0.02, 1.0);
          return Padding(
            padding: const EdgeInsets.only(bottom: 20),
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text(item.$1,
                    style: TextStyle(
                        fontSize: 13,
                        fontWeight: FontWeight.w500,
                        color: Colors.grey[600])),
                Text('AED ${_fmtCur(item.$2)}',
                    style: const TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w700,
                        color: _accent)),
              ]),
              const SizedBox(height: 8),
              Stack(children: [
                Container(
                    height: 8,
                    decoration: BoxDecoration(
                      color: item.$3.withOpacity(0.12),
                      borderRadius: BorderRadius.circular(4),
                    )),
                FractionallySizedBox(
                  widthFactor: frac,
                  child: Container(
                      height: 8,
                      decoration: BoxDecoration(
                        color: item.$3,
                        borderRadius: BorderRadius.circular(4),
                      )),
                ),
              ]),
            ]),
          );
        }).toList(),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  RECENT ORDERS
  // ═══════════════════════════════════════════════════════════
  Widget _recentOrdersCard(DashboardStatsDto s) {
    return _card(
      title: 'Recent Orders',
      icon: Icons.receipt_long_outlined,
      trailing: _viewAllBtn('/admin/orders'),
      child: s.recentOrders.isEmpty
          ? _empty('No orders yet', Icons.inbox_outlined)
          : Column(children: [
              _tableHead(
                  ['Order', 'Customer', 'Amount', 'Status'], [2, 2, 1, 1]),
              Divider(color: Colors.grey[200], height: 1),
              ...s.recentOrders.take(8).map(_orderRow),
            ]),
    );
  }

  Widget _orderRow(RecentOrderDto o) {
    return InkWell(
      onTap: () => Navigator.of(context)
          .pushNamed('/admin/orders/details', arguments: {'orderId': o.id}),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 11),
        decoration: BoxDecoration(
          border: Border(bottom: BorderSide(color: Colors.grey[100]!)),
        ),
        child: Row(children: [
          // Order
          Expanded(
            flex: 2,
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Text('#${o.orderNumber}',
                  style: const TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: _accent)),
              const SizedBox(height: 2),
              Text(_timeAgo(o.createdAt),
                  style: TextStyle(fontSize: 11, color: Colors.grey[400])),
            ]),
          ),
          // Customer
          Expanded(
            flex: 2,
            child: Text(o.customerName,
                style: TextStyle(fontSize: 13, color: Colors.grey[700]),
                overflow: TextOverflow.ellipsis),
          ),
          // Amount
          Expanded(
            child: Text('AED ${o.total.toStringAsFixed(2)}',
                style: const TextStyle(
                    fontSize: 13, fontWeight: FontWeight.w600, color: _accent)),
          ),
          // Status
          Expanded(child: _statusBadge(o.status)),
        ]),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  TOP PRODUCTS
  // ═══════════════════════════════════════════════════════════
  Widget _topProducts(DashboardStatsDto s) {
    final colors = [_success, _info, _purple, _warning, Colors.grey];

    return _card(
      title: 'Top Products',
      icon: Icons.star_outline_rounded,
      trailing: _viewAllBtn('/admin/products'),
      child: s.topProducts.isEmpty
          ? _empty('No sales data yet', Icons.leaderboard_outlined)
          : Column(
              children: s.topProducts.asMap().entries.map((e) {
                final i = e.key;
                final p = e.value;
                final c = colors[i % colors.length];
                return Container(
                  padding: const EdgeInsets.symmetric(vertical: 12),
                  decoration: BoxDecoration(
                    border:
                        Border(bottom: BorderSide(color: Colors.grey[100]!)),
                  ),
                  child: Row(children: [
                    _iconBox(null, c, c.withOpacity(0.1),
                        size: 28, text: '#${i + 1}'),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(p.name,
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                                style: const TextStyle(
                                    fontSize: 13,
                                    fontWeight: FontWeight.w500,
                                    color: _accent)),
                            const SizedBox(height: 2),
                            Text(
                                '${p.totalQuantity} sold · ${p.totalOrders} orders',
                                style: TextStyle(
                                    fontSize: 11, color: Colors.grey[400])),
                          ]),
                    ),
                    Text('AED ${_fmtCur(p.totalRevenue)}',
                        style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w700,
                            color: _accent)),
                  ]),
                );
              }).toList(),
            ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  CATALOG OVERVIEW
  // ═══════════════════════════════════════════════════════════
  Widget _catalogOverview(DashboardStatsDto s) {
    final cat = s.catalogSummary;
    final tiles = [
      ('Products', cat?.totalProducts ?? 0, Icons.inventory_2_outlined, _info),
      (
        'Active',
        cat?.activeProducts ?? 0,
        Icons.check_circle_outline,
        _success
      ),
      ('Featured', cat?.featuredProducts ?? 0, Icons.star_outline, _warning),
      (
        'Categories',
        cat?.totalCategories ?? 0,
        Icons.category_outlined,
        _purple
      ),
      ('Brands', cat?.totalBrands ?? 0, Icons.loyalty_outlined, _pink),
      ('Banners', s.activeBanners, Icons.view_carousel_outlined, _cyan),
    ];

    return _card(
      title: 'Catalog Overview',
      icon: Icons.grid_view_rounded,
      child: GridView.count(
        crossAxisCount: 3,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.35,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        children: tiles.map((t) {
          return Container(
            padding: const EdgeInsets.all(12),
            decoration: BoxDecoration(
              color: t.$4.withOpacity(0.06),
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: t.$4.withOpacity(0.12)),
            ),
            child:
                Column(mainAxisAlignment: MainAxisAlignment.center, children: [
              Icon(t.$3, color: t.$4, size: 20),
              const SizedBox(height: 6),
              Text(_fmtNum(t.$2),
                  style: const TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.w700,
                      color: _accent)),
              Text(t.$1,
                  style: TextStyle(
                      fontSize: 11,
                      color: Colors.grey[500],
                      fontWeight: FontWeight.w500)),
            ]),
          );
        }).toList(),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  ACTIVITY FEED
  // ═══════════════════════════════════════════════════════════
  Widget _activityFeed(DashboardStatsDto s) {
    final acts = s.recentActivity ?? [];

    return _card(
      title: 'Recent Activity',
      icon: Icons.timeline_outlined,
      child: acts.isEmpty
          ? _empty('No recent activity', Icons.history_outlined)
          : Column(
              children: acts.take(8).map((a) {
                return Container(
                  padding: const EdgeInsets.symmetric(vertical: 10),
                  decoration: BoxDecoration(
                    border:
                        Border(bottom: BorderSide(color: Colors.grey[100]!)),
                  ),
                  child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _iconBox(a.icon, a.color, a.color.withOpacity(0.1),
                            size: 30),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(a.title,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: const TextStyle(
                                        fontSize: 13,
                                        fontWeight: FontWeight.w500,
                                        color: _accent)),
                                if (a.subtitle != null) ...[
                                  const SizedBox(height: 2),
                                  Text(a.subtitle!,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: TextStyle(
                                          fontSize: 11,
                                          color: Colors.grey[400])),
                                ],
                              ]),
                        ),
                        const SizedBox(width: 8),
                        Text(_timeAgo(a.timestamp),
                            style: TextStyle(
                                fontSize: 11, color: Colors.grey[400])),
                      ]),
                );
              }).toList(),
            ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  QUICK ACTIONS
  // ═══════════════════════════════════════════════════════════
  Widget _quickActions() {
    final acts = [
      ('Add Product', Icons.add_box_outlined, _success, '/admin/products/new'),
      ('View Orders', Icons.receipt_long_outlined, _info, '/admin/orders'),
      (
        'Manage Promos',
        Icons.local_offer_outlined,
        _purple,
        '/admin/promo-codes'
      ),
      ('Customers', Icons.people_outline, _warning, '/admin/customers'),
      ('Categories', Icons.category_outlined, _pink, '/admin/categories'),
      ('Stripe Config', Icons.payment_outlined, _cyan, '/admin/stripe'),
    ];

    return _card(
      title: 'Quick Actions',
      icon: Icons.bolt_outlined,
      child: Column(
        children: acts.map((a) {
          return Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Material(
              color: Colors.transparent,
              borderRadius: BorderRadius.circular(10),
              child: InkWell(
                borderRadius: BorderRadius.circular(10),
                onTap: () => Navigator.of(context).pushReplacementNamed(a.$4),
                child: Padding(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 9),
                  child: Row(children: [
                    _iconBox(a.$2, a.$3, a.$3.withOpacity(0.1), size: 30),
                    const SizedBox(width: 12),
                    Text(a.$1,
                        style: const TextStyle(
                            fontSize: 13,
                            fontWeight: FontWeight.w500,
                            color: _accent)),
                    const Spacer(),
                    Icon(Icons.chevron_right,
                        size: 18, color: Colors.grey[300]),
                  ]),
                ),
              ),
            ),
          );
        }).toList(),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  SHARED WIDGETS
  // ═══════════════════════════════════════════════════════════
  Widget _card({
    required String title,
    required IconData icon,
    required Widget child,
    Widget? trailing,
  }) {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: _cardDeco(),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Icon(icon, size: 17, color: Colors.grey[400]),
          const SizedBox(width: 8),
          Text(title,
              style: const TextStyle(
                  fontSize: 15,
                  fontWeight: FontWeight.w600,
                  color: _accent,
                  letterSpacing: -0.2)),
          const Spacer(),
          if (trailing != null) trailing,
        ]),
        const SizedBox(height: 18),
        child,
      ]),
    );
  }

  BoxDecoration _cardDeco() {
    return BoxDecoration(
      color: _cardBg,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: Colors.grey.shade100),
      boxShadow: [
        BoxShadow(
          color: Colors.black.withOpacity(0.025),
          blurRadius: 10,
          offset: const Offset(0, 4),
        ),
      ],
    );
  }

  Widget _iconBox(IconData? icon, Color fg, Color bg,
      {double size = 38, String? text}) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(
          color: bg, borderRadius: BorderRadius.circular(size * 0.28)),
      alignment: Alignment.center,
      child: text != null
          ? Text(text,
              style: TextStyle(
                  fontSize: size * 0.38,
                  fontWeight: FontWeight.w700,
                  color: fg))
          : Icon(icon, color: fg, size: size * 0.5),
    );
  }

  Widget _statusBadge(String status) {
    final c = _statusColor(status);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: c.withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Text(_statusLabel(status),
          textAlign: TextAlign.center,
          style:
              TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: c)),
    );
  }

  Widget _viewAllBtn(String route) {
    return TextButton(
      onPressed: () => Navigator.of(context).pushReplacementNamed(route),
      child: const Text('View All',
          style: TextStyle(
              fontSize: 13, fontWeight: FontWeight.w600, color: _info)),
    );
  }

  Widget _empty(String msg, IconData ic) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 28),
      child: Column(children: [
        Icon(ic, size: 34, color: Colors.grey[300]),
        const SizedBox(height: 10),
        Text(msg, style: TextStyle(fontSize: 13, color: Colors.grey[400])),
      ]),
    );
  }

  Widget _tableHead(List<String> labels, List<int> flexes) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          for (int i = 0; i < labels.length; i++)
            Expanded(
              flex: flexes[i],
              child: Text(labels[i],
                  style: TextStyle(
                      fontSize: 11,
                      fontWeight: FontWeight.w600,
                      color: Colors.grey[400],
                      letterSpacing: 0.4)),
            ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  HELPERS
  // ═══════════════════════════════════════════════════════════
  Color _statusColor(String s) {
    switch (s) {
      case 'PROCESSING':
        return _info;
      case 'SHIPPED':
        return _purple;
      case 'DELIVERED':
        return _success;
      case 'CANCELLED':
        return _danger;
      case 'PAYMENT_PENDING':
      case 'PENDING':
        return _warning;
      case 'REFUNDED':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }

  String _statusLabel(String s) => s
      .replaceAll('_', ' ')
      .split(' ')
      .map((w) => w.isEmpty
          ? ''
          : '${w[0].toUpperCase()}${w.substring(1).toLowerCase()}')
      .join(' ');

  String _fmtCur(double v) {
    if (v >= 1000000) return '${(v / 1000000).toStringAsFixed(1)}M';
    if (v >= 1000) return '${(v / 1000).toStringAsFixed(1)}K';
    return v.toStringAsFixed(2);
  }

  String _fmtNum(int v) {
    if (v >= 1000000) return '${(v / 1000000).toStringAsFixed(1)}M';
    if (v >= 1000) return '${(v / 1000).toStringAsFixed(1)}K';
    return v.toString();
  }

  static const _months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];
  String _fmtDate(DateTime d) => '${_months[d.month - 1]} ${d.day}, ${d.year}';

  String _timeAgo(DateTime dt) {
    final d = DateTime.now().difference(dt);
    if (d.inMinutes < 1) return 'Just now';
    if (d.inMinutes < 60) return '${d.inMinutes}m ago';
    if (d.inHours < 24) return '${d.inHours}h ago';
    if (d.inDays < 7) return '${d.inDays}d ago';
    return _fmtDate(dt);
  }
}

// ═══════════════════════════════════════════════════════════════
//  SPARKLINE PAINTER
// ═══════════════════════════════════════════════════════════════
class _Spark extends CustomPainter {
  final Color color;
  _Spark(this.color);

  @override
  void paint(Canvas canvas, Size size) {
    final p = Paint()
      ..color = color
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.5
      ..strokeCap = StrokeCap.round;
    final pts = [0.5, 0.3, 0.7, 0.2, 0.6, 0.4, 0.8, 0.5];
    final dx = size.width / (pts.length - 1);
    final path = Path();
    for (var i = 0; i < pts.length; i++) {
      final x = i * dx;
      final y = size.height * (1 - pts[i]);
      i == 0 ? path.moveTo(x, y) : path.lineTo(x, y);
    }
    canvas.drawPath(path, p);
  }

  @override
  bool shouldRepaint(covariant CustomPainter old) => false;
}

// ═══════════════════════════════════════════════════════════════
//  DATA CLASSES
// ═══════════════════════════════════════════════════════════════
class _Kpi {
  final String label, value, sub;
  final IconData icon;
  final Color color, bg;
  _Kpi(this.label, this.value, this.sub, this.icon, this.color, this.bg);
}
