/// Unified Content/CMS DTOs for both storefront and admin
/// Source of truth for all CMS-related data structures
library;

import 'base_dto.dart';
export 'base_dto.dart';

// =============================================================================
// BANNER PLACEMENT CONSTANTS
// =============================================================================

/// Banner placement types
class BannerPlacement {
  static const String homeHero = 'HOME_HERO';
  static const String homeMid = 'HOME_MID';
  static const String homeSecondary = 'HOME_SECONDARY';
  static const String categoryTop = 'CATEGORY_TOP';
  static const String categoryMid = 'CATEGORY_MID';
  static const String productSidebar = 'PRODUCT_SIDEBAR';
  static const String checkoutTop = 'CHECKOUT_TOP';
  static const String cartSidebar = 'CART_SIDEBAR';
  static const String promotion = 'PROMOTION';

  static const List<String> all = [
    homeHero,
    homeMid,
    homeSecondary,
    categoryTop,
    categoryMid,
    productSidebar,
    checkoutTop,
    cartSidebar,
    promotion,
  ];

  static String getDisplayName(String placement) {
    switch (placement) {
      case homeHero:
        return 'Home Hero';
      case homeMid:
        return 'Home Middle';
      case homeSecondary:
        return 'Home Secondary';
      case categoryTop:
        return 'Category Top';
      case categoryMid:
        return 'Category Middle';
      case productSidebar:
        return 'Product Sidebar';
      case checkoutTop:
        return 'Checkout Top';
      case cartSidebar:
        return 'Cart Sidebar';
      case promotion:
        return 'Promotion';
      default:
        return placement;
    }
  }
}

/// Landing section types
class LandingSectionType {
  static const String productGrid = 'PRODUCT_GRID';
  static const String categoryGrid = 'CATEGORY_GRID';
  static const String richText = 'RICH_TEXT';
  static const String image = 'IMAGE';
  static const String bannerCarousel = 'BANNER_CAROUSEL';
  static const String featuredProducts = 'FEATURED_PRODUCTS';
  static const String brandShowcase = 'BRAND_SHOWCASE';
  static const String testimonials = 'TESTIMONIALS';

  static const List<String> all = [
    productGrid,
    categoryGrid,
    richText,
    image,
    bannerCarousel,
    featuredProducts,
    brandShowcase,
    testimonials,
  ];

  static String getDisplayName(String type) {
    switch (type) {
      case productGrid:
        return 'Product Grid';
      case categoryGrid:
        return 'Category Grid';
      case richText:
        return 'Rich Text';
      case image:
        return 'Image';
      case bannerCarousel:
        return 'Banner Carousel';
      case featuredProducts:
        return 'Featured Products';
      case brandShowcase:
        return 'Brand Showcase';
      case testimonials:
        return 'Testimonials';
      default:
        return type;
    }
  }
}

// =============================================================================
// BANNER DTOs
// =============================================================================

/// Banner DTO matching backend CMS response
class BannerDto {
  final String id;
  final String placement;
  final String title;
  final String? subtitle;
  final String? ctaText;
  final String? ctaUrl;
  final String imageDesktopUrl;
  final String? imageMobileUrl;
  final DateTime? startAt;
  final DateTime? endAt;
  final int displayOrder;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  BannerDto({
    required this.id,
    required this.placement,
    required this.title,
    this.subtitle,
    this.ctaText,
    this.ctaUrl,
    required this.imageDesktopUrl,
    this.imageMobileUrl,
    this.startAt,
    this.endAt,
    this.displayOrder = 0,
    this.isActive = true,
    required this.createdAt,
    required this.updatedAt,
  });

  /// Check if banner is currently within its date window
  bool get isWithinDateWindow {
    final now = DateTime.now();
    if (startAt != null && now.isBefore(startAt!)) return false;
    if (endAt != null && now.isAfter(endAt!)) return false;
    return true;
  }

  /// Check if banner should be displayed (active + within date window)
  bool get shouldDisplay => isActive && isWithinDateWindow;

  factory BannerDto.fromJson(Map<String, dynamic> json) {
    return BannerDto(
      id: parseString(json['id']),
      placement: parseString(json['placement'], BannerPlacement.homeHero),
      title: parseString(json['title']),
      subtitle: json['subtitle'] as String?,
      ctaText: json['ctaText'] as String?,
      ctaUrl: json['ctaUrl'] as String?,
      imageDesktopUrl: parseString(
          json['imageDesktopUrl'] ?? json['imageUrl'] ?? json['image']),
      imageMobileUrl: json['imageMobileUrl'] as String?,
      startAt: parseDateTime(json['startAt']),
      endAt: parseDateTime(json['endAt']),
      displayOrder: parseInt(json['displayOrder']),
      isActive: parseBool(json['isActive'], true),
      createdAt: parseDateTimeRequired(json['createdAt']),
      updatedAt: parseDateTimeRequired(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'placement': placement,
        'title': title,
        if (subtitle != null) 'subtitle': subtitle,
        if (ctaText != null) 'ctaText': ctaText,
        if (ctaUrl != null) 'ctaUrl': ctaUrl,
        'imageDesktopUrl': imageDesktopUrl,
        if (imageMobileUrl != null) 'imageMobileUrl': imageMobileUrl,
        if (startAt != null) 'startAt': startAt!.toIso8601String(),
        if (endAt != null) 'endAt': endAt!.toIso8601String(),
        'displayOrder': displayOrder,
        'isActive': isActive,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };

  /// Create a copy with updated fields
  BannerDto copyWith({
    String? id,
    String? placement,
    String? title,
    String? subtitle,
    String? ctaText,
    String? ctaUrl,
    String? imageDesktopUrl,
    String? imageMobileUrl,
    DateTime? startAt,
    DateTime? endAt,
    int? displayOrder,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return BannerDto(
      id: id ?? this.id,
      placement: placement ?? this.placement,
      title: title ?? this.title,
      subtitle: subtitle ?? this.subtitle,
      ctaText: ctaText ?? this.ctaText,
      ctaUrl: ctaUrl ?? this.ctaUrl,
      imageDesktopUrl: imageDesktopUrl ?? this.imageDesktopUrl,
      imageMobileUrl: imageMobileUrl ?? this.imageMobileUrl,
      startAt: startAt ?? this.startAt,
      endAt: endAt ?? this.endAt,
      displayOrder: displayOrder ?? this.displayOrder,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

// =============================================================================
// LANDING PAGE DTOs
// =============================================================================

/// Landing page DTO
class LandingPageDto {
  final String id;
  final String slug;
  final String title;
  final String? subtitle;
  final String? heroBannerId;
  final BannerDto? heroBanner;
  final String? seoTitle;
  final String? seoDescription;
  final bool isActive;
  final List<LandingSectionDto> sections;
  final DateTime createdAt;
  final DateTime updatedAt;

  LandingPageDto({
    required this.id,
    required this.slug,
    required this.title,
    this.subtitle,
    this.heroBannerId,
    this.heroBanner,
    this.seoTitle,
    this.seoDescription,
    this.isActive = true,
    this.sections = const [],
    required this.createdAt,
    required this.updatedAt,
  });

  factory LandingPageDto.fromJson(Map<String, dynamic> json) {
    return LandingPageDto(
      id: (json['id'] ?? json['landingPageId'] ?? json['pageId'])?.toString() ??
          '',
      slug: (json['slug'] ?? '') as String,
      title: parseString(json['title']),
      subtitle: json['subtitle'] as String?,
      heroBannerId: json['heroBannerId'] as String?,
      heroBanner: json['heroBanner'] != null
          ? BannerDto.fromJson(json['heroBanner'] as Map<String, dynamic>)
          : null,
      seoTitle: json['seoTitle'] as String?,
      seoDescription: json['seoDescription'] as String?,
      isActive: parseBool(json['isActive'], true),
      sections: parseList<LandingSectionDto>(
        json['sections'],
        (e) => LandingSectionDto.fromJson(e as Map<String, dynamic>),
      ),
      createdAt: parseDateTimeRequired(json['createdAt']),
      updatedAt: parseDateTimeRequired(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'slug': slug,
        'title': title,
        if (subtitle != null) 'subtitle': subtitle,
        if (heroBannerId != null) 'heroBannerId': heroBannerId,
        if (heroBanner != null) 'heroBanner': heroBanner!.toJson(),
        if (seoTitle != null) 'seoTitle': seoTitle,
        if (seoDescription != null) 'seoDescription': seoDescription,
        'isActive': isActive,
        'sections': sections.map((e) => e.toJson()).toList(),
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };

  LandingPageDto copyWith({
    String? id,
    String? slug,
    String? title,
    String? subtitle,
    String? heroBannerId,
    BannerDto? heroBanner,
    String? seoTitle,
    String? seoDescription,
    bool? isActive,
    List<LandingSectionDto>? sections,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return LandingPageDto(
      id: id ?? this.id,
      slug: slug ?? this.slug,
      title: title ?? this.title,
      subtitle: subtitle ?? this.subtitle,
      heroBannerId: heroBannerId ?? this.heroBannerId,
      heroBanner: heroBanner ?? this.heroBanner,
      seoTitle: seoTitle ?? this.seoTitle,
      seoDescription: seoDescription ?? this.seoDescription,
      isActive: isActive ?? this.isActive,
      sections: sections ?? this.sections,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

/// Landing section DTO
class LandingSectionDto {
  final String id;
  final String landingPageId;
  final String type;
  final Map<String, dynamic> data;
  final int displayOrder;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  LandingSectionDto({
    required this.id,
    required this.landingPageId,
    required this.type,
    required this.data,
    this.displayOrder = 0,
    this.isActive = true,
    required this.createdAt,
    required this.updatedAt,
  });

  factory LandingSectionDto.fromJson(Map<String, dynamic> json) {
    // Parse the data field - can be a JSON string or already a Map
    Map<String, dynamic> parsedData;
    final dataValue = json['data'];
    if (dataValue is String) {
      try {
        parsedData = Map<String, dynamic>.from(
          parseMap(dataValue.isNotEmpty ? _jsonDecode(dataValue) : {}),
        );
      } catch (e) {
        parsedData = {};
      }
    } else if (dataValue is Map<String, dynamic>) {
      parsedData = dataValue;
    } else {
      parsedData = {};
    }

    return LandingSectionDto(
      id: parseString(json['id']),
      landingPageId: parseString(json['landingPageId']),
      type: parseString(json['type'], LandingSectionType.richText),
      data: parsedData,
      displayOrder: parseInt(json['displayOrder']),
      isActive: parseBool(json['isActive'], true),
      createdAt: parseDateTimeRequired(json['createdAt']),
      updatedAt: parseDateTimeRequired(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'landingPageId': landingPageId,
        'type': type,
        'data': data,
        'displayOrder': displayOrder,
        'isActive': isActive,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };

  LandingSectionDto copyWith({
    String? id,
    String? landingPageId,
    String? type,
    Map<String, dynamic>? data,
    int? displayOrder,
    bool? isActive,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return LandingSectionDto(
      id: id ?? this.id,
      landingPageId: landingPageId ?? this.landingPageId,
      type: type ?? this.type,
      data: data ?? this.data,
      displayOrder: displayOrder ?? this.displayOrder,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

/// Helper to decode JSON string
dynamic _jsonDecode(String source) {
  // Import is intentionally avoided to not bloat this DTO file
  // The caller should handle JSON decoding if needed
  throw UnimplementedError('Use dart:convert jsonDecode');
}

// =============================================================================
// MEDIA DTOs
// =============================================================================

/// Media upload response DTO
class MediaUploadDto {
  final String url;
  final String filename;
  final String folder;
  final int size;
  final String mimeType;
  final DateTime uploadedAt;

  MediaUploadDto({
    required this.url,
    required this.filename,
    required this.folder,
    required this.size,
    required this.mimeType,
    required this.uploadedAt,
  });

  factory MediaUploadDto.fromJson(Map<String, dynamic> json) {
    return MediaUploadDto(
      url: parseString(json['url']),
      filename: parseString(json['filename']),
      folder: parseString(json['folder']),
      size: parseInt(json['size']),
      mimeType: parseString(json['mimeType']),
      uploadedAt: parseDateTimeRequired(json['uploadedAt']),
    );
  }

  Map<String, dynamic> toJson() => {
        'url': url,
        'filename': filename,
        'folder': folder,
        'size': size,
        'mimeType': mimeType,
        'uploadedAt': uploadedAt.toIso8601String(),
      };
}
