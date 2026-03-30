import 'package:flutter/material.dart';
import '../../models/dto/content_dto.dart';
import '../../models/dto/product_dto.dart';
import '../../models/product.dart';
import '../../models/product_dto_extension.dart';
import 'porto_section_renderer.dart';

/// Porto-style Product Carousel Section
/// Horizontal scrolling product carousel with arrows
class PortoProductCarouselSection extends StatefulWidget {
  final LandingSectionDto section;
  final List<ProductDto> products;
  final bool isLoading;
  final Function(ProductDto)? onProductTap;
  final Function(ProductDto)? onAddToCart;

  const PortoProductCarouselSection({
    super.key,
    required this.section,
    required this.products,
    this.isLoading = false,
    this.onProductTap,
    this.onAddToCart,
  });

  @override
  State<PortoProductCarouselSection> createState() =>
      _PortoProductCarouselSectionState();
}

class _PortoProductCarouselSectionState
    extends State<PortoProductCarouselSection> {
  late ScrollController _scrollController;
  bool _canScrollLeft = false;
  bool _canScrollRight = true;

  int get itemsPerView =>
      (widget.section.config?['itemsPerView'] as num?)?.toInt() ?? 4;
  int get mobileItemsPerView =>
      (widget.section.config?['mobileItemsPerView'] as num?)?.toInt() ?? 2;
  bool get showArrows => widget.section.config?['showArrows'] as bool? ?? true;
  bool get showDots => widget.section.config?['showDots'] as bool? ?? false;

  @override
  void initState() {
    super.initState();
    _scrollController = ScrollController();
    _scrollController.addListener(_updateScrollButtons);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _updateScrollButtons() {
    setState(() {
      _canScrollLeft = _scrollController.offset > 0;
      _canScrollRight =
          _scrollController.offset < _scrollController.position.maxScrollExtent;
    });
  }

  void _scrollLeft() {
    final screenWidth = MediaQuery.of(context).size.width;
    _scrollController.animateTo(
      (_scrollController.offset - screenWidth * 0.8)
          .clamp(0, _scrollController.position.maxScrollExtent),
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOut,
    );
  }

  void _scrollRight() {
    final screenWidth = MediaQuery.of(context).size.width;
    _scrollController.animateTo(
      (_scrollController.offset + screenWidth * 0.8)
          .clamp(0, _scrollController.position.maxScrollExtent),
      duration: const Duration(milliseconds: 300),
      curve: Curves.easeOut,
    );
  }

  @override
  Widget build(BuildContext context) {
    if (widget.products.isEmpty) {
      if (widget.isLoading) {
        return PortoSectionContainer(
          title: widget.section.title,
          subtitle: widget.section.subtitle,
          child: SizedBox(
            height: 280,
            child: Center(
              child: CircularProgressIndicator(
                strokeWidth: 2,
                color: Colors.grey[400],
              ),
            ),
          ),
        );
      }
      // Products finished loading but list is empty — show placeholder
      return PortoSectionContainer(
        title: widget.section.title,
        subtitle: widget.section.subtitle,
        child: SizedBox(
          height: 120,
          child: Center(
            child: Text(
              'No products available',
              style: TextStyle(
                fontFamily: 'WorkSans',
                fontSize: 14,
                color: Colors.grey[500],
              ),
            ),
          ),
        ),
      );
    }

    return PortoSectionContainer(
      title: widget.section.title,
      subtitle: widget.section.subtitle,
      child: LayoutBuilder(
        builder: (context, constraints) {
          final isMobile = constraints.maxWidth < 600;
          final displayItems = isMobile ? mobileItemsPerView : itemsPerView;
          final spacing = 16.0;
          final totalSpacing = spacing * (displayItems - 1);
          final itemWidth =
              (constraints.maxWidth - totalSpacing) / displayItems;

          return Stack(
            children: [
              // Product list
              SizedBox(
                height: itemWidth * 1.5, // Approximate product card height
                child: ListView.separated(
                  controller: _scrollController,
                  scrollDirection: Axis.horizontal,
                  padding: EdgeInsets.zero,
                  itemCount: widget.products.length,
                  separatorBuilder: (context, index) =>
                      SizedBox(width: spacing),
                  itemBuilder: (context, index) {
                    final productDto = widget.products[index];
                    final product = productDto.toProduct();

                    return SizedBox(
                      width: itemWidth,
                      child: _buildProductCard(product, productDto),
                    );
                  },
                ),
              ),

              // Left arrow
              if (showArrows && _canScrollLeft)
                Positioned(
                  left: 0,
                  top: 0,
                  bottom: 0,
                  child: Center(
                    child: _buildArrowButton(
                      icon: Icons.chevron_left,
                      onTap: _scrollLeft,
                    ),
                  ),
                ),

              // Right arrow
              if (showArrows && _canScrollRight)
                Positioned(
                  right: 0,
                  top: 0,
                  bottom: 0,
                  child: Center(
                    child: _buildArrowButton(
                      icon: Icons.chevron_right,
                      onTap: _scrollRight,
                    ),
                  ),
                ),
            ],
          );
        },
      ),
    );
  }

  Widget _buildProductCard(Product product, ProductDto productDto) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(4),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.05),
            blurRadius: 8,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Product Image
          Expanded(
            flex: 3,
            child: GestureDetector(
              onTap: () => widget.onProductTap?.call(productDto),
              child: Container(
                width: double.infinity,
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  borderRadius:
                      const BorderRadius.vertical(top: Radius.circular(4)),
                ),
                child: product.imageUrl.isNotEmpty
                    ? Image.network(
                        product.imageUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => Center(
                          child: Icon(Icons.image_not_supported,
                              color: Colors.grey[400]),
                        ),
                      )
                    : Center(
                        child: Icon(Icons.image,
                            size: 48, color: Colors.grey[400]),
                      ),
              ),
            ),
          ),

          // Product Info
          Expanded(
            flex: 2,
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Brand
                  if (product.brand.isNotEmpty)
                    Text(
                      product.brand.toUpperCase(),
                      style: TextStyle(
                        fontFamily: 'WorkSans',
                        fontSize: 10,
                        fontWeight: FontWeight.w500,
                        color: Colors.grey[500],
                        letterSpacing: 1,
                      ),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  const SizedBox(height: 4),

                  // Name
                  Text(
                    product.name,
                    style: const TextStyle(
                      fontFamily: 'WorkSans',
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: Colors.black87,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),

                  const Spacer(),

                  // Price
                  Row(
                    children: [
                      Text(
                        'AED ${product.price.toStringAsFixed(2)}',
                        style: const TextStyle(
                          fontFamily: 'WorkSans',
                          fontSize: 14,
                          fontWeight: FontWeight.w600,
                          color: Colors.black,
                        ),
                      ),
                      if (product.originalPrice != null &&
                          product.originalPrice! > product.price) ...[
                        const SizedBox(width: 8),
                        Text(
                          'AED ${product.originalPrice!.toStringAsFixed(2)}',
                          style: TextStyle(
                            fontFamily: 'WorkSans',
                            fontSize: 12,
                            fontWeight: FontWeight.w400,
                            color: Colors.grey[500],
                            decoration: TextDecoration.lineThrough,
                          ),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildArrowButton(
      {required IconData icon, required VoidCallback onTap}) {
    return InkWell(
      onTap: onTap,
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: Colors.white,
          shape: BoxShape.circle,
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.1),
              blurRadius: 8,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Icon(icon, color: Colors.black, size: 24),
      ),
    );
  }
}
