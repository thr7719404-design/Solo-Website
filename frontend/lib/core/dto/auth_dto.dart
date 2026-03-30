/// Auth DTOs
/// Source of truth for all authentication-related data structures
library;

import 'base_dto.dart';
export 'base_dto.dart';

// =============================================================================
// USER ROLE CONSTANTS
// =============================================================================

/// User roles
class UserRole {
  static const String customer = 'CUSTOMER';
  static const String admin = 'ADMIN';
  static const String superAdmin = 'SUPER_ADMIN';

  static const List<String> all = [customer, admin, superAdmin];

  static bool isAdmin(String role) {
    return role == admin || role == superAdmin;
  }

  static bool isSuperAdmin(String role) {
    return role == superAdmin;
  }
}

// =============================================================================
// AUTH DTOs
// =============================================================================

/// Login request DTO
class LoginRequest {
  final String email;
  final String password;

  LoginRequest({
    required this.email,
    required this.password,
  });

  Map<String, dynamic> toJson() => {
        'email': email,
        'password': password,
      };
}

/// Register request DTO
class RegisterRequest {
  final String email;
  final String password;
  final String firstName;
  final String lastName;
  final String? phone;

  RegisterRequest({
    required this.email,
    required this.password,
    required this.firstName,
    required this.lastName,
    this.phone,
  });

  Map<String, dynamic> toJson() => {
        'email': email,
        'password': password,
        'firstName': firstName,
        'lastName': lastName,
        if (phone != null) 'phone': phone,
      };
}

/// Auth response DTO (login/register response)
class AuthResponse {
  final String accessToken;
  final String refreshToken;
  final UserDto user;

  AuthResponse({
    required this.accessToken,
    required this.refreshToken,
    required this.user,
  });

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      accessToken: parseString(json['accessToken'] ?? json['access_token']),
      refreshToken: parseString(json['refreshToken'] ?? json['refresh_token']),
      user: UserDto.fromJson(json['user'] as Map<String, dynamic>),
    );
  }

  Map<String, dynamic> toJson() => {
        'accessToken': accessToken,
        'refreshToken': refreshToken,
        'user': user.toJson(),
      };
}

/// User DTO
class UserDto {
  final String id;
  final String email;
  final String firstName;
  final String lastName;
  final String? phone;
  final String role;
  final bool isActive;
  final bool isEmailVerified;
  final String? avatarUrl;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  UserDto({
    required this.id,
    required this.email,
    required this.firstName,
    required this.lastName,
    this.phone,
    required this.role,
    this.isActive = true,
    this.isEmailVerified = false,
    this.avatarUrl,
    this.createdAt,
    this.updatedAt,
  });

  /// Get full name
  String get fullName => '$firstName $lastName'.trim();

  /// Check if user is admin
  bool get isAdmin => UserRole.isAdmin(role);

  /// Check if user is super admin
  bool get isSuperAdmin => UserRole.isSuperAdmin(role);

  factory UserDto.fromJson(Map<String, dynamic> json) {
    return UserDto(
      id: parseString(json['id']),
      email: parseString(json['email']),
      firstName: parseString(json['firstName'] ?? json['first_name']),
      lastName: parseString(json['lastName'] ?? json['last_name']),
      phone: json['phone'] as String?,
      role: parseString(json['role'], UserRole.customer),
      isActive: parseBool(json['isActive'] ?? json['is_active'], true),
      isEmailVerified:
          parseBool(json['isEmailVerified'] ?? json['is_email_verified']),
      avatarUrl: json['avatarUrl'] as String?,
      createdAt: parseDateTime(json['createdAt']),
      updatedAt: parseDateTime(json['updatedAt']),
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'email': email,
        'firstName': firstName,
        'lastName': lastName,
        if (phone != null) 'phone': phone,
        'role': role,
        'isActive': isActive,
        'isEmailVerified': isEmailVerified,
        if (avatarUrl != null) 'avatarUrl': avatarUrl,
        if (createdAt != null) 'createdAt': createdAt!.toIso8601String(),
        if (updatedAt != null) 'updatedAt': updatedAt!.toIso8601String(),
      };

  UserDto copyWith({
    String? id,
    String? email,
    String? firstName,
    String? lastName,
    String? phone,
    String? role,
    bool? isActive,
    bool? isEmailVerified,
    String? avatarUrl,
    DateTime? createdAt,
    DateTime? updatedAt,
  }) {
    return UserDto(
      id: id ?? this.id,
      email: email ?? this.email,
      firstName: firstName ?? this.firstName,
      lastName: lastName ?? this.lastName,
      phone: phone ?? this.phone,
      role: role ?? this.role,
      isActive: isActive ?? this.isActive,
      isEmailVerified: isEmailVerified ?? this.isEmailVerified,
      avatarUrl: avatarUrl ?? this.avatarUrl,
      createdAt: createdAt ?? this.createdAt,
      updatedAt: updatedAt ?? this.updatedAt,
    );
  }
}

/// Update profile request DTO
class UpdateProfileRequest {
  final String? firstName;
  final String? lastName;
  final String? phone;
  final String? avatarUrl;

  UpdateProfileRequest({
    this.firstName,
    this.lastName,
    this.phone,
    this.avatarUrl,
  });

  Map<String, dynamic> toJson() {
    final map = <String, dynamic>{};
    if (firstName != null) map['firstName'] = firstName;
    if (lastName != null) map['lastName'] = lastName;
    if (phone != null) map['phone'] = phone;
    if (avatarUrl != null) map['avatarUrl'] = avatarUrl;
    return map;
  }
}

/// Change password request DTO
class ChangePasswordRequest {
  final String currentPassword;
  final String newPassword;

  ChangePasswordRequest({
    required this.currentPassword,
    required this.newPassword,
  });

  Map<String, dynamic> toJson() => {
        'currentPassword': currentPassword,
        'newPassword': newPassword,
      };
}
