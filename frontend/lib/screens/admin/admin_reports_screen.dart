import 'package:flutter/material.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:intl/intl.dart';
import '../../layouts/admin_layout.dart';
import '../../guards/admin_route_guard.dart';
import '../../services/api_service.dart';

/// ═══════════════════════════════════════════════════════════════════
/// BUSINESS INTELLIGENCE REPORTS — Interactive Analytics Suite
/// Clickable charts · Drill-down panels · Live filtering · Search
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

  // ── Interaction state ──
  int _pieTouchedStatus = -1;
  int _pieTouchedPayment = -1;
  int _pieTouchedShipping = -1;
  int _pieTouchedStock = -1;
  int _barTouchedProduct = -1;
  int? _selectedRevDay;
  String _promoSearch = '';
  String _stockSearch = '';
  int _promoSortCol = 0;
  bool _promoSortAsc = false;
  int _catSortCol = 0;
  bool _catSortAsc = false;

  // ── Design tokens ──
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

  static const _palette8 = [
    _accent,
    _success,
    _info,
    _warning,
    _danger,
    _purple,
    _cyan,
    _pink
  ];
  static const _stockColors = [_danger, _orange, _warning, _success, _info];

  final _cFmt = NumberFormat.currency(symbol: 'AED ', decimalDigits: 2);
  final _nFmt = NumberFormat('#,##0');

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
      final d = await ApiService.admin.getReports(days: _days);
      if (mounted) {
        setState(() {
          _data = d;
          _isLoading = false;
          _error = null;
        });
        _fadeCtrl.forward(from: 0);
      }
    } catch (e) {
      if (mounted)
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
    }
  }

  // ── Helpers ──
  double _d(dynamic v) => v == null
      ? 0
      : (v is num ? v.toDouble() : double.tryParse(v.toString()) ?? 0);
  int _i(dynamic v) => v == null
      ? 0
      : (v is int
          ? v
          : (v is num ? v.toInt() : int.tryParse(v.toString()) ?? 0));
  String _shortC(double v) {
    if (v >= 1e6) return '${(v / 1e6).toStringAsFixed(1)}M';
    if (v >= 1e3) return '${(v / 1e3).toStringAsFixed(1)}K';
    return v.toStringAsFixed(0);
  }

  String _fmtLabel(String s) => s
      .replaceAllMapped(RegExp(r'[_]'), (_) => ' ')
      .replaceAllMapped(RegExp(r'([a-z])([A-Z])'), (m) => '${m[1]} ${m[2]}')
      .split(' ')
      .map((w) => w.isEmpty
          ? w
          : '${w[0].toUpperCase()}${w.substring(1).toLowerCase()}')
      .join(' ');

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

  Widget _buildError() => Center(
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
                    borderRadius: BorderRadius.circular(10)))),
      ]));

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

    return ListView(padding: const EdgeInsets.all(24), children: [
      _periodPicker(),
      const SizedBox(height: 20),
      _sec(Icons.account_balance_wallet_outlined, 'Financial Overview'),
      const SizedBox(height: 12),
      _financialKPIs(fin),
      const SizedBox(height: 24),
      _sec(Icons.show_chart_rounded, 'Revenue Trend',
          subtitle: 'Click any point for daily breakdown'),
      const SizedBox(height: 12),
      _revenueChart(rev),
      const SizedBox(height: 24),
      _sec(Icons.shopping_bag_outlined, 'Order Analytics',
          subtitle: 'Click segments to drill down'),
      const SizedBox(height: 12),
      _orderBreakdownSection(orders),
      const SizedBox(height: 24),
      _sec(Icons.star_rounded, 'Top Products by Revenue',
          subtitle: 'Click bars for details'),
      const SizedBox(height: 12),
      _topProductsSection(topProducts),
      const SizedBox(height: 24),
      _sec(Icons.inventory_2_outlined, 'Inventory Report',
          subtitle: 'Click stock segments to filter'),
      const SizedBox(height: 12),
      _stockSection(stock),
      const SizedBox(height: 24),
      _sec(Icons.people_outline_rounded, 'Customer Analytics',
          subtitle: 'Click spenders for detail'),
      const SizedBox(height: 12),
      _customerSection(customers),
      const SizedBox(height: 24),
      _sec(Icons.percent_rounded, 'VAT Report'),
      const SizedBox(height: 12),
      _vatSection(vat),
      const SizedBox(height: 24),
      _sec(Icons.category_outlined, 'Category Performance',
          subtitle: 'Click header to sort'),
      const SizedBox(height: 12),
      _categorySection(categories),
      const SizedBox(height: 24),
      _sec(Icons.local_offer_outlined, 'Promo Code Performance',
          subtitle: 'Search & sort'),
      const SizedBox(height: 12),
      _promoSection(promos),
      const SizedBox(height: 40),
    ]);
  }

  // ═══════════════════════════════════════════════════════════
  // PERIOD PICKER
  // ═══════════════════════════════════════════════════════════
  Widget _periodPicker() {
    const p = [(7, '7D'), (30, '30D'), (90, '90D'), (180, '6M'), (365, '1Y')];
    return Row(children: [
      Icon(Icons.calendar_today_outlined, size: 16, color: Colors.grey[500]),
      const SizedBox(width: 8),
      Text('Period:', style: TextStyle(color: Colors.grey[600], fontSize: 13)),
      const SizedBox(width: 8),
      ...p.map((e) {
        final sel = _days == e.$1;
        return Padding(
            padding: const EdgeInsets.only(right: 6),
            child: InkWell(
              borderRadius: BorderRadius.circular(8),
              onTap: () {
                if (_days != e.$1) {
                  _days = e.$1;
                  _load();
                }
              },
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 200),
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 7),
                decoration: BoxDecoration(
                    color: sel ? _accent : Colors.white,
                    borderRadius: BorderRadius.circular(8),
                    border:
                        Border.all(color: sel ? _accent : Colors.grey[300]!),
                    boxShadow: sel
                        ? [
                            BoxShadow(
                                color: _accent.withAlpha(64),
                                blurRadius: 8,
                                offset: const Offset(0, 2))
                          ]
                        : null),
                child: Text(e.$2,
                    style: TextStyle(
                        color: sel ? Colors.white : Colors.grey[700],
                        fontWeight: sel ? FontWeight.w600 : FontWeight.w500,
                        fontSize: 13)),
              ),
            ));
      }),
      const Spacer(),
      IconButton(
          icon: const Icon(Icons.refresh_rounded, size: 20),
          tooltip: 'Refresh',
          onPressed: _load,
          color: Colors.grey[500]),
    ]);
  }

  // ═══════════════════════════════════════════════════════════
  // SECTION HEADER
  // ═══════════════════════════════════════════════════════════
  Widget _sec(IconData icon, String title, {String? subtitle}) =>
      Row(children: [
        Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
                color: _accent.withAlpha(20),
                borderRadius: BorderRadius.circular(8)),
            child: Icon(icon, size: 18, color: _accent)),
        const SizedBox(width: 10),
        Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(title,
              style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w700,
                  color: Color(0xFF1E293B))),
          if (subtitle != null)
            Text(subtitle,
                style: TextStyle(
                    fontSize: 11,
                    color: Colors.grey[400],
                    fontStyle: FontStyle.italic)),
        ]),
      ]);

  // ═══════════════════════════════════════════════════════════
  // FINANCIAL KPIs — clickable tiles open detail
  // ═══════════════════════════════════════════════════════════
  Widget _financialKPIs(Map<String, dynamic> fin) {
    final td = fin['today'] as Map<String, dynamic>? ?? {};
    final wk = fin['week'] as Map<String, dynamic>? ?? {};
    final mo = fin['month'] as Map<String, dynamic>? ?? {};
    final at = fin['allTime'] as Map<String, dynamic>? ?? {};
    final growth = _d(fin['monthGrowthPercent']);
    final tiles = [
      _KpiData("Today's Revenue", _cFmt.format(_d(td['revenue'])),
          Icons.today_rounded, _success, td),
      _KpiData('This Week', _cFmt.format(_d(wk['revenue'])),
          Icons.date_range_outlined, _info, wk),
      _KpiData('This Month', _cFmt.format(_d(mo['revenue'])),
          Icons.calendar_month_outlined, _purple, mo,
          growthPct: growth),
      _KpiData('All Time Revenue', _cFmt.format(_d(at['revenue'])),
          Icons.account_balance_outlined, _accent, at),
      _KpiData('Total Orders', _nFmt.format(_i(fin['totalOrders'])),
          Icons.shopping_bag_outlined, _cyan, {
        'orders': _i(fin['totalOrders']),
        'customers': _i(fin['totalCustomers'])
      }),
      _KpiData(
          'Avg Order Value',
          _cFmt.format(_d(fin['avgOrderValue'])),
          Icons.trending_up_rounded,
          _orange,
          {'aov': _d(fin['avgOrderValue'])}),
      _KpiData(
          'Total VAT Collected',
          _cFmt.format(_d(at['vat'])),
          Icons.receipt_long_outlined,
          _warning,
          {'vat': _d(at['vat']), 'shipping': _d(at['shipping'])}),
      _KpiData('Total Discounts', _cFmt.format(_d(at['discount'])),
          Icons.discount_outlined, _pink, {'discount': _d(at['discount'])}),
    ];
    return Wrap(
        spacing: 14,
        runSpacing: 14,
        children: tiles.map((t) => _kpiTile(t)).toList());
  }

  Widget _kpiTile(_KpiData t) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        onTap: () => _showKpiDetail(t),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          width: 220,
          padding: const EdgeInsets.all(18),
          decoration: BoxDecoration(
              color: _cardBg,
              borderRadius: BorderRadius.circular(14),
              boxShadow: [
                BoxShadow(
                    color: Colors.black.withAlpha(10),
                    blurRadius: 10,
                    offset: const Offset(0, 2))
              ]),
          child:
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Container(
                  padding: const EdgeInsets.all(8),
                  decoration: BoxDecoration(
                      color: t.color.withAlpha(25),
                      borderRadius: BorderRadius.circular(10)),
                  child: Icon(t.icon, size: 18, color: t.color)),
              const Spacer(),
              if (t.growthPct != null && t.growthPct != 0)
                _growthBadge(t.growthPct!),
              Icon(Icons.open_in_new_rounded,
                  size: 14, color: Colors.grey[300]),
            ]),
            const SizedBox(height: 14),
            Text(t.value,
                style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w700,
                    color: Color(0xFF1E293B))),
            const SizedBox(height: 4),
            Text(t.label,
                style: TextStyle(fontSize: 12, color: Colors.grey[500])),
          ]),
        ),
      ),
    );
  }

  void _showKpiDetail(_KpiData t) {
    showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
              title: Row(children: [
                Icon(t.icon, color: t.color, size: 22),
                const SizedBox(width: 10),
                Text(t.label,
                    style: const TextStyle(
                        fontSize: 16, fontWeight: FontWeight.w700)),
              ]),
              content: SizedBox(
                  width: 320,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: t.detail.entries
                        .map((e) => Padding(
                              padding: const EdgeInsets.only(bottom: 8),
                              child: Row(
                                  mainAxisAlignment:
                                      MainAxisAlignment.spaceBetween,
                                  children: [
                                    Text(_fmtLabel(e.key),
                                        style: TextStyle(
                                            color: Colors.grey[600],
                                            fontSize: 13)),
                                    Text(
                                        e.value is num &&
                                                e.key != 'orders' &&
                                                e.key != 'customers'
                                            ? _cFmt.format(_d(e.value))
                                            : e.value.toString(),
                                        style: const TextStyle(
                                            fontWeight: FontWeight.w600,
                                            fontSize: 14)),
                                  ]),
                            ))
                        .toList(),
                  )),
              actions: [
                TextButton(
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text('Close'))
              ],
            ));
  }

  Widget _growthBadge(double g) {
    final up = g >= 0;
    return Container(
        margin: const EdgeInsets.only(right: 6),
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
        decoration: BoxDecoration(
            color: (up ? _success : _danger).withAlpha(25),
            borderRadius: BorderRadius.circular(6)),
        child: Row(mainAxisSize: MainAxisSize.min, children: [
          Icon(up ? Icons.arrow_upward_rounded : Icons.arrow_downward_rounded,
              size: 12, color: up ? _success : _danger),
          const SizedBox(width: 3),
          Text('${g.toStringAsFixed(1)}%',
              style: TextStyle(
                  fontSize: 11,
                  fontWeight: FontWeight.w600,
                  color: up ? _success : _danger)),
        ]));
  }

  // ═══════════════════════════════════════════════════════════
  // REVENUE CHART — click to see day detail
  // ═══════════════════════════════════════════════════════════
  Widget _revenueChart(List<Map<String, dynamic>> rev) {
    if (rev.isEmpty) return _emptyCard('No revenue data yet');
    final spots = <FlSpot>[];
    double maxY = 0;
    for (int i = 0; i < rev.length; i++) {
      final v = _d(rev[i]['revenue']);
      if (v > maxY) maxY = v;
      spots.add(FlSpot(i.toDouble(), v));
    }
    if (maxY == 0) maxY = 100;
    final interval = (maxY / 5).ceilToDouble().clamp(1.0, double.infinity);

    return Column(children: [
      _card(
          height: 320,
          child: Padding(
              padding: const EdgeInsets.fromLTRB(8, 16, 16, 8),
              child: LineChart(LineChartData(
                minY: 0,
                maxY: maxY * 1.15,
                gridData: FlGridData(
                    show: true,
                    horizontalInterval: interval,
                    getDrawingHorizontalLine: (_) => FlLine(
                        color: Colors.grey[200]!,
                        strokeWidth: 1,
                        dashArray: [4, 4]),
                    drawVerticalLine: false),
                borderData: FlBorderData(show: false),
                titlesData: FlTitlesData(
                  leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                          showTitles: true,
                          reservedSize: 56,
                          interval: interval,
                          getTitlesWidget: (v, _) => Padding(
                              padding: const EdgeInsets.only(right: 6),
                              child: Text(_shortC(v),
                                  style: TextStyle(
                                      fontSize: 10, color: Colors.grey[500]),
                                  textAlign: TextAlign.right)))),
                  bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                          showTitles: true,
                          interval:
                              (rev.length / 6).ceilToDouble().clamp(1, 60),
                          getTitlesWidget: (v, _) {
                            final idx = v.toInt();
                            if (idx < 0 || idx >= rev.length)
                              return const SizedBox();
                            final d = rev[idx]['date']?.toString() ?? '';
                            return Padding(
                                padding: const EdgeInsets.only(top: 8),
                                child: Text(
                                    d.length >= 10 ? d.substring(5, 10) : d,
                                    style: TextStyle(
                                        fontSize: 10,
                                        color: Colors.grey[500])));
                          })),
                  topTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false)),
                  rightTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false)),
                ),
                lineTouchData: LineTouchData(
                  handleBuiltInTouches: true,
                  touchCallback: (event, response) {
                    if (event is FlTapUpEvent &&
                        response?.lineBarSpots != null &&
                        response!.lineBarSpots!.isNotEmpty) {
                      final idx = response.lineBarSpots!.first.x.toInt();
                      if (idx >= 0 && idx < rev.length) {
                        setState(() => _selectedRevDay = idx);
                        _showRevDayDetail(rev[idx]);
                      }
                    }
                  },
                  touchTooltipData: LineTouchTooltipData(
                      getTooltipItems: (spots) => spots.map((s) {
                            final idx = s.x.toInt();
                            final date = idx < rev.length
                                ? rev[idx]['date']?.toString() ?? ''
                                : '';
                            return LineTooltipItem(
                                '$date\n${_cFmt.format(s.y)}\nTap for details',
                                const TextStyle(
                                    color: Colors.white,
                                    fontWeight: FontWeight.w600,
                                    fontSize: 11));
                          }).toList()),
                ),
                lineBarsData: [
                  LineChartBarData(
                      spots: spots,
                      isCurved: true,
                      curveSmoothness: 0.25,
                      color: _accent,
                      barWidth: 2.5,
                      dotData: FlDotData(
                          show: true,
                          getDotPainter: (spot, _, __, ___) {
                            final isSelected =
                                spot.x.toInt() == _selectedRevDay;
                            return FlDotCirclePainter(
                                radius: isSelected ? 5 : 0,
                                color: _accent,
                                strokeWidth: isSelected ? 2 : 0,
                                strokeColor: Colors.white);
                          }),
                      belowBarData: BarAreaData(
                          show: true,
                          gradient: LinearGradient(
                              begin: Alignment.topCenter,
                              end: Alignment.bottomCenter,
                              colors: [
                                _accent.withAlpha(46),
                                _accent.withAlpha(3)
                              ])))
                ],
              )))),
    ]);
  }

  void _showRevDayDetail(Map<String, dynamic> day) {
    showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
              title: Row(children: [
                const Icon(Icons.calendar_today, color: _accent, size: 20),
                const SizedBox(width: 10),
                Text(day['date']?.toString() ?? '',
                    style: const TextStyle(
                        fontSize: 16, fontWeight: FontWeight.w700)),
              ]),
              content: SizedBox(
                  width: 300,
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    _detailRow('Revenue', _cFmt.format(_d(day['revenue']))),
                    _detailRow('Orders', _i(day['orders']).toString()),
                    _detailRow('VAT', _cFmt.format(_d(day['vat']))),
                    _detailRow('Discounts', _cFmt.format(_d(day['discount']))),
                  ])),
              actions: [
                TextButton(
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text('Close'))
              ],
            ));
  }

  // ═══════════════════════════════════════════════════════════
  // ORDER BREAKDOWN — interactive pie charts w/ drill-down
  // ═══════════════════════════════════════════════════════════
  Widget _orderBreakdownSection(Map<String, dynamic> orders) {
    final byStatus =
        (orders['byStatus'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final byPayment =
        (orders['byPayment'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final byShipping =
        (orders['byShipping'] as List?)?.cast<Map<String, dynamic>>() ?? [];

    return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Expanded(
          child: _interactivePie('By Status', byStatus, _pieTouchedStatus,
              (i) => setState(() => _pieTouchedStatus = i), [
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
          child: _interactivePie(
              'By Payment',
              byPayment,
              _pieTouchedPayment,
              (i) => setState(() => _pieTouchedPayment = i),
              [_accent, _orange, _cyan, _pink])),
      const SizedBox(width: 14),
      Expanded(
          child: _interactivePie(
              'By Shipping',
              byShipping,
              _pieTouchedShipping,
              (i) => setState(() => _pieTouchedShipping = i),
              [_info, _success, _purple, _warning])),
    ]);
  }

  Widget _interactivePie(String title, List<Map<String, dynamic>> data,
      int touchedIdx, ValueChanged<int> onTouch, List<Color> palette) {
    if (data.isEmpty) return _emptyCard('No data');
    final total = data.fold<int>(0, (s, e) => s + _i(e['count']));
    return _card(
        height: 340,
        child: Column(children: [
          Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: Text(title,
                  style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                      color: Color(0xFF334155)))),
          Expanded(
              child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: PieChart(PieChartData(
                    pieTouchData: PieTouchData(
                      touchCallback: (event, response) {
                        if (event is FlTapUpEvent) {
                          final idx =
                              response?.touchedSection?.touchedSectionIndex ??
                                  -1;
                          onTouch(idx);
                          if (idx >= 0 && idx < data.length)
                            _showPieDetail(title, data[idx],
                                palette[idx % palette.length], total);
                        }
                      },
                    ),
                    sectionsSpace: 2,
                    centerSpaceRadius: 32,
                    sections: List.generate(data.length, (i) {
                      final count = _i(data[i]['count']);
                      final pct = total > 0 ? (count / total * 100) : 0.0;
                      final isTouched = i == touchedIdx;
                      return PieChartSectionData(
                        color: palette[i % palette.length],
                        value: count.toDouble().clamp(0.1, double.infinity),
                        radius: isTouched ? 56 : 44,
                        title: pct >= 5 ? '${pct.toStringAsFixed(0)}%' : '',
                        titleStyle: TextStyle(
                            fontSize: isTouched ? 13 : 11,
                            color: Colors.white,
                            fontWeight: FontWeight.w700),
                        badgeWidget: isTouched
                            ? Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 6, vertical: 2),
                                decoration: BoxDecoration(
                                    color: Colors.black87,
                                    borderRadius: BorderRadius.circular(6)),
                                child: Text('$count',
                                    style: const TextStyle(
                                        color: Colors.white,
                                        fontSize: 10,
                                        fontWeight: FontWeight.w600)),
                              )
                            : null,
                        badgePositionPercentageOffset: 1.3,
                      );
                    }),
                  )))),
          // Interactive legend
          Padding(
              padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
              child: Wrap(
                spacing: 6,
                runSpacing: 4,
                children: List.generate(data.length, (i) {
                  final label = _fmtLabel(data[i]['label']?.toString() ?? '');
                  final isSel = i == touchedIdx;
                  return MouseRegion(
                      cursor: SystemMouseCursors.click,
                      child: GestureDetector(
                        onTap: () {
                          onTouch(i);
                          _showPieDetail(title, data[i],
                              palette[i % palette.length], total);
                        },
                        child: AnimatedContainer(
                          duration: const Duration(milliseconds: 200),
                          padding: const EdgeInsets.symmetric(
                              horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                              color: isSel
                                  ? palette[i % palette.length].withAlpha(30)
                                  : Colors.transparent,
                              borderRadius: BorderRadius.circular(6),
                              border: isSel
                                  ? Border.all(
                                      color: palette[i % palette.length],
                                      width: 1.5)
                                  : null),
                          child: Row(mainAxisSize: MainAxisSize.min, children: [
                            Container(
                                width: 10,
                                height: 10,
                                decoration: BoxDecoration(
                                    color: palette[i % palette.length],
                                    borderRadius: BorderRadius.circular(3))),
                            const SizedBox(width: 4),
                            Text('$label (${data[i]['count']})',
                                style: TextStyle(
                                    fontSize: 10,
                                    color: isSel
                                        ? palette[i % palette.length]
                                        : Colors.grey[600],
                                    fontWeight: isSel
                                        ? FontWeight.w700
                                        : FontWeight.w400)),
                          ]),
                        ),
                      ));
                }),
              )),
        ]));
  }

  void _showPieDetail(
      String section, Map<String, dynamic> item, Color color, int total) {
    final count = _i(item['count']);
    final rev = _d(item['revenue']);
    final pct = total > 0 ? (count / total * 100) : 0.0;
    showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
              title: Row(children: [
                Container(
                    width: 16,
                    height: 16,
                    decoration: BoxDecoration(
                        color: color, borderRadius: BorderRadius.circular(4))),
                const SizedBox(width: 10),
                Expanded(
                    child: Text(
                        '$section — ${_fmtLabel(item['label']?.toString() ?? '')}',
                        style: const TextStyle(
                            fontSize: 15, fontWeight: FontWeight.w700))),
              ]),
              content: SizedBox(
                  width: 320,
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    _detailRow('Count', count.toString()),
                    _detailRow('Percentage', '${pct.toStringAsFixed(1)}%'),
                    _detailRow('Revenue', _cFmt.format(rev)),
                    _detailRow('Avg per Order',
                        count > 0 ? _cFmt.format(rev / count) : 'N/A'),
                    const SizedBox(height: 12),
                    // Mini bar showing proportion
                    ClipRRect(
                        borderRadius: BorderRadius.circular(6),
                        child: LinearProgressIndicator(
                            value: pct / 100,
                            minHeight: 10,
                            backgroundColor: Colors.grey[200],
                            valueColor: AlwaysStoppedAnimation(color))),
                    const SizedBox(height: 4),
                    Text('${pct.toStringAsFixed(1)}% of total orders',
                        style:
                            TextStyle(fontSize: 11, color: Colors.grey[500])),
                  ])),
              actions: [
                TextButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      Navigator.pushNamed(context, '/admin/orders');
                    },
                    child: const Text('View Orders')),
                TextButton(
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text('Close')),
              ],
            ));
  }

  // ═══════════════════════════════════════════════════════════
  // TOP PRODUCTS — clickable bars w/ detail
  // ═══════════════════════════════════════════════════════════
  Widget _topProductsSection(List<Map<String, dynamic>> products) {
    if (products.isEmpty) return _emptyCard('No product data');
    final maxRev = products.fold<double>(
        0, (m, p) => _d(p['totalRevenue']) > m ? _d(p['totalRevenue']) : m);

    return Column(children: [
      _card(
          height: 360,
          child: Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: BarChart(BarChartData(
                maxY: maxRev * 1.15,
                barTouchData: BarTouchData(
                  touchCallback: (event, response) {
                    if (event is FlTapUpEvent) {
                      final idx = response?.spot?.touchedBarGroupIndex ?? -1;
                      setState(() => _barTouchedProduct = idx);
                      if (idx >= 0 && idx < products.length)
                        _showProductDetail(products[idx]);
                    }
                  },
                  touchTooltipData:
                      BarTouchTooltipData(getTooltipItem: (group, _, rod, __) {
                    final idx = group.x;
                    if (idx >= products.length) return null;
                    return BarTooltipItem(
                        '${products[idx]['name']}\n${_cFmt.format(rod.toY)}\nTap for details',
                        const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: 11));
                  }),
                ),
                gridData: FlGridData(
                    show: true,
                    drawVerticalLine: false,
                    horizontalInterval:
                        (maxRev / 4).clamp(1.0, double.infinity),
                    getDrawingHorizontalLine: (_) => FlLine(
                        color: Colors.grey[200]!,
                        strokeWidth: 1,
                        dashArray: [4, 4])),
                borderData: FlBorderData(show: false),
                titlesData: FlTitlesData(
                  leftTitles: AxisTitles(
                      sideTitles: SideTitles(
                          showTitles: true,
                          reservedSize: 56,
                          interval: (maxRev / 4).clamp(1.0, double.infinity),
                          getTitlesWidget: (v, _) => Text(_shortC(v),
                              style: TextStyle(
                                  fontSize: 10, color: Colors.grey[500])))),
                  bottomTitles: AxisTitles(
                      sideTitles: SideTitles(
                          showTitles: true,
                          reservedSize: 50,
                          getTitlesWidget: (v, _) {
                            final idx = v.toInt();
                            if (idx < 0 || idx >= products.length)
                              return const SizedBox();
                            final name =
                                products[idx]['name']?.toString() ?? '';
                            return Padding(
                                padding: const EdgeInsets.only(top: 8),
                                child: SizedBox(
                                    width: 60,
                                    child: Text(
                                        name.length > 12
                                            ? '${name.substring(0, 12)}…'
                                            : name,
                                        style: TextStyle(
                                            fontSize: 9,
                                            color: idx == _barTouchedProduct
                                                ? _accent
                                                : Colors.grey[600],
                                            fontWeight:
                                                idx == _barTouchedProduct
                                                    ? FontWeight.w700
                                                    : FontWeight.w400),
                                        textAlign: TextAlign.center,
                                        maxLines: 2,
                                        overflow: TextOverflow.ellipsis)));
                          })),
                  topTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false)),
                  rightTitles: const AxisTitles(
                      sideTitles: SideTitles(showTitles: false)),
                ),
                barGroups: List.generate(products.length, (i) {
                  final isSel = i == _barTouchedProduct;
                  return BarChartGroupData(x: i, barRods: [
                    BarChartRodData(
                      toY: _d(products[i]['totalRevenue']),
                      width: isSel ? 28 : 22,
                      borderRadius:
                          const BorderRadius.vertical(top: Radius.circular(6)),
                      gradient: LinearGradient(
                          begin: Alignment.bottomCenter,
                          end: Alignment.topCenter,
                          colors: isSel
                              ? [_accent, _purple]
                              : [_accent.withAlpha(178), _accent]),
                    )
                  ]);
                }),
              )))),
      // Product details strip
      if (_barTouchedProduct >= 0 && _barTouchedProduct < products.length)
        Padding(
            padding: const EdgeInsets.only(top: 10),
            child: _selectedProductStrip(products[_barTouchedProduct])),
    ]);
  }

  Widget _selectedProductStrip(Map<String, dynamic> p) {
    return _card(
        child: Padding(
            padding: const EdgeInsets.all(16),
            child: Row(children: [
              Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(
                      color: _accent.withAlpha(20),
                      borderRadius: BorderRadius.circular(10)),
                  child: const Icon(Icons.inventory_2_rounded,
                      color: _accent, size: 22)),
              const SizedBox(width: 14),
              Expanded(
                  child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                    Text(p['name']?.toString() ?? 'Unknown',
                        style: const TextStyle(
                            fontSize: 14, fontWeight: FontWeight.w700)),
                    Text('SKU: ${p['sku'] ?? 'N/A'}',
                        style:
                            TextStyle(fontSize: 11, color: Colors.grey[500])),
                  ])),
              _statChip(
                  'Revenue', _cFmt.format(_d(p['totalRevenue'])), _accent),
              const SizedBox(width: 10),
              _statChip('Qty Sold', '${p['totalQty']}', _success),
              const SizedBox(width: 10),
              _statChip('Orders', '${p['totalOrders']}', _info),
              const SizedBox(width: 10),
              TextButton.icon(
                onPressed: () =>
                    Navigator.pushNamed(context, '/admin/products'),
                icon: const Icon(Icons.open_in_new, size: 14),
                label:
                    const Text('View Product', style: TextStyle(fontSize: 12)),
              ),
            ])));
  }

  void _showProductDetail(Map<String, dynamic> p) {
    showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
              title: Row(children: [
                const Icon(Icons.inventory_2_rounded, color: _accent, size: 22),
                const SizedBox(width: 10),
                Expanded(
                    child: Text(p['name']?.toString() ?? 'Unknown',
                        style: const TextStyle(
                            fontSize: 15, fontWeight: FontWeight.w700))),
              ]),
              content: SizedBox(
                  width: 360,
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    _detailRow('SKU', p['sku']?.toString() ?? 'N/A'),
                    _detailRow(
                        'Total Revenue', _cFmt.format(_d(p['totalRevenue']))),
                    _detailRow('Total Quantity Sold', '${p['totalQty']}'),
                    _detailRow('Total Orders', '${p['totalOrders']}'),
                    _detailRow(
                        'Avg Revenue/Order',
                        _i(p['totalOrders']) > 0
                            ? _cFmt.format(
                                _d(p['totalRevenue']) / _i(p['totalOrders']))
                            : 'N/A'),
                    _detailRow(
                        'Avg Qty/Order',
                        _i(p['totalOrders']) > 0
                            ? (_i(p['totalQty']) / _i(p['totalOrders']))
                                .toStringAsFixed(1)
                            : 'N/A'),
                  ])),
              actions: [
                TextButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      Navigator.pushNamed(context, '/admin/products');
                    },
                    child: const Text('Go to Products')),
                TextButton(
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text('Close')),
              ],
            ));
  }

  // ═══════════════════════════════════════════════════════════
  // STOCK — interactive donut + filterable table
  // ═══════════════════════════════════════════════════════════
  Widget _stockSection(Map<String, dynamic> stock) {
    final dist =
        (stock['distribution'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final allLowItems =
        (stock['lowStockItems'] as List?)?.cast<Map<String, dynamic>>() ?? [];

    // Filter low stock items by search
    final lowItems = _stockSearch.isEmpty
        ? allLowItems
        : allLowItems.where((item) {
            final name = item['productName']?.toString().toLowerCase() ?? '';
            final sku = item['sku']?.toString().toLowerCase() ?? '';
            return name.contains(_stockSearch.toLowerCase()) ||
                sku.contains(_stockSearch.toLowerCase());
          }).toList();

    return Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
      // Interactive donut
      Expanded(
          flex: 2,
          child: _card(
              height: 380,
              child: Column(children: [
                const Padding(
                    padding: EdgeInsets.fromLTRB(16, 16, 16, 0),
                    child: Text('Stock Distribution',
                        style: TextStyle(
                            fontWeight: FontWeight.w600,
                            fontSize: 13,
                            color: Color(0xFF334155)))),
                const Padding(
                    padding: EdgeInsets.symmetric(horizontal: 16),
                    child: Text('Click segments to filter',
                        style: TextStyle(
                            fontSize: 10,
                            color: Colors.grey,
                            fontStyle: FontStyle.italic))),
                Expanded(
                    child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: PieChart(PieChartData(
                          pieTouchData:
                              PieTouchData(touchCallback: (event, response) {
                            if (event is FlTapUpEvent) {
                              final idx = response
                                      ?.touchedSection?.touchedSectionIndex ??
                                  -1;
                              setState(() => _pieTouchedStock =
                                  _pieTouchedStock == idx ? -1 : idx);
                            }
                          }),
                          sectionsSpace: 2,
                          centerSpaceRadius: 40,
                          sections: List.generate(dist.length, (i) {
                            final count = _i(dist[i]['count']);
                            final isTouched = i == _pieTouchedStock;
                            return PieChartSectionData(
                              color: _stockColors[i % _stockColors.length],
                              value:
                                  count.toDouble().clamp(0.1, double.infinity),
                              radius: isTouched ? 60 : 50,
                              title: count > 0 ? count.toString() : '',
                              titleStyle: TextStyle(
                                  fontSize: isTouched ? 14 : 12,
                                  color: Colors.white,
                                  fontWeight: FontWeight.w700),
                            );
                          }),
                        )))),
                // Clickable legend
                Padding(
                    padding: const EdgeInsets.fromLTRB(16, 0, 16, 14),
                    child: Wrap(
                        spacing: 8,
                        runSpacing: 4,
                        children: List.generate(dist.length, (i) {
                          final label = dist[i]['label']?.toString() ?? '';
                          final isSel = i == _pieTouchedStock;
                          return MouseRegion(
                              cursor: SystemMouseCursors.click,
                              child: GestureDetector(
                                onTap: () => setState(() => _pieTouchedStock =
                                    _pieTouchedStock == i ? -1 : i),
                                child: AnimatedContainer(
                                  duration: const Duration(milliseconds: 200),
                                  padding: const EdgeInsets.symmetric(
                                      horizontal: 8, vertical: 4),
                                  decoration: BoxDecoration(
                                      color: isSel
                                          ? _stockColors[
                                                  i % _stockColors.length]
                                              .withAlpha(30)
                                          : Colors.transparent,
                                      borderRadius: BorderRadius.circular(6),
                                      border: isSel
                                          ? Border.all(
                                              color: _stockColors[
                                                  i % _stockColors.length],
                                              width: 1.5)
                                          : null),
                                  child: Row(
                                      mainAxisSize: MainAxisSize.min,
                                      children: [
                                        Container(
                                            width: 10,
                                            height: 10,
                                            decoration: BoxDecoration(
                                                color: _stockColors[
                                                    i % _stockColors.length],
                                                borderRadius:
                                                    BorderRadius.circular(3))),
                                        const SizedBox(width: 4),
                                        Text('$label (${dist[i]['count']})',
                                            style: TextStyle(
                                                fontSize: 10,
                                                color: isSel
                                                    ? _stockColors[
                                                        i % _stockColors.length]
                                                    : Colors.grey[600],
                                                fontWeight: isSel
                                                    ? FontWeight.w700
                                                    : FontWeight.w400)),
                                      ]),
                                ),
                              ));
                        }))),
              ]))),
      const SizedBox(width: 14),
      // Low stock table with search
      Expanded(
          flex: 3,
          child: _card(
              height: 380,
              child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Padding(
                        padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
                        child: Row(children: [
                          Icon(Icons.warning_amber_rounded,
                              size: 16, color: _warning),
                          const SizedBox(width: 6),
                          Text('Low Stock Items (${allLowItems.length})',
                              style: const TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                  color: Color(0xFF334155))),
                          const Spacer(),
                          SizedBox(
                              width: 180,
                              height: 32,
                              child: TextField(
                                onChanged: (v) =>
                                    setState(() => _stockSearch = v),
                                style: const TextStyle(fontSize: 12),
                                decoration: InputDecoration(
                                  hintText: 'Search items...',
                                  hintStyle: TextStyle(
                                      fontSize: 12, color: Colors.grey[400]),
                                  prefixIcon: Icon(Icons.search,
                                      size: 16, color: Colors.grey[400]),
                                  contentPadding: const EdgeInsets.symmetric(
                                      horizontal: 10),
                                  border: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(8),
                                      borderSide:
                                          BorderSide(color: Colors.grey[300]!)),
                                  enabledBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(8),
                                      borderSide:
                                          BorderSide(color: Colors.grey[300]!)),
                                  focusedBorder: OutlineInputBorder(
                                      borderRadius: BorderRadius.circular(8),
                                      borderSide:
                                          const BorderSide(color: _accent)),
                                ),
                              )),
                        ])),
                    Expanded(
                      child: lowItems.isEmpty
                          ? Center(
                              child: Text(
                                  allLowItems.isEmpty
                                      ? 'All stock levels healthy!'
                                      : 'No matches',
                                  style: TextStyle(
                                      color: allLowItems.isEmpty
                                          ? _success
                                          : Colors.grey[400],
                                      fontWeight: FontWeight.w500,
                                      fontSize: 13)))
                          : ListView.separated(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 16),
                              itemCount: lowItems.length,
                              separatorBuilder: (_, __) =>
                                  Divider(height: 1, color: Colors.grey[100]),
                              itemBuilder: (_, i) {
                                final item = lowItems[i];
                                final qty = _i(item['stockQty']);
                                return MouseRegion(
                                    cursor: SystemMouseCursors.click,
                                    child: InkWell(
                                      onTap: () => _showStockItemDetail(item),
                                      borderRadius: BorderRadius.circular(8),
                                      child: Padding(
                                          padding: const EdgeInsets.symmetric(
                                              vertical: 8),
                                          child: Row(children: [
                                            Expanded(
                                                child: Column(
                                                    crossAxisAlignment:
                                                        CrossAxisAlignment
                                                            .start,
                                                    children: [
                                                  Text(
                                                      item['productName']
                                                              ?.toString() ??
                                                          'Unknown',
                                                      style: const TextStyle(
                                                          fontSize: 12,
                                                          fontWeight:
                                                              FontWeight.w600),
                                                      maxLines: 1,
                                                      overflow: TextOverflow
                                                          .ellipsis),
                                                  Text(
                                                      'SKU: ${item['sku'] ?? 'N/A'}',
                                                      style: TextStyle(
                                                          fontSize: 10,
                                                          color: Colors
                                                              .grey[500])),
                                                ])),
                                            Container(
                                                padding:
                                                    const EdgeInsets.symmetric(
                                                        horizontal: 10,
                                                        vertical: 4),
                                                decoration: BoxDecoration(
                                                    color: qty == 0
                                                        ? _danger.withAlpha(25)
                                                        : _warning
                                                            .withAlpha(25),
                                                    borderRadius:
                                                        BorderRadius.circular(
                                                            6)),
                                                child: Text('$qty left',
                                                    style: TextStyle(
                                                        fontSize: 11,
                                                        fontWeight:
                                                            FontWeight.w600,
                                                        color: qty == 0
                                                            ? _danger
                                                            : _warning))),
                                            const SizedBox(width: 6),
                                            Icon(Icons.chevron_right_rounded,
                                                size: 16,
                                                color: Colors.grey[300]),
                                          ])),
                                    ));
                              }),
                    ),
                  ]))),
    ]);
  }

  void _showStockItemDetail(Map<String, dynamic> item) {
    showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
              title: Row(children: [
                Icon(Icons.inventory_2_outlined,
                    color: _i(item['stockQty']) == 0 ? _danger : _warning,
                    size: 22),
                const SizedBox(width: 10),
                Expanded(
                    child: Text(item['productName']?.toString() ?? 'Unknown',
                        style: const TextStyle(
                            fontSize: 15, fontWeight: FontWeight.w700))),
              ]),
              content: SizedBox(
                  width: 320,
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    _detailRow('SKU', item['sku']?.toString() ?? 'N/A'),
                    _detailRow(
                        'Current Stock', '${_i(item['stockQty'])} units'),
                    _detailRow(
                        'Status',
                        _i(item['stockQty']) == 0
                            ? 'OUT OF STOCK'
                            : 'LOW STOCK'),
                    _detailRow('Product Active',
                        item['isActive'] == true ? 'Yes' : 'No'),
                    const SizedBox(height: 8),
                    Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                            color:
                                (_i(item['stockQty']) == 0 ? _danger : _warning)
                                    .withAlpha(20),
                            borderRadius: BorderRadius.circular(10)),
                        child: Row(children: [
                          Icon(Icons.info_outline,
                              size: 16,
                              color: _i(item['stockQty']) == 0
                                  ? _danger
                                  : _warning),
                          const SizedBox(width: 8),
                          Expanded(
                              child: Text(
                                  _i(item['stockQty']) == 0
                                      ? 'This item is completely out of stock. Restock urgently.'
                                      : 'Stock is running low. Consider reordering soon.',
                                  style: TextStyle(
                                      fontSize: 12,
                                      color: _i(item['stockQty']) == 0
                                          ? _danger
                                          : _warning))),
                        ])),
                  ])),
              actions: [
                TextButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      Navigator.pushNamed(context, '/admin/products');
                    },
                    child: const Text('Go to Products')),
                TextButton(
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text('Close')),
              ],
            ));
  }

  // ═══════════════════════════════════════════════════════════
  // CUSTOMER ANALYTICS — clickable spenders
  // ═══════════════════════════════════════════════════════════
  Widget _customerSection(Map<String, dynamic> customers) {
    final growthSeries =
        (customers['growthSeries'] as List?)?.cast<Map<String, dynamic>>() ??
            [];
    final topSpenders =
        (customers['topSpenders'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final segments = customers['segments'] as Map<String, dynamic>? ?? {};
    final firstTime = _i(segments['firstTime']);
    final returning = _i(segments['returning']);
    final totalC = _i(customers['totalCustomers']);

    return Column(children: [
      Row(children: [
        _miniKpi('Total Customers', _nFmt.format(totalC), _accent),
        const SizedBox(width: 14),
        _miniKpi('First Time', _nFmt.format(firstTime), _info),
        const SizedBox(width: 14),
        _miniKpi('Returning', _nFmt.format(returning), _success),
      ]),
      const SizedBox(height: 14),
      Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
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
                                  color: Color(0xFF334155)))),
                      Expanded(
                          child: Padding(
                              padding: const EdgeInsets.fromLTRB(8, 8, 16, 8),
                              child: growthSeries.isEmpty
                                  ? Center(
                                      child: Text('No data',
                                          style: TextStyle(
                                              color: Colors.grey[400])))
                                  : _customerGrowthChart(growthSeries))),
                    ]))),
        const SizedBox(width: 14),
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
                                  color: Color(0xFF334155)))),
                      Expanded(
                          child: ListView.builder(
                        padding: const EdgeInsets.symmetric(horizontal: 16),
                        itemCount: topSpenders.length.clamp(0, 8),
                        itemBuilder: (_, i) {
                          final c = topSpenders[i];
                          return MouseRegion(
                              cursor: SystemMouseCursors.click,
                              child: InkWell(
                                onTap: () => _showSpenderDetail(c, i + 1),
                                borderRadius: BorderRadius.circular(8),
                                child: Padding(
                                    padding: const EdgeInsets.only(bottom: 8),
                                    child: Row(children: [
                                      CircleAvatar(
                                          radius: 14,
                                          backgroundColor:
                                              _palette8[i % 8].withAlpha(30),
                                          child: Text('${i + 1}',
                                              style: TextStyle(
                                                  fontSize: 11,
                                                  fontWeight: FontWeight.w700,
                                                  color: _palette8[i % 8]))),
                                      const SizedBox(width: 10),
                                      Expanded(
                                          child: Column(
                                              crossAxisAlignment:
                                                  CrossAxisAlignment.start,
                                              children: [
                                            Text(
                                                c['name']?.toString() ??
                                                    'Unknown',
                                                style: const TextStyle(
                                                    fontSize: 12,
                                                    fontWeight:
                                                        FontWeight.w600),
                                                maxLines: 1,
                                                overflow:
                                                    TextOverflow.ellipsis),
                                            Text('${c['orderCount']} orders',
                                                style: TextStyle(
                                                    fontSize: 10,
                                                    color: Colors.grey[500])),
                                          ])),
                                      Text(_cFmt.format(_d(c['totalSpent'])),
                                          style: TextStyle(
                                              fontSize: 12,
                                              fontWeight: FontWeight.w600,
                                              color: Colors.grey[800])),
                                      const SizedBox(width: 4),
                                      Icon(Icons.chevron_right_rounded,
                                          size: 14, color: Colors.grey[300]),
                                    ])),
                              ));
                        },
                      )),
                    ]))),
      ]),
    ]);
  }

  void _showSpenderDetail(Map<String, dynamic> c, int rank) {
    showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
              title: Row(children: [
                CircleAvatar(
                    radius: 16,
                    backgroundColor: _accent.withAlpha(30),
                    child: Text('#$rank',
                        style: const TextStyle(
                            fontSize: 12,
                            fontWeight: FontWeight.w700,
                            color: _accent))),
                const SizedBox(width: 10),
                Expanded(
                    child: Text(c['name']?.toString() ?? 'Unknown',
                        style: const TextStyle(
                            fontSize: 15, fontWeight: FontWeight.w700))),
              ]),
              content: SizedBox(
                  width: 320,
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    _detailRow('Email', c['email']?.toString() ?? 'N/A'),
                    _detailRow(
                        'Total Spent', _cFmt.format(_d(c['totalSpent']))),
                    _detailRow('Total Orders', '${c['orderCount']}'),
                    _detailRow(
                        'Avg Order Value',
                        _i(c['orderCount']) > 0
                            ? _cFmt.format(
                                _d(c['totalSpent']) / _i(c['orderCount']))
                            : 'N/A'),
                  ])),
              actions: [
                TextButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      Navigator.pushNamed(context, '/admin/customers');
                    },
                    child: const Text('View Customers')),
                TextButton(
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text('Close')),
              ],
            ));
  }

  Widget _customerGrowthChart(List<Map<String, dynamic>> series) {
    final spots = <FlSpot>[];
    double maxY = 0;
    for (int i = 0; i < series.length; i++) {
      final v = _d(series[i]['cumulative']);
      if (v > maxY) maxY = v;
      spots.add(FlSpot(i.toDouble(), v));
    }
    if (maxY == 0) maxY = 10;
    return LineChart(LineChartData(
      minY: 0,
      maxY: maxY * 1.2,
      gridData: FlGridData(
          show: true,
          drawVerticalLine: false,
          horizontalInterval: (maxY / 4).clamp(1.0, double.infinity),
          getDrawingHorizontalLine: (_) => FlLine(
              color: Colors.grey[200]!, strokeWidth: 1, dashArray: [4, 4])),
      borderData: FlBorderData(show: false),
      titlesData: FlTitlesData(
        leftTitles: AxisTitles(
            sideTitles: SideTitles(
                showTitles: true,
                reservedSize: 32,
                interval: (maxY / 4).clamp(1.0, double.infinity),
                getTitlesWidget: (v, _) => Text(v.toInt().toString(),
                    style: TextStyle(fontSize: 10, color: Colors.grey[500])))),
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
                })),
        topTitles: const AxisTitles(sideTitles: SideTitles(showTitles: false)),
        rightTitles:
            const AxisTitles(sideTitles: SideTitles(showTitles: false)),
      ),
      lineTouchData: LineTouchData(
          handleBuiltInTouches: true,
          touchTooltipData: LineTouchTooltipData(
              getTooltipItems: (spots) => spots.map((s) {
                    final idx = s.x.toInt();
                    final day = idx < series.length ? series[idx] : null;
                    return LineTooltipItem(
                        '${day?['date'] ?? ''}\nTotal: ${s.y.toInt()}\nNew: ${day?['newCustomers'] ?? 0}',
                        const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.w600,
                            fontSize: 11));
                  }).toList())),
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
                    colors: [_cyan.withAlpha(38), _cyan.withAlpha(3)])))
      ],
    ));
  }

  // ═══════════════════════════════════════════════════════════
  // VAT — clickable month rows
  // ═══════════════════════════════════════════════════════════
  Widget _vatSection(Map<String, dynamic> vat) {
    final monthly =
        (vat['monthlySeries'] as List?)?.cast<Map<String, dynamic>>() ?? [];
    final totalCollected = _d(vat['totalVatCollected']);
    final effectiveRate = _d(vat['effectiveRate']);

    return Column(children: [
      Row(children: [
        _miniKpi('Total VAT Collected', _cFmt.format(totalCollected), _warning),
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
                          padding: EdgeInsets.all(24),
                          child: Text('No VAT data')))
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                          const Text(
                              'Monthly VAT Summary — click rows for detail',
                              style: TextStyle(
                                  fontWeight: FontWeight.w600,
                                  fontSize: 13,
                                  color: Color(0xFF334155))),
                          const SizedBox(height: 10),
                          SingleChildScrollView(
                              scrollDirection: Axis.horizontal,
                              child: DataTable(
                                headingRowHeight: 40,
                                dataRowMinHeight: 36,
                                dataRowMaxHeight: 44,
                                columnSpacing: 20,
                                horizontalMargin: 0,
                                headingTextStyle: const TextStyle(
                                    fontWeight: FontWeight.w600,
                                    fontSize: 11,
                                    color: Color(0xFF64748B)),
                                dataTextStyle: TextStyle(
                                    fontSize: 12, color: Colors.grey[800]),
                                columns: const [
                                  DataColumn(label: Text('Month')),
                                  DataColumn(
                                      label: Text('Orders'), numeric: true),
                                  DataColumn(
                                      label: Text('Revenue'), numeric: true),
                                  DataColumn(
                                      label: Text('VAT Collected'),
                                      numeric: true),
                                  DataColumn(
                                      label: Text('Eff. Rate'), numeric: true)
                                ],
                                rows: monthly.map((m) {
                                  final rev = _d(m['totalRevenue']);
                                  final vatAmt = _d(m['vatCollected']);
                                  final rate =
                                      rev > 0 ? (vatAmt / rev * 100) : 0.0;
                                  return DataRow(
                                      onSelectChanged: (_) =>
                                          _showVatMonthDetail(m),
                                      cells: [
                                        DataCell(
                                            Text(m['month']?.toString() ?? '')),
                                        DataCell(Text(
                                            _nFmt.format(_i(m['orderCount'])))),
                                        DataCell(Text(_cFmt.format(rev))),
                                        DataCell(Text(_cFmt.format(vatAmt))),
                                        DataCell(Text(
                                            '${rate.toStringAsFixed(1)}%')),
                                      ]);
                                }).toList(),
                              )),
                        ]))),
    ]);
  }

  void _showVatMonthDetail(Map<String, dynamic> m) {
    final rev = _d(m['totalRevenue']);
    final vatAmt = _d(m['vatCollected']);
    showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
              title: Row(children: [
                const Icon(Icons.receipt_long, color: _warning, size: 22),
                const SizedBox(width: 10),
                Text('VAT Detail — ${m['month']}',
                    style: const TextStyle(
                        fontSize: 15, fontWeight: FontWeight.w700)),
              ]),
              content: SizedBox(
                  width: 320,
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    _detailRow('Month', m['month']?.toString() ?? ''),
                    _detailRow(
                        'Total Orders', _nFmt.format(_i(m['orderCount']))),
                    _detailRow('Total Revenue', _cFmt.format(rev)),
                    _detailRow('VAT Collected', _cFmt.format(vatAmt)),
                    _detailRow(
                        'Effective Rate',
                        rev > 0
                            ? '${(vatAmt / rev * 100).toStringAsFixed(2)}%'
                            : 'N/A'),
                    _detailRow(
                        'Avg VAT/Order',
                        _i(m['orderCount']) > 0
                            ? _cFmt.format(vatAmt / _i(m['orderCount']))
                            : 'N/A'),
                  ])),
              actions: [
                TextButton(
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text('Close'))
              ],
            ));
  }

  // ═══════════════════════════════════════════════════════════
  // CATEGORY PERFORMANCE — sortable + clickable rows
  // ═══════════════════════════════════════════════════════════
  Widget _categorySection(List<Map<String, dynamic>> categories) {
    if (categories.isEmpty) return _emptyCard('No category data');

    // Sort
    final sorted = List<Map<String, dynamic>>.from(categories);
    sorted.sort((a, b) {
      dynamic va, vb;
      switch (_catSortCol) {
        case 0:
          va = a['name'];
          vb = b['name'];
          break;
        case 1:
          va = _d(a['revenue']);
          vb = _d(b['revenue']);
          break;
        case 2:
          va = _i(a['qty']);
          vb = _i(b['qty']);
          break;
        case 3:
          va = _i(a['orders']);
          vb = _i(b['orders']);
          break;
        default:
          va = _d(a['revenue']);
          vb = _d(b['revenue']);
      }
      final cmp =
          va is String ? va.compareTo(vb) : (va as num).compareTo(vb as num);
      return _catSortAsc ? cmp : -cmp;
    });

    final maxRev = sorted.fold<double>(
        0, (m, c) => _d(c['revenue']) > m ? _d(c['revenue']) : m);

    return _card(
        child: Padding(
            padding: const EdgeInsets.all(16),
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              // Sort controls
              Row(children: [
                Text('Sort by:',
                    style: TextStyle(fontSize: 11, color: Colors.grey[500])),
                const SizedBox(width: 8),
                ...[('Name', 0), ('Revenue', 1), ('Quantity', 2), ('Orders', 3)]
                    .map((e) {
                  final isSel = _catSortCol == e.$2;
                  return Padding(
                      padding: const EdgeInsets.only(right: 4),
                      child: InkWell(
                          borderRadius: BorderRadius.circular(6),
                          onTap: () => setState(() {
                                if (_catSortCol == e.$2) {
                                  _catSortAsc = !_catSortAsc;
                                } else {
                                  _catSortCol = e.$2;
                                  _catSortAsc = false;
                                }
                              }),
                          child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                  color: isSel
                                      ? _accent.withAlpha(20)
                                      : Colors.transparent,
                                  borderRadius: BorderRadius.circular(6),
                                  border: isSel
                                      ? Border.all(color: _accent, width: 1)
                                      : null),
                              child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(e.$1,
                                        style: TextStyle(
                                            fontSize: 11,
                                            color: isSel
                                                ? _accent
                                                : Colors.grey[600],
                                            fontWeight: isSel
                                                ? FontWeight.w600
                                                : FontWeight.w400)),
                                    if (isSel)
                                      Icon(
                                          _catSortAsc
                                              ? Icons.arrow_upward
                                              : Icons.arrow_downward,
                                          size: 12,
                                          color: _accent),
                                  ]))));
                }),
              ]),
              const SizedBox(height: 14),
              ...List.generate(sorted.length, (i) {
                final c = sorted[i];
                final rev = _d(c['revenue']);
                final pct = maxRev > 0 ? rev / maxRev : 0.0;
                final barColor = _palette8[i % 8];
                return MouseRegion(
                    cursor: SystemMouseCursors.click,
                    child: InkWell(
                      onTap: () => _showCatDetail(c),
                      borderRadius: BorderRadius.circular(8),
                      child: Padding(
                          padding: const EdgeInsets.only(bottom: 12),
                          child: Row(children: [
                            SizedBox(
                                width: 120,
                                child: Text(c['name']?.toString() ?? 'Unknown',
                                    style: const TextStyle(
                                        fontSize: 12,
                                        fontWeight: FontWeight.w600),
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis)),
                            const SizedBox(width: 12),
                            Expanded(
                                child: Stack(children: [
                              Container(
                                  height: 28,
                                  decoration: BoxDecoration(
                                      color: Colors.grey[100],
                                      borderRadius: BorderRadius.circular(6))),
                              FractionallySizedBox(
                                  widthFactor: pct.clamp(0.02, 1),
                                  child: Container(
                                      height: 28,
                                      decoration: BoxDecoration(
                                          gradient: LinearGradient(colors: [
                                            barColor.withAlpha(178),
                                            barColor
                                          ]),
                                          borderRadius:
                                              BorderRadius.circular(6)),
                                      alignment: Alignment.centerLeft,
                                      padding: const EdgeInsets.only(left: 8),
                                      child: Text(_cFmt.format(rev),
                                          style: TextStyle(
                                              fontSize: 10,
                                              fontWeight: FontWeight.w600,
                                              color: pct > 0.3
                                                  ? Colors.white
                                                  : Colors.grey[700]),
                                          overflow: TextOverflow.ellipsis))),
                            ])),
                            const SizedBox(width: 10),
                            SizedBox(
                                width: 60,
                                child: Text('${c['qty'] ?? 0} qty',
                                    style: TextStyle(
                                        fontSize: 11, color: Colors.grey[500]),
                                    textAlign: TextAlign.right)),
                            Icon(Icons.chevron_right_rounded,
                                size: 16, color: Colors.grey[300]),
                          ])),
                    ));
              }),
            ])));
  }

  void _showCatDetail(Map<String, dynamic> c) {
    showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
              title: Row(children: [
                const Icon(Icons.category_rounded, color: _accent, size: 22),
                const SizedBox(width: 10),
                Expanded(
                    child: Text(c['name']?.toString() ?? 'Unknown',
                        style: const TextStyle(
                            fontSize: 15, fontWeight: FontWeight.w700))),
              ]),
              content: SizedBox(
                  width: 320,
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    _detailRow('Total Revenue', _cFmt.format(_d(c['revenue']))),
                    _detailRow('Items Sold', '${c['qty'] ?? 0}'),
                    _detailRow('Total Orders', '${c['orders'] ?? 0}'),
                    _detailRow(
                        'Avg Revenue/Order',
                        _i(c['orders']) > 0
                            ? _cFmt.format(_d(c['revenue']) / _i(c['orders']))
                            : 'N/A'),
                    _detailRow(
                        'Avg Qty/Order',
                        _i(c['orders']) > 0
                            ? (_i(c['qty']) / _i(c['orders']))
                                .toStringAsFixed(1)
                            : 'N/A'),
                  ])),
              actions: [
                TextButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      Navigator.pushNamed(context, '/admin/categories');
                    },
                    child: const Text('View Categories')),
                TextButton(
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text('Close')),
              ],
            ));
  }

  // ═══════════════════════════════════════════════════════════
  // PROMO CODES — searchable + sortable + clickable
  // ═══════════════════════════════════════════════════════════
  Widget _promoSection(List<Map<String, dynamic>> promos) {
    if (promos.isEmpty) return _emptyCard('No promo code data');

    // Filter
    final filtered = _promoSearch.isEmpty
        ? promos
        : promos
            .where((p) => (p['code']?.toString().toLowerCase() ?? '')
                .contains(_promoSearch.toLowerCase()))
            .toList();

    // Sort
    final sorted = List<Map<String, dynamic>>.from(filtered);
    sorted.sort((a, b) {
      dynamic va, vb;
      switch (_promoSortCol) {
        case 0:
          va = a['code'];
          vb = b['code'];
          break;
        case 1:
          va = _i(a['usageCount']);
          vb = _i(b['usageCount']);
          break;
        case 2:
          va = _i(a['orderCount']);
          vb = _i(b['orderCount']);
          break;
        case 3:
          va = _d(a['totalRevenue']);
          vb = _d(b['totalRevenue']);
          break;
        case 4:
          va = _d(a['totalDiscount']);
          vb = _d(b['totalDiscount']);
          break;
        default:
          va = _i(a['usageCount']);
          vb = _i(b['usageCount']);
      }
      final cmp =
          va is String ? va.compareTo(vb) : (va as num).compareTo(vb as num);
      return _promoSortAsc ? cmp : -cmp;
    });

    return _card(
        child: Padding(
            padding: const EdgeInsets.all(16),
            child:
                Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              // Search + sort bar
              Row(children: [
                SizedBox(
                    width: 220,
                    height: 36,
                    child: TextField(
                      onChanged: (v) => setState(() => _promoSearch = v),
                      style: const TextStyle(fontSize: 12),
                      decoration: InputDecoration(
                        hintText: 'Search promo codes...',
                        hintStyle:
                            TextStyle(fontSize: 12, color: Colors.grey[400]),
                        prefixIcon: Icon(Icons.search,
                            size: 16, color: Colors.grey[400]),
                        contentPadding:
                            const EdgeInsets.symmetric(horizontal: 10),
                        border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                            borderSide: BorderSide(color: Colors.grey[300]!)),
                        enabledBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                            borderSide: BorderSide(color: Colors.grey[300]!)),
                        focusedBorder: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(8),
                            borderSide: const BorderSide(color: _accent)),
                      ),
                    )),
                const SizedBox(width: 16),
                Text('Sort:',
                    style: TextStyle(fontSize: 11, color: Colors.grey[500])),
                const SizedBox(width: 6),
                ...[
                  ('Code', 0),
                  ('Usage', 1),
                  ('Orders', 2),
                  ('Revenue', 3),
                  ('Discount', 4)
                ].map((e) {
                  final isSel = _promoSortCol == e.$2;
                  return Padding(
                      padding: const EdgeInsets.only(right: 4),
                      child: InkWell(
                          borderRadius: BorderRadius.circular(6),
                          onTap: () => setState(() {
                                if (_promoSortCol == e.$2) {
                                  _promoSortAsc = !_promoSortAsc;
                                } else {
                                  _promoSortCol = e.$2;
                                  _promoSortAsc = false;
                                }
                              }),
                          child: Container(
                              padding: const EdgeInsets.symmetric(
                                  horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                  color: isSel
                                      ? _accent.withAlpha(20)
                                      : Colors.transparent,
                                  borderRadius: BorderRadius.circular(6),
                                  border: isSel
                                      ? Border.all(color: _accent, width: 1)
                                      : null),
                              child: Row(
                                  mainAxisSize: MainAxisSize.min,
                                  children: [
                                    Text(e.$1,
                                        style: TextStyle(
                                            fontSize: 11,
                                            color: isSel
                                                ? _accent
                                                : Colors.grey[600],
                                            fontWeight: isSel
                                                ? FontWeight.w600
                                                : FontWeight.w400)),
                                    if (isSel)
                                      Icon(
                                          _promoSortAsc
                                              ? Icons.arrow_upward
                                              : Icons.arrow_downward,
                                          size: 12,
                                          color: _accent),
                                  ]))));
                }),
              ]),
              const SizedBox(height: 14),
              if (filtered.isEmpty)
                Padding(
                    padding: const EdgeInsets.all(24),
                    child: Center(
                        child: Text('No promos match "$_promoSearch"',
                            style: TextStyle(color: Colors.grey[400]))))
              else
                SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: DataTable(
                      headingRowHeight: 40,
                      dataRowMinHeight: 36,
                      dataRowMaxHeight: 44,
                      columnSpacing: 20,
                      horizontalMargin: 0,
                      showCheckboxColumn: false,
                      headingTextStyle: const TextStyle(
                          fontWeight: FontWeight.w600,
                          fontSize: 11,
                          color: Color(0xFF64748B)),
                      dataTextStyle:
                          TextStyle(fontSize: 12, color: Colors.grey[800]),
                      columns: const [
                        DataColumn(label: Text('Code')),
                        DataColumn(label: Text('Type')),
                        DataColumn(label: Text('Value')),
                        DataColumn(label: Text('Usage'), numeric: true),
                        DataColumn(label: Text('Orders'), numeric: true),
                        DataColumn(label: Text('Revenue'), numeric: true),
                        DataColumn(label: Text('Discount'), numeric: true),
                        DataColumn(label: Text('Status')),
                      ],
                      rows: sorted.map((p) {
                        final usageCount = _i(p['usageCount']);
                        final usageLimit = _i(p['usageLimit']);
                        final isActive = p['isActive'] == true;
                        return DataRow(
                            onSelectChanged: (_) => _showPromoDetail(p),
                            cells: [
                              DataCell(Text(p['code']?.toString() ?? '',
                                  style: const TextStyle(
                                      fontWeight: FontWeight.w600))),
                              DataCell(Text(_fmtLabel(
                                  p['discountType']?.toString() ?? ''))),
                              DataCell(Text(p['discountType'] == 'PERCENTAGE'
                                  ? '${_d(p['discountValue']).toStringAsFixed(0)}%'
                                  : _cFmt.format(_d(p['discountValue'])))),
                              DataCell(Text(
                                  '$usageCount${usageLimit > 0 ? ' / $usageLimit' : ''}')),
                              DataCell(Text(_nFmt.format(_i(p['orderCount'])))),
                              DataCell(
                                  Text(_cFmt.format(_d(p['totalRevenue'])))),
                              DataCell(
                                  Text(_cFmt.format(_d(p['totalDiscount'])))),
                              DataCell(Container(
                                padding: const EdgeInsets.symmetric(
                                    horizontal: 8, vertical: 3),
                                decoration: BoxDecoration(
                                    color: (isActive ? _success : _danger)
                                        .withAlpha(20),
                                    borderRadius: BorderRadius.circular(6)),
                                child: Text(isActive ? 'Active' : 'Inactive',
                                    style: TextStyle(
                                        fontSize: 11,
                                        fontWeight: FontWeight.w600,
                                        color: isActive ? _success : _danger)),
                              )),
                            ]);
                      }).toList(),
                    )),
            ])));
  }

  void _showPromoDetail(Map<String, dynamic> p) {
    showDialog(
        context: context,
        builder: (ctx) => AlertDialog(
              shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.circular(16)),
              title: Row(children: [
                const Icon(Icons.local_offer_rounded, color: _pink, size: 22),
                const SizedBox(width: 10),
                Text(p['code']?.toString() ?? '',
                    style: const TextStyle(
                        fontSize: 16, fontWeight: FontWeight.w700)),
              ]),
              content: SizedBox(
                  width: 360,
                  child: Column(mainAxisSize: MainAxisSize.min, children: [
                    _detailRow('Discount Type',
                        _fmtLabel(p['discountType']?.toString() ?? '')),
                    _detailRow(
                        'Discount Value',
                        p['discountType'] == 'PERCENTAGE'
                            ? '${_d(p['discountValue']).toStringAsFixed(0)}%'
                            : _cFmt.format(_d(p['discountValue']))),
                    _detailRow('Usage Count', '${_i(p['usageCount'])}'),
                    _detailRow(
                        'Usage Limit',
                        _i(p['usageLimit']) > 0
                            ? '${_i(p['usageLimit'])}'
                            : 'Unlimited'),
                    _detailRow('Orders Driven', '${_i(p['orderCount'])}'),
                    _detailRow('Revenue Generated',
                        _cFmt.format(_d(p['totalRevenue']))),
                    _detailRow('Total Discount Given',
                        _cFmt.format(_d(p['totalDiscount']))),
                    _detailRow('Status',
                        p['isActive'] == true ? 'Active' : 'Inactive'),
                    if (_i(p['orderCount']) > 0)
                      _detailRow(
                          'Avg Revenue/Order',
                          _cFmt.format(
                              _d(p['totalRevenue']) / _i(p['orderCount']))),
                  ])),
              actions: [
                TextButton(
                    onPressed: () {
                      Navigator.pop(ctx);
                      Navigator.pushNamed(context, '/admin/promo-codes');
                    },
                    child: const Text('Manage Promos')),
                TextButton(
                    onPressed: () => Navigator.pop(ctx),
                    child: const Text('Close')),
              ],
            ));
  }

  // ═══════════════════════════════════════════════════════════
  // SHARED WIDGETS
  // ═══════════════════════════════════════════════════════════
  Widget _card({double? height, required Widget child}) => Container(
      height: height,
      decoration: BoxDecoration(
          color: _cardBg,
          borderRadius: BorderRadius.circular(14),
          boxShadow: [
            BoxShadow(
                color: Colors.black.withAlpha(10),
                blurRadius: 10,
                offset: const Offset(0, 2))
          ]),
      clipBehavior: Clip.antiAlias,
      child: child);

  Widget _emptyCard(String msg) => _card(
      height: 160,
      child: Center(
          child: Text(msg,
              style: TextStyle(color: Colors.grey[400], fontSize: 13))));

  Widget _miniKpi(String label, String value, Color color) => Expanded(
      child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 18, vertical: 14),
          decoration: BoxDecoration(
              color: _cardBg,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [
                BoxShadow(
                    color: Colors.black.withAlpha(10),
                    blurRadius: 10,
                    offset: const Offset(0, 2))
              ]),
          child: Row(children: [
            Container(
                width: 4,
                height: 36,
                decoration: BoxDecoration(
                    color: color, borderRadius: BorderRadius.circular(2))),
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
          ])));

  Widget _detailRow(String label, String value) => Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Text(label, style: TextStyle(color: Colors.grey[600], fontSize: 13)),
        Flexible(
            child: Text(value,
                style:
                    const TextStyle(fontWeight: FontWeight.w600, fontSize: 14),
                textAlign: TextAlign.right)),
      ]));

  Widget _statChip(String label, String value, Color color) => Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
          color: color.withAlpha(20), borderRadius: BorderRadius.circular(8)),
      child: Column(children: [
        Text(value,
            style: TextStyle(
                fontSize: 13, fontWeight: FontWeight.w700, color: color)),
        Text(label, style: TextStyle(fontSize: 9, color: color.withAlpha(178))),
      ]));
}

// ── Data class for KPI tiles ──
class _KpiData {
  final String label, value;
  final IconData icon;
  final Color color;
  final Map<String, dynamic> detail;
  final double? growthPct;
  _KpiData(this.label, this.value, this.icon, this.color, this.detail,
      {this.growthPct});
}
