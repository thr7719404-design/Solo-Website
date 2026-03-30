// Admin Dashboard DTOs
import 'package:flutter/material.dart';

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
  final CatalogSummaryDto? catalogSummary;
  final List<RecentActivityDto>? recentActivity;

  DashboardStatsDto({
    required this.ordersToday,
    required this.ordersThisWeek,
    required this.ordersThisMonth,
    required this.revenueToday,
    required this.revenueThisWeek,
    required this.revenueThisMonth,
    required this.totalCustomers,
    required this.newCustomersToday,
    required this.topProducts,
    required this.lowStockProducts,
    required this.activeBanners,
    required this.totalBanners,
    required this.recentOrders,
    required this.ordersByStatus,
    this.catalogSummary,
    this.recentActivity,
  });

  factory DashboardStatsDto.fromJson(Map<String, dynamic> json) {
    return DashboardStatsDto(
      ordersToday: json['ordersToday'] as int? ?? 0,
      ordersThisWeek: json['ordersThisWeek'] as int? ?? 0,
      ordersThisMonth: json['ordersThisMonth'] as int? ?? 0,
      revenueToday: (json['revenueToday'] as num?)?.toDouble() ?? 0.0,
      revenueThisWeek: (json['revenueThisWeek'] as num?)?.toDouble() ?? 0.0,
      revenueThisMonth: (json['revenueThisMonth'] as num?)?.toDouble() ?? 0.0,
      totalCustomers: json['totalCustomers'] as int? ?? 0,
      newCustomersToday: json['newCustomersToday'] as int? ?? 0,
      topProducts: (json['topProducts'] as List?)
              ?.map((e) => TopProductDto.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      lowStockProducts: (json['lowStockProducts'] as List?)
              ?.map(
                  (e) => LowStockProductDto.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      activeBanners: json['activeBanners'] as int? ?? 0,
      totalBanners: json['totalBanners'] as int? ?? 0,
      recentOrders: (json['recentOrders'] as List?)
              ?.map((e) => RecentOrderDto.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      ordersByStatus: (json['ordersByStatus'] as List?)
              ?.map((e) => OrderStatusCount.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      catalogSummary: json['catalogSummary'] != null
          ? CatalogSummaryDto.fromJson(
              json['catalogSummary'] as Map<String, dynamic>)
          : null,
      recentActivity: (json['recentActivity'] as List?)
          ?.map((e) => RecentActivityDto.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

/// Catalog summary for dashboard
class CatalogSummaryDto {
  final int totalCategories;
  final int totalBrands;
  final int totalProducts;
  final int activeProducts;
  final int featuredProducts;
  final int lowStockCount;

  CatalogSummaryDto({
    required this.totalCategories,
    required this.totalBrands,
    required this.totalProducts,
    required this.activeProducts,
    required this.featuredProducts,
    required this.lowStockCount,
  });

  factory CatalogSummaryDto.fromJson(Map<String, dynamic> json) {
    return CatalogSummaryDto(
      totalCategories: json['totalCategories'] as int? ?? 0,
      totalBrands: json['totalBrands'] as int? ?? 0,
      totalProducts: json['totalProducts'] as int? ?? 0,
      activeProducts: json['activeProducts'] as int? ?? 0,
      featuredProducts: json['featuredProducts'] as int? ?? 0,
      lowStockCount: json['lowStockCount'] as int? ?? 0,
    );
  }
}

/// Recent activity item for dashboard feed
class RecentActivityDto {
  final String id;
  final String type; // 'order', 'product', 'category', 'user'
  final String action; // 'created', 'updated', 'deleted'
  final String title;
  final String? subtitle;
  final DateTime timestamp;
  final String? userId;
  final String? userName;

  RecentActivityDto({
    required this.id,
    required this.type,
    required this.action,
    required this.title,
    this.subtitle,
    required this.timestamp,
    this.userId,
    this.userName,
  });

  factory RecentActivityDto.fromJson(Map<String, dynamic> json) {
    return RecentActivityDto(
      id: json['id'] as String? ?? '',
      type: json['type'] as String? ?? 'unknown',
      action: json['action'] as String? ?? 'unknown',
      title: json['title'] as String? ?? '',
      subtitle: json['subtitle'] as String?,
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'] as String)
          : DateTime.now(),
      userId: json['userId'] as String?,
      userName: json['userName'] as String?,
    );
  }

  IconData get icon {
    switch (type) {
      case 'order':
        return Icons.shopping_cart;
      case 'product':
        return Icons.inventory_2;
      case 'category':
        return Icons.category;
      case 'user':
        return Icons.person;
      default:
        return Icons.info;
    }
  }

  Color get color {
    switch (action) {
      case 'created':
        return Colors.green;
      case 'updated':
        return Colors.blue;
      case 'deleted':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }
}

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
    required this.imageUrl,
    required this.totalOrders,
    required this.totalRevenue,
    required this.totalQuantity,
  });

  factory TopProductDto.fromJson(Map<String, dynamic> json) {
    return TopProductDto(
      id: json['id'] as String,
      sku: json['sku'] as String,
      name: json['name'] as String,
      imageUrl: json['imageUrl'] as String? ?? '',
      totalOrders: json['totalOrders'] as int,
      totalRevenue: (json['totalRevenue'] as num).toDouble(),
      totalQuantity: json['totalQuantity'] as int,
    );
  }
}

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
    required this.imageUrl,
    required this.stock,
    required this.threshold,
  });

  factory LowStockProductDto.fromJson(Map<String, dynamic> json) {
    return LowStockProductDto(
      id: json['id'] as String,
      sku: json['sku'] as String,
      name: json['name'] as String,
      imageUrl: json['imageUrl'] as String? ?? '',
      stock: json['stock'] as int,
      threshold: json['threshold'] as int,
    );
  }
}

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
    required this.total,
    required this.status,
    required this.createdAt,
  });

  factory RecentOrderDto.fromJson(Map<String, dynamic> json) {
    return RecentOrderDto(
      id: json['id'] as String,
      orderNumber: json['orderNumber'] as String,
      customerName: json['customerName'] as String,
      total: (json['total'] as num).toDouble(),
      status: json['status'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }
}

class OrderStatusCount {
  final String status;
  final int count;
  final double percentage;

  OrderStatusCount({
    required this.status,
    required this.count,
    required this.percentage,
  });

  factory OrderStatusCount.fromJson(Map<String, dynamic> json) {
    return OrderStatusCount(
      status: json['status'] as String,
      count: json['count'] as int,
      percentage: (json['percentage'] as num).toDouble(),
    );
  }
}
