import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../models/dto/content_dto.dart';
import '../../providers/catalog_provider.dart';
import 'porto_section_renderer.dart';

/// Porto-style Category Grid Section ("Shop by Category")
/// Full category grid with luxury styling
class PortoCategoryGridSection extends StatelessWidget {
  final LandingSectionDto section;

  const PortoCategoryGridSection({super.key, required this.section});

  int get limit => (section.data['limit'] as num?)?.toInt() ?? 8;
  int get columns => (section.config?['columns'] as num?)?.toInt() ?? 4;
  int get mobileColumns => (section.config?['mobileColumns'] as num?)?.toInt() ?? 2;
  bool get showDescription => section.config?['showDescription'] as bool? ?? false;
  String get cardStyle => section.config?['cardStyle'] as String? ?? 'minimal';

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topCenter,
          end: Alignment.bottomCenter,
          colors: [
            Colors.grey[50]!,
            Colors.white,
            Colors.grey[50]!,
          ],
        ),
      ),
      child: PortoSectionContainer(
        title: section.title,
        subtitle: section.subtitle,
        backgroundColor: Colors.transparent,
        child: Consumer<CatalogProvider>(
          builder: (context, catalogProvider, child) {
            final categories = catalogProvider.categories.take(limit).toList();

            if (catalogProvider.isLoading) {
              return const Center(
                child: Padding(
                  padding: EdgeInsets.all(40),
                  child: CircularProgressIndicator(strokeWidth: 2),
                ),
              );
            }

            if (categories.isEmpty) {
              return const Center(
                child: Text('No categories available'),
              );
            }

            return LayoutBuilder(
              builder: (context, constraints) {
                final isMobile = constraints.maxWidth < 600;
                final gridColumns = isMobile ? mobileColumns : columns;
                
                // Calculate item width for consistent sizing
                const spacing = 16.0;
                final totalSpacing = spacing * (gridColumns - 1);
                final itemWidth = (constraints.maxWidth - totalSpacing) / gridColumns;
                
                return GridView.builder(
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: gridColumns,
                    crossAxisSpacing: spacing,
                    mainAxisSpacing: spacing,
                    childAspectRatio: cardStyle == 'minimal' ? 1.0 : 0.85,
                  ),
                  itemCount: categories.length,
                  itemBuilder: (context, index) {
                    final category = categories[index];
                    return _buildCategoryCard(
                      context,
                      category.name,
                      category.imageUrl,
                      category.effectiveSlug,
                    );
                  },
                );
              },
            );
          },
        ),
      ),
    );
  }

  Widget _buildCategoryCard(
    BuildContext context,
    String name,
    String imageUrl,
    String slug,
  ) {
    return GestureDetector(
      onTap: () {
        Navigator.pushNamed(context, '/category/$slug');
      },
      child: Container(
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(cardStyle == 'bordered' ? 8 : 4),
          border: cardStyle == 'bordered'
              ? Border.all(color: Colors.grey[300]!, width: 1)
              : null,
          boxShadow: cardStyle == 'elevated'
              ? [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.08),
                    blurRadius: 12,
                    offset: const Offset(0, 4),
                  ),
                ]
              : null,
        ),
        child: ClipRRect(
          borderRadius: BorderRadius.circular(cardStyle == 'bordered' ? 8 : 4),
          child: Stack(
            fit: StackFit.expand,
            children: [
              // Background Image
              if (imageUrl.isNotEmpty)
                Image.network(
                  imageUrl,
                  fit: BoxFit.cover,
                  errorBuilder: (context, error, stackTrace) => Container(
                    color: Colors.grey[100],
                    child: Center(
                      child: Icon(
                        Icons.category_outlined,
                        size: 40,
                        color: Colors.grey[400],
                      ),
                    ),
                  ),
                )
              else
                Container(
                  color: Colors.grey[100],
                  child: Center(
                    child: Icon(
                      Icons.category_outlined,
                      size: 40,
                      color: Colors.grey[400],
                    ),
                  ),
                ),
              
              // Gradient overlay
              Container(
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    begin: Alignment.topCenter,
                    end: Alignment.bottomCenter,
                    colors: [
                      Colors.transparent,
                      Colors.black.withOpacity(0.6),
                    ],
                    stops: const [0.4, 1.0],
                  ),
                ),
              ),
              
              // Category name
              Positioned(
                bottom: 16,
                left: 12,
                right: 12,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.center,
                  children: [
                    Text(
                      name,
                      style: const TextStyle(
                        fontFamily: 'WorkSans',
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                        color: Colors.white,
                        letterSpacing: 0.5,
                      ),
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
              
              // Hover effect
              Material(
                color: Colors.transparent,
                child: InkWell(
                  onTap: () {
                    Navigator.pushNamed(context, '/category/$slug');
                  },
                  splashColor: Colors.white.withOpacity(0.1),
                  highlightColor: Colors.white.withOpacity(0.05),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
