import '../api_client.dart';

/// Customer DTO for admin customer list
class CustomerDto {
  final String id;
  final String fullName;
  final String email;
  final String? phone;
  final bool isActive;
  final DateTime createdAt;
  final int ordersCount;
  final int addressesCount;

  CustomerDto({
    required this.id,
    required this.fullName,
    required this.email,
    this.phone,
    required this.isActive,
    required this.createdAt,
    required this.ordersCount,
    required this.addressesCount,
  });

  factory CustomerDto.fromJson(Map<String, dynamic> json) {
    return CustomerDto(
      id: json['id']?.toString() ?? '',
      fullName: json['fullName']?.toString() ?? 'N/A',
      email: json['email']?.toString() ?? '',
      phone: json['phone']?.toString(),
      isActive: json['isActive'] == true,
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
      ordersCount: (json['ordersCount'] as num?)?.toInt() ?? 0,
      addressesCount: (json['addressesCount'] as num?)?.toInt() ?? 0,
    );
  }
}

/// Customer list response DTO
class CustomerListDto {
  final List<CustomerDto> items;
  final int total;
  final int page;
  final int limit;

  CustomerListDto({
    required this.items,
    required this.total,
    required this.page,
    required this.limit,
  });

  factory CustomerListDto.fromJson(Map<String, dynamic> json) {
    final itemsList = json['items'] as List<dynamic>? ?? [];
    return CustomerListDto(
      items: itemsList
          .map((e) => CustomerDto.fromJson(e as Map<String, dynamic>))
          .toList(),
      total: (json['total'] as num?)?.toInt() ?? 0,
      page: (json['page'] as num?)?.toInt() ?? 1,
      limit: (json['limit'] as num?)?.toInt() ?? 20,
    );
  }

  int get totalPages => (total / limit).ceil();
  bool get hasNextPage => page < totalPages;
  bool get hasPrevPage => page > 1;
}

/// DTO for creating a new customer
class CreateCustomerDto {
  final String fullName;
  final String email;
  final String? phone;
  final String? password;
  final bool isActive;

  CreateCustomerDto({
    required this.fullName,
    required this.email,
    this.phone,
    this.password,
    this.isActive = true,
  });

  Map<String, dynamic> toJson() {
    return {
      'fullName': fullName,
      'email': email,
      if (phone != null && phone!.isNotEmpty) 'phone': phone,
      if (password != null && password!.isNotEmpty) 'password': password,
      'isActive': isActive,
    };
  }
}

/// Response DTO for created customer
class CreateCustomerResponseDto {
  final String id;
  final String fullName;
  final String email;
  final String? phone;
  final bool isActive;
  final DateTime createdAt;
  final String? generatedPassword;

  CreateCustomerResponseDto({
    required this.id,
    required this.fullName,
    required this.email,
    this.phone,
    required this.isActive,
    required this.createdAt,
    this.generatedPassword,
  });

  factory CreateCustomerResponseDto.fromJson(Map<String, dynamic> json) {
    return CreateCustomerResponseDto(
      id: json['id']?.toString() ?? '',
      fullName: json['fullName']?.toString() ?? 'N/A',
      email: json['email']?.toString() ?? '',
      phone: json['phone']?.toString(),
      isActive: json['isActive'] == true,
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
      generatedPassword: json['generatedPassword']?.toString(),
    );
  }
}

/// Customer address DTO
class CustomerAddressDto {
  final String id;
  final String? label;
  final String? fullName;
  final String city;
  final String addressLine1;
  final String? addressLine2;
  final String? phone;
  final bool isDefault;
  final DateTime createdAt;

  CustomerAddressDto({
    required this.id,
    this.label,
    this.fullName,
    required this.city,
    required this.addressLine1,
    this.addressLine2,
    this.phone,
    required this.isDefault,
    required this.createdAt,
  });

  factory CustomerAddressDto.fromJson(Map<String, dynamic> json) {
    return CustomerAddressDto(
      id: json['id']?.toString() ?? '',
      label: json['label']?.toString(),
      fullName: json['fullName']?.toString(),
      city: json['city']?.toString() ?? '',
      addressLine1: json['addressLine1']?.toString() ?? '',
      addressLine2: json['addressLine2']?.toString(),
      phone: json['phone']?.toString(),
      isDefault: json['isDefault'] == true,
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
    );
  }
}

/// DTO for creating a new address
class CreateAddressDto {
  final String? label;
  final String? fullName;
  final String? phone;
  final String city;
  final String? area;
  final String? street;
  final String? building;
  final String? apartment;
  final String? notes;
  final String addressLine1;
  final String? addressLine2;
  final bool isDefault;

  CreateAddressDto({
    this.label,
    this.fullName,
    this.phone,
    required this.city,
    this.area,
    this.street,
    this.building,
    this.apartment,
    this.notes,
    required this.addressLine1,
    this.addressLine2,
    this.isDefault = false,
  });

  Map<String, dynamic> toJson() {
    return {
      if (label != null && label!.isNotEmpty) 'label': label,
      if (fullName != null && fullName!.isNotEmpty) 'fullName': fullName,
      if (phone != null && phone!.isNotEmpty) 'phone': phone,
      'city': city,
      if (area != null && area!.isNotEmpty) 'area': area,
      if (street != null && street!.isNotEmpty) 'street': street,
      if (building != null && building!.isNotEmpty) 'building': building,
      if (apartment != null && apartment!.isNotEmpty) 'apartment': apartment,
      if (notes != null && notes!.isNotEmpty) 'notes': notes,
      'addressLine1': addressLine1,
      if (addressLine2 != null && addressLine2!.isNotEmpty)
        'addressLine2': addressLine2,
      'isDefault': isDefault,
    };
  }
}

/// DTO for updating an address
class UpdateAddressDto {
  final String? label;
  final String? fullName;
  final String? phone;
  final String? city;
  final String? area;
  final String? street;
  final String? building;
  final String? apartment;
  final String? notes;
  final String? addressLine1;
  final String? addressLine2;
  final bool? isDefault;

  UpdateAddressDto({
    this.label,
    this.fullName,
    this.phone,
    this.city,
    this.area,
    this.street,
    this.building,
    this.apartment,
    this.notes,
    this.addressLine1,
    this.addressLine2,
    this.isDefault,
  });

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (label != null) map['label'] = label;
    if (fullName != null) map['fullName'] = fullName;
    if (phone != null) map['phone'] = phone;
    if (city != null) map['city'] = city;
    if (area != null) map['area'] = area;
    if (street != null) map['street'] = street;
    if (building != null) map['building'] = building;
    if (apartment != null) map['apartment'] = apartment;
    if (notes != null) map['notes'] = notes;
    if (addressLine1 != null) map['addressLine1'] = addressLine1;
    if (addressLine2 != null) map['addressLine2'] = addressLine2;
    if (isDefault != null) map['isDefault'] = isDefault;
    return map;
  }
}

/// Customer order DTO
class CustomerOrderDto {
  final String id;
  final String orderNumber;
  final double total;
  final String status;
  final DateTime createdAt;

  CustomerOrderDto({
    required this.id,
    required this.orderNumber,
    required this.total,
    required this.status,
    required this.createdAt,
  });

  factory CustomerOrderDto.fromJson(Map<String, dynamic> json) {
    return CustomerOrderDto(
      id: json['id']?.toString() ?? '',
      orderNumber: json['orderNumber']?.toString() ?? '',
      total: (json['total'] as num?)?.toDouble() ?? 0.0,
      status: json['status']?.toString() ?? 'PENDING',
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
    );
  }
}

/// Customer details DTO (with addresses and orders)
class CustomerDetailsDto {
  final String id;
  final String fullName;
  final String email;
  final String? phone;
  final bool isActive;
  final DateTime createdAt;
  final int ordersCount;
  final int addressesCount;
  final List<CustomerAddressDto> addresses;
  final List<CustomerOrderDto> orders;
  final LoyaltySummaryDto loyalty;

  CustomerDetailsDto({
    required this.id,
    required this.fullName,
    required this.email,
    this.phone,
    required this.isActive,
    required this.createdAt,
    required this.ordersCount,
    required this.addressesCount,
    required this.addresses,
    required this.orders,
    required this.loyalty,
  });

  factory CustomerDetailsDto.fromJson(Map<String, dynamic> json) {
    final addressesList = json['addresses'] as List<dynamic>? ?? [];
    final ordersList = json['orders'] as List<dynamic>? ?? [];
    final loyaltyJson = json['loyalty'] as Map<String, dynamic>? ?? {};

    return CustomerDetailsDto(
      id: json['id']?.toString() ?? '',
      fullName: json['fullName']?.toString() ?? 'N/A',
      email: json['email']?.toString() ?? '',
      phone: json['phone']?.toString(),
      isActive: json['isActive'] == true,
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
      ordersCount: (json['ordersCount'] as num?)?.toInt() ?? 0,
      addressesCount: (json['addressesCount'] as num?)?.toInt() ?? 0,
      addresses: addressesList
          .map((e) => CustomerAddressDto.fromJson(e as Map<String, dynamic>))
          .toList(),
      orders: ordersList
          .map((e) => CustomerOrderDto.fromJson(e as Map<String, dynamic>))
          .toList(),
      loyalty: LoyaltySummaryDto.fromJson(loyaltyJson),
    );
  }
}

/// DTO for updating a customer
class UpdateCustomerDto {
  final String? fullName;
  final String? email;
  final String? phone;
  final bool? isActive;

  UpdateCustomerDto({
    this.fullName,
    this.email,
    this.phone,
    this.isActive,
  });

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (fullName != null) map['fullName'] = fullName;
    if (email != null) map['email'] = email;
    if (phone != null) map['phone'] = phone;
    if (isActive != null) map['isActive'] = isActive;
    return map;
  }
}

/// Response DTO for updated customer
class UpdateCustomerResponseDto {
  final String id;
  final String fullName;
  final String email;
  final String? phone;
  final bool isActive;
  final DateTime createdAt;

  UpdateCustomerResponseDto({
    required this.id,
    required this.fullName,
    required this.email,
    this.phone,
    required this.isActive,
    required this.createdAt,
  });

  factory UpdateCustomerResponseDto.fromJson(Map<String, dynamic> json) {
    return UpdateCustomerResponseDto(
      id: json['id']?.toString() ?? '',
      fullName: json['fullName']?.toString() ?? 'N/A',
      email: json['email']?.toString() ?? '',
      phone: json['phone']?.toString(),
      isActive: json['isActive'] == true,
      createdAt: DateTime.tryParse(json['createdAt']?.toString() ?? '') ??
          DateTime.now(),
    );
  }
}

/// Customers API service
class CustomersApi {
  final ApiClient _client;

  CustomersApi(this._client);

  /// Get customers list with pagination and search
  /// Set includeInactive to true to also return disabled customers
  Future<CustomerListDto> getCustomers({
    int page = 1,
    int limit = 20,
    String? search,
    bool includeInactive = false,
  }) async {
    final queryParams = <String, String>{
      'page': page.toString(),
      'limit': limit.toString(),
    };

    if (search != null && search.isNotEmpty) {
      queryParams['search'] = search;
    }

    if (includeInactive) {
      queryParams['includeInactive'] = 'true';
    }

    final response = await _client.get(
      '/admin/customers',
      queryParams: queryParams,
      requiresAuth: true,
    );

    return CustomerListDto.fromJson(response.getDataOrThrow());
  }

  /// Get customer details by ID
  Future<CustomerDetailsDto> getCustomer(String id) async {
    final response = await _client.get(
      '/admin/customers/$id',
      requiresAuth: true,
    );

    return CustomerDetailsDto.fromJson(response.getDataOrThrow());
  }

  /// Create a new customer
  Future<CreateCustomerResponseDto> createCustomer(
      CreateCustomerDto dto) async {
    final response = await _client.post(
      '/admin/customers',
      body: dto.toJson(),
      requiresAuth: true,
    );

    return CreateCustomerResponseDto.fromJson(response.getDataOrThrow());
  }

  /// Update an existing customer
  Future<UpdateCustomerResponseDto> updateCustomer(
      String id, UpdateCustomerDto dto) async {
    final response = await _client.patch(
      '/admin/customers/$id',
      body: dto.toJson(),
      requiresAuth: true,
    );

    return UpdateCustomerResponseDto.fromJson(response.getDataOrThrow());
  }

  /// Soft delete (disable) a customer
  Future<void> deleteCustomer(String id) async {
    await _client.delete(
      '/admin/customers/$id',
      requiresAuth: true,
    );
  }

  // ============================================================================
  // ADDRESS CRUD OPERATIONS
  // ============================================================================

  /// Create a new address for a customer
  Future<CustomerAddressDto> createAddress(
      String customerId, CreateAddressDto dto) async {
    final response = await _client.post(
      '/admin/customers/$customerId/addresses',
      body: dto.toJson(),
      requiresAuth: true,
    );

    return CustomerAddressDto.fromJson(response.getDataOrThrow());
  }

  /// Update an existing address
  Future<CustomerAddressDto> updateAddress(
      String addressId, UpdateAddressDto dto) async {
    final response = await _client.patch(
      '/admin/customer-addresses/$addressId',
      body: dto.toJson(),
      requiresAuth: true,
    );

    return CustomerAddressDto.fromJson(response.getDataOrThrow());
  }

  /// Delete an address
  Future<void> deleteAddress(String addressId) async {
    await _client.delete(
      '/admin/customer-addresses/$addressId',
      requiresAuth: true,
    );
  }

  /// Set an address as default
  Future<CustomerAddressDto> setDefaultAddress(String addressId) async {
    final response = await _client.patch(
      '/admin/customer-addresses/$addressId/default',
      body: {},
      requiresAuth: true,
    );

    return CustomerAddressDto.fromJson(response.getDataOrThrow());
  }

  // ============================================================================
  // LOYALTY ADJUSTMENT
  // ============================================================================

  /// Adjust customer's loyalty balance (admin only)
  /// Returns updated loyalty summary
  Future<LoyaltySummaryDto> adjustLoyalty(
    String customerId, {
    required double amountAed,
    String? description,
  }) async {
    final response = await _client.post(
      '/admin/customers/$customerId/loyalty/adjust',
      body: {
        'amountAed': amountAed,
        if (description != null && description.isNotEmpty)
          'description': description,
      },
      requiresAuth: true,
    );

    return LoyaltySummaryDto.fromJson(response.getDataOrThrow());
  }
}

/// DTO for loyalty summary response
class LoyaltySummaryDto {
  final double balanceAed;
  final double totalEarnedAed;
  final double totalRedeemedAed;

  LoyaltySummaryDto({
    required this.balanceAed,
    required this.totalEarnedAed,
    required this.totalRedeemedAed,
  });

  factory LoyaltySummaryDto.fromJson(Map<String, dynamic> json) {
    return LoyaltySummaryDto(
      balanceAed: (json['balanceAed'] as num?)?.toDouble() ?? 0.0,
      totalEarnedAed: (json['totalEarnedAed'] as num?)?.toDouble() ?? 0.0,
      totalRedeemedAed: (json['totalRedeemedAed'] as num?)?.toDouble() ?? 0.0,
    );
  }
}
