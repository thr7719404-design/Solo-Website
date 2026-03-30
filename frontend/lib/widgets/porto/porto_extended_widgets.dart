import 'package:flutter/material.dart';
import '../../models/dto/content_dto.dart';

/// Top Promo Bar - Dismissable promotional message bar
class PortoTopPromoBar extends StatefulWidget {
  final LandingSectionDto section;
  final VoidCallback? onDismiss;

  const PortoTopPromoBar({
    super.key,
    required this.section,
    this.onDismiss,
  });

  @override
  State<PortoTopPromoBar> createState() => _PortoTopPromoBarState();
}

class _PortoTopPromoBarState extends State<PortoTopPromoBar> {
  bool _dismissed = false;

  @override
  Widget build(BuildContext context) {
    if (_dismissed) return const SizedBox.shrink();

    final data = widget.section.data;
    final config = widget.section.config ?? {};
    
    final text = data['text'] ?? widget.section.title ?? 'Special Offer';
    final backgroundColor = _parseColor(config['backgroundColor']) ?? const Color(0xFF1A1A1A);
    final textColor = _parseColor(config['textColor']) ?? Colors.white;
    final dismissable = config['dismissable'] == true;
    final link = data['link'];

    return Container(
      color: backgroundColor,
      padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Expanded(
            child: GestureDetector(
              onTap: link != null ? () => Navigator.pushNamed(context, link) : null,
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
          ),
          if (dismissable)
            IconButton(
              icon: Icon(Icons.close, color: textColor, size: 18),
              onPressed: () {
                setState(() => _dismissed = true);
                widget.onDismiss?.call();
              },
              padding: EdgeInsets.zero,
              constraints: const BoxConstraints(minWidth: 32, minHeight: 32),
            ),
        ],
      ),
    );
  }

  Color? _parseColor(dynamic colorValue) {
    if (colorValue == null) return null;
    if (colorValue is String) {
      final hex = colorValue.replaceAll('#', '');
      return Color(int.parse('FF$hex', radix: 16));
    }
    return null;
  }
}

/// Value Propositions Row - Row of 3-4 value icons/text
class PortoValuePropsRow extends StatelessWidget {
  final LandingSectionDto section;

  const PortoValuePropsRow({super.key, required this.section});

  @override
  Widget build(BuildContext context) {
    final data = section.data;
    final config = section.config ?? {};
    
    final items = (data['items'] as List<dynamic>?) ?? [
      {'icon': 'local_shipping', 'title': 'Free Shipping', 'subtitle': 'On orders over AED 500'},
      {'icon': 'replay', 'title': 'Easy Returns', 'subtitle': '30-day return policy'},
      {'icon': 'support_agent', 'title': '24/7 Support', 'subtitle': 'We\'re here to help'},
      {'icon': 'verified_user', 'title': 'Secure Payment', 'subtitle': '100% secure checkout'},
    ];

    final backgroundColor = _parseColor(config['backgroundColor']) ?? const Color(0xFFF8F9FA);
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 600;

    return Container(
      color: backgroundColor,
      padding: EdgeInsets.symmetric(
        vertical: isMobile ? 24 : 32,
        horizontal: isMobile ? 16 : 60,
      ),
      child: Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 1320),
          child: isMobile
              ? Column(
                  children: items.map((item) => _buildValueProp(item, true)).toList(),
                )
              : Row(
                  mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                  children: items.map((item) => Expanded(child: _buildValueProp(item, false))).toList(),
                ),
        ),
      ),
    );
  }

  Widget _buildValueProp(Map<String, dynamic> item, bool isMobile) {
    final iconName = item['icon'] as String? ?? 'check_circle';
    final title = item['title'] as String? ?? '';
    final subtitle = item['subtitle'] as String? ?? '';

    return Padding(
      padding: EdgeInsets.symmetric(
        vertical: isMobile ? 12 : 0,
        horizontal: 8,
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            _getIconData(iconName),
            size: 32,
            color: const Color(0xFF1A1A1A),
          ),
          const SizedBox(width: 12),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 14,
                  fontWeight: FontWeight.w600,
                  color: Color(0xFF1A1A1A),
                ),
              ),
              if (subtitle.isNotEmpty)
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.grey[600],
                  ),
                ),
            ],
          ),
        ],
      ),
    );
  }

  IconData _getIconData(String name) {
    switch (name) {
      case 'local_shipping': return Icons.local_shipping_outlined;
      case 'replay': return Icons.replay;
      case 'support_agent': return Icons.support_agent;
      case 'verified_user': return Icons.verified_user_outlined;
      case 'credit_card': return Icons.credit_card;
      case 'star': return Icons.star_border;
      default: return Icons.check_circle_outline;
    }
  }

  Color? _parseColor(dynamic colorValue) {
    if (colorValue == null) return null;
    if (colorValue is String) {
      final hex = colorValue.replaceAll('#', '');
      return Color(int.parse('FF$hex', radix: 16));
    }
    return null;
  }
}

/// Info Blocks 3 - Three-column info cards
class PortoInfoBlocks3 extends StatelessWidget {
  final LandingSectionDto section;

  const PortoInfoBlocks3({super.key, required this.section});

  @override
  Widget build(BuildContext context) {
    final data = section.data;
    final config = section.config ?? {};
    
    final blocks = (data['blocks'] as List<dynamic>?) ?? [
      {
        'icon': 'local_shipping',
        'title': 'Free Shipping',
        'description': 'Free shipping on all UAE orders over AED 500. International shipping available.',
      },
      {
        'icon': 'support_agent',
        'title': 'Customer Support',
        'description': 'Our dedicated team is available 24/7 to assist you with any questions.',
      },
      {
        'icon': 'verified',
        'title': 'Quality Guarantee',
        'description': 'All products come with a quality guarantee. Your satisfaction is our priority.',
      },
    ];

    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 600;

    return Container(
      padding: EdgeInsets.symmetric(
        vertical: 64,
        horizontal: isMobile ? 16 : 60,
      ),
      child: Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 1320),
          child: Column(
            children: [
              if (section.title != null) ...[
                Text(
                  section.title!,
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w300,
                    letterSpacing: 1,
                  ),
                ),
                const SizedBox(height: 8),
              ],
              if (section.subtitle != null) ...[
                Text(
                  section.subtitle!,
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
                const SizedBox(height: 40),
              ],
              isMobile
                  ? Column(
                      children: blocks.map((block) => _buildInfoBlock(block)).toList(),
                    )
                  : Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: blocks.map((block) => Expanded(child: _buildInfoBlock(block))).toList(),
                    ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildInfoBlock(Map<String, dynamic> block) {
    final iconName = block['icon'] as String? ?? 'info';
    final title = block['title'] as String? ?? '';
    final description = block['description'] as String? ?? '';

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          Container(
            width: 80,
            height: 80,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: const Color(0xFFE5E5E5), width: 1),
            ),
            child: Icon(
              _getIconData(iconName),
              size: 36,
              color: const Color(0xFF1A1A1A),
            ),
          ),
          const SizedBox(height: 20),
          Text(
            title,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.w600,
              color: Color(0xFF1A1A1A),
            ),
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: 12),
          Text(
            description,
            style: TextStyle(
              fontSize: 14,
              color: Colors.grey[600],
              height: 1.6,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ),
    );
  }

  IconData _getIconData(String name) {
    switch (name) {
      case 'local_shipping': return Icons.local_shipping_outlined;
      case 'support_agent': return Icons.support_agent;
      case 'verified': return Icons.verified_outlined;
      case 'credit_card': return Icons.credit_card;
      case 'replay': return Icons.replay;
      default: return Icons.info_outline;
    }
  }
}

/// Sale Strip Banner - Full-width promotional strip
class PortoSaleStripBanner extends StatelessWidget {
  final LandingSectionDto section;

  const PortoSaleStripBanner({super.key, required this.section});

  @override
  Widget build(BuildContext context) {
    final data = section.data;
    final config = section.config ?? {};
    
    final title = section.title ?? data['title'] ?? 'SALE';
    final subtitle = section.subtitle ?? data['subtitle'] ?? 'Up to 50% Off';
    final ctaText = data['ctaText'] ?? 'Shop Now';
    final ctaUrl = data['ctaUrl'] ?? '/sale';
    final imageUrl = data['imageUrl'];
    final backgroundColor = _parseColor(config['backgroundColor']) ?? const Color(0xFF1A1A1A);
    final textColor = _parseColor(config['textColor']) ?? Colors.white;

    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 600;

    return Container(
      height: isMobile ? 200 : 300,
      decoration: BoxDecoration(
        color: backgroundColor,
        image: imageUrl != null
            ? DecorationImage(
                image: NetworkImage(imageUrl),
                fit: BoxFit.cover,
                colorFilter: ColorFilter.mode(
                  Colors.black.withOpacity(0.4),
                  BlendMode.darken,
                ),
              )
            : null,
      ),
      child: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              title,
              style: TextStyle(
                fontSize: isMobile ? 28 : 42,
                fontWeight: FontWeight.w300,
                color: textColor,
                letterSpacing: 8,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              subtitle,
              style: TextStyle(
                fontSize: isMobile ? 16 : 20,
                color: textColor.withOpacity(0.9),
              ),
            ),
            const SizedBox(height: 24),
            OutlinedButton(
              onPressed: () => Navigator.pushNamed(context, ctaUrl),
              style: OutlinedButton.styleFrom(
                foregroundColor: textColor,
                side: BorderSide(color: textColor),
                padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 16),
              ),
              child: Text(
                ctaText,
                style: const TextStyle(
                  letterSpacing: 1,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Color? _parseColor(dynamic colorValue) {
    if (colorValue == null) return null;
    if (colorValue is String) {
      final hex = colorValue.replaceAll('#', '');
      return Color(int.parse('FF$hex', radix: 16));
    }
    return null;
  }
}

/// Newsletter Block
class PortoNewsletterBlock extends StatefulWidget {
  final LandingSectionDto section;

  const PortoNewsletterBlock({super.key, required this.section});

  @override
  State<PortoNewsletterBlock> createState() => _PortoNewsletterBlockState();
}

class _PortoNewsletterBlockState extends State<PortoNewsletterBlock> {
  final _emailController = TextEditingController();
  bool _subscribed = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final data = widget.section.data;
    final config = widget.section.config ?? {};
    
    final title = widget.section.title ?? 'Subscribe to Our Newsletter';
    final subtitle = widget.section.subtitle ?? 'Get the latest updates on new products and upcoming sales';
    final backgroundColor = _parseColor(config['backgroundColor']) ?? const Color(0xFFF8F9FA);

    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 600;

    return Container(
      color: backgroundColor,
      padding: EdgeInsets.symmetric(
        vertical: 64,
        horizontal: isMobile ? 16 : 60,
      ),
      child: Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 600),
          child: Column(
            children: [
              Text(
                title,
                style: const TextStyle(
                  fontSize: 24,
                  fontWeight: FontWeight.w400,
                  letterSpacing: 0.5,
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 12),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 14,
                  color: Colors.grey[600],
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 32),
              if (_subscribed)
                const Text(
                  'Thank you for subscribing!',
                  style: TextStyle(
                    color: Colors.green,
                    fontWeight: FontWeight.w500,
                  ),
                )
              else
                Row(
                  children: [
                    Expanded(
                      child: TextField(
                        controller: _emailController,
                        decoration: InputDecoration(
                          hintText: 'Enter your email address',
                          border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(0),
                            borderSide: const BorderSide(color: Color(0xFFE5E5E5)),
                          ),
                          contentPadding: const EdgeInsets.symmetric(
                            horizontal: 16,
                            vertical: 16,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 8),
                    ElevatedButton(
                      onPressed: () {
                        if (_emailController.text.isNotEmpty) {
                          setState(() => _subscribed = true);
                        }
                      },
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF1A1A1A),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(
                          horizontal: 24,
                          vertical: 18,
                        ),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(0),
                        ),
                      ),
                      child: const Text('Subscribe'),
                    ),
                  ],
                ),
            ],
          ),
        ),
      ),
    );
  }

  Color? _parseColor(dynamic colorValue) {
    if (colorValue == null) return null;
    if (colorValue is String) {
      final hex = colorValue.replaceAll('#', '');
      return Color(int.parse('FF$hex', radix: 16));
    }
    return null;
  }
}

/// Category Circle Strip - Horizontal scrollable category circles
class PortoCategoryCircleStrip extends StatelessWidget {
  final LandingSectionDto section;

  const PortoCategoryCircleStrip({super.key, required this.section});

  @override
  Widget build(BuildContext context) {
    final data = section.data;
    final config = section.config ?? {};
    
    final categories = (data['categories'] as List<dynamic>?) ?? [];

    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 600;

    return Container(
      padding: EdgeInsets.symmetric(
        vertical: 48,
        horizontal: isMobile ? 16 : 60,
      ),
      child: Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 1320),
          child: Column(
            children: [
              if (section.title != null) ...[
                Text(
                  section.title!,
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.w300,
                    letterSpacing: 1,
                  ),
                ),
                const SizedBox(height: 32),
              ],
              SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: categories.map((cat) => _buildCategoryCircle(context, cat)).toList(),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildCategoryCircle(BuildContext context, Map<String, dynamic> category) {
    final name = category['name'] as String? ?? '';
    final imageUrl = category['imageUrl'] as String?;
    final linkUrl = category['linkUrl'] as String? ?? '/category';

    return GestureDetector(
      onTap: () => Navigator.pushNamed(context, linkUrl),
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: const Color(0xFFF5F5F5),
                image: imageUrl != null
                    ? DecorationImage(
                        image: NetworkImage(imageUrl),
                        fit: BoxFit.cover,
                      )
                    : null,
                border: Border.all(
                  color: const Color(0xFFE5E5E5),
                  width: 2,
                ),
              ),
              child: imageUrl == null
                  ? const Icon(Icons.category, size: 40, color: Colors.grey)
                  : null,
            ),
            const SizedBox(height: 12),
            Text(
              name,
              style: const TextStyle(
                fontSize: 14,
                fontWeight: FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
