import 'dart:convert';

/// Banner placement types - Use these as the single source of truth
class BannerPlacement {
  static const String homeHero = 'HOME_HERO';
  static const String homeMid = 'HOME_MID';
  static const String homeSecondary = 'HOME_SECONDARY';
  static const String categoryTop = 'CATEGORY_TOP';
  static const String categoryMid = 'CATEGORY_MID';
  static const String category = 'CATEGORY';
  static const String productSidebar = 'PRODUCT_SIDEBAR';
  static const String productDetail = 'PRODUCT_DETAIL';
  static const String checkoutTop = 'CHECKOUT_TOP';
  static const String checkout = 'CHECKOUT';
  static const String cartSidebar = 'CART_SIDEBAR';
  static const String promotion = 'PROMOTION';
}

/// Landing section types - Use these as the single source of truth
class LandingSectionType {
  // Original types
  static const String productGrid = 'PRODUCT_GRID';
  static const String categoryGrid = 'CATEGORY_GRID';
  static const String richText = 'RICH_TEXT';
  static const String image = 'IMAGE';
  static const String bannerCarousel = 'BANNER_CAROUSEL';

  // Porto-style homepage section types
  static const String hero = 'HERO';
  static const String categoryTiles = 'CATEGORY_TILES';
  static const String productCarousel = 'PRODUCT_CAROUSEL';
  static const String brandStrip = 'BRAND_STRIP';
  static const String promoBanner = 'PROMO_BANNER';

  // Porto Demo 4 extended section types
  static const String topPromoBar = 'TOP_PROMO_BAR';
  static const String topLinksBar = 'TOP_LINKS_BAR';
  static const String mainHeader = 'MAIN_HEADER';
  static const String primaryNav = 'PRIMARY_NAV';
  static const String heroSlider = 'HERO_SLIDER';
  static const String valuePropsRow = 'VALUE_PROPS_ROW';
  static const String promoBannerRow3 = 'PROMO_BANNER_ROW_3';
  static const String productCollection = 'PRODUCT_COLLECTION';
  static const String saleStripBanner = 'SALE_STRIP_BANNER';
  static const String categoryCircleStrip = 'CATEGORY_CIRCLE_STRIP';
  static const String infoBlocks3 = 'INFO_BLOCKS_3';
  static const String blogLatestGrid = 'BLOG_LATEST_GRID';
  static const String brandLogoStrip = 'BRAND_LOGO_STRIP';
  static const String footerConfig = 'FOOTER_CONFIG';
  static const String newsletterBlock = 'NEWSLETTER_BLOCK';
  static const String testimonials = 'TESTIMONIALS';

  // Legacy types (for backwards compatibility)
  static const String heroBanner = 'HERO_BANNER';
  static const String featuredProducts = 'FEATURED_PRODUCTS';
  static const String brandShowcase = 'BRAND_SHOWCASE';
  static const String promoStrip = 'PROMO_STRIP';
  static const String newArrivals = 'NEW_ARRIVALS';
  static const String bestSellers = 'BEST_SELLERS';
  static const String textBlock = 'TEXT_BLOCK';
  static const String imageGallery = 'IMAGE_GALLERY';
  static const String customHtml = 'CUSTOM_HTML';

  /// Get all available section types for admin UI
  static List<String> get allTypes => [
        // Porto main types
        hero,
        heroSlider,
        topPromoBar,
        valuePropsRow,
        categoryTiles,
        categoryGrid,
        categoryCircleStrip,
        productCarousel,
        productCollection,
        brandStrip,
        brandLogoStrip,
        promoBanner,
        promoBannerRow3,
        saleStripBanner,
        infoBlocks3,
        blogLatestGrid,
        newsletterBlock,
        testimonials,
        // Standard types
        productGrid,
        richText,
        image,
        bannerCarousel,
      ];

  /// Get user-friendly display name for a section type
  static String getDisplayName(String type) {
    switch (type) {
      case hero:
        return 'Hero Banner';
      case heroSlider:
        return 'Hero Slider (Multi-slide)';
      case topPromoBar:
        return 'Top Promo Bar';
      case topLinksBar:
        return 'Top Links Bar';
      case mainHeader:
        return 'Main Header';
      case primaryNav:
        return 'Primary Navigation';
      case valuePropsRow:
        return 'Value Propositions Row';
      case categoryTiles:
        return 'Category Tiles (4)';
      case categoryGrid:
        return 'Category Grid';
      case categoryCircleStrip:
        return 'Category Circle Strip';
      case productCarousel:
        return 'Product Carousel';
      case productCollection:
        return 'Product Collection';
      case brandStrip:
        return 'Brand Strip';
      case brandLogoStrip:
        return 'Brand Logo Strip';
      case promoBanner:
        return 'Promo Banner';
      case promoBannerRow3:
        return 'Promo Banner Row (3)';
      case saleStripBanner:
        return 'Sale Strip Banner';
      case infoBlocks3:
        return 'Info Blocks (3)';
      case blogLatestGrid:
        return 'Latest Blog Posts';
      case footerConfig:
        return 'Footer Configuration';
      case newsletterBlock:
        return 'Newsletter Block';
      case testimonials:
        return 'Testimonials';
      case productGrid:
        return 'Product Grid';
      case richText:
        return 'Rich Text';
      case image:
        return 'Single Image';
      case bannerCarousel:
        return 'Banner Carousel';
      default:
        return type;
    }
  }

  /// Get icon name for a section type
  static String getIconName(String type) {
    switch (type) {
      case hero:
      case heroSlider:
        return 'panorama_wide_angle';
      case topPromoBar:
        return 'campaign';
      case valuePropsRow:
        return 'verified';
      case categoryTiles:
      case categoryGrid:
        return 'grid_4x4';
      case categoryCircleStrip:
        return 'radio_button_checked';
      case productCarousel:
      case productCollection:
        return 'view_carousel';
      case brandStrip:
      case brandLogoStrip:
        return 'business';
      case promoBanner:
      case promoBannerRow3:
      case saleStripBanner:
        return 'sell';
      case infoBlocks3:
        return 'info';
      case blogLatestGrid:
        return 'article';
      case newsletterBlock:
        return 'email';
      case testimonials:
        return 'format_quote';
      default:
        return 'widgets';
    }
  }
}

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
    required this.displayOrder,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
  });

  factory BannerDto.fromJson(Map<String, dynamic> json) {
    return BannerDto(
      id: json['id'] as String,
      placement: json['placement'] as String,
      title: json['title'] as String,
      subtitle: json['subtitle'] as String?,
      ctaText: json['ctaText'] as String?,
      ctaUrl: json['ctaUrl'] as String?,
      imageDesktopUrl: json['imageDesktopUrl'] as String,
      imageMobileUrl: json['imageMobileUrl'] as String?,
      startAt: json['startAt'] != null
          ? DateTime.parse(json['startAt'] as String)
          : null,
      endAt: json['endAt'] != null
          ? DateTime.parse(json['endAt'] as String)
          : null,
      displayOrder: json['displayOrder'] as int,
      isActive: json['isActive'] as bool,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  /// Check if banner is within its date window (or has no date constraints)
  bool get isWithinDateWindow {
    final now = DateTime.now();
    if (startAt != null && now.isBefore(startAt!)) return false;
    if (endAt != null && now.isAfter(endAt!)) return false;
    return true;
  }

  /// Check if banner should be displayed (active AND within date window)
  bool get shouldDisplay => isActive && isWithinDateWindow;
}

/// Landing page DTO
class LandingPageDto {
  final String id;
  final String slug;
  final String title;
  final String? subtitle;
  final String? description;
  final String? metaTitle;
  final String? metaDescription;
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
    this.description,
    this.metaTitle,
    this.metaDescription,
    this.heroBannerId,
    this.heroBanner,
    this.seoTitle,
    this.seoDescription,
    required this.isActive,
    required this.sections,
    required this.createdAt,
    required this.updatedAt,
  });

  factory LandingPageDto.fromJson(Map<String, dynamic> json) {
    return LandingPageDto(
      id: (json['id'] ?? json['landingPageId'] ?? json['pageId'])?.toString() ??
          '',
      slug: (json['slug'] ?? '') as String,
      title: json['title'] as String,
      subtitle: json['subtitle'] as String?,
      description: json['description'] as String?,
      metaTitle: json['metaTitle'] as String?,
      metaDescription: json['metaDescription'] as String?,
      heroBannerId: json['heroBannerId'] as String?,
      heroBanner: json['heroBanner'] != null
          ? BannerDto.fromJson(json['heroBanner'] as Map<String, dynamic>)
          : null,
      seoTitle: json['seoTitle'] as String?,
      seoDescription: json['seoDescription'] as String?,
      isActive: json['isActive'] as bool,
      sections: (json['sections'] as List<dynamic>?)
              ?.map(
                  (e) => LandingSectionDto.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }
}

/// Landing section DTO
class LandingSectionDto {
  final String id;
  final String landingPageId;
  final String type;
  final String? title;
  final String? subtitle;
  final Map<String, dynamic> data;
  final Map<String, dynamic>? config;
  final int displayOrder;
  final bool isActive;
  final DateTime createdAt;
  final DateTime updatedAt;

  LandingSectionDto({
    required this.id,
    required this.landingPageId,
    required this.type,
    this.title,
    this.subtitle,
    required this.data,
    this.config,
    required this.displayOrder,
    required this.isActive,
    required this.createdAt,
    required this.updatedAt,
  });

  factory LandingSectionDto.fromJson(Map<String, dynamic> json) {
    // Parse the JSON string stored in 'data' field
    Map<String, dynamic> parsedData = {};
    final rawData = json['data'];
    if (rawData is String) {
      try {
        parsedData = Map<String, dynamic>.from(
          const JsonDecoder().convert(rawData) as Map,
        );
      } catch (e) {
        parsedData = {};
      }
    } else if (rawData is Map) {
      parsedData = Map<String, dynamic>.from(rawData);
    }

    // Parse config if present
    Map<String, dynamic>? parsedConfig;
    final rawConfig = json['config'];
    if (rawConfig is String) {
      try {
        parsedConfig = Map<String, dynamic>.from(
          const JsonDecoder().convert(rawConfig) as Map,
        );
      } catch (e) {
        parsedConfig = null;
      }
    } else if (rawConfig is Map) {
      parsedConfig = Map<String, dynamic>.from(rawConfig);
    }

    return LandingSectionDto(
      id: json['id'] as String,
      landingPageId: json['landingPageId'] as String,
      type: json['type'] as String,
      title: json['title'] as String?,
      subtitle: json['subtitle'] as String?,
      data: parsedData,
      config: parsedConfig,
      displayOrder: json['displayOrder'] as int,
      isActive: json['isActive'] as bool,
      createdAt: DateTime.parse(json['createdAt'] as String),
      updatedAt: DateTime.parse(json['updatedAt'] as String),
    );
  }

  // Helper getter to access parsed data
  Map<String, dynamic> get parsedData => data;

  // Helper to get config value with default
  T getConfigValue<T>(String key, T defaultValue) {
    if (config == null) return defaultValue;
    final value = config![key];
    if (value is T) return value;
    return defaultValue;
  }
}
