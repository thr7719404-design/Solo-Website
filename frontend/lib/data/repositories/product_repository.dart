import '../api/api_client.dart';
import '../api/api_endpoints.dart';
import '../../models/product.dart';

class ProductRepository {
  final ApiClient _apiClient;

  ProductRepository(this._apiClient);

  Future<List<Product>> getProducts({
    String? category,
    String? search,
    int? limit,
    int? offset,
    String? sortBy,
  }) async {
    final queryParams = <String, String>{};
    
    if (category != null) queryParams['category'] = category;
    if (search != null) queryParams['search'] = search;
    if (limit != null) queryParams['limit'] = limit.toString();
    if (offset != null) queryParams['offset'] = offset.toString();
    if (sortBy != null) queryParams['sortBy'] = sortBy;

    return await _apiClient.get(
      ApiEndpoints.products,
      queryParams: queryParams,
      parser: (data) {
        if (data is List) {
          return data.map((json) => Product.fromJson(json)).toList();
        }
        return [];
      },
    );
  }

  Future<Product> getProductById(String id) async {
    return await _apiClient.get(
      ApiEndpoints.productById(id),
      parser: (data) => Product.fromJson(data),
    );
  }

  Future<List<Product>> getFeaturedProducts() async {
    return await _apiClient.get(
      ApiEndpoints.featuredProducts,
      parser: (data) {
        if (data is List) {
          return data.map((json) => Product.fromJson(json)).toList();
        }
        return [];
      },
    );
  }

  Future<List<Product>> getBestSellers() async {
    return await _apiClient.get(
      ApiEndpoints.bestSellers,
      parser: (data) {
        if (data is List) {
          return data.map((json) => Product.fromJson(json)).toList();
        }
        return [];
      },
    );
  }

  Future<List<Product>> getNewArrivals() async {
    return await _apiClient.get(
      ApiEndpoints.newArrivals,
      parser: (data) {
        if (data is List) {
          return data.map((json) => Product.fromJson(json)).toList();
        }
        return [];
      },
    );
  }

  Future<List<Product>> getRelatedProducts(String productId) async {
    return await _apiClient.get(
      ApiEndpoints.relatedProducts(productId),
      parser: (data) {
        if (data is List) {
          return data.map((json) => Product.fromJson(json)).toList();
        }
        return [];
      },
    );
  }

  Future<List<Product>> searchProducts(String query, {
    Map<String, dynamic>? filters,
  }) async {
    final queryParams = <String, String>{'search': query};
    
    if (filters != null) {
      filters.forEach((key, value) {
        queryParams[key] = value.toString();
      });
    }

    return await _apiClient.get(
      ApiEndpoints.search,
      queryParams: queryParams,
      parser: (data) {
        if (data is List) {
          return data.map((json) => Product.fromJson(json)).toList();
        }
        return [];
      },
    );
  }

  Future<List<Product>> getDeals() async {
    return await _apiClient.get(
      ApiEndpoints.deals,
      parser: (data) {
        if (data is List) {
          return data.map((json) => Product.fromJson(json)).toList();
        }
        return [];
      },
    );
  }
}
