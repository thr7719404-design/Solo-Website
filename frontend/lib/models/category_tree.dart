import '../core/dto/catalog_dto.dart';

/// Represents a subcategory node in the category tree.
/// Used for hierarchical display (e.g., in navigation drawers).
class SubcategoryNode {
  final String id;
  final String name;
  final String? slug;
  final String? imageUrl;
  final int? productCount;

  SubcategoryNode({
    required this.id,
    required this.name,
    this.slug,
    this.imageUrl,
    this.productCount,
  });

  /// Factory constructor to create from SubcategoryDto
  factory SubcategoryNode.fromDto(SubcategoryDto dto) {
    return SubcategoryNode(
      id: dto.id,
      name: dto.name,
      slug: dto.slug,
      imageUrl: null, // SubcategoryDto doesn't have image
      productCount: dto.productCount,
    );
  }

  /// Factory constructor to create from CategoryDto (when children are CategoryDto)
  factory SubcategoryNode.fromCategoryDto(CategoryDto dto) {
    return SubcategoryNode(
      id: dto.id,
      name: dto.name,
      slug: dto.slug,
      imageUrl: dto.image,
      productCount: dto.productCount,
    );
  }
}

/// Represents a parent category node with its subcategories.
/// Used for hierarchical display (e.g., in navigation drawers).
class CategoryNode {
  final String id;
  final String name;
  final String? slug;
  final String? icon;
  final String? imageUrl;
  final int? productCount;
  final List<SubcategoryNode> children;

  CategoryNode({
    required this.id,
    required this.name,
    this.slug,
    this.icon,
    this.imageUrl,
    this.productCount,
    this.children = const [],
  });

  /// Factory constructor to create from CategoryDto.
  /// Prioritizes dto.children if present, otherwise uses dto.subcategories.
  /// Children are mapped to SubcategoryNode (not CategoryNode) because
  /// our DB structure is parent category + subcategories (not nested categories).
  factory CategoryNode.fromDto(CategoryDto dto) {
    List<SubcategoryNode> childNodes;

    // Prefer children (CategoryDto list) if not empty
    if (dto.children.isNotEmpty) {
      childNodes = dto.children
          .map((child) => SubcategoryNode.fromCategoryDto(child))
          .toList();
    }
    // Otherwise use subcategories (SubcategoryDto list)
    else if (dto.subcategories.isNotEmpty) {
      childNodes = dto.subcategories
          .map((sub) => SubcategoryNode.fromDto(sub))
          .toList();
    }
    // Default to empty list
    else {
      childNodes = [];
    }

    return CategoryNode(
      id: dto.id,
      name: dto.name,
      slug: dto.slug,
      icon: null, // CategoryDto doesn't have icon field
      imageUrl: dto.image,
      productCount: dto.productCount,
      children: childNodes,
    );
  }

  /// Whether this category has any subcategories
  bool get hasChildren => children.isNotEmpty;

  /// Total count of subcategories
  int get childCount => children.length;
}
