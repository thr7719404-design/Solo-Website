import 'package:flutter/material.dart';
import 'dart:async';
import '../../models/dto/content_dto.dart';

/// Porto-style Hero Banner Section
/// Full-width carousel with slides, CTA buttons, and auto-play
class PortoHeroSection extends StatefulWidget {
  final LandingSectionDto section;

  const PortoHeroSection({super.key, required this.section});

  @override
  State<PortoHeroSection> createState() => _PortoHeroSectionState();
}

class _PortoHeroSectionState extends State<PortoHeroSection> {
  late PageController _pageController;
  int _currentPage = 0;
  Timer? _autoPlayTimer;

  List<Map<String, dynamic>> get slides {
    final rawSlides = widget.section.data['slides'] as List<dynamic>?;
    if (rawSlides == null) return [];
    return rawSlides.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  double get height => (widget.section.config?['height'] as num?)?.toDouble() ?? 600;
  double get mobileHeight => (widget.section.config?['mobileHeight'] as num?)?.toDouble() ?? 400;
  bool get autoPlay => widget.section.data['autoPlay'] as bool? ?? true;
  int get interval => (widget.section.data['interval'] as num?)?.toInt() ?? 5000;
  bool get showDots => widget.section.config?['showDots'] as bool? ?? true;
  bool get showArrows => widget.section.config?['showArrows'] as bool? ?? true;

  @override
  void initState() {
    super.initState();
    _pageController = PageController();
    if (autoPlay && slides.length > 1) {
      _startAutoPlay();
    }
  }

  @override
  void dispose() {
    _autoPlayTimer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  void _startAutoPlay() {
    _autoPlayTimer = Timer.periodic(Duration(milliseconds: interval), (_) {
      if (_pageController.hasClients) {
        final nextPage = (_currentPage + 1) % slides.length;
        _pageController.animateToPage(
          nextPage,
          duration: const Duration(milliseconds: 500),
          curve: Curves.easeInOut,
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    if (slides.isEmpty) {
      return const SizedBox.shrink();
    }

    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 600;
    final bannerHeight = isMobile ? mobileHeight : height;

    return SizedBox(
      height: bannerHeight,
      child: Stack(
        children: [
          // Slide PageView
          PageView.builder(
            controller: _pageController,
            itemCount: slides.length,
            onPageChanged: (index) {
              setState(() => _currentPage = index);
            },
            itemBuilder: (context, index) {
              final slide = slides[index];
              return _buildSlide(slide, isMobile);
            },
          ),
          
          // Navigation Arrows
          if (showArrows && slides.length > 1) ...[
            Positioned(
              left: 16,
              top: 0,
              bottom: 0,
              child: Center(
                child: _buildArrowButton(
                  icon: Icons.chevron_left,
                  onTap: () {
                    final prevPage = (_currentPage - 1 + slides.length) % slides.length;
                    _pageController.animateToPage(
                      prevPage,
                      duration: const Duration(milliseconds: 300),
                      curve: Curves.easeOut,
                    );
                  },
                ),
              ),
            ),
            Positioned(
              right: 16,
              top: 0,
              bottom: 0,
              child: Center(
                child: _buildArrowButton(
                  icon: Icons.chevron_right,
                  onTap: () {
                    final nextPage = (_currentPage + 1) % slides.length;
                    _pageController.animateToPage(
                      nextPage,
                      duration: const Duration(milliseconds: 300),
                      curve: Curves.easeOut,
                    );
                  },
                ),
              ),
            ),
          ],
          
          // Dot Indicators
          if (showDots && slides.length > 1)
            Positioned(
              bottom: 24,
              left: 0,
              right: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(slides.length, (index) {
                  return Container(
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: _currentPage == index ? 24 : 8,
                    height: 8,
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

  Widget _buildSlide(Map<String, dynamic> slide, bool isMobile) {
    final imageUrl = isMobile
        ? (slide['mobileImageUrl'] ?? slide['imageUrl']) as String?
        : slide['imageUrl'] as String?;
    final title = slide['title'] as String?;
    final subtitle = slide['subtitle'] as String?;
    final ctaText = slide['ctaText'] as String?;
    final ctaUrl = slide['ctaUrl'] as String?;
    final alignment = slide['alignment'] as String? ?? 'center';

    return Stack(
      fit: StackFit.expand,
      children: [
        // Background Image
        if (imageUrl != null)
          Image.network(
            imageUrl,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) => Container(
              color: Colors.grey[200],
              child: const Center(
                child: Icon(Icons.image_not_supported, size: 64, color: Colors.grey),
              ),
            ),
          )
        else
          Container(color: Colors.grey[300]),
        
        // Overlay gradient
        Container(
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                Colors.black.withOpacity(0.1),
                Colors.black.withOpacity(0.5),
              ],
            ),
          ),
        ),
        
        // Content
        Container(
          padding: EdgeInsets.symmetric(
            horizontal: isMobile ? 24 : 80,
            vertical: 40,
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: alignment == 'left'
                ? CrossAxisAlignment.start
                : alignment == 'right'
                    ? CrossAxisAlignment.end
                    : CrossAxisAlignment.center,
            children: [
              if (title != null)
                Text(
                  title,
                  style: TextStyle(
                    fontFamily: 'WorkSans',
                    fontSize: isMobile ? 32 : 56,
                    fontWeight: FontWeight.w300,
                    color: Colors.white,
                    letterSpacing: 2,
                    height: 1.2,
                  ),
                  textAlign: alignment == 'left'
                      ? TextAlign.left
                      : alignment == 'right'
                          ? TextAlign.right
                          : TextAlign.center,
                ),
              if (subtitle != null) ...[
                const SizedBox(height: 16),
                Text(
                  subtitle,
                  style: TextStyle(
                    fontFamily: 'WorkSans',
                    fontSize: isMobile ? 14 : 18,
                    fontWeight: FontWeight.w300,
                    color: Colors.white.withOpacity(0.9),
                    letterSpacing: 0.5,
                  ),
                  textAlign: alignment == 'left'
                      ? TextAlign.left
                      : alignment == 'right'
                          ? TextAlign.right
                          : TextAlign.center,
                ),
              ],
              if (ctaText != null) ...[
                const SizedBox(height: 32),
                ElevatedButton(
                  onPressed: () {
                    if (ctaUrl != null) {
                      Navigator.pushNamed(context, ctaUrl);
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: Colors.black,
                    padding: EdgeInsets.symmetric(
                      horizontal: isMobile ? 24 : 40,
                      vertical: isMobile ? 12 : 16,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(0),
                    ),
                  ),
                  child: Text(
                    ctaText,
                    style: TextStyle(
                      fontFamily: 'WorkSans',
                      fontSize: isMobile ? 12 : 14,
                      fontWeight: FontWeight.w500,
                      letterSpacing: 2,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildArrowButton({required IconData icon, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      child: Container(
        width: 48,
        height: 48,
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.9),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: Colors.black, size: 28),
      ),
    );
  }
}
