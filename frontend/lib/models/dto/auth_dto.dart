/// User model matching backend response
class UserDto {
  final String id;
  final String email;
  final String? firstName;
  final String? lastName;
  final String? phone;
  final String role;
  final bool emailVerified;
  final bool isActive;
  final DateTime? createdAt;
  final DateTime? lastLoginAt;

  UserDto({
    required this.id,
    required this.email,
    this.firstName,
    this.lastName,
    this.phone,
    required this.role,
    this.emailVerified = false,
    this.isActive = true,
    this.createdAt,
    this.lastLoginAt,
  });

  factory UserDto.fromJson(Map<String, dynamic> json) {
    return UserDto(
      id: json['id'] as String,
      email: json['email'] as String,
      firstName: json['firstName'] as String?,
      lastName: json['lastName'] as String?,
      phone: json['phone'] as String?,
      role: json['role'] as String,
      emailVerified: json['emailVerified'] as bool? ?? false,
      isActive: json['isActive'] as bool? ?? true,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : null,
      lastLoginAt: json['lastLoginAt'] != null
          ? DateTime.parse(json['lastLoginAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'email': email,
      'firstName': firstName,
      'lastName': lastName,
      'phone': phone,
      'role': role,
      'emailVerified': emailVerified,
      'isActive': isActive,
      'createdAt': createdAt?.toIso8601String(),
      'lastLoginAt': lastLoginAt?.toIso8601String(),
    };
  }
}

/// Authentication response with tokens
class AuthResponseDto {
  final UserDto user;
  final TokensDto tokens;

  AuthResponseDto({
    required this.user,
    required this.tokens,
  });

  factory AuthResponseDto.fromJson(Map<String, dynamic> json) {
    // Handle both formats:
    // 1. Tokens wrapped in 'tokens' object: { user: {...}, tokens: { accessToken, refreshToken } }
    // 2. Tokens at root level: { user: {...}, accessToken, refreshToken }
    TokensDto tokens;
    if (json.containsKey('tokens')) {
      tokens = TokensDto.fromJson(json['tokens'] as Map<String, dynamic>);
    } else {
      tokens = TokensDto(
        accessToken: json['accessToken'] as String,
        refreshToken: json['refreshToken'] as String,
      );
    }
    
    return AuthResponseDto(
      user: UserDto.fromJson(json['user'] as Map<String, dynamic>),
      tokens: tokens,
    );
  }
}

/// JWT tokens
class TokensDto {
  final String accessToken;
  final String refreshToken;

  TokensDto({
    required this.accessToken,
    required this.refreshToken,
  });

  factory TokensDto.fromJson(Map<String, dynamic> json) {
    return TokensDto(
      accessToken: json['accessToken'] as String,
      refreshToken: json['refreshToken'] as String,
    );
  }
}
