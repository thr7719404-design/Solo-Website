import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../providers/home_cms_provider.dart';
import '../../screens/category_landing_screen.dart';
import 'cms_section_widgets.dart';

/// CMS Sections Builder
/// Renders all enabled sections from HomeCmsProvider
class CmsSectionsBuilder extends StatelessWidget {
  const CmsSectionsBuilder({super.key});

  @override
  Widget build(BuildContext context) {
    return Consumer<HomeCmsProvider>(
      builder: (context, cmsProvider, child) {
        // Loading state
        if (cmsProvider.isLoading) {
          return const SizedBox(
            height: 400,
            child: Center(
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.black,
              ),
            ),
          );
        }

        // Error state
        if (cmsProvider.error != null) {
          return Padding(
            padding: const EdgeInsets.all(40),
            child: Center(
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(Icons.error_outline, size: 48, color: Colors.grey[400]),
                  const SizedBox(height: 16),
                  Text(
                    'Failed to load content',
                    style: TextStyle(
                      fontFamily: 'WorkSans',
                      fontSize: 18,
                      color: Colors.grey[600],
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    cmsProvider.error!,
                    style: TextStyle(
                      fontFamily: 'WorkSans',
                      fontSize: 12,
                      color: Colors.grey[500],
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 24),
                  ElevatedButton(
                    onPressed: () => cmsProvider.loadHomeCms(),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.black,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(
                        horizontal: 32,
                        vertical: 14,
                      ),
                    ),
                    child: const Text('Retry'),
                  ),
                ],
              ),
            ),
          );
        }

        // No sections
        if (cmsProvider.sections.isEmpty) {
          return const SizedBox.shrink();
        }

        // Render sections
        return Column(
          children: [
            for (final section in cmsProvider.sections)
              _buildSection(context, section),
          ],
        );
      },
    );
  }

  Widget _buildSection(BuildContext context, dynamic section) {
    final type = section['type'] as String? ?? '';
    final isEnabled = section['isEnabled'] as bool? ?? true;
    final title = section['title'] as String?;
    final config = section['config'] as Map<String, dynamic>? ?? {};

    if (!isEnabled) return const SizedBox.shrink();

    switch (type) {
      case 'HERO_SLIDER':
        return Padding(
          padding: const EdgeInsets.only(bottom: 32),
          child: CmsHeroSlider(
            config: config,
            onCtaTap: (targetType, targetValue) {
              _handleNavigation(context, targetType, targetValue);
            },
          ),
        );

      case 'CATEGORY_TILES':
        return Padding(
          padding: const EdgeInsets.symmetric(vertical: 32),
          child: CmsCategoryTiles(
            title: title,
            config: config,
            onTileTap: (targetType, targetValue) {
              _handleNavigation(context, targetType, targetValue);
            },
          ),
        );

      default:
        // Unknown section type - ignore
        return const SizedBox.shrink();
    }
  }

  void _handleNavigation(
      BuildContext context, String targetType, String targetValue) {
    if (targetValue.isEmpty) return;

    switch (targetType) {
      case 'category':
        // Navigate to category landing page
        Navigator.push(
          context,
          MaterialPageRoute(
            builder: (context) => CategoryLandingScreen(
              categoryId: targetValue,
            ),
          ),
        );
        break;

      case 'url':
      case 'page':
        // Navigate to internal route
        if (targetValue.startsWith('/')) {
          Navigator.pushNamed(context, targetValue);
        }
        break;

      case 'product':
        // Navigate to product detail
        Navigator.pushNamed(context, '/product/$targetValue');
        break;

      default:
        break;
    }
  }
}
