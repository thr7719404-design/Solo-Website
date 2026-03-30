import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'dart:async';
import '../providers/content_provider.dart';
import '../models/dto/content_dto.dart';

class HeroBanner extends StatefulWidget {
  final String? placement;

  const HeroBanner({
    super.key,
    this.placement,
  });

  @override
  State<HeroBanner> createState() => _HeroBannerState();
}

class _HeroBannerState extends State<HeroBanner> {
  final PageController _pageController = PageController();
  int _currentPage = 0;
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    // Load banners on mount
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ContentProvider>().loadBanners(
            placement: widget.placement ?? BannerPlacement.homeHero,
          );
    });
  }

  void _startAutoScroll(int bannerCount) {
    _timer?.cancel();
    if (bannerCount > 1) {
      _timer = Timer.periodic(const Duration(seconds: 5), (timer) {
        if (_pageController.hasClients) {
          final nextPage = (_currentPage + 1) % bannerCount;
          _pageController.animateToPage(
            nextPage,
            duration: const Duration(milliseconds: 500),
            curve: Curves.easeInOut,
          );
        }
      });
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<ContentProvider>(
      builder: (context, provider, child) {
        // Loading state
        if (provider.isBannersLoading) {
          return Container(
            height: 400,
            color: Colors.grey[100],
            child: Center(
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.black,
              ),
            ),
          );
        }

        // Error state
        if (provider.hasBannersError) {
          return Container(
            height: 400,
            color: Colors.grey[100],
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 48, color: Colors.grey[400]),
                  const SizedBox(height: 16),
                  Text(
                    'Failed to load banners',
                    style: TextStyle(color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 8),
                  TextButton(
                    onPressed: () => provider.reloadBanners(),
                    child: const Text('Try Again'),
                  ),
                ],
              ),
            ),
          );
        }

        // Empty state
        if (!provider.hasBanners) {
          return const SizedBox.shrink();
        }

        final banners = provider.banners;

        // Start auto-scroll when banners load
        if (_timer == null) {
          _startAutoScroll(banners.length);
        }

        return Column(
          children: [
            SizedBox(
              height: 400,
              child: PageView.builder(
                controller: _pageController,
                onPageChanged: (index) {
                  setState(() => _currentPage = index);
                },
                itemCount: banners.length,
                itemBuilder: (context, index) {
                  final banner = banners[index];
                  return _buildBannerItem(context, banner);
                },
              ),
            ),
            if (banners.length > 1) ...[
              const SizedBox(height: 16),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(banners.length, (index) {
                  return AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: _currentPage == index ? 24 : 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: _currentPage == index
                          ? const Color(0xFF1A1A1A)
                          : Colors.grey[300],
                      borderRadius: BorderRadius.zero,
                    ),
                  );
                }),
              ),
            ],
          ],
        );
      },
    );
  }

  Widget _buildBannerItem(BuildContext context, BannerDto banner) {
    final screenWidth = MediaQuery.of(context).size.width;

    // Responsive breakpoints (matching design system)
    final isMobile = screenWidth < 600;
    final isTablet = screenWidth >= 600 && screenWidth < 900;

    // Choose appropriate image based on screen size
    final imageUrl = isMobile && banner.imageMobileUrl != null
        ? banner.imageMobileUrl!
        : banner.imageDesktopUrl;

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 0),
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Background Image
          ClipRect(
            child: Image.network(
              imageUrl,
              fit: BoxFit.cover,
              errorBuilder: (context, error, stackTrace) {
                return Container(
                  decoration: BoxDecoration(
                    gradient: LinearGradient(
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                      colors: [
                        Colors.grey[300]!,
                        Colors.grey[400]!,
                      ],
                    ),
                  ),
                );
              },
            ),
          ),

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

          // Content
          Padding(
            padding: EdgeInsets.all(isMobile
                ? 24
                : isTablet
                    ? 32
                    : 48),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ...[
                  Text(
                    banner.title,
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: isMobile
                          ? 28
                          : isTablet
                              ? 32
                              : 36,
                      fontWeight: FontWeight.bold,
                      height: 1.2,
                    ),
                  ),
                  const SizedBox(height: 12),
                ],
                if (banner.subtitle != null) ...[
                  Text(
                    banner.subtitle!,
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.9),
                      fontSize: isMobile
                          ? 14
                          : isTablet
                              ? 16
                              : 18,
                    ),
                  ),
                  const SizedBox(height: 24),
                ],
                if (banner.ctaText != null) ...[
                  ElevatedButton(
                    onPressed: () {
                      // TODO: Handle CTA URL navigation
                      if (banner.ctaUrl != null) {
                        // TODO: Navigate to banner.ctaUrl
                      }
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: Colors.black,
                      padding: EdgeInsets.symmetric(
                        horizontal: isMobile ? 24 : 32,
                        vertical: isMobile ? 12 : 16,
                      ),
                    ),
                    child: Text(
                      banner.ctaText!,
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }
}
