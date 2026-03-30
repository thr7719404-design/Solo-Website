/// Spec item for product specifications table
class ProductSpec {
  final String key;
  final String value;

  const ProductSpec({required this.key, required this.value});

  factory ProductSpec.fromMap(Map<String, dynamic> map) {
    return ProductSpec(
      key: map['key']?.toString() ?? '',
      value: map['value']?.toString() ?? '',
    );
  }

  Map<String, dynamic> toMap() => {'key': key, 'value': value};
}

class Product {
  final String id;
  final String name;
  final String brand;
  final String description;
  final double price;
  final double? originalPrice;
  final String imageUrl;
  final List<String> images;
  final String category;
  final String? subcategory;
  final String? categoryId; // DB category ID for tree lookup
  final bool isFavorite;
  final bool isNew;
  final List<String> colors;
  final List<String> sizes;

  // ==== NEW: Product Page Fields v1 ====
  final String? shortDescription;
  final String? fullDescription;
  final List<String> highlights; // e.g. ["Dishwasher Safe", "BPA Free"]
  final List<String> galleryImageUrls; // Gallery image URLs
  final List<ProductSpec> specs; // Specs table [{key, value}]
  final String? deliveryNote;
  final String? returnsNote;
  final String? urlSlug;
  final String? metaTitle;
  final String? metaDescription;
  // ==== END: Product Page Fields v1 ====

  const Product({
    required this.id,
    required this.name,
    required this.brand,
    required this.description,
    required this.price,
    this.originalPrice,
    required this.imageUrl,
    this.images = const [],
    required this.category,
    this.subcategory,
    this.categoryId,
    this.isFavorite = false,
    this.isNew = false,
    this.colors = const [],
    this.sizes = const [],
    // ==== NEW: Product Page Fields v1 ====
    this.shortDescription,
    this.fullDescription,
    this.highlights = const [],
    this.galleryImageUrls = const [],
    this.specs = const [],
    this.deliveryNote,
    this.returnsNote,
    this.urlSlug,
    this.metaTitle,
    this.metaDescription,
    // ==== END: Product Page Fields v1 ====
  });

  double get discountPercent {
    if (originalPrice == null || originalPrice! <= price) return 0;
    return ((originalPrice! - price) / originalPrice! * 100).roundToDouble();
  }

  /// Get effective gallery images (galleryImageUrls or fallback to images)
  List<String> get effectiveGalleryImages {
    if (galleryImageUrls.isNotEmpty) return galleryImageUrls;
    if (images.isNotEmpty) return images;
    return [imageUrl];
  }
}
