import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/content_provider.dart';
import '../models/dto/content_dto.dart';

/// Landing Page Screen - Loads and renders CMS landing pages by slug
class LandingPageScreen extends StatefulWidget {
  final String slug;

  const LandingPageScreen({
    super.key,
    required this.slug,
  });

  @override
  State<LandingPageScreen> createState() => _LandingPageScreenState();
}

class _LandingPageScreenState extends State<LandingPageScreen> {
  @override
  void initState() {
    super.initState();
    // Load landing page on mount
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<ContentProvider>().loadLandingPage(widget.slug);
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(''),
        elevation: 0,
      ),
      body: Consumer<ContentProvider>(
        builder: (context, provider, child) {
          // Loading state
          if (provider.isLandingPageLoading) {
            return Center(
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.black,
              ),
            );
          }

          // Error state
          if (provider.hasLandingPageError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline, size: 64, color: Colors.grey[400]),
                  const SizedBox(height: 16),
                  Text(
                    'Failed to load page',
                    style: TextStyle(
                      fontSize: 18,
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    provider.landingPageError ?? 'Unknown error',
                    style: TextStyle(
                      fontSize: 14,
                      color: Colors.grey[500],
                    ),
                  ),
                  const SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: () => provider.reloadLandingPage(),
                    child: const Text('Try Again'),
                  ),
                ],
              ),
            );
          }

          // No page
          if (!provider.hasLandingPage) {
            return Center(
              child: Text(
                'Page not found',
                style: TextStyle(fontSize: 18, color: Colors.grey[600]),
              ),
            );
          }

          final page = provider.landingPage!;

          return SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Hero Banner (if available)
                if (page.heroBanner != null) ...[
                  _buildHeroBanner(context, page.heroBanner!),
                  const SizedBox(height: 40),
                ],

                // Page Title
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 24),
                  child: Text(
                    page.title,
                    style: const TextStyle(
                      fontSize: 32,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
                const SizedBox(height: 40),

                // Sections
                ...page.sections.map((section) {
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 40),
                    child: _buildSection(context, section),
                  );
                }),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildHeroBanner(BuildContext context, BannerDto banner) {
    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 600;

    final imageUrl = isMobile && banner.imageMobileUrl != null
        ? banner.imageMobileUrl!
        : banner.imageDesktopUrl;

    return SizedBox(
      height: 400,
      child: Stack(
        fit: StackFit.expand,
        children: [
          Image.network(
            imageUrl,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) {
              return Container(color: Colors.grey[300]);
            },
          ),
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
          Padding(
            padding: EdgeInsets.all(isMobile ? 24 : 48),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text(
                  banner.title,
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: isMobile ? 28 : 36,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                if (banner.subtitle != null) ...[
                  const SizedBox(height: 12),
                  Text(
                    banner.subtitle!,
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.9),
                      fontSize: isMobile ? 14 : 18,
                    ),
                  ),
                ],
                if (banner.ctaText != null) ...[
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () {
                      // TODO: Handle CTA navigation
                    },
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.white,
                      foregroundColor: Colors.black,
                      padding: EdgeInsets.symmetric(
                        horizontal: isMobile ? 24 : 32,
                        vertical: isMobile ? 12 : 16,
                      ),
                    ),
                    child: Text(banner.ctaText!),
                  ),
                ],
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSection(BuildContext context, LandingSectionDto section) {
    switch (section.type) {
      case LandingSectionType.productGrid:
        return _buildProductGrid(context, section);
      case LandingSectionType.categoryGrid:
        return _buildCategoryGrid(context, section);
      case LandingSectionType.richText:
        return _buildRichText(context, section);
      case LandingSectionType.image:
        return _buildImage(context, section);
      case LandingSectionType.bannerCarousel:
        return _buildBannerCarousel(context, section);
      default:
        return _buildUnsupportedSection(context, section);
    }
  }

  Widget _buildProductGrid(BuildContext context, LandingSectionDto section) {
    final data = section.parsedData;
    final productIds = data['productIds'] as List<dynamic>?;
    final columns = data['columns'] as int? ?? 4;

    if (productIds == null || productIds.isEmpty) {
      return const SizedBox.shrink();
    }

    // TODO: Fetch products by IDs
    // For now, show placeholder
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (data['title'] != null)
            Text(
              data['title'],
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
          const SizedBox(height: 16),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount:
                  MediaQuery.of(context).size.width < 600 ? 2 : columns,
              childAspectRatio: 0.7,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
            ),
            itemCount: productIds.length,
            itemBuilder: (context, index) {
              return Container(
                decoration: BoxDecoration(
                  color: Colors.grey[200],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Text('Product ${productIds[index]}'),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildCategoryGrid(BuildContext context, LandingSectionDto section) {
    final data = section.parsedData;
    final categoryIds = data['categoryIds'] as List<dynamic>?;
    final columns = data['columns'] as int? ?? 3;

    if (categoryIds == null || categoryIds.isEmpty) {
      return const SizedBox.shrink();
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (data['title'] != null)
            Text(
              data['title'],
              style: const TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
              ),
            ),
          const SizedBox(height: 16),
          GridView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount:
                  MediaQuery.of(context).size.width < 600 ? 2 : columns,
              childAspectRatio: 1.0,
              crossAxisSpacing: 16,
              mainAxisSpacing: 16,
            ),
            itemCount: categoryIds.length,
            itemBuilder: (context, index) {
              return Container(
                decoration: BoxDecoration(
                  color: Colors.grey[200],
                  borderRadius: BorderRadius.circular(8),
                ),
                child: Center(
                  child: Text('Category ${categoryIds[index]}'),
                ),
              );
            },
          ),
        ],
      ),
    );
  }

  Widget _buildRichText(BuildContext context, LandingSectionDto section) {
    final data = section.parsedData;
    final html = data['html'] as String?;

    if (html == null || html.isEmpty) {
      return const SizedBox.shrink();
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.grey[50],
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          // Simple HTML stripping - in production use flutter_html package
          html.replaceAll(RegExp(r'<[^>]*>'), ''),
          style: const TextStyle(fontSize: 16),
        ),
      ),
    );
  }

  Widget _buildImage(BuildContext context, LandingSectionDto section) {
    final data = section.parsedData;
    final imageUrl = data['imageUrl'] as String?;
    final altText = data['altText'] as String?;
    final linkUrl = data['linkUrl'] as String?;

    if (imageUrl == null || imageUrl.isEmpty) {
      return const SizedBox.shrink();
    }

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: InkWell(
        onTap: linkUrl != null
            ? () {
                // TODO: Handle link navigation
              }
            : null,
        child: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: Image.network(
            imageUrl,
            fit: BoxFit.cover,
            errorBuilder: (context, error, stackTrace) {
              return Container(
                height: 200,
                color: Colors.grey[300],
                child: Center(
                  child: Text(altText ?? 'Image'),
                ),
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildBannerCarousel(BuildContext context, LandingSectionDto section) {
    final data = section.parsedData;
    final bannerIds = data['bannerIds'] as List<dynamic>?;

    if (bannerIds == null || bannerIds.isEmpty) {
      return const SizedBox.shrink();
    }

    return Container(
      height: 300,
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Center(
        child: Text(
          'Banner Carousel (${bannerIds.length} banners)',
          style: TextStyle(color: Colors.grey[600]),
        ),
      ),
    );
  }

  Widget _buildUnsupportedSection(
      BuildContext context, LandingSectionDto section) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24),
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: Colors.orange[50],
          border: Border.all(color: Colors.orange[200]!),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Text(
          'Unsupported section type: ${section.type}',
          style: TextStyle(color: Colors.orange[800]),
        ),
      ),
    );
  }
}
