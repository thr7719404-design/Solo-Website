import '../models/product.dart';
import '../models/dto/product_dto.dart';

/// Extension to convert API DTOs to UI models
extension ProductDtoExtension on ProductDto {
  /// Convert ProductDto to Product model for UI components
  Product toProduct() {
    return Product(
      id: id,
      name: name,
      brand: brand?.name ?? 'Unknown Brand',
      description: description ?? '',
      price: price,
      originalPrice: oldPrice,
      imageUrl: imageUrl ?? '',
      images: images.isNotEmpty ? images : [imageUrl ?? ''],
      category: category?.name ?? 'Uncategorized',
      subcategory: null, // Not available in current API
      categoryId: category?.id, // DB category ID for tree lookup
      isFavorite: false, // Track this locally in favorites provider
      isNew: isNew ?? false,
      colors: [], // Not available in current API
      sizes: [], // Not available in current API
      // ==== NEW: Product Page Fields v1 ====
      shortDescription: shortDescription,
      fullDescription: fullDescription,
      highlights: highlights ?? [],
      galleryImageUrls: galleryImageUrls ?? [],
      specs: specs.map((m) => ProductSpec.fromMap(m)).toList() ?? [],
      deliveryNote: deliveryNote,
      returnsNote: returnsNote,
      urlSlug: urlSlug,
      metaTitle: metaTitle,
      metaDescription: metaDescription,
      // ==== END: Product Page Fields v1 ====
    );
  }
}

/// Extension to convert lists
extension ProductDtoListExtension on List<ProductDto> {
  List<Product> toProducts() {
    return map((dto) => dto.toProduct()).toList();
  }
}
