import 'package:flutter/material.dart';
import 'dart:async';

/// CMS Hero Slider Widget
/// Renders a full-width PageView slider from CMS config.slides
class CmsHeroSlider extends StatefulWidget {
  final Map<String, dynamic> config;
  final Function(String type, String value)? onCtaTap;

  const CmsHeroSlider({
    super.key,
    required this.config,
    this.onCtaTap,
  });

  @override
  State<CmsHeroSlider> createState() => _CmsHeroSliderState();
}

class _CmsHeroSliderState extends State<CmsHeroSlider> {
  late PageController _pageController;
  int _currentPage = 0;
  Timer? _autoplayTimer;

  List<Map<String, dynamic>> get slides {
    final rawSlides = widget.config['slides'];
    if (rawSlides == null || rawSlides is! List) return [];
    return rawSlides.map((s) => Map<String, dynamic>.from(s)).toList();
  }

  int get autoplayMs => widget.config['autoplayMs'] ?? 5000;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    _startAutoplay();
  }

  @override
  void dispose() {
    _autoplayTimer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  void _startAutoplay() {
    if (slides.length > 1 && autoplayMs > 0) {
      _autoplayTimer = Timer.periodic(Duration(milliseconds: autoplayMs), (_) {
        if (mounted && _pageController.hasClients) {
          final nextPage = (_currentPage + 1) % slides.length;
          _pageController.animateToPage(
            nextPage,
            duration: const Duration(milliseconds: 500),
            curve: Curves.easeInOut,
          );
        }
      });
    }
  }

  void _handleCtaTap(Map<String, dynamic> slide) {
    final targetType = slide['ctaTargetType'] as String? ?? '';
    final targetValue = slide['ctaTargetValue'] as String? ?? '';

    if (widget.onCtaTap != null) {
      widget.onCtaTap!(targetType, targetValue);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (slides.isEmpty) return const SizedBox.shrink();

    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 600;
    final sliderHeight = isMobile ? 280.0 : 480.0;

    return SizedBox(
      height: sliderHeight,
      child: Stack(
        children: [
          PageView.builder(
            controller: _pageController,
            onPageChanged: (index) {
              setState(() => _currentPage = index);
            },
            itemCount: slides.length,
            itemBuilder: (context, index) {
              final slide = slides[index];
              final imageUrl = isMobile
                  ? (slide['mobileImageUrl'] ?? slide['imageUrl'] ?? '')
                  : (slide['imageUrl'] ?? '');
              final title = slide['title'] ?? '';
              final subtitle = slide['subtitle'] ?? '';
              final ctaLabel = slide['ctaLabel'] ?? '';

              return Stack(
                fit: StackFit.expand,
                children: [
                  // Background Image
                  if (imageUrl.isNotEmpty)
                    Image.network(
                      imageUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => Container(
                        color: Colors.grey[200],
                        child: const Icon(Icons.image_not_supported, size: 48),
                      ),
                    )
                  else
                    Container(color: Colors.grey[300]),

                  // Gradient Overlay
                  Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.centerLeft,
                        end: Alignment.centerRight,
                        colors: [
                          Colors.black.withOpacity(0.6),
                          Colors.transparent,
                        ],
                      ),
                    ),
                  ),

                  // Text Content
                  Positioned(
                    left: isMobile ? 20 : 60,
                    bottom: isMobile ? 40 : 80,
                    right: isMobile ? 20 : null,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (title.isNotEmpty)
                          Text(
                            title,
                            style: TextStyle(
                              fontFamily: 'WorkSans',
                              fontSize: isMobile ? 28 : 42,
                              fontWeight: FontWeight.w600,
                              color: Colors.white,
                              height: 1.2,
                            ),
                          ),
                        if (subtitle.isNotEmpty) ...[
                          const SizedBox(height: 8),
                          Text(
                            subtitle,
                            style: TextStyle(
                              fontFamily: 'WorkSans',
                              fontSize: isMobile ? 14 : 18,
                              fontWeight: FontWeight.w300,
                              color: Colors.white.withOpacity(0.9),
                            ),
                          ),
                        ],
                        if (ctaLabel.isNotEmpty) ...[
                          const SizedBox(height: 20),
                          ElevatedButton(
                            onPressed: () => _handleCtaTap(slide),
                            style: ElevatedButton.styleFrom(
                              backgroundColor: Colors.white,
                              foregroundColor: Colors.black,
                              padding: EdgeInsets.symmetric(
                                horizontal: isMobile ? 24 : 32,
                                vertical: isMobile ? 12 : 16,
                              ),
                              shape: RoundedRectangleBorder(
                                borderRadius: BorderRadius.circular(0),
                              ),
                            ),
                            child: Text(
                              ctaLabel.toUpperCase(),
                              style: TextStyle(
                                fontFamily: 'WorkSans',
                                fontSize: isMobile ? 12 : 14,
                                fontWeight: FontWeight.w600,
                                letterSpacing: 1.5,
                              ),
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                ],
              );
            },
          ),

          // Page Indicators
          if (slides.length > 1)
            Positioned(
              bottom: 16,
              left: 0,
              right: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(slides.length, (index) {
                  return Container(
                    width: _currentPage == index ? 24 : 8,
                    height: 8,
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    decoration: BoxDecoration(
                      color: _currentPage == index
                          ? Colors.white
                          : Colors.white.withOpacity(0.5),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  );
                }),
              ),
            ),
        ],
      ),
    );
  }
}

/// CMS Category Tiles Widget
/// Renders a 2x2 (or responsive) grid of category tiles
class CmsCategoryTiles extends StatelessWidget {
  final String? title;
  final Map<String, dynamic> config;
  final Function(String type, String value)? onTileTap;

  const CmsCategoryTiles({
    super.key,
    this.title,
    required this.config,
    this.onTileTap,
  });

  List<Map<String, dynamic>> get tiles {
    final rawTiles = config['tiles'];
    if (rawTiles == null || rawTiles is! List) return [];
    return rawTiles
        .where((t) => t['isEnabled'] == true)
        .map((t) => Map<String, dynamic>.from(t))
        .toList();
  }

  String get layout => config['layout'] ?? 'grid4';

  @override
  Widget build(BuildContext context) {
    if (tiles.isEmpty) return const SizedBox.shrink();

    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 600;
    final padding = isMobile ? 16.0 : 60.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title != null && title!.isNotEmpty) ...[
          Padding(
            padding: EdgeInsets.symmetric(horizontal: padding),
            child: Text(
              title!,
              style: TextStyle(
                fontFamily: 'WorkSans',
                fontSize: isMobile ? 24 : 32,
                fontWeight: FontWeight.w400,
                color: Colors.black,
              ),
            ),
          ),
          const SizedBox(height: 24),
        ],
        Padding(
          padding: EdgeInsets.symmetric(horizontal: padding),
          child: LayoutBuilder(
            builder: (context, constraints) {
              int crossAxisCount;
              double childAspectRatio;

              if (constraints.maxWidth < 600) {
                crossAxisCount = 2;
                childAspectRatio = 0.85;
              } else if (constraints.maxWidth < 900) {
                crossAxisCount = layout == 'grid2' ? 2 : 4;
                childAspectRatio = 0.9;
              } else {
                crossAxisCount = layout == 'grid2' ? 2 : 4;
                childAspectRatio = 0.9;
              }

              return GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: crossAxisCount,
                  crossAxisSpacing: 16,
                  mainAxisSpacing: 16,
                  childAspectRatio: childAspectRatio,
                ),
                itemCount: tiles.length,
                itemBuilder: (context, index) {
                  final tile = tiles[index];
                  return _CmsCategoryTile(
                    tile: tile,
                    onTap: () {
                      final targetType = tile['targetType'] as String? ?? '';
                      final targetValue = tile['targetValue'] as String? ?? '';
                      if (onTileTap != null) {
                        onTileTap!(targetType, targetValue);
                      }
                    },
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }
}

class _CmsCategoryTile extends StatelessWidget {
  final Map<String, dynamic> tile;
  final VoidCallback? onTap;

  const _CmsCategoryTile({
    required this.tile,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final title = tile['title'] ?? '';
    final subtitle = tile['subtitle'] ?? '';
    final imageUrl = tile['imageUrl'] ?? '';

    return MouseRegion(
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              // Image
              Expanded(
                flex: 3,
                child: Container(
                  color: Colors.grey[100],
                  child: imageUrl.isNotEmpty
                      ? Image.network(
                          imageUrl,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => Icon(
                            Icons.image_not_supported,
                            size: 40,
                            color: Colors.grey[400],
                          ),
                        )
                      : Icon(
                          Icons.category,
                          size: 40,
                          color: Colors.grey[400],
                        ),
                ),
              ),
              // Title & Subtitle
              Expanded(
                flex: 1,
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                  alignment: Alignment.center,
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        title.toUpperCase(),
                        style: const TextStyle(
                          fontFamily: 'WorkSans',
                          fontSize: 13,
                          fontWeight: FontWeight.w600,
                          color: Color(0xFF1A1A1A),
                          letterSpacing: 1,
                        ),
                        textAlign: TextAlign.center,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      if (subtitle.isNotEmpty) ...[
                        const SizedBox(height: 2),
                        Text(
                          subtitle,
                          style: TextStyle(
                            fontFamily: 'WorkSans',
                            fontSize: 11,
                            fontWeight: FontWeight.w300,
                            color: Colors.grey[600],
                          ),
                          textAlign: TextAlign.center,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],
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
}
