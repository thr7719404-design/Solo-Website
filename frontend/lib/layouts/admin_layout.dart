import 'package:flutter/material.dart';

/// ═══════════════════════════════════════════════════════════════════
/// ADMIN LAYOUT — Clean, modern shell with sidebar + top bar
/// ═══════════════════════════════════════════════════════════════════
class AdminLayout extends StatefulWidget {
  final Widget child;
  final String currentRoute;

  const AdminLayout({
    super.key,
    required this.child,
    required this.currentRoute,
  });

  @override
  State<AdminLayout> createState() => _AdminLayoutState();
}

class _AdminLayoutState extends State<AdminLayout> {
  bool _collapsed = false;

  // ── Design tokens ─────────────────────────────────────
  static const _sidebarBg = Color(0xFF111827); // slate-900
  static const _sidebarW = 240.0;
  static const _collapsedW = 72.0;
  static const _accent = Color(0xFF6366F1); // indigo-500
  static const _surface = Color(0xFFF8F9FC);

  @override
  Widget build(BuildContext context) {
    final w = MediaQuery.of(context).size.width;
    final isMobile = w < 900;

    return Scaffold(
      backgroundColor: _surface,
      appBar: _topBar(isMobile),
      drawer: isMobile
          ? Drawer(backgroundColor: _sidebarBg, child: _sidebar())
          : null,
      body: isMobile
          ? widget.child
          : Row(children: [
              _sidebar(),
              Expanded(child: widget.child),
            ]),
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  TOP BAR
  // ═══════════════════════════════════════════════════════════
  PreferredSizeWidget _topBar(bool isMobile) {
    return AppBar(
      elevation: 0,
      scrolledUnderElevation: 1,
      backgroundColor: Colors.white,
      foregroundColor: const Color(0xFF1F2937),
      surfaceTintColor: Colors.transparent,
      title: Row(children: [
        Text('Solo',
            style: TextStyle(
              fontSize: 20,
              fontWeight: FontWeight.w800,
              color: _accent,
              letterSpacing: -0.5,
            )),
        const SizedBox(width: 8),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
          decoration: BoxDecoration(
            color: _accent.withOpacity(0.1),
            borderRadius: BorderRadius.circular(6),
          ),
          child: Text('ADMIN',
              style: TextStyle(
                fontSize: 10,
                fontWeight: FontWeight.w700,
                color: _accent,
                letterSpacing: 1,
              )),
        ),
      ]),
      actions: [
        IconButton(
          icon: Icon(Icons.storefront_outlined,
              color: Colors.grey[600], size: 20),
          onPressed: () => Navigator.of(context).pushReplacementNamed('/'),
          tooltip: 'View Store',
        ),
        const SizedBox(width: 4),
        IconButton(
          icon: Icon(Icons.notifications_none_rounded,
              color: Colors.grey[600], size: 20),
          onPressed: () {},
          tooltip: 'Notifications',
        ),
        const SizedBox(width: 4),
        Container(
          margin: const EdgeInsets.only(right: 16),
          width: 32,
          height: 32,
          decoration: BoxDecoration(
            color: _accent.withOpacity(0.1),
            shape: BoxShape.circle,
          ),
          child: Icon(Icons.person_outline, color: _accent, size: 18),
        ),
      ],
    );
  }

  // ═══════════════════════════════════════════════════════════
  //  SIDEBAR
  // ═══════════════════════════════════════════════════════════
  Widget _sidebar() {
    return AnimatedContainer(
      duration: const Duration(milliseconds: 200),
      curve: Curves.easeInOut,
      width: _collapsed ? _collapsedW : _sidebarW,
      color: _sidebarBg,
      child: Column(children: [
        // ── Collapse toggle ──
        Padding(
          padding: EdgeInsets.symmetric(
            horizontal: _collapsed ? 12 : 16,
            vertical: 14,
          ),
          child: Row(children: [
            if (!_collapsed) ...[
              Icon(Icons.space_dashboard_outlined,
                  color: Colors.white.withOpacity(0.7), size: 18),
              const SizedBox(width: 10),
              Expanded(
                child: Text('Navigation',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: Colors.white.withOpacity(0.7),
                      letterSpacing: 0.2,
                    )),
              ),
            ] else
              const Spacer(),
            _collapseBtn(),
          ]),
        ),
        Divider(color: Colors.white.withOpacity(0.08), height: 1),
        // ── Nav items ──
        Expanded(
          child: ListView(
            padding: const EdgeInsets.symmetric(vertical: 10),
            children: [
              _navItem(Icons.dashboard_rounded, 'Dashboard', '/admin'),
              _sectionGap(),
              _sectionLabel('Catalog'),
              _navItem(
                  Icons.inventory_2_outlined, 'Products', '/admin/products'),
              _navItem(
                  Icons.category_outlined, 'Categories', '/admin/categories'),
              _navItem(Icons.loyalty_outlined, 'Brands', '/admin/brands'),
              _sectionGap(),
              _sectionLabel('Content'),
              _navItem(
                  Icons.view_carousel_outlined, 'Banners', '/admin/banners'),
              _navItem(
                  Icons.web_outlined, 'Landing Pages', '/admin/landing-pages'),
              _sectionGap(),
              _sectionLabel('Sales'),
              _navItem(Icons.shopping_bag_outlined, 'Orders', '/admin/orders'),
              _navItem(Icons.people_outline_rounded, 'Customers',
                  '/admin/customers'),
              _navItem(Icons.local_offer_outlined, 'Promo Codes',
                  '/admin/promo-codes'),
              _sectionGap(),
              _sectionLabel('Reports'),
              _navItem(
                  Icons.analytics_outlined, 'Business Intel', '/admin/reports'),
              _sectionGap(),
              _sectionLabel('Configs'),
              _navItem(Icons.payment_outlined, 'Stripe', '/admin/stripe'),
              _navItem(
                  Icons.percent_rounded, 'VAT Config', '/admin/vat-config'),
            ],
          ),
        ),
        // ── Footer ──
        Divider(color: Colors.white.withOpacity(0.08), height: 1),
        Padding(
          padding: const EdgeInsets.all(12),
          child: _navItem(Icons.storefront_outlined, 'View Store', '/',
              isFooter: true),
        ),
      ]),
    );
  }

  Widget _collapseBtn() {
    return InkWell(
      borderRadius: BorderRadius.circular(8),
      onTap: () => setState(() => _collapsed = !_collapsed),
      child: Container(
        padding: const EdgeInsets.all(6),
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.06),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Icon(
          _collapsed ? Icons.chevron_right_rounded : Icons.chevron_left_rounded,
          color: Colors.white.withOpacity(0.6),
          size: 18,
        ),
      ),
    );
  }

  Widget _sectionLabel(String label) {
    if (_collapsed) return const SizedBox.shrink();

    return Padding(
      padding: const EdgeInsets.fromLTRB(20, 0, 16, 8),
      child: Text(
        label.toUpperCase(),
        style: TextStyle(
          fontSize: 10,
          fontWeight: FontWeight.w700,
          color: Colors.white.withOpacity(0.35),
          letterSpacing: 1.5,
        ),
      ),
    );
  }

  Widget _sectionGap() => const SizedBox(height: 16);

  Widget _navItem(IconData icon, String label, String route,
      {bool isFooter = false}) {
    final isActive = widget.currentRoute == route && !isFooter;

    if (_collapsed && !isFooter) {
      return Container(
        margin: const EdgeInsets.symmetric(horizontal: 10, vertical: 2),
        decoration: BoxDecoration(
          color: isActive ? _accent.withOpacity(0.15) : Colors.transparent,
          borderRadius: BorderRadius.circular(10),
        ),
        child: IconButton(
          icon: Icon(icon,
              color: isActive ? _accent : Colors.white.withOpacity(0.5),
              size: 20),
          onPressed: () => Navigator.of(context).pushReplacementNamed(route),
          tooltip: label,
        ),
      );
    }

    return Padding(
      padding: EdgeInsets.symmetric(
        horizontal: isFooter ? 0 : 10,
        vertical: 1,
      ),
      child: Material(
        color: isActive ? _accent.withOpacity(0.12) : Colors.transparent,
        borderRadius: BorderRadius.circular(10),
        child: InkWell(
          borderRadius: BorderRadius.circular(10),
          hoverColor: Colors.white.withOpacity(0.05),
          onTap: () => Navigator.of(context).pushReplacementNamed(route),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            child: Row(children: [
              Icon(icon,
                  color: isActive ? _accent : Colors.white.withOpacity(0.55),
                  size: 19),
              if (!_collapsed) ...[
                const SizedBox(width: 12),
                Expanded(
                  child: Text(label,
                      style: TextStyle(
                        fontSize: 13,
                        fontWeight:
                            isActive ? FontWeight.w600 : FontWeight.w400,
                        color: isActive
                            ? Colors.white
                            : Colors.white.withOpacity(0.65),
                      )),
                ),
                if (isActive)
                  Container(
                    width: 5,
                    height: 5,
                    decoration: BoxDecoration(
                      color: _accent,
                      shape: BoxShape.circle,
                    ),
                  ),
              ],
            ]),
          ),
        ),
      ),
    );
  }
}
