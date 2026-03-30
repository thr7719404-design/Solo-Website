import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/dto/content_dto.dart';
import '../../providers/catalog_provider.dart';
import 'porto_section_renderer.dart';

/// Porto-style Brand Strip Section
/// Horizontal scrolling brand logos
class PortoBrandStripSection extends StatelessWidget {
  final LandingSectionDto section;

  const PortoBrandStripSection({super.key, required this.section});

  int get limit => (section.data['limit'] as num?)?.toInt() ?? 8;
  bool get scrollable => section.config?['scrollable'] as bool? ?? true;
  bool get showNames => section.config?['showNames'] as bool? ?? false;
  double get logoHeight => (section.config?['logoHeight'] as num?)?.toDouble() ?? 60;
  double get spacing => (section.config?['spacing'] as num?)?.toDouble() ?? 40;
  String get backgroundColor => section.config?['backgroundColor'] as String? ?? '#f9f9f9';

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

    return Container(
      color: bgColor,
      padding: const EdgeInsets.symmetric(vertical: 48),
      child: Column(
        children: [
          if (section.title != null) ...[
            PortoSectionHeader(
              title: section.title!,
              subtitle: section.subtitle,
              showAccent: false,
            ),
            const SizedBox(height: 32),
          ],
          Consumer<CatalogProvider>(
            builder: (context, catalogProvider, child) {
              final brands = catalogProvider.brands.take(limit).toList();

              if (catalogProvider.isBrandsLoading) {
                return const Padding(
                  padding: EdgeInsets.all(20),
                  child: CircularProgressIndicator(strokeWidth: 2),
                );
              }

              if (brands.isEmpty) {
                return const SizedBox.shrink();
              }

              if (scrollable) {
                return SizedBox(
                  height: logoHeight + (showNames ? 30 : 0),
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 60),
                    itemCount: brands.length,
                    separatorBuilder: (context, index) => SizedBox(width: spacing),
                    itemBuilder: (context, index) {
                      final brand = brands[index];
                      return _buildBrandItem(context, brand.name, brand.logoUrl);
                    },
                  ),
                );
              } else {
                return Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 60),
                  child: Wrap(
                    alignment: WrapAlignment.center,
                    spacing: spacing,
                    runSpacing: 24,
                    children: brands.map((brand) {
                      return _buildBrandItem(context, brand.name, brand.logoUrl);
                    }).toList(),
                  ),
                );
              }
            },
          ),
        ],
      ),
    );
  }

  Widget _buildBrandItem(BuildContext context, String name, String? logoUrl) {
    return GestureDetector(
      onTap: () {
        // Navigate to brand page
        Navigator.pushNamed(context, '/brand/${name.toLowerCase().replaceAll(' ', '-')}');
      },
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            height: logoHeight,
            width: logoHeight * 1.5,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(4),
            ),
            child: logoUrl != null && logoUrl.isNotEmpty
                ? Image.network(
                    logoUrl,
                    fit: BoxFit.contain,
                    errorBuilder: (context, error, stackTrace) => Center(
                      child: Text(
                        name.substring(0, 1).toUpperCase(),
                        style: TextStyle(
                          fontFamily: 'WorkSans',
                          fontSize: 24,
                          fontWeight: FontWeight.w300,
                          color: Colors.grey[600],
                        ),
                      ),
                    ),
                  )
                : Center(
                    child: Text(
                      name.substring(0, 1).toUpperCase(),
                      style: TextStyle(
                        fontFamily: 'WorkSans',
                        fontSize: 24,
                        fontWeight: FontWeight.w300,
                        color: Colors.grey[600],
                      ),
                    ),
                  ),
          ),
          if (showNames) ...[
            const SizedBox(height: 8),
            Text(
              name,
              style: TextStyle(
                fontFamily: 'WorkSans',
                fontSize: 12,
                fontWeight: FontWeight.w400,
                color: Colors.grey[700],
              ),
            ),
          ],
        ],
      ),
    );
  }
}
