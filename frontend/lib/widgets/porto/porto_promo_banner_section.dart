import 'package:flutter/material.dart';
import '../../models/dto/content_dto.dart';

/// Porto-style Promo Banner Section
/// Full-width promotional banner with CTA
class PortoPromoBannerSection extends StatelessWidget {
  final LandingSectionDto section;

  const PortoPromoBannerSection({super.key, required this.section});

  String get backgroundColor => section.data['backgroundColor'] as String? ?? '#1a1a1a';
  String get textColor => section.data['textColor'] as String? ?? '#ffffff';
  String? get imageUrl => section.data['imageUrl'] as String?;
  String? get ctaText => section.data['ctaText'] as String?;
  String? get ctaUrl => section.data['ctaUrl'] as String?;
  String get alignment => section.data['alignment'] as String? ?? 'center';
  double get height => (section.config?['height'] as num?)?.toDouble() ?? 300;
  double get mobileHeight => (section.config?['mobileHeight'] as num?)?.toDouble() ?? 200;
  bool get fullWidth => section.config?['fullWidth'] as bool? ?? true;

  Color _parseColor(String hexColor) {
    hexColor = hexColor.replaceAll('#', '');
    if (hexColor.length == 6) {
      hexColor = 'FF$hexColor';
    }
    return Color(int.parse(hexColor, radix: 16));
  }

  @override
  Widget build(BuildContext context) {
    final bgColor = _parseColor(backgroundColor);
    final txtColor = _parseColor(textColor);
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 600;
    final bannerHeight = isMobile ? mobileHeight : height;

    Widget content = Container(
      height: bannerHeight,
      decoration: BoxDecoration(
        color: bgColor,
      ),
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Background Image
          if (imageUrl != null)
            Positioned.fill(
              child: Image.network(
                imageUrl!,
                fit: BoxFit.cover,
                errorBuilder: (context, error, stackTrace) => const SizedBox.shrink(),
              ),
            ),
          
          // Overlay for text readability
          if (imageUrl != null)
            Container(
              decoration: BoxDecoration(
                gradient: LinearGradient(
                  begin: Alignment.centerLeft,
                  end: Alignment.centerRight,
                  colors: [
                    bgColor.withOpacity(0.8),
                    bgColor.withOpacity(0.4),
                  ],
                ),
              ),
            ),
          
          // Content
          Container(
            padding: EdgeInsets.symmetric(
              horizontal: isMobile ? 24 : 80,
              vertical: 32,
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: alignment == 'left'
                  ? CrossAxisAlignment.start
                  : alignment == 'right'
                      ? CrossAxisAlignment.end
                      : CrossAxisAlignment.center,
              children: [
                if (section.title != null)
                  Text(
                    section.title!,
                    style: TextStyle(
                      fontFamily: 'WorkSans',
                      fontSize: isMobile ? 24 : 36,
                      fontWeight: FontWeight.w300,
                      color: txtColor,
                      letterSpacing: 1,
                    ),
                    textAlign: alignment == 'left'
                        ? TextAlign.left
                        : alignment == 'right'
                            ? TextAlign.right
                            : TextAlign.center,
                  ),
                if (section.subtitle != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    section.subtitle!,
                    style: TextStyle(
                      fontFamily: 'WorkSans',
                      fontSize: isMobile ? 14 : 16,
                      fontWeight: FontWeight.w300,
                      color: txtColor.withOpacity(0.8),
                    ),
                    textAlign: alignment == 'left'
                        ? TextAlign.left
                        : alignment == 'right'
                            ? TextAlign.right
                            : TextAlign.center,
                  ),
                ],
                if (ctaText != null) ...[
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () {
                      if (ctaUrl != null) {
                        Navigator.pushNamed(context, ctaUrl!);
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: txtColor,
                      foregroundColor: bgColor,
                      padding: EdgeInsets.symmetric(
                        horizontal: isMobile ? 24 : 32,
                        vertical: isMobile ? 12 : 14,
                      ),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(0),
                      ),
                    ),
                    child: Text(
                      ctaText!,
                      style: TextStyle(
                        fontFamily: 'WorkSans',
                        fontSize: isMobile ? 12 : 13,
                        fontWeight: FontWeight.w500,
                        letterSpacing: 1.5,
                      ),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );

    if (!fullWidth) {
      content = Padding(
        padding: EdgeInsets.symmetric(horizontal: isMobile ? 16 : 60),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: content,
        ),
      );
    }

    return content;
  }
}
