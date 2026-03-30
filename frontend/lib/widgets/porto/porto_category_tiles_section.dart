import 'package:flutter/material.dart';
import '../../models/dto/content_dto.dart';

/// Porto-style Category Tiles Section (exactly 4 tiles)
/// Grid of 4 category tiles with images and links
class PortoCategoryTilesSection extends StatelessWidget {
  final LandingSectionDto section;

  const PortoCategoryTilesSection({super.key, required this.section});

  List<Map<String, dynamic>> get tiles {
    // Try config.tiles first (CMS format), then data.tiles (legacy format)
    final rawTiles = (section.config?['tiles'] as List<dynamic>?) ??
        (section.data['tiles'] as List<dynamic>?);
    if (rawTiles == null) return [];
    return rawTiles.map((e) => Map<String, dynamic>.from(e as Map)).toList();
  }

  int get columns => (section.config?['columns'] as num?)?.toInt() ?? 4;
  int get mobileColumns =>
      (section.config?['mobileColumns'] as num?)?.toInt() ?? 2;
  double get aspectRatio =>
      (section.config?['aspectRatio'] as num?)?.toDouble() ?? 1.2;
  bool get showTitle => section.config?['showTitle'] as bool? ?? true;
  double get overlayOpacity =>
      (section.config?['overlayOpacity'] as num?)?.toDouble() ?? 0.3;

  @override
  Widget build(BuildContext context) {
    if (tiles.isEmpty) {
      return const SizedBox.shrink();
    }

    final screenWidth = MediaQuery.of(context).size.width;
    final isMobile = screenWidth < 768;
    final horizontalPadding = isMobile ? 16.0 : 60.0;
    final gridColumns = isMobile ? mobileColumns : 4;
    // On desktop: wider, shorter tiles (1.6 ratio = ~50% shorter than 1.2)
    final effectiveAspectRatio = isMobile ? aspectRatio : 1.6;

    return Padding(
      padding:
          EdgeInsets.symmetric(horizontal: horizontalPadding, vertical: 32),
      child: Center(
        child: Container(
          constraints: const BoxConstraints(maxWidth: 1320),
          child: LayoutBuilder(
            builder: (context, constraints) {
              return GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                gridDelegate: SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: gridColumns,
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: effectiveAspectRatio,
                ),
                itemCount: tiles.length.clamp(0, 4), // Max 4 tiles
                itemBuilder: (context, index) {
                  final tile = tiles[index];
                  return _buildTile(context, tile);
                },
              );
            },
          ),
        ),
      ),
    );
  }

  Widget _buildTile(BuildContext context, Map<String, dynamic> tile) {
    final title = tile['title'] as String?;
    final imageUrl = tile['imageUrl'] as String?;
    final targetValue = (tile['targetValue'] ?? '').toString().trim();

    return MouseRegion(
      cursor: SystemMouseCursors.click,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: () {
          final id = targetValue.toString().trim();
          if (id.isEmpty) return;

          Navigator.of(context, rootNavigator: true).pushNamed(
            '/category-landing',
            arguments: {'categoryId': id},
          );
        },
        child: Container(
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(4),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.08),
                blurRadius: 8,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(4),
            child: Stack(
              fit: StackFit.expand,
              children: [
                // Background Image
                if (imageUrl != null)
                  IgnorePointer(
                    child: Image.network(
                      imageUrl,
                      fit: BoxFit.cover,
                      errorBuilder: (context, error, stackTrace) => Container(
                        color: Colors.grey[200],
                        child: const Center(
                          child: Icon(Icons.image_not_supported,
                              color: Colors.grey),
                        ),
                      ),
                    ),
                  )
                else
                  IgnorePointer(child: Container(color: Colors.grey[300])),

                // Overlay - IgnorePointer so it doesn't block taps
                IgnorePointer(
                  child: Container(
                    decoration: BoxDecoration(
                      gradient: LinearGradient(
                        begin: Alignment.topCenter,
                        end: Alignment.bottomCenter,
                        colors: [
                          Colors.transparent,
                          Colors.black.withOpacity(overlayOpacity),
                        ],
                      ),
                    ),
                  ),
                ),

                // Title - IgnorePointer so it doesn't block taps
                if (showTitle && title != null)
                  Positioned(
                    bottom: 16,
                    left: 16,
                    right: 16,
                    child: IgnorePointer(
                      child: Text(
                        title,
                        style: const TextStyle(
                          fontFamily: 'WorkSans',
                          fontSize: 16,
                          fontWeight: FontWeight.w500,
                          color: Colors.white,
                          letterSpacing: 0.5,
                        ),
                        textAlign: TextAlign.center,
                      ),
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
