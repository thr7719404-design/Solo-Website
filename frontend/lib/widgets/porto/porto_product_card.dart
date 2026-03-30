import 'package:flutter/material.dart';
import '../../models/dto/product_dto.dart';

/// Porto-style Product Card widget
class PortoProductCard extends StatefulWidget {
  final ProductDto product;
  final VoidCallback? onTap;
  final VoidCallback? onAddToCart;
  final bool showQuickView;

  const PortoProductCard({
    super.key,
    required this.product,
    this.onTap,
    this.onAddToCart,
    this.showQuickView = true,
  });

  @override
  State<PortoProductCard> createState() => _PortoProductCardState();
}

class _PortoProductCardState extends State<PortoProductCard> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    final product = widget.product;
    final hasDiscount = product.compareAtPrice != null &&
        product.compareAtPrice! > (product.price ?? 0);
    final discountPercent = hasDiscount
        ? ((1 - (product.price ?? 0) / product.compareAtPrice!) * 100).round()
        : 0;

    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: Container(
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(4),
            boxShadow: _isHovered
                ? [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 20,
                      offset: const Offset(0, 8),
                    ),
                  ]
                : [],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Image container
              Expanded(
                flex: 3,
                child: Stack(
                  children: [
                    // Product image
                    ClipRRect(
                      borderRadius: const BorderRadius.vertical(
                        top: Radius.circular(4),
                      ),
                      child: Container(
                        width: double.infinity,
                        color: const Color(0xFFF8F9FA),
                        child: Image.network(
                          product.imageUrl,
                          fit: BoxFit.cover,
                          errorBuilder: (_, __, ___) => _buildPlaceholder(),
                        ),
                      ),
                    ),

                    // Badges
                    Positioned(
                      top: 8,
                      left: 8,
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          if (product.isNew == true)
                            _buildBadge('NEW', const Color(0xFF1A1A1A)),
                          if (hasDiscount) ...[
                            const SizedBox(height: 4),
                            _buildBadge('-$discountPercent%', Colors.red),
                          ],
                          if (product.isBestSeller == true) ...[
                            const SizedBox(height: 4),
                            _buildBadge('BESTSELLER', const Color(0xFFB8860B)),
                          ],
                        ],
                      ),
                    ),

                    // Quick action buttons on hover
                    if (_isHovered && widget.showQuickView)
                      Positioned(
                        bottom: 8,
                        left: 8,
                        right: 8,
                        child: Row(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            _buildActionButton(
                              Icons.shopping_bag_outlined,
                              'Add to Cart',
                              widget.onAddToCart,
                            ),
                            const SizedBox(width: 8),
                            _buildActionButton(
                              Icons.favorite_border,
                              'Wishlist',
                              () {},
                            ),
                            const SizedBox(width: 8),
                            _buildActionButton(
                              Icons.visibility_outlined,
                              'Quick View',
                              widget.onTap,
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
              ),

              // Product info
              Expanded(
                flex: 2,
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Brand
                      if (product.brand?.name != null)
                        Text(
                          product.brand!.name.toUpperCase(),
                          style: TextStyle(
                            fontSize: 10,
                            fontWeight: FontWeight.w500,
                            color: Colors.grey[500],
                            letterSpacing: 0.5,
                          ),
                        ),
                      const SizedBox(height: 4),

                      // Product name
                      Text(
                        product.name ?? 'Product',
                        style: const TextStyle(
                          fontSize: 13,
                          fontWeight: FontWeight.w500,
                          height: 1.3,
                        ),
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const Spacer(),

                      // Price
                      Row(
                        children: [
                          Text(
                            'AED ${product.price.toStringAsFixed(0) ?? '0'}',
                            style: const TextStyle(
                              fontSize: 14,
                              fontWeight: FontWeight.w600,
                              color: Color(0xFF1A1A1A),
                            ),
                          ),
                          if (hasDiscount) ...[
                            const SizedBox(width: 8),
                            Text(
                              'AED ${product.compareAtPrice?.toStringAsFixed(0)}',
                              style: TextStyle(
                                fontSize: 12,
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
        ),
      ),
    );
  }

  Widget _buildPlaceholder() {
    return Container(
      color: const Color(0xFFF5F5F5),
      child: Center(
        child: Icon(
          Icons.image_outlined,
          size: 48,
          color: Colors.grey[400],
        ),
      ),
    );
  }

  Widget _buildBadge(String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color,
        borderRadius: BorderRadius.circular(2),
      ),
      child: Text(
        text,
        style: const TextStyle(
          color: Colors.white,
          fontSize: 10,
          fontWeight: FontWeight.w600,
          letterSpacing: 0.5,
        ),
      ),
    );
  }

  Widget _buildActionButton(
      IconData icon, String tooltip, VoidCallback? onTap) {
    return Tooltip(
      message: tooltip,
      child: InkWell(
        onTap: onTap,
        child: Container(
          width: 36,
          height: 36,
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(4),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withOpacity(0.1),
                blurRadius: 4,
              ),
            ],
          ),
          child: Icon(icon, size: 18, color: const Color(0xFF1A1A1A)),
        ),
      ),
    );
  }
}
