import 'package:flutter/material.dart';
import '../../models/dto/content_dto.dart';

/// Porto Theme Header Stack
/// Combines: TopPromoBar + TopLinksBar + MainHeader + PrimaryNav
class PortoHeader extends StatefulWidget {
  final List<LandingSectionDto> headerSections;
  final VoidCallback? onCartTap;
  final VoidCallback? onAccountTap;
  final VoidCallback? onSearchTap;
  final Function(String)? onNavigate;

  const PortoHeader({
    super.key,
    required this.headerSections,
    this.onCartTap,
    this.onAccountTap,
    this.onSearchTap,
    this.onNavigate,
  });

  @override
  State<PortoHeader> createState() => _PortoHeaderState();
}

class _PortoHeaderState extends State<PortoHeader> {
  bool _promoBarDismissed = false;
  bool _mobileMenuOpen = false;

  LandingSectionDto? _findSection(String type) {
    try {
      return widget.headerSections.firstWhere((s) => s.type == type);
    } catch (_) {
      return null;
    }
  }

  @override
  Widget build(BuildContext context) {
    final promoBar = _findSection(LandingSectionType.topPromoBar);
    final topLinks = _findSection(LandingSectionType.topLinksBar);
    final mainHeader = _findSection(LandingSectionType.mainHeader);
    final primaryNav = _findSection(LandingSectionType.primaryNav);

    return Column(
      children: [
        if (promoBar != null && !_promoBarDismissed) _buildPromoBar(promoBar),
        if (topLinks != null) _buildTopLinksBar(topLinks),
        _buildMainHeader(mainHeader),
        if (primaryNav != null) _buildPrimaryNav(primaryNav),
        if (_mobileMenuOpen && primaryNav != null) _buildMobileMenu(primaryNav),
      ],
    );
  }

  Widget _buildPromoBar(LandingSectionDto section) {
    final data = section.data;
    final config = section.config ?? {};

    final text = data['text'] ??
        section.title ??
        'Free shipping on orders over AED 500!';
    final backgroundColor =
        _parseColor(config['backgroundColor']) ?? const Color(0xFF1A1A1A);
    final textColor = _parseColor(config['textColor']) ?? Colors.white;
    final dismissable = config['dismissable'] != false;

    return Container(
      color: backgroundColor,
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Expanded(
            child: Text(
              text,
              textAlign: TextAlign.center,
              style: TextStyle(
                color: textColor,
                fontSize: 13,
                fontWeight: FontWeight.w500,
                letterSpacing: 0.3,
              ),
            ),
          ),
          if (dismissable)
            IconButton(
              icon: Icon(Icons.close, color: textColor, size: 18),
              onPressed: () => setState(() => _promoBarDismissed = true),
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
            ),
        ],
      ),
    );
  }

  Widget _buildTopLinksBar(LandingSectionDto section) {
    final data = section.data;
    final config = section.config ?? {};

    final leftLinks = (data['leftLinks'] as List<dynamic>?) ?? [];
    final rightLinks = (data['rightLinks'] as List<dynamic>?) ??
        [
          {'label': 'About Us', 'url': '/about'},
          {'label': 'Contact', 'url': '/contact'},
          {'label': 'FAQs', 'url': '/faqs'},
        ];
    final backgroundColor =
        _parseColor(config['backgroundColor']) ?? const Color(0xFFF8F9FA);
    final textColor =
        _parseColor(config['textColor']) ?? const Color(0xFF666666);

    return Container(
      color: backgroundColor,
      padding: const EdgeInsets.symmetric(vertical: 8, horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            children: leftLinks
                .map((link) => _buildTopLink(link, textColor))
                .toList(),
          ),
          Row(
            children: rightLinks
                .map((link) => _buildTopLink(link, textColor))
                .toList(),
          ),
        ],
      ),
    );
  }

  Widget _buildTopLink(Map<String, dynamic> link, Color textColor) {
    final label = link['label'] as String? ?? '';
    final url = link['url'] as String? ?? '/';

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 12),
      child: GestureDetector(
        onTap: () => widget.onNavigate?.call(url),
        child: Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: textColor,
          ),
        ),
      ),
    );
  }

  Widget _buildMainHeader(LandingSectionDto? section) {
    final data = section?.data ?? {};
    final config = section?.config ?? {};

    final logoUrl = data['logoUrl'];
    final logoText = data['logoText'] ?? 'PORTO';
    final searchPlaceholder = data['searchPlaceholder'] ?? 'Search products...';
    final showSearch = config['showSearch'] != false;
    final showCart = config['showCart'] != false;
    final showAccount = config['showAccount'] != false;

    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 768;

    return Container(
      color: Colors.white,
      padding: EdgeInsets.symmetric(
        vertical: 16,
        horizontal: isMobile ? 16 : 60,
      ),
      child: Row(
        children: [
          // Mobile menu toggle
          if (isMobile)
            IconButton(
              icon: Icon(_mobileMenuOpen ? Icons.close : Icons.menu),
              onPressed: () =>
                  setState(() => _mobileMenuOpen = !_mobileMenuOpen),
            ),

          // Logo
          GestureDetector(
            onTap: () => widget.onNavigate?.call('/'),
            child: logoUrl != null
                ? Image.network(
                    logoUrl,
                    height: 40,
                    errorBuilder: (_, __, ___) => _buildTextLogo(logoText),
                  )
                : _buildTextLogo(logoText),
          ),

          const Spacer(),

          // Search bar (desktop only)
          if (showSearch && !isMobile)
            Expanded(
              flex: 2,
              child: Container(
                constraints: const BoxConstraints(maxWidth: 500),
                child: TextField(
                  decoration: InputDecoration(
                    hintText: searchPlaceholder,
                    prefixIcon: const Icon(Icons.search, color: Colors.grey),
                    border: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(4),
                      borderSide: const BorderSide(color: Color(0xFFE5E5E5)),
                    ),
                    enabledBorder: OutlineInputBorder(
                      borderRadius: BorderRadius.circular(4),
                      borderSide: const BorderSide(color: Color(0xFFE5E5E5)),
                    ),
                    contentPadding: const EdgeInsets.symmetric(
                        horizontal: 16, vertical: 12),
                    filled: true,
                    fillColor: const Color(0xFFF8F9FA),
                  ),
                  onSubmitted: (query) {
                    widget.onNavigate?.call('/search?q=$query');
                  },
                ),
              ),
            ),

          const Spacer(),

          // Action icons
          Row(
            children: [
              if (showSearch && isMobile)
                IconButton(
                  icon: const Icon(Icons.search),
                  onPressed: widget.onSearchTap,
                ),
              if (showAccount)
                IconButton(
                  icon: const Icon(Icons.person_outline),
                  onPressed: widget.onAccountTap,
                ),
              if (showCart)
                IconButton(
                  icon: const Icon(Icons.shopping_bag_outlined),
                  onPressed: widget.onCartTap,
                ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildTextLogo(String text) {
    return Text(
      text,
      style: const TextStyle(
        fontSize: 28,
        fontWeight: FontWeight.w700,
        letterSpacing: 2,
        color: Color(0xFF1A1A1A),
      ),
    );
  }

  Widget _buildPrimaryNav(LandingSectionDto section) {
    final data = section.data;
    final config = section.config ?? {};

    final menuItems = (data['items'] as List<dynamic>?) ?? [];
    final backgroundColor =
        _parseColor(config['backgroundColor']) ?? const Color(0xFF1A1A1A);
    final textColor = _parseColor(config['textColor']) ?? Colors.white;

    final screenWidth = MediaQuery.of(context).size.width;
    if (screenWidth < 768) return const SizedBox.shrink();

    return Container(
      color: backgroundColor,
      padding: const EdgeInsets.symmetric(horizontal: 60),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children:
            menuItems.map((item) => _buildNavItem(item, textColor)).toList(),
      ),
    );
  }

  Widget _buildNavItem(Map<String, dynamic> item, Color textColor) {
    final label = item['label'] as String? ?? '';
    final url = item['url'] as String? ?? '/';
    final children = item['children'] as List<dynamic>?;
    final hasDropdown = children != null && children.isNotEmpty;

    return PopupMenuButton<String>(
      enabled: hasDropdown,
      offset: const Offset(0, 48),
      onSelected: (url) => widget.onNavigate?.call(url),
      itemBuilder: (context) {
        if (!hasDropdown) return [];
        return children.map((child) {
          final childLabel = child['label'] as String? ?? '';
          final childUrl = child['url'] as String? ?? '/';
          return PopupMenuItem<String>(
            value: childUrl,
            child: Text(childLabel),
          );
        }).toList();
      },
      child: InkWell(
        onTap: hasDropdown ? null : () => widget.onNavigate?.call(url),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                label,
                style: TextStyle(
                  color: textColor,
                  fontSize: 14,
                  fontWeight: FontWeight.w500,
                  letterSpacing: 0.5,
                ),
              ),
              if (hasDropdown) ...[
                const SizedBox(width: 4),
                Icon(Icons.keyboard_arrow_down, color: textColor, size: 18),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildMobileMenu(LandingSectionDto section) {
    final data = section.data;
    final menuItems = (data['items'] as List<dynamic>?) ?? [];

    return Container(
      color: Colors.white,
      child: Column(
        children: menuItems.map((item) => _buildMobileMenuItem(item)).toList(),
      ),
    );
  }

  Widget _buildMobileMenuItem(Map<String, dynamic> item) {
    final label = item['label'] as String? ?? '';
    final url = item['url'] as String? ?? '/';
    final children = item['children'] as List<dynamic>?;
    final hasChildren = children != null && children.isNotEmpty;

    return ExpansionTile(
      title: Text(label),
      trailing: hasChildren ? null : const SizedBox.shrink(),
      childrenPadding: const EdgeInsets.only(left: 16),
      onExpansionChanged: hasChildren
          ? null
          : (_) {
              setState(() => _mobileMenuOpen = false);
              widget.onNavigate?.call(url);
            },
      children: hasChildren
          ? children.map((child) {
              final childLabel = child['label'] as String? ?? '';
              final childUrl = child['url'] as String? ?? '/';
              return ListTile(
                title: Text(childLabel),
                onTap: () {
                  setState(() => _mobileMenuOpen = false);
                  widget.onNavigate?.call(childUrl);
                },
              );
            }).toList()
          : [],
    );
  }

  Color? _parseColor(dynamic colorValue) {
    if (colorValue == null) return null;
    if (colorValue is String) {
      final hex = colorValue.replaceAll('#', '');
      if (hex.length == 6) {
        return Color(int.parse('FF$hex', radix: 16));
      }
    }
    return null;
  }
}
