import 'package:flutter/material.dart';
import '../../models/dto/content_dto.dart';

/// Porto Theme Footer
/// CMS-driven footer with configurable columns
class PortoFooter extends StatelessWidget {
  final LandingSectionDto? footerSection;
  final Map<String, dynamic>? siteSettings;
  final Function(String)? onNavigate;

  const PortoFooter({
    super.key,
    this.footerSection,
    this.siteSettings,
    this.onNavigate,
  });

  @override
  Widget build(BuildContext context) {
    final data = footerSection?.data ?? {};
    final config = footerSection?.config ?? {};

    final columns = (data['columns'] as List<dynamic>?) ?? _defaultColumns;
    final copyright = data['copyright'] ??
        siteSettings?['footerCopyright'] ??
        '© 2025 Porto Store. All rights reserved.';
    final socialLinks = (data['socialLinks'] as List<dynamic>?) ??
        _parseSocialLinks(siteSettings);
    final backgroundColor =
        _parseColor(config['backgroundColor']) ?? const Color(0xFF1A1A1A);
    final textColor = _parseColor(config['textColor']) ?? Colors.white;

    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 768;

    return Container(
      color: backgroundColor,
      child: Column(
        children: [
          // Main footer content
          Padding(
            padding: EdgeInsets.symmetric(
              vertical: 48,
              horizontal: isMobile ? 16 : 60,
            ),
            child: Center(
              child: Container(
                constraints: const BoxConstraints(maxWidth: 1320),
                child: isMobile
                    ? Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          ...columns
                              .map((col) => _buildColumn(col, textColor, true)),
                          const SizedBox(height: 32),
                          _buildSocialLinks(socialLinks, textColor),
                        ],
                      )
                    : Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          ...columns.map((col) => Expanded(
                              child: _buildColumn(col, textColor, false))),
                          Expanded(
                              child:
                                  _buildSocialColumn(socialLinks, textColor)),
                        ],
                      ),
              ),
            ),
          ),

          // Copyright bar
          Container(
            color: backgroundColor.withOpacity(0.9),
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 16),
            child: Center(
              child: Text(
                copyright,
                style: TextStyle(
                  color: textColor.withOpacity(0.7),
                  fontSize: 13,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildColumn(
      Map<String, dynamic> column, Color textColor, bool isMobile) {
    final title = column['title'] as String? ?? '';
    final links = (column['links'] as List<dynamic>?) ?? [];

    return Padding(
      padding: EdgeInsets.only(bottom: isMobile ? 24 : 0, right: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: TextStyle(
              color: textColor,
              fontSize: 16,
              fontWeight: FontWeight.w600,
              letterSpacing: 0.5,
            ),
          ),
          const SizedBox(height: 16),
          ...links.map((link) => _buildFooterLink(link, textColor)),
        ],
      ),
    );
  }

  Widget _buildFooterLink(Map<String, dynamic> link, Color textColor) {
    final label = link['label'] as String? ?? '';
    final url = link['url'] as String? ?? '/';

    return Padding(
      padding: const EdgeInsets.only(bottom: 10),
      child: GestureDetector(
        onTap: () => onNavigate?.call(url),
        child: Text(
          label,
          style: TextStyle(
            color: textColor.withOpacity(0.7),
            fontSize: 14,
          ),
        ),
      ),
    );
  }

  Widget _buildSocialColumn(List<dynamic> socialLinks, Color textColor) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Follow Us',
          style: TextStyle(
            color: textColor,
            fontSize: 16,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 16),
        _buildSocialLinks(socialLinks, textColor),
        const SizedBox(height: 24),
        Text(
          'Contact Info',
          style: TextStyle(
            color: textColor,
            fontSize: 16,
            fontWeight: FontWeight.w600,
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 16),
        Text(
          siteSettings?['contactEmail'] ?? 'hello@porto.com',
          style: TextStyle(
            color: textColor.withOpacity(0.7),
            fontSize: 14,
          ),
        ),
        const SizedBox(height: 8),
        Text(
          siteSettings?['contactPhone'] ?? '+971 4 123 4567',
          style: TextStyle(
            color: textColor.withOpacity(0.7),
            fontSize: 14,
          ),
        ),
      ],
    );
  }

  Widget _buildSocialLinks(List<dynamic> socialLinks, Color textColor) {
    return Row(
      children: socialLinks.map((social) {
        final platform = social['platform'] as String? ?? '';
        final url = social['url'] as String? ?? '';

        return Padding(
          padding: const EdgeInsets.only(right: 16),
          child: GestureDetector(
            onTap: () {
              // Open external URL
            },
            child: Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: textColor.withOpacity(0.3)),
              ),
              child: Icon(
                _getSocialIcon(platform),
                color: textColor.withOpacity(0.8),
                size: 20,
              ),
            ),
          ),
        );
      }).toList(),
    );
  }

  IconData _getSocialIcon(String platform) {
    switch (platform.toLowerCase()) {
      case 'facebook':
        return Icons.facebook;
      case 'twitter':
        return Icons.close; // X icon
      case 'instagram':
        return Icons.camera_alt_outlined;
      case 'youtube':
        return Icons.play_circle_outline;
      case 'linkedin':
        return Icons.work_outline;
      case 'tiktok':
        return Icons.music_note;
      default:
        return Icons.link;
    }
  }

  List<Map<String, dynamic>> _parseSocialLinks(Map<String, dynamic>? settings) {
    if (settings == null) return [];
    final links = <Map<String, dynamic>>[];

    if (settings['socialFacebook'] != null) {
      links.add({'platform': 'facebook', 'url': settings['socialFacebook']});
    }
    if (settings['socialInstagram'] != null) {
      links.add({'platform': 'instagram', 'url': settings['socialInstagram']});
    }
    if (settings['socialTwitter'] != null) {
      links.add({'platform': 'twitter', 'url': settings['socialTwitter']});
    }
    if (settings['socialYoutube'] != null) {
      links.add({'platform': 'youtube', 'url': settings['socialYoutube']});
    }

    return links;
  }

  List<Map<String, dynamic>> get _defaultColumns => [
        {
          'title': 'Shop',
          'links': [
            {'label': 'All Products', 'url': '/products'},
            {'label': 'New Arrivals', 'url': '/new-arrivals'},
            {'label': 'Best Sellers', 'url': '/best-sellers'},
            {'label': 'On Sale', 'url': '/sale'},
          ],
        },
        {
          'title': 'Customer Service',
          'links': [
            {'label': 'Contact Us', 'url': '/contact'},
            {'label': 'FAQs', 'url': '/faqs'},
            {'label': 'Shipping Info', 'url': '/shipping'},
            {'label': 'Returns', 'url': '/returns'},
          ],
        },
        {
          'title': 'About',
          'links': [
            {'label': 'About Us', 'url': '/about'},
            {'label': 'Our Story', 'url': '/story'},
            {'label': 'Careers', 'url': '/careers'},
          ],
        },
      ];

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
