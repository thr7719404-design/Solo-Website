import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../models/dto/content_dto.dart';

/// Loyalty Program banner section driven by HOME_MID placement
class LoyaltyProgramBanner extends StatefulWidget {
  const LoyaltyProgramBanner({super.key});

  @override
  State<LoyaltyProgramBanner> createState() => _LoyaltyProgramBannerState();
}

class _LoyaltyProgramBannerState extends State<LoyaltyProgramBanner> {
  BannerDto? _banner;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadBanner();
  }

  Future<void> _loadBanner() async {
    try {
      final banners =
          await ApiService.content.getBanners(placement: 'HOME_MID');
      if (mounted) {
        setState(() {
          // Get first active banner ordered by displayOrder
          _banner = banners.isNotEmpty ? banners.first : null;
          _isLoading = false;
        });
      }
    } catch (e) {
      debugPrint('Error loading HOME_MID banner: $e');
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // Loading state
    if (_isLoading) {
      return const SizedBox.shrink();
    }

    // No banner available
    if (_banner == null) {
      return const SizedBox.shrink();
    }

    final banner = _banner!;
    final isMobile = MediaQuery.of(context).size.width < 768;
    final imageUrl = isMobile && banner.imageMobileUrl != null
        ? banner.imageMobileUrl!
        : banner.imageDesktopUrl ?? '';

    return InkWell(
      onTap: () {
        final url = banner.ctaUrl;
        if (url == null || url.isEmpty) return;

        // Navigate to internal app route
        Navigator.pushNamed(context, url);
      },
      child: Container(
        decoration: BoxDecoration(border: Border.all(width: 4)),
        child: Container(
          width: double.infinity,
          margin: EdgeInsets.symmetric(
            horizontal: isMobile ? 16 : 60,
            vertical: 24,
          ),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 20,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(16),
            child: Stack(
              children: [
                // Background Image
                if (imageUrl.isNotEmpty)
                  Positioned.fill(
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
                                const Color(0xFFFFD700).withOpacity(0.2),
                                const Color(0xFFFFA500).withOpacity(0.3),
                              ],
                            ),
                          ),
                        );
                      },
                    ),
                  ),

                // Golden Overlay
                Positioned.fill(
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.centerLeft,
                        end: Alignment.centerRight,
                        colors: [
                          Colors.black.withOpacity(0.7),
                          Colors.transparent,
                        ],
                      ),
                    ),
                  ),
                ),

                // Content
                Padding(
                  padding: EdgeInsets.all(isMobile ? 24 : 48),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      // Title
                      Text(
                        banner.title,
                        style: TextStyle(
                          fontSize: isMobile ? 24 : 36,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFFFFD700),
                          height: 1.2,
                        ),
                      ),

                      if (banner.subtitle != null &&
                          banner.subtitle!.isNotEmpty) ...[
                        const SizedBox(height: 16),
                        // Subtitle
                        Text(
                          banner.subtitle!,
                          style: TextStyle(
                            fontSize: isMobile ? 14 : 18,
                            color: Colors.white,
                            height: 1.5,
                          ),
                          maxLines: 3,
                          overflow: TextOverflow.ellipsis,
                        ),
                      ],

                      if (banner.ctaText != null &&
                          banner.ctaText!.isNotEmpty) ...[
                        const SizedBox(height: 24),
                        // CTA Button
                        ElevatedButton(
                          onPressed: () {
                            if (banner.ctaUrl != null &&
                                banner.ctaUrl!.isNotEmpty) {
                              // Navigate to CTA URL
                              Navigator.pushNamed(context, banner.ctaUrl!);
                            }
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFFFFD700),
                            foregroundColor: Colors.black,
                            padding: EdgeInsets.symmetric(
                              horizontal: isMobile ? 24 : 32,
                              vertical: isMobile ? 12 : 16,
                            ),
                            shape: RoundedRectangleBorder(
                              borderRadius: BorderRadius.circular(8),
                            ),
                            elevation: 4,
                          ),
                          child: Text(
                            banner.ctaText!,
                            style: TextStyle(
                              fontSize: isMobile ? 14 : 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                      ],
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
