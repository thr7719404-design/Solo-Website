/// Unified Product DTOs for both storefront and admin
/// Source of truth for all product-related data structures
library;

import 'base_dto.dart';
export 'base_dto.dart';

// =============================================================================
// PRODUCT DTOs
// =============================================================================

/// Product DTO matching backend API response
class ProductDto {
  final String id;
  final String sku;
  final String name;
  final String description;
  final double price;
  final double? listPrice;
  final double? salePrice;
  final double? priceInclVat;
  final String currency;
  final String imageUrl;
  final List<ProductImageDto> images;
  final CategoryDto? category;
  final BrandDto? brand;
  final int stock;
  final bool inStock;
  final bool isActive;
  final bool isFeatured;
  final bool isNew;
  final bool isBestSeller;
  final double? discount;
  final int? homepageRank;
  final int? categoryRank;
  final List<ProductSpecificationDto> specifications;
  final List<String> features;
  final ProductDimensionsDto? dimensions;
  final ProductPackagingDto? packaging;
  final ProductOverrideDto? override;
  final ProductSeoDto? seo;
  final DateTime createdAt;
  final DateTime updatedAt;

  ProductDto({
    required this.id,
    required this.sku,
    required this.name,
    required this.description,
    required this.price,
    this.listPrice,
    this.salePrice,
    this.priceInclVat,
    this.currency = 'AED',
    required this.imageUrl,
    required this.images,
    this.category,
    this.brand,
    required this.stock,
    required this.inStock,
    this.isActive = true,
    required this.isFeatured,
    required this.isNew,
    required this.isBestSeller,
    this.discount,
    this.homepageRank,
    this.categoryRank,
    required this.specifications,
    required this.features,
    this.dimensions,
    this.packaging,
    this.override,
    this.seo,
    required this.createdAt,
    required this.updatedAt,
  });

  /// Whether this product has an admin override
  bool get hasOverride => override != null;

  /// Get display price (sale price if available, otherwise regular price)
  double get displayPrice => salePrice ?? price;

  /// Whether product is on sale
  bool get isOnSale => salePrice != null && salePrice! < price;

  factory ProductDto.fromJson(Map<String, dynamic> json) {
    // Handle images - can be list of objects or list of strings
    final List<ProductImageDto> imagesList = _parseImages(json['images']);
    final String primaryImage = imagesList.isNotEmpty
        ? imagesList.first.url
        : parseString(json['imageUrl']);

    return ProductDto(
      id: parseString(json['id']),
      sku: parseString(json['sku']),
      name: parseString(json['name']),
      description: parseString(json['description']),
      price: parseDouble(json['price']),
      listPrice:
          json['listPrice'] != null ? parseDouble(json['listPrice']) : null,
      salePrice:
          json['salePrice'] != null ? parseDouble(json['salePrice']) : null,
      priceInclVat: json['priceInclVat'] != null
          ? parseDouble(json['priceInclVat'])
          : null,
      currency: parseString(json['currency'], 'AED'),
      imageUrl: primaryImage,
      images: imagesList,
      category: json['category'] != null
          ? CategoryDto.fromJson(json['category'] as Map<String, dynamic>)
          : null,
      brand: json['brand'] != null
          ? BrandDto.fromJson(json['brand'] as Map<String, dynamic>)
          : null,
      stock: parseInt(json['stock'] ?? json['stockQuantity']),
      inStock: parseBool(json['inStock'], true),
      isActive: parseBool(json['isActive'], true),
      isFeatured: parseBool(json['isFeatured']),
      isNew: parseBool(json['isNew']),
      isBestSeller: parseBool(json['isBestSeller']),
      discount: json['discount'] != null ? parseDouble(json['discount']) : null,
      homepageRank:
          json['homepageRank'] != null ? parseInt(json['homepageRank']) : null,
      categoryRank:
          json['categoryRank'] != null ? parseInt(json['categoryRank']) : null,
      specifications: _parseSpecifications(json['specifications']),
      features: parseList<String>(json['features'], (e) => e.toString()),
      dimensions: json['dimensions'] != null
          ? ProductDimensionsDto.fromJson(
              json['dimensions'] as Map<String, dynamic>)
          : null,
      packaging: json['packaging'] != null
          ? ProductPackagingDto.fromJson(
              json['packaging'] as Map<String, dynamic>)
          : null,
      override: json['_override'] != null
          ? ProductOverrideDto.fromJson(
              json['_override'] as Map<String, dynamic>)
          : null,
      seo: json['seo'] != null
          ? ProductSeoDto.fromJson(json['seo'] as Map<String, dynamic>)
          : null,
      createdAt: parseDateTimeRequired(json['createdAt']),
      updatedAt: parseDateTimeRequired(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'sku': sku,
        'name': name,
        'description': description,
        'price': price,
        if (listPrice != null) 'listPrice': listPrice,
        if (salePrice != null) 'salePrice': salePrice,
        if (priceInclVat != null) 'priceInclVat': priceInclVat,
        'currency': currency,
        'imageUrl': imageUrl,
        'images': images.map((e) => e.toJson()).toList(),
        if (category != null) 'category': category!.toJson(),
        if (brand != null) 'brand': brand!.toJson(),
        'stock': stock,
        'inStock': inStock,
        'isActive': isActive,
        'isFeatured': isFeatured,
        'isNew': isNew,
        'isBestSeller': isBestSeller,
        if (discount != null) 'discount': discount,
        if (homepageRank != null) 'homepageRank': homepageRank,
        if (categoryRank != null) 'categoryRank': categoryRank,
        'specifications': specifications.map((e) => e.toJson()).toList(),
        'features': features,
        if (dimensions != null) 'dimensions': dimensions!.toJson(),
        if (packaging != null) 'packaging': packaging!.toJson(),
        if (override != null) '_override': override!.toJson(),
        if (seo != null) 'seo': seo!.toJson(),
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };

  static List<ProductImageDto> _parseImages(dynamic imagesData) {
    if (imagesData == null) return [];
    if (imagesData is! List) return [];

    return imagesData
        .map((e) {
          if (e is String) {
            return ProductImageDto(url: e, isPrimary: false, displayOrder: 0);
          }
          if (e is Map<String, dynamic>) {
            return ProductImageDto.fromJson(e);
          }
          return null;
        })
        .whereType<ProductImageDto>()
        .toList();
  }

  static List<ProductSpecificationDto> _parseSpecifications(dynamic specsData) {
    if (specsData == null) return [];
    if (specsData is! List) return [];

    return specsData
        .map((e) {
          if (e is Map<String, dynamic>) {
            return ProductSpecificationDto.fromJson(e);
          }
          return null;
        })
        .whereType<ProductSpecificationDto>()
        .toList();
  }
}

/// Product image DTO
class ProductImageDto {
  final String id;
  final String url;
  final String? altText;
  final bool isPrimary;
  final int displayOrder;

  ProductImageDto({
    String? id,
    required this.url,
    this.altText,
    this.isPrimary = false,
    this.displayOrder = 0,
  }) : id = id ?? '';

  factory ProductImageDto.fromJson(Map<String, dynamic> json) {
    return ProductImageDto(
      id: parseString(json['id']),
      url: parseString(json['url'] ?? json['imageUrl']),
      altText: json['altText'] as String?,
      isPrimary: parseBool(json['isPrimary']),
      displayOrder: parseInt(json['displayOrder']),
    );
  }

  Map<String, dynamic> toJson() => {
        if (id.isNotEmpty) 'id': id,
        'url': url,
        if (altText != null) 'altText': altText,
        'isPrimary': isPrimary,
        'displayOrder': displayOrder,
      };
}

/// Product specification DTO
class ProductSpecificationDto {
  final String id;
  final String key;
  final String value;
  final String? unit;
  final int displayOrder;

  ProductSpecificationDto({
    String? id,
    required this.key,
    required this.value,
    this.unit,
    this.displayOrder = 0,
  }) : id = id ?? '';

  factory ProductSpecificationDto.fromJson(Map<String, dynamic> json) {
    return ProductSpecificationDto(
      id: parseString(json['id']),
      key: parseString(json['key'] ?? json['spec_key'] ?? json['specKey']),
      value:
          parseString(json['value'] ?? json['spec_value'] ?? json['specValue']),
      unit: json['unit'] as String? ?? json['spec_unit'] as String?,
      displayOrder: parseInt(json['displayOrder']),
    );
  }

  Map<String, dynamic> toJson() => {
        if (id.isNotEmpty) 'id': id,
        'key': key,
        'value': value,
        if (unit != null) 'unit': unit,
        'displayOrder': displayOrder,
      };
}

/// Product dimensions DTO
class ProductDimensionsDto {
  final double? length;
  final double? width;
  final double? height;
  final double? diameter;
  final double? capacity;
  final double? weight;
  final String? unit;

  ProductDimensionsDto({
    this.length,
    this.width,
    this.height,
    this.diameter,
    this.capacity,
    this.weight,
    this.unit,
  });

  factory ProductDimensionsDto.fromJson(Map<String, dynamic> json) {
    return ProductDimensionsDto(
      length: json['length'] != null ? parseDouble(json['length']) : null,
      width: json['width'] != null ? parseDouble(json['width']) : null,
      height: json['height'] != null ? parseDouble(json['height']) : null,
      diameter: json['diameter'] != null ? parseDouble(json['diameter']) : null,
      capacity: json['capacity'] != null ? parseDouble(json['capacity']) : null,
      weight: json['weight'] != null ? parseDouble(json['weight']) : null,
      unit: json['unit'] as String?,
    );
  }

  Map<String, dynamic> toJson() => {
        if (length != null) 'length': length,
        if (width != null) 'width': width,
        if (height != null) 'height': height,
        if (diameter != null) 'diameter': diameter,
        if (capacity != null) 'capacity': capacity,
        if (weight != null) 'weight': weight,
        if (unit != null) 'unit': unit,
      };
}

/// Product packaging DTO
class ProductPackagingDto {
  final String? type;
  final int? colliSize;
  final double? colliWeight;
  final double? colliLength;
  final double? colliWidth;
  final double? colliHeight;

  ProductPackagingDto({
    this.type,
    this.colliSize,
    this.colliWeight,
    this.colliLength,
    this.colliWidth,
    this.colliHeight,
  });

  factory ProductPackagingDto.fromJson(Map<String, dynamic> json) {
    return ProductPackagingDto(
      type: json['type'] as String?,
      colliSize: json['colliSize'] != null ? parseInt(json['colliSize']) : null,
      colliWeight:
          json['colliWeight'] != null ? parseDouble(json['colliWeight']) : null,
      colliLength:
          json['colliLength'] != null ? parseDouble(json['colliLength']) : null,
      colliWidth:
          json['colliWidth'] != null ? parseDouble(json['colliWidth']) : null,
      colliHeight:
          json['colliHeight'] != null ? parseDouble(json['colliHeight']) : null,
    );
  }

  Map<String, dynamic> toJson() => {
        if (type != null) 'type': type,
        if (colliSize != null) 'colliSize': colliSize,
        if (colliWeight != null) 'colliWeight': colliWeight,
        if (colliLength != null) 'colliLength': colliLength,
        if (colliWidth != null) 'colliWidth': colliWidth,
        if (colliHeight != null) 'colliHeight': colliHeight,
      };
}

/// Product override DTO (admin overrides to inventory data)
class ProductOverrideDto {
  final String id;
  final String? name;
  final String? description;
  final double? price;
  final double? salePrice;
  final bool? isFeatured;
  final bool? isNew;
  final bool? isBestSeller;
  final bool? isActive;
  final int? homepageRank;
  final int? categoryRank;
  final List<ProductImageDto>? images;
  final ProductSeoDto? seo;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  ProductOverrideDto({
    required this.id,
    this.name,
    this.description,
    this.price,
    this.salePrice,
    this.isFeatured,
    this.isNew,
    this.isBestSeller,
    this.isActive,
    this.homepageRank,
    this.categoryRank,
    this.images,
    this.seo,
    this.createdAt,
    this.updatedAt,
  });

  factory ProductOverrideDto.fromJson(Map<String, dynamic> json) {
    return ProductOverrideDto(
      id: parseString(json['id']),
      name: json['name'] as String?,
      description: json['description'] as String?,
      price: json['price'] != null ? parseDouble(json['price']) : null,
      salePrice:
          json['salePrice'] != null ? parseDouble(json['salePrice']) : null,
      isFeatured: json['isFeatured'] as bool?,
      isNew: json['isNew'] as bool?,
      isBestSeller: json['isBestSeller'] as bool?,
      isActive: json['isActive'] as bool?,
      homepageRank: json['homepageRank'] as int?,
      categoryRank: json['categoryRank'] as int?,
      images: json['images'] != null
          ? ProductDto._parseImages(json['images'])
          : null,
      seo: json['seo'] != null
          ? ProductSeoDto.fromJson(json['seo'] as Map<String, dynamic>)
          : null,
      createdAt: parseDateTime(json['createdAt']),
      updatedAt: parseDateTime(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        if (name != null) 'name': name,
        if (description != null) 'description': description,
        if (price != null) 'price': price,
        if (salePrice != null) 'salePrice': salePrice,
        if (isFeatured != null) 'isFeatured': isFeatured,
        if (isNew != null) 'isNew': isNew,
        if (isBestSeller != null) 'isBestSeller': isBestSeller,
        if (isActive != null) 'isActive': isActive,
        if (homepageRank != null) 'homepageRank': homepageRank,
        if (categoryRank != null) 'categoryRank': categoryRank,
        if (images != null) 'images': images!.map((e) => e.toJson()).toList(),
        if (seo != null) 'seo': seo!.toJson(),
        if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
        if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
      };
}

/// Product SEO DTO
class ProductSeoDto {
  final String? title;
  final String? description;
  final List<String>? keywords;

  ProductSeoDto({
    this.title,
    this.description,
    this.keywords,
  });

  factory ProductSeoDto.fromJson(Map<String, dynamic> json) {
    return ProductSeoDto(
      title: json['title'] as String?,
      description: json['description'] as String?,
      keywords: parseList<String>(json['keywords'], (e) => e.toString()),
    );
  }

  Map<String, dynamic> toJson() => {
        if (title != null) 'title': title,
        if (description != null) 'description': description,
        if (keywords != null && keywords!.isNotEmpty) 'keywords': keywords,
      };
}

// =============================================================================
// CATEGORY DTOs
// =============================================================================

/// Category DTO
class CategoryDto {
  final String id;
  final String name;
  final String slug;
  final String? description;
  final String? image;
  final int displayOrder;
  final bool isActive;
  final String? parentId;
  final List<CategoryDto> children;
  final int productCount;
  final List<SubcategoryDto> subcategories;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  CategoryDto({
    required this.id,
    required this.name,
    required this.slug,
    this.description,
    this.image,
    this.displayOrder = 0,
    this.isActive = true,
    this.parentId,
    this.children = const [],
    this.productCount = 0,
    this.subcategories = const [],
    this.createdAt,
    this.updatedAt,
  });

  factory CategoryDto.fromJson(Map<String, dynamic> json) {
    // Handle _count object for product count
    final countObj = json['_count'] as Map<String, dynamic>?;
    final productCount =
        countObj?['products'] as int? ?? parseInt(json['productCount']);

    return CategoryDto(
      id: parseString(json['id']),
      name: parseString(
          json['name'] ?? json['categoryName'] ?? json['category_name']),
      slug: parseString(json['slug'] ?? json['id']),
      description: json['description'] as String?,
      image: json['image'] as String?,
      displayOrder: parseInt(json['displayOrder'] ??
          json['sortOrder'] ??
          json['display_order'] ??
          json['sort_order']),
      isActive: parseBool(json['isActive'] ?? json['is_active'], true),
      parentId: (json['parentId'] ?? json['parent_id'])?.toString(),
      children: parseList<CategoryDto>(
        json['children'],
        (e) => CategoryDto.fromJson(e as Map<String, dynamic>),
      ),
      productCount: productCount,
      subcategories: parseList<SubcategoryDto>(
        json['subcategories'],
        (e) => SubcategoryDto.fromJson(e as Map<String, dynamic>),
      ),
      createdAt: parseDateTime(json['createdAt']),
      updatedAt: parseDateTime(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'slug': slug,
        if (description != null) 'description': description,
        if (image != null) 'image': image,
        'displayOrder': displayOrder,
        'isActive': isActive,
        if (parentId != null) 'parentId': parentId,
        'children': children.map((e) => e.toJson()).toList(),
        'productCount': productCount,
        'subcategories': subcategories.map((e) => e.toJson()).toList(),
        if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
        if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
      };
}

/// Subcategory DTO
class SubcategoryDto {
  final String id;
  final String name;
  final String slug;
  final String categoryId;
  final int displayOrder;
  final bool isActive;
  final int productCount;

  SubcategoryDto({
    required this.id,
    required this.name,
    required this.slug,
    required this.categoryId,
    this.displayOrder = 0,
    this.isActive = true,
    this.productCount = 0,
  });

  factory SubcategoryDto.fromJson(Map<String, dynamic> json) {
    final countObj = json['_count'] as Map<String, dynamic>?;
    return SubcategoryDto(
      id: parseString(json['id']),
      name: parseString(
          json['name'] ?? json['subcategory_name'] ?? json['subcategoryName']),
      slug: parseString(json['slug'] ?? json['id']),
      categoryId: parseString(json['categoryId'] ?? json['category_id']),
      displayOrder: parseInt(
          json['displayOrder'] ?? json['display_order'] ?? json['sort_order']),
      isActive: parseBool(json['isActive'] ?? json['is_active'], true),
      productCount: countObj?['products'] as int? ??
          parseInt(json['productCount'] ?? json['product_count']),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'slug': slug,
        'categoryId': categoryId,
        'displayOrder': displayOrder,
        'isActive': isActive,
        'productCount': productCount,
      };
}

// =============================================================================
// BRAND DTOs
// =============================================================================

/// Brand DTO
class BrandDto {
  final String id;
  final String name;
  final String slug;
  final String? description;
  final String? logo;
  final String? website;
  final bool isActive;
  final int productCount;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  BrandDto({
    required this.id,
    required this.name,
    required this.slug,
    this.description,
    this.logo,
    this.website,
    this.isActive = true,
    this.productCount = 0,
    this.createdAt,
    this.updatedAt,
  });

  factory BrandDto.fromJson(Map<String, dynamic> json) {
    final countObj = json['_count'] as Map<String, dynamic>?;
    return BrandDto(
      id: parseString(json['id']),
      name:
          parseString(json['name'] ?? json['brandName'] ?? json['brand_name']),
      slug: parseString(json['slug'] ?? json['id']),
      description: json['description'] as String?,
      logo: json['logo'] as String?,
      website: json['website'] as String?,
      isActive: parseBool(json['isActive'] ?? json['is_active'], true),
      productCount:
          countObj?['products'] as int? ?? parseInt(json['productCount']),
      createdAt: parseDateTime(json['createdAt']),
      updatedAt: parseDateTime(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'slug': slug,
        if (description != null) 'description': description,
        if (logo != null) 'logo': logo,
        if (website != null) 'website': website,
        'isActive': isActive,
        'productCount': productCount,
        if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
        if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
      };
}

// =============================================================================
// PAGINATION DTOs
// =============================================================================

/// Pagination metadata
class PaginationMeta {
  final int total;
  final int page;
  final int limit;
  final int totalPages;

  PaginationMeta({
    required this.total,
    required this.page,
    required this.limit,
    required this.totalPages,
  });

  factory PaginationMeta.fromJson(Map<String, dynamic> json) {
    final total = parseInt(json['total']);
    final limit = parseInt(json['limit'], 20);
    return PaginationMeta(
      total: total,
      page: parseInt(json['page'], 1),
      limit: limit,
      totalPages:
          parseInt(json['totalPages'], limit > 0 ? (total / limit).ceil() : 1),
    );
  }

  bool get hasNextPage => page < totalPages;
  bool get hasPrevPage => page > 1;

  Map<String, dynamic> toJson() => {
        'total': total,
        'page': page,
        'limit': limit,
        'totalPages': totalPages,
      };
}

/// Paginated list response
class PaginatedList<T> {
  final List<T> data;
  final PaginationMeta meta;

  PaginatedList({
    required this.data,
    required this.meta,
  });

  factory PaginatedList.fromJson(
    Map<String, dynamic> json,
    T Function(Map<String, dynamic>) fromJson,
  ) {
    // Handle both 'meta' object and flat pagination fields
    PaginationMeta meta;
    if (json['meta'] != null) {
      meta = PaginationMeta.fromJson(json['meta'] as Map<String, dynamic>);
    } else {
      meta = PaginationMeta(
        total: parseInt(json['total']),
        page: parseInt(json['page'], 1),
        limit: parseInt(json['limit'], 20),
        totalPages: parseInt(json['totalPages'], 1),
      );
    }

    return PaginatedList<T>(
      data: parseList<T>(
        json['data'],
        (e) => fromJson(e as Map<String, dynamic>),
      ),
      meta: meta,
    );
  }

  bool get isEmpty => data.isEmpty;
  bool get isNotEmpty => data.isNotEmpty;
  int get length => data.length;
}

/// Alias for backward compatibility
typedef ProductListDto = PaginatedList<ProductDto>;
typedef PaginationMetaDto = PaginationMeta;
