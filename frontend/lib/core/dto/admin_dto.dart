/// Unified Admin DTOs
/// Source of truth for all admin-specific data structures
library;

import 'base_dto.dart';
export 'base_dto.dart';

// =============================================================================
// DASHBOARD DTOs
// =============================================================================

/// Dashboard statistics DTO
class DashboardStatsDto {
  final int ordersToday;
  final int ordersThisWeek;
  final int ordersThisMonth;
  final double revenueToday;
  final double revenueThisWeek;
  final double revenueThisMonth;
  final int totalCustomers;
  final int newCustomersToday;
  final List<TopProductDto> topProducts;
  final List<LowStockProductDto> lowStockProducts;
  final int activeBanners;
  final int totalBanners;
  final List<RecentOrderDto> recentOrders;
  final List<OrderStatusCount> ordersByStatus;

  DashboardStatsDto({
    this.ordersToday = 0,
    this.ordersThisWeek = 0,
    this.ordersThisMonth = 0,
    this.revenueToday = 0.0,
    this.revenueThisWeek = 0.0,
    this.revenueThisMonth = 0.0,
    this.totalCustomers = 0,
    this.newCustomersToday = 0,
    this.topProducts = const [],
    this.lowStockProducts = const [],
    this.activeBanners = 0,
    this.totalBanners = 0,
    this.recentOrders = const [],
    this.ordersByStatus = const [],
  });

  factory DashboardStatsDto.fromJson(Map<String, dynamic> json) {
    return DashboardStatsDto(
      ordersToday: parseInt(json['ordersToday']),
      ordersThisWeek: parseInt(json['ordersThisWeek']),
      ordersThisMonth: parseInt(json['ordersThisMonth']),
      revenueToday: parseDouble(json['revenueToday']),
      revenueThisWeek: parseDouble(json['revenueThisWeek']),
      revenueThisMonth: parseDouble(json['revenueThisMonth']),
      totalCustomers: parseInt(json['totalCustomers']),
      newCustomersToday: parseInt(json['newCustomersToday']),
      topProducts: parseList<TopProductDto>(
        json['topProducts'],
        (e) => TopProductDto.fromJson(e as Map<String, dynamic>),
      ),
      lowStockProducts: parseList<LowStockProductDto>(
        json['lowStockProducts'],
        (e) => LowStockProductDto.fromJson(e as Map<String, dynamic>),
      ),
      activeBanners: parseInt(json['activeBanners']),
      totalBanners: parseInt(json['totalBanners']),
      recentOrders: parseList<RecentOrderDto>(
        json['recentOrders'],
        (e) => RecentOrderDto.fromJson(e as Map<String, dynamic>),
      ),
      ordersByStatus: parseList<OrderStatusCount>(
        json['ordersByStatus'],
        (e) => OrderStatusCount.fromJson(e as Map<String, dynamic>),
      ),
    );
  }

  Map<String, dynamic> toJson() => {
        'ordersToday': ordersToday,
        'ordersThisWeek': ordersThisWeek,
        'ordersThisMonth': ordersThisMonth,
        'revenueToday': revenueToday,
        'revenueThisWeek': revenueThisWeek,
        'revenueThisMonth': revenueThisMonth,
        'totalCustomers': totalCustomers,
        'newCustomersToday': newCustomersToday,
        'topProducts': topProducts.map((e) => e.toJson()).toList(),
        'lowStockProducts': lowStockProducts.map((e) => e.toJson()).toList(),
        'activeBanners': activeBanners,
        'totalBanners': totalBanners,
        'recentOrders': recentOrders.map((e) => e.toJson()).toList(),
        'ordersByStatus': ordersByStatus.map((e) => e.toJson()).toList(),
      };
}

/// Top product DTO
class TopProductDto {
  final String id;
  final String sku;
  final String name;
  final String imageUrl;
  final int totalOrders;
  final double totalRevenue;
  final int totalQuantity;

  TopProductDto({
    required this.id,
    required this.sku,
    required this.name,
    this.imageUrl = '',
    this.totalOrders = 0,
    this.totalRevenue = 0.0,
    this.totalQuantity = 0,
  });

  factory TopProductDto.fromJson(Map<String, dynamic> json) {
    return TopProductDto(
      id: parseString(json['id']),
      sku: parseString(json['sku']),
      name: parseString(json['name']),
      imageUrl: parseString(json['imageUrl']),
      totalOrders: parseInt(json['totalOrders']),
      totalRevenue: parseDouble(json['totalRevenue']),
      totalQuantity: parseInt(json['totalQuantity']),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'sku': sku,
        'name': name,
        'imageUrl': imageUrl,
        'totalOrders': totalOrders,
        'totalRevenue': totalRevenue,
        'totalQuantity': totalQuantity,
      };
}

/// Low stock product DTO
class LowStockProductDto {
  final String id;
  final String sku;
  final String name;
  final String imageUrl;
  final int stock;
  final int threshold;

  LowStockProductDto({
    required this.id,
    required this.sku,
    required this.name,
    this.imageUrl = '',
    this.stock = 0,
    this.threshold = 0,
  });

  factory LowStockProductDto.fromJson(Map<String, dynamic> json) {
    return LowStockProductDto(
      id: parseString(json['id']),
      sku: parseString(json['sku']),
      name: parseString(json['name']),
      imageUrl: parseString(json['imageUrl']),
      stock: parseInt(json['stock']),
      threshold: parseInt(json['threshold']),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'sku': sku,
        'name': name,
        'imageUrl': imageUrl,
        'stock': stock,
        'threshold': threshold,
      };
}

/// Recent order DTO
class RecentOrderDto {
  final String id;
  final String orderNumber;
  final String customerName;
  final double total;
  final String status;
  final DateTime createdAt;

  RecentOrderDto({
    required this.id,
    required this.orderNumber,
    required this.customerName,
    this.total = 0.0,
    required this.status,
    required this.createdAt,
  });

  factory RecentOrderDto.fromJson(Map<String, dynamic> json) {
    return RecentOrderDto(
      id: parseString(json['id']),
      orderNumber: parseString(json['orderNumber']),
      customerName: parseString(json['customerName']),
      total: parseDouble(json['total']),
      status: parseString(json['status']),
      createdAt: parseDateTimeRequired(json['createdAt']),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'orderNumber': orderNumber,
        'customerName': customerName,
        'total': total,
        'status': status,
        'createdAt': createdAt.toIso8601String(),
      };
}

/// Order status count DTO
class OrderStatusCount {
  final String status;
  final int count;
  final double percentage;

  OrderStatusCount({
    required this.status,
    this.count = 0,
    this.percentage = 0.0,
  });

  factory OrderStatusCount.fromJson(Map<String, dynamic> json) {
    return OrderStatusCount(
      status: parseString(json['status']),
      count: parseInt(json['count']),
      percentage: parseDouble(json['percentage']),
    );
  }

  Map<String, dynamic> toJson() => {
        'status': status,
        'count': count,
        'percentage': percentage,
      };
}

// =============================================================================
// CREATE/UPDATE REQUEST DTOs
// =============================================================================

/// Create/Update product override request
class ProductOverrideRequest {
  final String sku;
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
  final List<Map<String, dynamic>>? images;
  final Map<String, dynamic>? seo;

  ProductOverrideRequest({
    required this.sku,
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
  });

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{
      'sku': sku,
    };

    // Only include non-null values
    if (name != null) map['name'] = name;
    if (description != null) map['description'] = description;
    if (price != null) map['price'] = price;
    if (salePrice != null) map['salePrice'] = salePrice;
    if (isFeatured != null) map['isFeatured'] = isFeatured;
    if (isNew != null) map['isNew'] = isNew;
    if (isBestSeller != null) map['isBestSeller'] = isBestSeller;
    if (isActive != null) map['isActive'] = isActive;
    if (homepageRank != null) map['homepageRank'] = homepageRank;
    if (categoryRank != null) map['categoryRank'] = categoryRank;
    if (images != null) map['images'] = images;
    if (seo != null) map['seo'] = seo;

    return map;
  }
}

/// Create/Update category request
class CategoryRequest {
  final String name;
  final String? slug;
  final String? description;
  final String? image;
  final int? displayOrder;
  final bool? isActive;
  final String? parentId;

  CategoryRequest({
    required this.name,
    this.slug,
    this.description,
    this.image,
    this.displayOrder,
    this.isActive,
    this.parentId,
  });

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{
      'name': name,
    };

    if (slug != null) map['slug'] = slug;
    if (description != null) map['description'] = description;
    if (image != null) map['image'] = image;
    if (displayOrder != null) map['displayOrder'] = displayOrder;
    if (isActive != null) map['isActive'] = isActive;
    if (parentId != null) map['parentId'] = parentId;

    return map;
  }
}

/// Create/Update brand request
class BrandRequest {
  final String name;
  final String? slug;
  final String? description;
  final String? logo;
  final String? website;
  final bool? isActive;

  BrandRequest({
    required this.name,
    this.slug,
    this.description,
    this.logo,
    this.website,
    this.isActive,
  });

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{
      'name': name,
    };

    if (slug != null) map['slug'] = slug;
    if (description != null) map['description'] = description;
    if (logo != null) map['logo'] = logo;
    if (website != null) map['website'] = website;
    if (isActive != null) map['isActive'] = isActive;

    return map;
  }
}

/// Create/Update banner request
class BannerRequest {
  final String placement;
  final String title;
  final String? subtitle;
  final String? ctaText;
  final String? ctaUrl;
  final String imageDesktopUrl;
  final String? imageMobileUrl;
  final DateTime? startAt;
  final DateTime? endAt;
  final int? displayOrder;
  final bool? isActive;

  BannerRequest({
    required this.placement,
    required this.title,
    this.subtitle,
    this.ctaText,
    this.ctaUrl,
    required this.imageDesktopUrl,
    this.imageMobileUrl,
    this.startAt,
    this.endAt,
    this.displayOrder,
    this.isActive,
  });

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{
      'placement': placement,
      'title': title,
      'imageDesktopUrl': imageDesktopUrl,
    };

    if (subtitle != null) map['subtitle'] = subtitle;
    if (ctaText != null) map['ctaText'] = ctaText;
    if (ctaUrl != null) map['ctaUrl'] = ctaUrl;
    if (imageMobileUrl != null) map['imageMobileUrl'] = imageMobileUrl;
    if (startAt != null) map['startAt'] = startAt!.toIso8601String();
    if (endAt != null) map['endAt'] = endAt!.toIso8601String();
    if (displayOrder != null) map['displayOrder'] = displayOrder;
    if (isActive != null) map['isActive'] = isActive;

    return map;
  }
}

/// Create/Update landing page request
class LandingPageRequest {
  final String slug;
  final String title;
  final String? heroBannerId;
  final String? seoTitle;
  final String? seoDescription;
  final bool? isActive;

  LandingPageRequest({
    required this.slug,
    required this.title,
    this.heroBannerId,
    this.seoTitle,
    this.seoDescription,
    this.isActive,
  });

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{
      'slug': slug,
      'title': title,
    };

    if (heroBannerId != null) map['heroBannerId'] = heroBannerId;
    if (seoTitle != null) map['seoTitle'] = seoTitle;
    if (seoDescription != null) map['seoDescription'] = seoDescription;
    if (isActive != null) map['isActive'] = isActive;

    return map;
  }
}

/// Create/Update landing section request
class LandingSectionRequest {
  final String landingPageId;
  final String type;
  final Map<String, dynamic> data;
  final int? displayOrder;
  final bool? isActive;

  LandingSectionRequest({
    required this.landingPageId,
    required this.type,
    required this.data,
    this.displayOrder,
    this.isActive,
  });

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{
      'landingPageId': landingPageId,
      'type': type,
      'data': data,
    };

    if (displayOrder != null) map['displayOrder'] = displayOrder;
    if (isActive != null) map['isActive'] = isActive;

    return map;
  }
}
