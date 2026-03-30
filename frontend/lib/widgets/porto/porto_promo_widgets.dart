import 'package:flutter/material.dart';
import '../../models/dto/content_dto.dart';

/// Brand Logo Strip - Horizontal scrolling brand logos
class PortoBrandLogoStrip extends StatelessWidget {
  final LandingSectionDto section;
  final Function(int)? onBrandTap;

  const PortoBrandLogoStrip({
    super.key,
    required this.section,
    this.onBrandTap,
  });

  @override
  Widget build(BuildContext context) {
    final data = section.data;
    final config = section.config ?? {};

    final brands = (data['brands'] as List<dynamic>?) ?? [];
    final backgroundColor =
        _parseColor(config['backgroundColor']) ?? Colors.white;
    final autoScroll = config['autoScroll'] == true;

    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 600;

    return Container(
      color: backgroundColor,
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
              SizedBox(
                height: 80,
                child: ListView.builder(
                  scrollDirection: Axis.horizontal,
                  itemCount: brands.length,
                  itemBuilder: (context, index) {
                    return _buildBrandLogo(brands[index], index);
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildBrandLogo(Map<String, dynamic> brand, int index) {
    final name = brand['name'] as String? ?? '';
    final logoUrl = brand['logoUrl'] as String?;
    final id = brand['id'] as int? ?? index;

    return GestureDetector(
      onTap: () => onBrandTap?.call(id),
      child: Container(
        width: 140,
        margin: const EdgeInsets.symmetric(horizontal: 16),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            if (logoUrl != null)
              Image.network(
                logoUrl,
                height: 50,
                fit: BoxFit.contain,
                errorBuilder: (_, __, ___) => _buildPlaceholderLogo(name),
              )
            else
              _buildPlaceholderLogo(name),
          ],
        ),
      ),
    );
  }

  Widget _buildPlaceholderLogo(String name) {
    return Container(
      height: 50,
      padding: const EdgeInsets.symmetric(horizontal: 16),
      alignment: Alignment.center,
      decoration: BoxDecoration(
        color: const Color(0xFFF5F5F5),
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        name,
        style: const TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.w500,
          color: Color(0xFF666666),
        ),
        textAlign: TextAlign.center,
      ),
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

/// Promo Banner Row 3 - Three promotional banners in a row
class PortoPromoBannerRow3 extends StatelessWidget {
  final LandingSectionDto section;
  final Function(String)? onBannerTap;

  const PortoPromoBannerRow3({
    super.key,
    required this.section,
    this.onBannerTap,
  });

  @override
  Widget build(BuildContext context) {
    final data = section.data;

    final banners = (data['banners'] as List<dynamic>?) ?? [];

    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 600;

    return Container(
      padding: EdgeInsets.symmetric(
        vertical: 32,
        horizontal: isMobile ? 16 : 60,
      ),
      child: Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 1320),
          child: isMobile
              ? Column(
                  children: banners
                      .map((banner) => Padding(
                            padding: const EdgeInsets.only(bottom: 16),
                            child: _buildBanner(banner, double.infinity, 180),
                          ))
                      .toList(),
                )
              : Row(
                  children: banners
                      .map((banner) => Expanded(
                            child: Padding(
                              padding:
                                  const EdgeInsets.symmetric(horizontal: 8),
                              child: _buildBanner(banner, null, 220),
                            ),
                          ))
                      .toList(),
                ),
        ),
      ),
    );
  }

  Widget _buildBanner(
      Map<String, dynamic> banner, double? width, double height) {
    final title = banner['title'] as String? ?? '';
    final subtitle = banner['subtitle'] as String? ?? '';
    final imageUrl = banner['imageUrl'] as String?;
    final linkUrl = banner['linkUrl'] as String? ?? '/';
    final overlayColor = banner['overlayColor'] as String?;
    final textPosition = banner['textPosition'] as String? ?? 'center';

    return GestureDetector(
      onTap: () => onBannerTap?.call(linkUrl),
      child: Container(
        width: width,
        height: height,
        decoration: BoxDecoration(
          color: const Color(0xFFF5F5F5),
          borderRadius: BorderRadius.circular(4),
          image: imageUrl != null
              ? DecorationImage(
                  image: NetworkImage(imageUrl),
                  fit: BoxFit.cover,
                )
              : null,
        ),
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(4),
            gradient: LinearGradient(
              colors: [
                Colors.black.withOpacity(0.4),
                Colors.black.withOpacity(0.1),
              ],
              begin: Alignment.bottomCenter,
              end: Alignment.topCenter,
            ),
          ),
          padding: const EdgeInsets.all(24),
          alignment: _getAlignment(textPosition),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: _getCrossAxisAlignment(textPosition),
            children: [
              if (subtitle.isNotEmpty)
                Text(
                  subtitle,
                  style: TextStyle(
                    fontSize: 12,
                    color: Colors.white.withOpacity(0.9),
                    letterSpacing: 1,
                  ),
                ),
              if (title.isNotEmpty) ...[
                const SizedBox(height: 4),
                Text(
                  title,
                  style: const TextStyle(
                    fontSize: 20,
                    fontWeight: FontWeight.w600,
                    color: Colors.white,
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Alignment _getAlignment(String position) {
    switch (position) {
      case 'top-left':
        return Alignment.topLeft;
      case 'top-center':
        return Alignment.topCenter;
      case 'top-right':
        return Alignment.topRight;
      case 'center-left':
        return Alignment.centerLeft;
      case 'center-right':
        return Alignment.centerRight;
      case 'bottom-left':
        return Alignment.bottomLeft;
      case 'bottom-center':
        return Alignment.bottomCenter;
      case 'bottom-right':
        return Alignment.bottomRight;
      default:
        return Alignment.center;
    }
  }

  CrossAxisAlignment _getCrossAxisAlignment(String position) {
    if (position.contains('left')) return CrossAxisAlignment.start;
    if (position.contains('right')) return CrossAxisAlignment.end;
    return CrossAxisAlignment.center;
  }
}

/// Testimonials Section
class PortoTestimonials extends StatefulWidget {
  final LandingSectionDto section;

  const PortoTestimonials({super.key, required this.section});

  @override
  State<PortoTestimonials> createState() => _PortoTestimonialsState();
}

class _PortoTestimonialsState extends State<PortoTestimonials> {
  int _currentIndex = 0;
  late PageController _pageController;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final data = widget.section.data;
    final config = widget.section.config ?? {};

    final testimonials = (data['testimonials'] as List<dynamic>?) ??
        [
          {
            'text':
                'Amazing quality products and excellent customer service. Will definitely order again!',
            'author': 'Sarah M.',
            'role': 'Verified Buyer',
          },
          {
            'text':
                'Fast shipping and exactly what I expected. The packaging was also beautiful.',
            'author': 'Ahmed K.',
            'role': 'Verified Buyer',
          },
          {
            'text':
                'Best online shopping experience I\'ve had. The product quality exceeded my expectations.',
            'author': 'Maria L.',
            'role': 'Verified Buyer',
          },
        ];

    final backgroundColor =
        _parseColor(config['backgroundColor']) ?? const Color(0xFFF8F9FA);

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
          constraints: const BoxConstraints(maxWidth: 800),
          child: Column(
            children: [
              if (widget.section.title != null) ...[
                Text(
                  widget.section.title!,
                  style: const TextStyle(
                    fontSize: 28,
                    fontWeight: FontWeight.w300,
                    letterSpacing: 1,
                  ),
                ),
                const SizedBox(height: 40),
              ],
              SizedBox(
                height: 200,
                child: PageView.builder(
                  controller: _pageController,
                  itemCount: testimonials.length,
                  onPageChanged: (index) =>
                      setState(() => _currentIndex = index),
                  itemBuilder: (context, index) {
                    return _buildTestimonial(testimonials[index]);
                  },
                ),
              ),
              const SizedBox(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(testimonials.length, (index) {
                  return GestureDetector(
                    onTap: () => _pageController.animateToPage(
                      index,
                      duration: const Duration(milliseconds: 300),
                      curve: Curves.easeInOut,
                    ),
                    child: Container(
                      width: 10,
                      height: 10,
                      margin: const EdgeInsets.symmetric(horizontal: 4),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        color: _currentIndex == index
                            ? const Color(0xFF1A1A1A)
                            : const Color(0xFFE5E5E5),
                      ),
                    ),
                  );
                }),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildTestimonial(Map<String, dynamic> testimonial) {
    final text = testimonial['text'] as String? ?? '';
    final author = testimonial['author'] as String? ?? '';
    final role = testimonial['role'] as String? ?? '';

    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        // Quote
        Text(
          '"$text"',
          style: const TextStyle(
            fontSize: 18,
            fontStyle: FontStyle.italic,
            height: 1.6,
          ),
          textAlign: TextAlign.center,
        ),
        const SizedBox(height: 24),

        // Author
        Text(
          author,
          style: const TextStyle(
            fontSize: 14,
            fontWeight: FontWeight.w600,
          ),
        ),
        if (role.isNotEmpty) ...[
          const SizedBox(height: 4),
          Text(
            role,
            style: TextStyle(
              fontSize: 12,
              color: Colors.grey[600],
            ),
          ),
        ],
      ],
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
