class Address {
  final String id;
  final String? label;
  final String firstName;
  final String lastName;
  final String? email;
  final String? company;
  final String addressLine1;
  final String? addressLine2;
  final String city;
  final String? state;
  final String? postalCode;
  final String country;
  final String? phone;
  final bool isDefault;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  Address({
    required this.id,
    this.label,
    required this.firstName,
    required this.lastName,
    this.email,
    this.company,
    required this.addressLine1,
    this.addressLine2,
    required this.city,
    this.state,
    this.postalCode,
    this.country = 'AE',
    this.phone,
    this.isDefault = false,
    this.createdAt,
    this.updatedAt,
  });

  factory Address.fromJson(Map<String, dynamic> json) {
    return Address(
      id: json['id'] ?? '',
      label: json['label'],
      firstName: json['firstName'] ?? '',
      lastName: json['lastName'] ?? '',
      email: json['email'],
      company: json['company'],
      addressLine1: json['addressLine1'] ?? '',
      addressLine2: json['addressLine2'],
      city: json['city'] ?? '',
      state: json['state'],
      postalCode: json['postalCode'],
      country: json['country'] ?? 'AE',
      phone: json['phone'],
      isDefault: json['isDefault'] ?? false,
      createdAt: json['createdAt'] != null ? DateTime.parse(json['createdAt']) : null,
      updatedAt: json['updatedAt'] != null ? DateTime.parse(json['updatedAt']) : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'label': label,
      'firstName': firstName,
      'lastName': lastName,
      'email': email,
      'company': company,
      'addressLine1': addressLine1,
      'addressLine2': addressLine2,
      'city': city,
      'state': state,
      'postalCode': postalCode,
      'country': country,
      'phone': phone,
      'isDefault': isDefault,
    };
  }

  Address copyWith({
    String? id,
    String? label,
    String? firstName,
    String? lastName,
    String? email,
    String? company,
    String? addressLine1,
    String? addressLine2,
    String? city,
    String? state,
    String? postalCode,
    String? country,
    String? phone,
    bool? isDefault,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return Address(
      id: id ?? this.id,
      label: label ?? this.label,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      email: email ?? this.email,
      company: company ?? this.company,
      addressLine1: addressLine1 ?? this.addressLine1,
      addressLine2: addressLine2 ?? this.addressLine2,
      city: city ?? this.city,
      state: state ?? this.state,
      postalCode: postalCode ?? this.postalCode,
      country: country ?? this.country,
      phone: phone ?? this.phone,
      isDefault: isDefault ?? this.isDefault,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }

  String get fullAddress {
    final parts = <String>[];
    parts.add(addressLine1);
    if (addressLine2 != null && addressLine2!.isNotEmpty) {
      parts.add(addressLine2!);
    }
    parts.add(city);
    if (state != null && state!.isNotEmpty) {
      parts.add(state!);
    }
    if (postalCode != null && postalCode!.isNotEmpty) {
      parts.add(postalCode!);
    }
    parts.add(country);
    return parts.join(', ');
  }

  String get displayName {
    return label ?? '$firstName $lastName';
  }
}
