class Category {
  final String id;
  final String name;
  final String? slug;
  final String icon;
  final String imageUrl;
  final int productCount;

  const Category({
    required this.id,
    required this.name,
    this.slug,
    required this.icon,
    required this.imageUrl,
    this.productCount = 0,
  });

  /// Get URL-friendly slug (defaults to id if not set)
  String get effectiveSlug => slug ?? id;
}
