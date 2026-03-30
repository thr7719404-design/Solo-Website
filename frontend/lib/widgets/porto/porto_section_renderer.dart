import 'package:flutter/material.dart';
import '../../models/dto/content_dto.dart';
import '../../models/dto/product_dto.dart';
import '../../models/blog.dart';
import '../../providers/home_provider.dart';
import 'porto_hero_section.dart';
import 'porto_category_tiles_section.dart';
import 'porto_category_grid_section.dart';
import 'porto_product_carousel_section.dart';
import 'porto_brand_strip_section.dart';
import 'porto_extended_widgets.dart';
import 'porto_promo_widgets.dart';
import 'porto_blog_widgets.dart';

/// Porto Section Renderer
/// Maps section.type to the appropriate Porto-style widget
class PortoSectionRenderer extends StatelessWidget {
  final LandingSectionDto section;
  final HomeProvider homeProvider;
  final Function(ProductDto)? onProductTap;
  final Function(ProductDto)? onAddToCart;
  final Function(String)? onNavigate;
  final List<BlogPost>? blogPosts;
  final VoidCallback? onPromoDismiss;

  const PortoSectionRenderer({
    super.key,
    required this.section,
    required this.homeProvider,
    this.onProductTap,
    this.onAddToCart,
    this.onNavigate,
    this.blogPosts,
    this.onPromoDismiss,
  });

  @override
  Widget build(BuildContext context) {
    switch (section.type) {
      case LandingSectionType.hero:
        return PortoHeroSection(section: section);

      case LandingSectionType.categoryTiles:
        return PortoCategoryTilesSection(section: section);

      case LandingSectionType.categoryGrid:
        return PortoCategoryGridSection(section: section);

      case LandingSectionType.productCarousel:
        final products = homeProvider.getProductsForSection(section);
        final isLoading = homeProvider.isLoadingForSection(section);
        return PortoProductCarouselSection(
          section: section,
          products: products,
          isLoading: isLoading,
          onProductTap: onProductTap,
          onAddToCart: onAddToCart,
        );

      case LandingSectionType.brandStrip:
        return PortoBrandStripSection(section: section);

      case LandingSectionType.promoBanner:
        final bgColorHex =
            (section.data['backgroundColor'] as String?) ?? '#1a1a1a';
        final textColorHex =
            (section.data['textColor'] as String?) ?? '#ffffff';
        final imageUrl = section.data['imageUrl'] as String?;
        final ctaText = section.data['ctaText'] as String?;
        final ctaUrl = section.data['ctaUrl'] as String?;
        final alignment = section.data['alignment'] as String? ?? 'center';

        Color parseHex(String hex) {
          hex = hex.replaceAll('#', '');
          if (hex.length == 6) hex = 'FF$hex';
          return Color(int.parse(hex, radix: 16));
        }

        final bgColor = parseHex(bgColorHex);
        final txtColor = parseHex(textColorHex);

        return Material(
          child: InkWell(
            onTap: () {
              if (ctaUrl != null && ctaUrl.isNotEmpty) {
                Navigator.pushNamed(context, ctaUrl);
              }
            },
            child: Container(
              height: 200,
              alignment: alignment == 'left'
                  ? Alignment.centerLeft
                  : alignment == 'right'
                      ? Alignment.centerRight
                      : Alignment.center,
              decoration: BoxDecoration(
                color: bgColor,
                image: imageUrl != null && imageUrl.isNotEmpty
                    ? DecorationImage(
                        image: NetworkImage(imageUrl),
                        fit: BoxFit.cover,
                        colorFilter: ColorFilter.mode(
                          bgColor.withOpacity(0.6),
                          BlendMode.darken,
                        ),
                      )
                    : null,
              ),
              padding: const EdgeInsets.symmetric(horizontal: 60),
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
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: txtColor,
                        fontFamily: 'WorkSans',
                      ),
                    ),
                  if (section.subtitle != null) ...[
                    const SizedBox(height: 8),
                    Text(
                      section.subtitle!,
                      style: TextStyle(
                        fontSize: 16,
                        color: txtColor.withOpacity(0.85),
                        fontFamily: 'WorkSans',
                      ),
                    ),
                  ],
                  if (ctaText != null && ctaText.isNotEmpty) ...[
                    const SizedBox(height: 16),
                    Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 24,
                        vertical: 10,
                      ),
                      decoration: BoxDecoration(
                        border: Border.all(color: txtColor),
                        borderRadius: BorderRadius.circular(2),
                      ),
                      child: Text(
                        ctaText,
                        style: TextStyle(
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: txtColor,
                          fontFamily: 'WorkSans',
                          letterSpacing: 1,
                        ),
                      ),
                    ),
                  ],
                ],
              ),
            ),
          ),
        );

      // Legacy types - map to Porto equivalents
      case LandingSectionType.productGrid:
        final products = homeProvider.getProductsForSection(section);
        final isLoading = homeProvider.isLoadingForSection(section);
        return PortoProductCarouselSection(
          section: section,
          products: products,
          isLoading: isLoading,
          onProductTap: onProductTap,
          onAddToCart: onAddToCart,
        );

      // New Porto Theme section types
      case LandingSectionType.topPromoBar:
        return PortoTopPromoBar(
          section: section,
          onDismiss: onPromoDismiss,
        );

      case LandingSectionType.valuePropsRow:
        return PortoValuePropsRow(section: section);

      case LandingSectionType.promoBannerRow3:
        return PortoPromoBannerRow3(
          section: section,
          onBannerTap: onNavigate,
        );

      case LandingSectionType.saleStripBanner:
        return PortoSaleStripBanner(section: section);

      case LandingSectionType.categoryCircleStrip:
        return PortoCategoryCircleStrip(section: section);

      case LandingSectionType.infoBlocks3:
        return PortoInfoBlocks3(section: section);

      case LandingSectionType.blogLatestGrid:
        return PortoBlogLatestGrid(
          section: section,
          posts: blogPosts,
          onPostTap: onNavigate,
        );

      case LandingSectionType.brandLogoStrip:
        return PortoBrandLogoStrip(
          section: section,
          onBrandTap: (id) => onNavigate?.call('/brand/$id'),
        );

      case LandingSectionType.newsletterBlock:
        return PortoNewsletterBlock(section: section);

      case LandingSectionType.testimonials:
        return PortoTestimonials(section: section);

      // Header/Footer sections are handled separately by PortoHeader/PortoFooter
      case LandingSectionType.topLinksBar:
      case LandingSectionType.mainHeader:
      case LandingSectionType.primaryNav:
      case LandingSectionType.heroSlider:
      case LandingSectionType.productCollection:
      case LandingSectionType.footerConfig:
        return const SizedBox.shrink();

      default:
        // Return empty container for unknown section types
        return const SizedBox.shrink();
    }
  }
}

/// Porto-style section container with consistent spacing
class PortoSectionContainer extends StatelessWidget {
  final String? title;
  final String? subtitle;
  final Widget child;
  final EdgeInsetsGeometry? padding;
  final Color? backgroundColor;
  final bool showDivider;

  const PortoSectionContainer({
    super.key,
    this.title,
    this.subtitle,
    required this.child,
    this.padding,
    this.backgroundColor,
    this.showDivider = false,
  });

  @override
  Widget build(BuildContext context) {
    final screenWidth = MediaQuery.of(context).size.width;
    final horizontalPadding = screenWidth < 600 ? 16.0 : 60.0;
    final maxWidth = 1320.0;

    return Container(
      color: backgroundColor,
      child: Center(
        child: Container(
          constraints: BoxConstraints(maxWidth: maxWidth),
          padding: padding ??
              EdgeInsets.symmetric(
                horizontal: horizontalPadding,
                vertical: 64,
              ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.center,
            children: [
              if (title != null) ...[
                PortoSectionHeader(
                  title: title!,
                  subtitle: subtitle,
                ),
                const SizedBox(height: 40),
              ],
              child,
              if (showDivider) ...[
                const SizedBox(height: 64),
                Container(
                  height: 1,
                  color: Colors.grey[200],
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// Porto-style section header with luxury styling
class PortoSectionHeader extends StatelessWidget {
  final String title;
  final String? subtitle;
  final bool showAccent;

  const PortoSectionHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.showAccent = true,
  });

  @override
  Widget build(BuildContext context) {
    final isMobile = MediaQuery.of(context).size.width < 600;

    return Column(
      children: [
        if (showAccent)
          Container(
            width: 80,
            height: 2,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                colors: [
                  Colors.transparent,
                  const Color(0xFFB8860B),
                  Colors.transparent,
                ],
              ),
            ),
          ),
        if (showAccent) const SizedBox(height: 20),
        Text(
          title,
          style: TextStyle(
            fontFamily: 'WorkSans',
            fontSize: isMobile ? 32 : 42,
            fontWeight: FontWeight.w200,
            color: Colors.black,
            letterSpacing: 1,
            height: 1.2,
          ),
          textAlign: TextAlign.center,
        ),
        if (subtitle != null) ...[
          const SizedBox(height: 12),
          Container(
            width: 60,
            height: 1,
            color: Colors.black.withOpacity(0.2),
          ),
          const SizedBox(height: 12),
          Text(
            subtitle!,
            style: TextStyle(
              fontFamily: 'WorkSans',
              fontSize: isMobile ? 13 : 14,
              fontWeight: FontWeight.w300,
              color: Colors.grey[600],
              letterSpacing: 0.5,
            ),
            textAlign: TextAlign.center,
          ),
        ],
      ],
    );
  }
}
