/// Product DTO matching backend response
class ProductDto {
  final String id;
  final String sku;
  final String name;
  final String? slug;
  final String description;
  final double price;
  final double? oldPrice;
  final double? compareAtPrice;
  final double? priceInclVat;
  final String imageUrl;
  final List<String> images;
  final CategoryDto? category;
  final SubcategoryRefDto? subcategory;
  final BrandDto? brand;
  final int stock;
  final bool inStock;
  final bool isActive;
  final bool isFeatured;
  final bool isNew;
  final bool isBestSeller;
  final double? discount;
  final List<Map<String, dynamic>>? specifications;
  final List<String>? features;
  final Map<String, dynamic>? dimensions;
  final Map<String, dynamic>? packaging;
  final ProductOverrideDto? override;
  final DateTime createdAt;
  final DateTime updatedAt;

  // ==== NEW: Product Page Fields v1 ====
  final String? shortDescription;
  final String? fullDescription;
  final List<String> highlights;
  final List<String> galleryImageUrls;
  final List<Map<String, dynamic>> specs; // [{key, value}]
  final String? deliveryNote;
  final String? returnsNote;
  final String? urlSlug;
  final String? metaTitle;
  final String? metaDescription;
  // ==== END: Product Page Fields v1 ====

  ProductDto({
    required this.id,
    required this.sku,
    required this.name,
    this.slug,
    required this.description,
    required this.price,
    this.oldPrice,
    this.compareAtPrice,
    this.priceInclVat,
    required this.imageUrl,
    required this.images,
    this.category,
    this.subcategory,
    this.brand,
    required this.stock,
    required this.inStock,
    this.isActive = true,
    required this.isFeatured,
    required this.isNew,
    required this.isBestSeller,
    this.discount,
    this.specifications,
    this.features,
    this.dimensions,
    this.packaging,
    this.override,
    required this.createdAt,
    required this.updatedAt,
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

  factory ProductDto.fromJson(Map<String, dynamic> json) {
    // Handle images - can be list of objects or list of strings
    List<String> imagesList = [];
    if (json['images'] != null) {
      final imagesData = json['images'] as List<dynamic>;
      imagesList = imagesData
          .map((e) {
            if (e is String) return e;
            if (e is Map<String, dynamic>) return e['url']?.toString() ?? '';
            return '';
          })
          .where((s) => s.isNotEmpty)
          .toList();
    }

    // Parse highlights
    List<String> highlightsList = [];
    if (json['highlights'] != null && json['highlights'] is List) {
      highlightsList = (json['highlights'] as List<dynamic>)
          .map((e) => e.toString())
          .toList();
    }

    // Parse galleryImageUrls
    List<String> galleryList = [];
    if (json['galleryImageUrls'] != null && json['galleryImageUrls'] is List) {
      galleryList = (json['galleryImageUrls'] as List<dynamic>)
          .map((e) => e.toString())
          .toList();
    }

    // Parse specs
    List<Map<String, dynamic>> specsList = [];
    if (json['specs'] != null && json['specs'] is List) {
      specsList = (json['specs'] as List<dynamic>)
          .map((e) => e is Map<String, dynamic> ? e : <String, dynamic>{})
          .where((m) => m.isNotEmpty)
          .toList();
    }

    return ProductDto(
      id: json['id']?.toString() ?? '',
      sku: json['sku']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      slug: json['slug']?.toString(),
      description: json['description']?.toString() ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0.0,
      oldPrice: json['oldPrice'] != null
          ? (json['oldPrice'] as num).toDouble()
          : null,
      compareAtPrice: json['compareAtPrice'] != null
          ? (json['compareAtPrice'] as num).toDouble()
          : null,
      priceInclVat: json['priceInclVat'] != null
          ? (json['priceInclVat'] as num).toDouble()
          : null,
      imageUrl: json['imageUrl']?.toString() ??
          (imagesList.isNotEmpty ? imagesList.first : ''),
      images: imagesList,
      category: json['category'] != null
          ? CategoryDto.fromJson(json['category'] as Map<String, dynamic>)
          : null,
      subcategory: json['subcategory'] != null
          ? SubcategoryRefDto.fromJson(
              json['subcategory'] as Map<String, dynamic>)
          : null,
      brand: json['brand'] != null
          ? BrandDto.fromJson(json['brand'] as Map<String, dynamic>)
          : null,
      stock: json['stock'] as int? ?? json['stockQuantity'] as int? ?? 0,
      inStock: json['inStock'] as bool? ?? true,
      isActive: json['isActive'] as bool? ?? true,
      isFeatured: json['isFeatured'] as bool? ?? false,
      isNew: json['isNew'] as bool? ?? false,
      isBestSeller: json['isBestSeller'] as bool? ?? false,
      discount: json['discount'] != null
          ? (json['discount'] as num).toDouble()
          : null,
      specifications: json['specifications'] != null
          ? (json['specifications'] as List<dynamic>)
              .map((e) => e as Map<String, dynamic>)
              .toList()
          : null,
      features: (json['features'] as List<dynamic>?)
          ?.map((e) => e.toString())
          .toList(),
      dimensions: json['dimensions'] as Map<String, dynamic>?,
      packaging: json['packaging'] as Map<String, dynamic>?,
      override: json['_override'] != null
          ? ProductOverrideDto.fromJson(
              json['_override'] as Map<String, dynamic>)
          : null,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'].toString())
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'].toString())
          : DateTime.now(),
      // ==== NEW: Product Page Fields v1 ====
      shortDescription: json['shortDescription']?.toString(),
      fullDescription: json['fullDescription']?.toString(),
      highlights: highlightsList,
      galleryImageUrls: galleryList,
      specs: specsList,
      deliveryNote: json['deliveryNote']?.toString(),
      returnsNote: json['returnsNote']?.toString(),
      urlSlug: json['urlSlug']?.toString(),
      metaTitle: json['metaTitle']?.toString(),
      metaDescription: json['metaDescription']?.toString(),
      // ==== END: Product Page Fields v1 ====
    );
  }
}

/// Subcategory reference (id + name only, as returned in product responses)
class SubcategoryRefDto {
  final String id;
  final String name;

  SubcategoryRefDto({required this.id, required this.name});

  factory SubcategoryRefDto.fromJson(Map<String, dynamic> json) {
    return SubcategoryRefDto(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
    );
  }
}

/// Product override info
class ProductOverrideDto {
  final String id;
  final int? homepageRank;
  final int? categoryRank;

  ProductOverrideDto({
    required this.id,
    this.homepageRank,
    this.categoryRank,
  });

  factory ProductOverrideDto.fromJson(Map<String, dynamic> json) {
    return ProductOverrideDto(
      id: json['id'] as String,
      homepageRank: json['homepageRank'] as int?,
      categoryRank: json['categoryRank'] as int?,
    );
  }
}

/// Product list response with pagination
class ProductListDto {
  final List<ProductDto> data;
  final PaginationMetaDto meta;

  ProductListDto({
    required this.data,
    required this.meta,
  });

  factory ProductListDto.fromJson(Map<String, dynamic> json) {
    // Handle both 'meta' object and flat pagination fields
    PaginationMetaDto meta;
    if (json['meta'] != null) {
      meta = PaginationMetaDto.fromJson(json['meta'] as Map<String, dynamic>);
    } else {
      meta = PaginationMetaDto(
        total: json['total'] as int? ?? 0,
        page: json['page'] as int? ?? 1,
        limit: json['limit'] as int? ?? 20,
        totalPages: json['totalPages'] as int? ?? 1,
      );
    }

    return ProductListDto(
      data: (json['data'] as List<dynamic>)
          .map((e) => ProductDto.fromJson(e as Map<String, dynamic>))
          .toList(),
      meta: meta,
    );
  }
}

/// Pagination metadata
class PaginationMetaDto {
  final int total;
  final int page;
  final int limit;
  final int totalPages;

  PaginationMetaDto({
    required this.total,
    required this.page,
    required this.limit,
    required this.totalPages,
  });

  factory PaginationMetaDto.fromJson(Map<String, dynamic> json) {
    return PaginationMetaDto(
      total: json['total'] as int,
      page: json['page'] as int,
      limit: json['limit'] as int,
      totalPages: json['totalPages'] as int,
    );
  }
}

/// Category DTO
class CategoryDto {
  final String id;
  final String name;
  final String slug;
  final String? description;
  final String? image;
  final int? displayOrder;
  final bool isActive;
  final String? parentId;
  final List<CategoryDto>? children;
  final int? productCount;
  final List<dynamic>? subcategories;

  CategoryDto({
    required this.id,
    required this.name,
    required this.slug,
    this.description,
    this.image,
    this.displayOrder,
    required this.isActive,
    this.parentId,
    this.children,
    this.productCount,
    this.subcategories,
  });

  factory CategoryDto.fromJson(Map<String, dynamic> json) {
    return CategoryDto(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      slug: json['slug']?.toString() ?? json['id']?.toString() ?? '',
      description: json['description'] as String?,
      image: json['image'] as String?,
      displayOrder: json['displayOrder'] as int? ?? json['sortOrder'] as int?,
      isActive: json['isActive'] as bool? ?? true,
      parentId: json['parentId']?.toString(),
      children: json['children'] != null
          ? (json['children'] as List)
              .map((e) => CategoryDto.fromJson(e as Map<String, dynamic>))
              .toList()
          : null,
      productCount: json['productCount'] as int? ??
          (json['_count'] != null
              ? (json['_count'] as Map<String, dynamic>)['products'] as int?
              : null),
      subcategories: json['subcategories'] as List<dynamic>?,
    );
  }
}

/// Brand DTO
class BrandDto {
  final String id;
  final String name;
  final String slug;
  final String? description;
  final String? logo;
  final String? website;
  final bool isActive;
  final int? productCount;

  BrandDto({
    required this.id,
    required this.name,
    required this.slug,
    this.description,
    this.logo,
    this.website,
    required this.isActive,
    this.productCount,
  });

  factory BrandDto.fromJson(Map<String, dynamic> json) {
    return BrandDto(
      id: json['id']?.toString() ?? '',
      name: json['name']?.toString() ?? '',
      slug: json['slug']?.toString() ?? json['id']?.toString() ?? '',
      description: json['description'] as String?,
      logo: json['logo'] as String?,
      website: json['website'] as String?,
      isActive: json['isActive'] as bool? ?? true,
      productCount: json['productCount'] as int? ??
          (json['_count'] != null
              ? (json['_count'] as Map<String, dynamic>)['products'] as int?
              : null),
    );
  }
}
