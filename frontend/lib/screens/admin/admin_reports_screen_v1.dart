import 'package:flutter/material.dart';
import 'dart:async';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import '../../layouts/admin_layout.dart';
import '../../guards/admin_route_guard.dart';
import '../../services/api_service.dart';

/// ═══════════════════════════════════════════════════════════════════
/// BUSINESS INTELLIGENCE REPORTS — Full Analytics Suite
/// Revenue · Orders · Inventory · Customers · VAT · Promos
/// ═══════════════════════════════════════════════════════════════════
class AdminReportsScreen extends StatefulWidget {
  const AdminReportsScreen({super.key});

  @override
  State<AdminReportsScreen> createState() => _AdminReportsScreenState();
}

class _AdminReportsScreenState extends State<AdminReportsScreen>
    with TickerProviderStateMixin {
  Map<String, dynamic>? _data;
  bool _isLoading = true;
  String? _error;
  int _days = 30;
  late AnimationController _fadeCtrl;
  late Animation<double> _fadeAnim;

  // ── Design tokens ──────────────────────────────────────────
  static const _accent = Color(0xFF6366F1);
  static const _surface = Color(0xFFF8F9FC);
  static const _cardBg = Colors.white;
  static const _success = Color(0xFF10B981);
  static const _warning = Color(0xFFF59E0B);
  static const _danger = Color(0xFFEF4444);
  static const _info = Color(0xFF3B82F6);
  static const _purple = Color(0xFF8B5CF6);
  static const _pink = Color(0xFFEC4899);
  static const _cyan = Color(0xFF06B6D4);
  static const _orange = Color(0xFFF97316);

  final _currFmt = NumberFormat.currency(symbol: 'AED ', decimalDigits: 2);
  final _numFmt = NumberFormat('#,##0');

  @override
  void initState() {
    super.initState();
    _fadeCtrl = AnimationController(
        vsync: this, duration: const Duration(milliseconds: 600));
    _fadeAnim = CurvedAnimation(parent: _fadeCtrl, curve: Curves.easeOut);
    _load();
  }

  @override
  void dispose() {
    _fadeCtrl.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() => _isLoading = true);
    try {
      final data = await ApiService.admin.getReports(days: _days);
      if (mounted) {
        setState(() {
          _data = data;
          _isLoading = false;
          _error = null;
        });
        _fadeCtrl.forward(from: 0);
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
        currentRoute: '/admin/reports',
        child: Container(
          color: _surface,
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _error != null
                  ? _buildError()
                  : FadeTransition(opacity: _fadeAnim, child: _buildBody()),
        ),
      ),
    );
  }

  Widget _buildError() {
    return Center(
      child: Column(mainAxisSize: MainAxisSize.min, children: [
        Icon(Icons.error_outline, size: 48, color: _danger),
        const SizedBox(height: 12),
        Text('Failed to load reports',
            style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.w600,
                color: Colors.grey[800])),
        const SizedBox(height: 6),
        Text(_error!, style: TextStyle(color: Colors.grey[500], fontSize: 13)),
        const SizedBox(height: 16),
        ElevatedButton.icon(
          onPressed: _load,
          icon: const Icon(Icons.refresh, size: 18),
          label: const Text('Retry'),
          style: ElevatedButton.styleFrom(
              backgroundColor: _accent,
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(10))),
        ),
      ]),
    );
  }

  Widget _buildBody() {
    final fin = _data!['financial'] as Map<String, dynamic>? ?? {};
    final rev =
        (_data!['revenueSeries'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final orders = _data!['orderBreakdown'] as Map<String, dynamic>? ?? {};
    final topProducts =
        (_data!['topProducts'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final stock = _data!['stock'] as Map<String, dynamic>? ?? {};
    final customers = _data!['customers'] as Map<String, dynamic>? ?? {};
    final vat = _data!['vat'] as Map<String, dynamic>? ?? {};
    final categories = (_data!['categoryPerformance'] as List?)
            ?.cast<Map<String, dynamic>>() ??
        [];
    final promos =
        (_data!['promos'] as List?)?.cast<Map<String, dynamic>>() ?? [];

    return ListView(
      padding: const EdgeInsets.all(24),
      children: [
        // ── Period picker ──
        _periodPicker(),
        const SizedBox(height: 20),

        // ── Financial KPIs ──
        _sectionHeader(
            Icons.account_balance_wallet_outlined, 'Financial Overview'),
        const SizedBox(height: 12),
        _financialKPIs(fin),
        const SizedBox(height: 24),

        // ── Revenue Chart ──
        _sectionHeader(Icons.show_chart_rounded, 'Revenue Trend'),
        const SizedBox(height: 12),
        _revenueChart(rev),
        const SizedBox(height: 24),

        // ── Orders Breakdown ──
        _sectionHeader(Icons.shopping_bag_outlined, 'Order Analytics'),
        const SizedBox(height: 12),
        _orderBreakdown(orders),
        const SizedBox(height: 24),

        // ── Top Products ──
        _sectionHeader(Icons.star_rounded, 'Top Products by Revenue'),
        const SizedBox(height: 12),
        _topProductsChart(topProducts),
        const SizedBox(height: 24),

        // ── Stock / Inventory ──
        _sectionHeader(Icons.inventory_2_outlined, 'Inventory Report'),
        const SizedBox(height: 12),
        _stockReport(stock),
        const SizedBox(height: 24),

        // ── Customer Analytics ──
        _sectionHeader(Icons.people_outline_rounded, 'Customer Analytics'),
        const SizedBox(height: 12),
        _customerAnalytics(customers),
        const SizedBox(height: 24),

        // ── VAT Report ──
        _sectionHeader(Icons.percent_rounded, 'VAT Report'),
        const SizedBox(height: 12),
        _vatReport(vat),
        const SizedBox(height: 24),

        // ── Category Performance ──
        _sectionHeader(Icons.category_outlined, 'Category Performance'),
        const SizedBox(height: 12),
        _categoryPerformance(categories),
        const SizedBox(height: 24),

        // ── Promo Codes ──
        _sectionHeader(Icons.local_offer_outlined, 'Promo Code Performance'),
        const SizedBox(height: 12),
        _promoReport(promos),
        const SizedBox(height: 40),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════
  // PERIOD PICKER
  // ═══════════════════════════════════════════════════════════

  Widget _periodPicker() {
    const periods = [
      (7, '7D'),
      (30, '30D'),
      (90, '90D'),
      (180, '6M'),
      (365, '1Y'),
    ];
    return Row(
      children: [
        Icon(Icons.calendar_today_outlined, size: 16, color: Colors.grey[500]),
        const SizedBox(width: 8),
        Text('Period:',
            style: TextStyle(color: Colors.grey[600], fontSize: 13)),
        const SizedBox(width: 8),
        ...periods.map((p) {
          final selected = _days == p.$1;
          return Padding(
            padding: const EdgeInsets.only(right: 6),
            child: InkWell(
              borderRadius: BorderRadius.circular(8),
              onTap: () {
                if (_days != p.$1) {
                  _days = p.$1;
                  _load();
                }
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                decoration: BoxDecoration(
                  color: selected ? _accent : Colors.white,
                  borderRadius: BorderRadius.circular(8),
                  border:
                      Border.all(color: selected ? _accent : Colors.grey[300]!),
                  boxShadow: selected
                      ? [
                          BoxShadow(
                              color: _accent.withOpacity(0.25),
                              blurRadius: 8,
                              offset: const Offset(0, 2))
                        ]
                      : null,
                ),
                child: Text(p.$2,
                    style: TextStyle(
                      color: selected ? Colors.white : Colors.grey[700],
                      fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
                      fontSize: 13,
                    )),
              ),
            ),
          );
        }),
        const Spacer(),
        IconButton(
          icon: const Icon(Icons.refresh_rounded, size: 20),
          tooltip: 'Refresh',
          onPressed: _load,
          color: Colors.grey[500],
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════
  // SECTION HEADER
  // ═══════════════════════════════════════════════════════════

  Widget _sectionHeader(IconData icon, String title) {
    return Row(children: [
      Container(
        padding: const EdgeInsets.all(8),
        decoration: BoxDecoration(
          color: _accent.withOpacity(0.08),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(icon, size: 18, color: _accent),
      ),
      const SizedBox(width: 10),
      Text(title,
          style: const TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w700,
              color: Color(0xFF1E293B))),
    ]);
  }

  // ═══════════════════════════════════════════════════════════
  // FINANCIAL KPIs
  // ═══════════════════════════════════════════════════════════

  Widget _financialKPIs(Map<String, dynamic> fin) {
    final todayData = fin['today'] as Map<String, dynamic>? ?? {};
    final weekData = fin['week'] as Map<String, dynamic>? ?? {};
    final monthData = fin['month'] as Map<String, dynamic>? ?? {};
    final allTimeData = fin['allTime'] as Map<String, dynamic>? ?? {};
    final today = _toDouble(todayData['revenue']);
    final week = _toDouble(weekData['revenue']);
    final month = _toDouble(monthData['revenue']);
    final allTime = _toDouble(allTimeData['revenue']);
    final totalOrders = _toInt(fin['totalOrders']);
    final aov = _toDouble(fin['avgOrderValue']);
    final growth = _toDouble(fin['monthGrowthPercent']);
    final totalVat = _toDouble(allTimeData['vat']);
    final totalDiscount = _toDouble(allTimeData['discount']);

    return Wrap(
      spacing: 14,
      runSpacing: 14,
      children: [
        _kpiTile("Today's Revenue", _currFmt.format(today), Icons.today_rounded,
            _success, null),
        _kpiTile('This Week', _currFmt.format(week), Icons.date_range_outlined,
            _info, null),
        _kpiTile('This Month', _currFmt.format(month),
            Icons.calendar_month_outlined, _purple, _growthBadge(growth)),
        _kpiTile('All Time Revenue', _currFmt.format(allTime),
            Icons.account_balance_outlined, _accent, null),
        _kpiTile('Total Orders', _numFmt.format(totalOrders),
            Icons.shopping_bag_outlined, _cyan, null),
        _kpiTile('Avg Order Value', _currFmt.format(aov),
            Icons.trending_up_rounded, _orange, null),
        _kpiTile('Total VAT Collected', _currFmt.format(totalVat),
            Icons.receipt_long_outlined, _warning, null),
        _kpiTile('Total Discounts', _currFmt.format(totalDiscount),
            Icons.discount_outlined, _pink, null),
      ],
    );
  }

  Widget? _growthBadge(double growth) {
    if (growth == 0) return null;
    final positive = growth >= 0;
    return Container(
      margin: const EdgeInsets.only(top: 6),
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: (positive ? _success : _danger).withOpacity(0.1),
        borderRadius: BorderRadius.circular(6),
      ),
      child: Row(mainAxisSize: MainAxisSize.min, children: [
        Icon(
            positive
                ? Icons.arrow_upward_rounded
                : Icons.arrow_downward_rounded,
            size: 12,
            color: positive ? _success : _danger),
        const SizedBox(width: 3),
        Text('${growth.toStringAsFixed(1)}% MoM',
            style: TextStyle(
                fontSize: 11,
                fontWeight: FontWeight.w600,
                color: positive ? _success : _danger)),
      ]),
    );
  }

  Widget _kpiTile(
      String label, String value, IconData icon, Color color, Widget? extra) {
    return Container(
      width: 220,
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        color: _cardBg,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 10,
              offset: const Offset(0, 2))
        ],
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Row(children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: color.withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 18, color: color),
          ),
          const Spacer(),
          if (extra != null) extra,
        ]),
        const SizedBox(height: 14),
        Text(value,
            style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.w700,
                color: Color(0xFF1E293B))),
        const SizedBox(height: 4),
        Text(label, style: TextStyle(fontSize: 12, color: Colors.grey[500])),
      ]),
    );
  }

  // ═══════════════════════════════════════════════════════════
  // REVENUE CHART (Line + Area)
  // ═══════════════════════════════════════════════════════════

  Widget _revenueChart(List<Map<String, dynamic>> rev) {
    if (rev.isEmpty) return _emptyCard('No revenue data yet');
    final spots = <FlSpot>[];
    double maxY = 0;
    for (int i = 0; i < rev.length; i++) {
      final v = _toDouble(rev[i]['revenue']);
      if (v > maxY) maxY = v;
      spots.add(FlSpot(i.toDouble(), v));
    }
    if (maxY == 0) maxY = 100;
    final interval = (maxY / 5).ceilToDouble().clamp(1.0, double.infinity);

    return _card(
      height: 320,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(8, 16, 16, 8),
        child: LineChart(
          LineChartData(
            minY: 0,
            maxY: maxY * 1.15,
            gridData: FlGridData(
              show: true,
              horizontalInterval: interval,
              getDrawingHorizontalLine: (_) => FlLine(
                  color: Colors.grey[200]!, strokeWidth: 1, dashArray: [4, 4]),
              drawVerticalLine: false,
            ),
            borderData: FlBorderData(show: false),
            titlesData: FlTitlesData(
              leftTitles: AxisTitles(
                sideTitles: SideTitles(
                  showTitles: true,
                  reservedSize: 56,
                  interval: interval,
                  getTitlesWidget: (v, _) => Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: Text(_shortCurrency(v),
                        style: TextStyle(fontSize: 10, color: Colors.grey[500]),
                        textAlign: TextAlign.right),
                  ),
                ),
              ),
              bottomTitles: AxisTitles(
                sideTitles: SideTitles(
                  showTitles: true,
                  interval: (rev.length / 6).ceilToDouble().clamp(1, 60),
                  getTitlesWidget: (v, _) {
                    final idx = v.toInt();
                    if (idx < 0 || idx >= rev.length) return const SizedBox();
                    final d = rev[idx]['date'] ?? '';
                    return Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: Text(
                          d.toString().length >= 10
                              ? d.toString().substring(5, 10)
                              : d.toString(),
                          style:
                              TextStyle(fontSize: 10, color: Colors.grey[500])),
                    );
                  },
                ),
              ),
              topTitles:
                  const AxisTitles(sideTitles: SideTitles(showTitles: false)),
              rightTitles:
                  const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            ),
            lineTouchData: LineTouchData(
              handleBuiltInTouches: true,
              touchTooltipData: LineTouchTooltipData(
                getTooltipItems: (spots) => spots.map((s) {
                  final idx = s.x.toInt();
                  final date = idx < rev.length
                      ? rev[idx]['date']?.toString() ?? ''
                      : '';
                  return LineTooltipItem(
                    '$date\n${_currFmt.format(s.y)}',
                    const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 12),
                  );
                }).toList(),
              ),
            ),
            lineBarsData: [
              LineChartBarData(
                spots: spots,
                isCurved: true,
                curveSmoothness: 0.25,
                color: _accent,
                barWidth: 2.5,
                dotData: const FlDotData(show: false),
                belowBarData: BarAreaData(
                  show: true,
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      _accent.withOpacity(0.18),
                      _accent.withOpacity(0.01)
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  // ORDER BREAKDOWN (Pie Charts)
  // ═══════════════════════════════════════════════════════════

  Widget _orderBreakdown(Map<String, dynamic> orders) {
    final byStatus =
        (orders['byStatus'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final byPayment =
        (orders['byPayment'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final byShipping =
        (orders['byShipping'] as List?)?.cast<Map<String, dynamic>>() ?? [];

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(
            child: _pieCard('By Status', byStatus, 'label', 'count', [
          _success,
          _info,
          _warning,
          _danger,
          _purple,
          _cyan,
          _pink,
          _orange
        ])),
        const SizedBox(width: 14),
        Expanded(
            child: _pieCard('By Payment', byPayment, 'label', 'count',
                [_accent, _orange, _cyan, _pink])),
        const SizedBox(width: 14),
        Expanded(
            child: _pieCard('By Shipping', byShipping, 'label', 'count',
                [_info, _success, _purple, _warning])),
      ],
    );
  }

  Widget _pieCard(String title, List<Map<String, dynamic>> data,
      String labelKey, String countKey, List<Color> palette) {
    if (data.isEmpty) return _emptyCard('No data');
    final total = data.fold<int>(0, (s, e) => s + _toInt(e[countKey]));
    return _card(
      height: 300,
      child: Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
          child: Text(title,
              style: const TextStyle(
                  fontWeight: FontWeight.w600,
                  fontSize: 13,
                  color: Color(0xFF334155))),
        ),
        Expanded(
          child: Padding(
            padding: const EdgeInsets.all(12),
            child: PieChart(
              PieChartData(
                sectionsSpace: 2,
                centerSpaceRadius: 32,
                sections: List.generate(data.length, (i) {
                  final count = _toInt(data[i][countKey]);
                  final pct = total > 0 ? (count / total * 100) : 0.0;
                  return PieChartSectionData(
                    color: palette[i % palette.length],
                    value: count.toDouble(),
                    radius: 44,
                    title: pct >= 5 ? '${pct.toStringAsFixed(0)}%' : '',
                    titleStyle: const TextStyle(
                        fontSize: 11,
                        color: Colors.white,
                        fontWeight: FontWeight.w600),
                  );
                }),
              ),
            ),
          ),
        ),
        // Legend
        Padding(
          padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
          child: Wrap(
            spacing: 10,
            runSpacing: 4,
            children: List.generate(data.length, (i) {
              final label = _formatLabel(data[i][labelKey]?.toString() ?? '');
              return Row(mainAxisSize: MainAxisSize.min, children: [
                Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                        color: palette[i % palette.length],
                        borderRadius: BorderRadius.circular(3))),
                const SizedBox(width: 4),
                Text('$label (${data[i][countKey]})',
                    style: TextStyle(fontSize: 10, color: Colors.grey[600])),
              ]);
            }),
          ),
        ),
      ]),
    );
  }

  // ═══════════════════════════════════════════════════════════
  // TOP PRODUCTS (Bar Chart)
  // ═══════════════════════════════════════════════════════════

  Widget _topProductsChart(List<Map<String, dynamic>> products) {
    if (products.isEmpty) return _emptyCard('No product data');
    final maxRev = products.fold<double>(
        0,
        (m, p) => _toDouble(p['totalRevenue']) > m
            ? _toDouble(p['totalRevenue'])
            : m);

    return _card(
      height: 360,
      child: Padding(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
        child: BarChart(
          BarChartData(
            maxY: maxRev * 1.15,
            barTouchData: BarTouchData(
              touchTooltipData: BarTouchTooltipData(
                getTooltipItem: (group, _, rod, __) {
                  final idx = group.x;
                  if (idx >= products.length) return null;
                  final p = products[idx];
                  return BarTooltipItem(
                    '${p['name']}\n${_currFmt.format(rod.toY)}\nQty: ${p['totalQty']}',
                    const TextStyle(
                        color: Colors.white,
                        fontWeight: FontWeight.w600,
                        fontSize: 11),
                  );
                },
              ),
            ),
            gridData: FlGridData(
              show: true,
              drawVerticalLine: false,
              horizontalInterval: (maxRev / 4).clamp(1.0, double.infinity),
              getDrawingHorizontalLine: (_) => FlLine(
                  color: Colors.grey[200]!, strokeWidth: 1, dashArray: [4, 4]),
            ),
            borderData: FlBorderData(show: false),
            titlesData: FlTitlesData(
              leftTitles: AxisTitles(
                sideTitles: SideTitles(
                  showTitles: true,
                  reservedSize: 56,
                  interval: (maxRev / 4).clamp(1.0, double.infinity),
                  getTitlesWidget: (v, _) => Text(_shortCurrency(v),
                      style: TextStyle(fontSize: 10, color: Colors.grey[500])),
                ),
              ),
              bottomTitles: AxisTitles(
                sideTitles: SideTitles(
                  showTitles: true,
                  reservedSize: 50,
                  getTitlesWidget: (v, _) {
                    final idx = v.toInt();
                    if (idx < 0 || idx >= products.length)
                      return const SizedBox();
                    final name = products[idx]['name']?.toString() ?? '';
                    return Padding(
                      padding: const EdgeInsets.only(top: 8),
                      child: SizedBox(
                        width: 60,
                        child: Text(
                          name.length > 12 ? '${name.substring(0, 12)}…' : name,
                          style:
                              TextStyle(fontSize: 9, color: Colors.grey[600]),
                          textAlign: TextAlign.center,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    );
                  },
                ),
              ),
              topTitles:
                  const AxisTitles(sideTitles: SideTitles(showTitles: false)),
              rightTitles:
                  const AxisTitles(sideTitles: SideTitles(showTitles: false)),
            ),
            barGroups: List.generate(products.length, (i) {
              return BarChartGroupData(x: i, barRods: [
                BarChartRodData(
                  toY: _toDouble(products[i]['totalRevenue']),
                  width: 22,
                  borderRadius:
                      const BorderRadius.vertical(top: Radius.circular(6)),
                  gradient: LinearGradient(
                    begin: Alignment.bottomCenter,
                    end: Alignment.topCenter,
                    colors: [_accent.withOpacity(0.7), _accent],
                  ),
                ),
              ]);
            }),
          ),
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  // STOCK / INVENTORY REPORT (Donut + Table)
  // ═══════════════════════════════════════════════════════════

  Widget _stockReport(Map<String, dynamic> stock) {
    final dist =
        (stock['distribution'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final lowItems =
        (stock['lowStockItems'] as List?)?.cast<Map<String, dynamic>>() ?? [];

    final stockColorList = [_danger, _orange, _warning, _success, _info];

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Donut chart
        Expanded(
          flex: 2,
          child: _card(
            height: 340,
            child: Column(children: [
              const Padding(
                padding: EdgeInsets.fromLTRB(16, 16, 16, 0),
                child: Text('Stock Distribution',
                    style: TextStyle(
                        fontWeight: FontWeight.w600,
                        fontSize: 13,
                        color: Color(0xFF334155))),
              ),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: PieChart(
                    PieChartData(
                      sectionsSpace: 2,
                      centerSpaceRadius: 40,
                      sections: List.generate(dist.length, (i) {
                        final label = dist[i]['label']?.toString() ?? '';
                        final count = _toInt(dist[i]['count']);
                        return PieChartSectionData(
                          color: stockColorList[i % stockColorList.length],
                          value: count.toDouble().clamp(0.1, double.infinity),
                          radius: 50,
                          title: count > 0 ? count.toString() : '',
                          titleStyle: const TextStyle(
                              fontSize: 12,
                              color: Colors.white,
                              fontWeight: FontWeight.w700),
                        );
                      }),
                    ),
                  ),
                ),
              ),
              Padding(
                padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
                child: Wrap(
                  spacing: 14,
                  runSpacing: 4,
                  children: List.generate(dist.length, (i) {
                    final label = dist[i]['label']?.toString() ?? '';
                    return Row(mainAxisSize: MainAxisSize.min, children: [
                      Container(
                          width: 10,
                          height: 10,
                          decoration: BoxDecoration(
                              color: stockColorList[i % stockColorList.length],
                              borderRadius: BorderRadius.circular(3))),
                      const SizedBox(width: 4),
                      Text('$label (${dist[i]['count']})',
                          style:
                              TextStyle(fontSize: 10, color: Colors.grey[600])),
                    ]);
                  }).toList(),
                ),
              ),
            ]),
          ),
        ),
        const SizedBox(width: 14),
        // Low stock items table
        Expanded(
          flex: 3,
          child: _card(
            height: 340,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(16, 16, 16, 12),
                  child: Row(children: [
                    Icon(Icons.warning_amber_rounded,
                        size: 16, color: _warning),
                    const SizedBox(width: 6),
                    Text('Low Stock Items (${lowItems.length})',
                        style: const TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                            color: Color(0xFF334155))),
                  ]),
                ),
                Expanded(
                  child: lowItems.isEmpty
                      ? Center(
                          child: Text('All stock levels healthy!',
                              style: TextStyle(
                                  color: _success,
                                  fontWeight: FontWeight.w500,
                                  fontSize: 13)))
                      : ListView.separated(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          itemCount: lowItems.length,
                          separatorBuilder: (_, __) =>
                              Divider(height: 1, color: Colors.grey[100]),
                          itemBuilder: (_, i) {
                            final item = lowItems[i];
                            final qty = _toInt(item['stockQty']);
                            return Padding(
                              padding: const EdgeInsets.symmetric(vertical: 8),
                              child: Row(children: [
                                Expanded(
                                  child: Column(
                                    crossAxisAlignment:
                                        CrossAxisAlignment.start,
                                    children: [
                                      Text(
                                          item['productName']?.toString() ??
                                              'Unknown',
                                          style: const TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w600),
                                          maxLines: 1,
                                          overflow: TextOverflow.ellipsis),
                                      Text('SKU: ${item['sku'] ?? 'N/A'}',
                                          style: TextStyle(
                                              fontSize: 10,
                                              color: Colors.grey[500])),
                                    ],
                                  ),
                                ),
                                Container(
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    color: qty == 0
                                        ? _danger.withOpacity(0.1)
                                        : _warning.withOpacity(0.1),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text('$qty left',
                                      style: TextStyle(
                                          fontSize: 11,
                                          fontWeight: FontWeight.w600,
                                          color:
                                              qty == 0 ? _danger : _warning)),
                                ),
                              ]),
                            );
                          },
                        ),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════
  // CUSTOMER ANALYTICS (Line + Cards)
  // ═══════════════════════════════════════════════════════════

  Widget _customerAnalytics(Map<String, dynamic> customers) {
    final growthSeries =
        (customers['growthSeries'] as List?)?.cast<Map<String, dynamic>>() ??
            [];
    final topSpenders =
        (customers['topSpenders'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final segments = customers['segments'] as Map<String, dynamic>? ?? {};
    final firstTime = _toInt(segments['firstTime']);
    final returning = _toInt(segments['returning']);
    final totalCustomers = _toInt(customers['totalCustomers']);

    return Column(children: [
      // Summary row
      Row(children: [
        _miniKpi('Total Customers', _numFmt.format(totalCustomers), _accent),
        const SizedBox(width: 14),
        _miniKpi('First Time', _numFmt.format(firstTime), _info),
        const SizedBox(width: 14),
        _miniKpi('Returning', _numFmt.format(returning), _success),
      ]),
      const SizedBox(height: 14),
      Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Growth chart
          Expanded(
            flex: 3,
            child: _card(
              height: 280,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Padding(
                    padding: EdgeInsets.fromLTRB(16, 14, 16, 0),
                    child: Text('Customer Growth',
                        style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                            color: Color(0xFF334155))),
                  ),
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.fromLTRB(8, 8, 16, 8),
                      child: growthSeries.isEmpty
                          ? Center(
                              child: Text('No data',
                                  style: TextStyle(color: Colors.grey[400])))
                          : _buildCustomerGrowthChart(growthSeries),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(width: 14),
          // Top spenders
          Expanded(
            flex: 2,
            child: _card(
              height: 280,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Padding(
                    padding: EdgeInsets.fromLTRB(16, 14, 16, 8),
                    child: Text('Top Spenders',
                        style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                            color: Color(0xFF334155))),
                  ),
                  Expanded(
                    child: ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: topSpenders.length.clamp(0, 8),
                      itemBuilder: (_, i) {
                        final c = topSpenders[i];
                        return Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: Row(children: [
                            CircleAvatar(
                              radius: 14,
                              backgroundColor: [
                                _accent,
                                _purple,
                                _cyan,
                                _pink,
                                _info
                              ][i % 5]
                                  .withOpacity(0.12),
                              child: Text('${i + 1}',
                                  style: TextStyle(
                                      fontSize: 11,
                                      fontWeight: FontWeight.w700,
                                      color: [
                                        _accent,
                                        _purple,
                                        _cyan,
                                        _pink,
                                        _info
                                      ][i % 5])),
                            ),
                            const SizedBox(width: 10),
                            Expanded(
                              child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text('${c['name'] ?? 'Unknown'}',
                                        style: const TextStyle(
                                            fontSize: 12,
                                            fontWeight: FontWeight.w600),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis),
                                    Text('${c['orderCount']} orders',
                                        style: TextStyle(
                                            fontSize: 10,
                                            color: Colors.grey[500])),
                                  ]),
                            ),
                            Text(_currFmt.format(_toDouble(c['totalSpent'])),
                                style: TextStyle(
                                    fontSize: 12,
                                    fontWeight: FontWeight.w600,
                                    color: Colors.grey[800])),
                          ]),
                        );
                      },
                    ),
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    ]);
  }

  Widget _buildCustomerGrowthChart(List<Map<String, dynamic>> series) {
    final spots = <FlSpot>[];
    double maxY = 0;
    for (int i = 0; i < series.length; i++) {
      final v = _toDouble(series[i]['cumulative']);
      if (v > maxY) maxY = v;
      spots.add(FlSpot(i.toDouble(), v));
    }
    if (maxY == 0) maxY = 10;
    return LineChart(
      LineChartData(
        minY: 0,
        maxY: maxY * 1.2,
        gridData: FlGridData(
          show: true,
          drawVerticalLine: false,
          horizontalInterval: (maxY / 4).clamp(1.0, double.infinity),
          getDrawingHorizontalLine: (_) => FlLine(
              color: Colors.grey[200]!, strokeWidth: 1, dashArray: [4, 4]),
        ),
        borderData: FlBorderData(show: false),
        titlesData: FlTitlesData(
          leftTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              reservedSize: 32,
              interval: (maxY / 4).clamp(1.0, double.infinity),
              getTitlesWidget: (v, _) => Text(v.toInt().toString(),
                  style: TextStyle(fontSize: 10, color: Colors.grey[500])),
            ),
          ),
          bottomTitles: AxisTitles(
            sideTitles: SideTitles(
              showTitles: true,
              interval: (series.length / 5).ceilToDouble().clamp(1, 60),
              getTitlesWidget: (v, _) {
                final idx = v.toInt();
                if (idx < 0 || idx >= series.length) return const SizedBox();
                final d = series[idx]['date']?.toString() ?? '';
                return Text(d.length >= 10 ? d.substring(5, 10) : d,
                    style: TextStyle(fontSize: 9, color: Colors.grey[500]));
              },
            ),
          ),
          topTitles:
              const AxisTitles(sideTitles: SideTitles(showTitles: false)),
          rightTitles:
              const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        ),
        lineBarsData: [
          LineChartBarData(
            spots: spots,
            isCurved: true,
            curveSmoothness: 0.25,
            color: _cyan,
            barWidth: 2,
            dotData: const FlDotData(show: false),
            belowBarData: BarAreaData(
              show: true,
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [_cyan.withOpacity(0.15), _cyan.withOpacity(0.01)],
              ),
            ),
          ),
        ],
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  // VAT REPORT (Table + KPIs)
  // ═══════════════════════════════════════════════════════════

  Widget _vatReport(Map<String, dynamic> vat) {
    final monthly =
        (vat['monthlySeries'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final totalCollected = _toDouble(vat['totalVatCollected']);
    final effectiveRate = _toDouble(vat['effectiveRate']);

    return Column(children: [
      Row(children: [
        _miniKpi(
            'Total VAT Collected', _currFmt.format(totalCollected), _warning),
        const SizedBox(width: 14),
        _miniKpi(
            'Effective Rate', '${effectiveRate.toStringAsFixed(1)}%', _info),
      ]),
      const SizedBox(height: 14),
      _card(
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: monthly.isEmpty
              ? const Center(
                  child: Padding(
                      padding: EdgeInsets.all(24), child: Text('No VAT data')))
              : Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Monthly VAT Summary',
                        style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                            color: Color(0xFF334155))),
                    const SizedBox(height: 10),
                    _dataTable(
                      columns: ['Month', 'Orders', 'Revenue', 'VAT Collected'],
                      rows: monthly.map((m) {
                        return [
                          m['month']?.toString() ?? '',
                          _numFmt.format(_toInt(m['orderCount'])),
                          _currFmt.format(_toDouble(m['totalRevenue'])),
                          _currFmt.format(_toDouble(m['vatCollected'])),
                        ];
                      }).toList(),
                    ),
                  ],
                ),
        ),
      ),
    ]);
  }

  // ═══════════════════════════════════════════════════════════
  // CATEGORY PERFORMANCE (Horizontal Bar)
  // ═══════════════════════════════════════════════════════════

  Widget _categoryPerformance(List<Map<String, dynamic>> categories) {
    if (categories.isEmpty) return _emptyCard('No category data');
    final maxRev = categories.fold<double>(
        0, (m, c) => _toDouble(c['revenue']) > m ? _toDouble(c['revenue']) : m);

    return _card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: List.generate(categories.length, (i) {
            final c = categories[i];
            final rev = _toDouble(c['revenue']);
            final pct = maxRev > 0 ? rev / maxRev : 0.0;
            final barColor = [
              _accent,
              _purple,
              _cyan,
              _success,
              _info,
              _pink,
              _orange,
              _warning
            ][i % 8];
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Row(children: [
                SizedBox(
                  width: 120,
                  child: Text(c['name']?.toString() ?? 'Unknown',
                      style: const TextStyle(
                          fontSize: 12, fontWeight: FontWeight.w600),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Stack(children: [
                    Container(
                      height: 24,
                      decoration: BoxDecoration(
                        color: Colors.grey[100],
                        borderRadius: BorderRadius.circular(6),
                      ),
                    ),
                    FractionallySizedBox(
                      widthFactor: pct.clamp(0.02, 1),
                      child: Container(
                        height: 24,
                        decoration: BoxDecoration(
                          gradient: LinearGradient(
                              colors: [barColor.withOpacity(0.7), barColor]),
                          borderRadius: BorderRadius.circular(6),
                        ),
                        alignment: Alignment.centerLeft,
                        padding: const EdgeInsets.only(left: 8),
                        child: Text(
                          _currFmt.format(rev),
                          style: TextStyle(
                              fontSize: 10,
                              fontWeight: FontWeight.w600,
                              color:
                                  pct > 0.3 ? Colors.white : Colors.grey[700]),
                          overflow: TextOverflow.ellipsis,
                        ),
                      ),
                    ),
                  ]),
                ),
                const SizedBox(width: 10),
                SizedBox(
                  width: 50,
                  child: Text('${c['qty'] ?? 0} qty',
                      style: TextStyle(fontSize: 11, color: Colors.grey[500]),
                      textAlign: TextAlign.right),
                ),
              ]),
            );
          }),
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  // PROMO CODES REPORT (Table)
  // ═══════════════════════════════════════════════════════════

  Widget _promoReport(List<Map<String, dynamic>> promos) {
    if (promos.isEmpty) return _emptyCard('No promo code data');
    return _card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: _dataTable(
          columns: [
            'Code',
            'Type',
            'Value',
            'Usage',
            'Orders',
            'Revenue',
            'Discount Given',
            'Status',
          ],
          rows: promos.map((p) {
            final usageCount = _toInt(p['usageCount']);
            final usageLimit = _toInt(p['usageLimit']);
            return [
              p['code']?.toString() ?? '',
              p['discountType']?.toString() ?? '',
              p['discountType'] == 'PERCENTAGE'
                  ? '${_toDouble(p['discountValue']).toStringAsFixed(0)}%'
                  : _currFmt.format(_toDouble(p['discountValue'])),
              '$usageCount${usageLimit > 0 ? ' / $usageLimit' : ''}',
              _numFmt.format(_toInt(p['orderCount'])),
              _currFmt.format(_toDouble(p['totalRevenue'])),
              _currFmt.format(_toDouble(p['totalDiscount'])),
              p['isActive'] == true ? 'Active' : 'Inactive',
            ];
          }).toList(),
        ),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  // SHARED WIDGETS
  // ═══════════════════════════════════════════════════════════

  Widget _card({double? height, required Widget child}) {
    return Container(
      height: height,
      decoration: BoxDecoration(
        color: _cardBg,
        borderRadius: BorderRadius.circular(14),
        boxShadow: [
          BoxShadow(
              color: Colors.black.withOpacity(0.04),
              blurRadius: 10,
              offset: const Offset(0, 2))
        ],
      ),
      clipBehavior: Clip.antiAlias,
      child: child,
    );
  }

  Widget _emptyCard(String msg) {
    return _card(
      height: 160,
      child: Center(
        child:
            Text(msg, style: TextStyle(color: Colors.grey[400], fontSize: 13)),
      ),
    );
  }

  Widget _miniKpi(String label, String value, Color color) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
        decoration: BoxDecoration(
          color: _cardBg,
          borderRadius: BorderRadius.circular(12),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withOpacity(0.04),
                blurRadius: 10,
                offset: const Offset(0, 2))
          ],
        ),
        child: Row(children: [
          Container(
            width: 4,
            height: 36,
            decoration: BoxDecoration(
              color: color,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 14),
          Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text(value,
                style: const TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1E293B))),
            const SizedBox(height: 2),
            Text(label,
                style: TextStyle(fontSize: 11, color: Colors.grey[500])),
          ]),
        ]),
      ),
    );
  }

  Widget _dataTable(
      {required List<String> columns, required List<List<String>> rows}) {
    return SingleChildScrollView(
      scrollDirection: Axis.horizontal,
      child: DataTable(
        headingRowHeight: 40,
        dataRowMinHeight: 36,
        dataRowMaxHeight: 40,
        columnSpacing: 20,
        horizontalMargin: 0,
        headingTextStyle: const TextStyle(
            fontWeight: FontWeight.w600,
            fontSize: 11,
            color: Color(0xFF64748B)),
        dataTextStyle: TextStyle(fontSize: 12, color: Colors.grey[800]),
        columns: columns.map((c) => DataColumn(label: Text(c))).toList(),
        rows: rows
            .map((r) =>
                DataRow(cells: r.map((cell) => DataCell(Text(cell))).toList()))
            .toList(),
      ),
    );
  }

  // ═══════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════

  double _toDouble(dynamic v) {
    if (v == null) return 0;
    if (v is num) return v.toDouble();
    return double.tryParse(v.toString()) ?? 0;
  }

  int _toInt(dynamic v) {
    if (v == null) return 0;
    if (v is int) return v;
    if (v is num) return v.toInt();
    return int.tryParse(v.toString()) ?? 0;
  }

  String _shortCurrency(double v) {
    if (v >= 1000000) return '${(v / 1000000).toStringAsFixed(1)}M';
    if (v >= 1000) return '${(v / 1000).toStringAsFixed(1)}K';
    return v.toStringAsFixed(0);
  }

  String _formatLabel(String s) {
    // CREDIT_CARD → Credit Card, outOfStock → Out Of Stock
    return s
        .replaceAllMapped(RegExp(r'[_]'), (_) => ' ')
        .replaceAllMapped(RegExp(r'([a-z])([A-Z])'), (m) => '${m[1]} ${m[2]}')
        .split(' ')
        .map((w) => w.isEmpty
            ? w
            : '${w[0].toUpperCase()}${w.substring(1).toLowerCase()}')
        .join(' ');
  }
}
