# Security Guidelines

This document outlines the security requirements and best practices for the Solo Ecommerce Platform, aligned with **OWASP Top 10 2021** and **OWASP ASVS 4.0 Level 2**.

## 🎯 Security Standards

### OWASP Top 10 2021 Coverage

1. **A01:2021 – Broken Access Control**
   - Implemented RBAC on all admin endpoints
   - Server-side authorization checks (never trust client)
   - Row-level security for user data

2. **A02:2021 – Cryptographic Failures**
   - HTTPS enforced with HSTS
   - TLS 1.2+ only
   - Argon2id for password hashing
   - Secure session management with JWT

3. **A03:2021 – Injection**
   - Parameterized queries via Prisma (no raw SQL)
   - Input validation with class-validator DTOs
   - Output encoding

4. **A04:2021 – Insecure Design**
   - Security by design approach
   - Threat modeling during development
   - Least privilege principle

5. **A05:2021 – Security Misconfiguration**
   - Security headers configured
   - Disabled unnecessary features
   - Environment-based configurations

6. **A06:2021 – Vulnerable and Outdated Components**
   - Regular dependency updates
   - Automated vulnerability scanning
   - No deprecated dependencies

7. **A07:2021 – Identification and Authentication Failures**
   - Strong password requirements
   - Account lockout after failed attempts
   - Multi-factor authentication ready
   - Secure password reset flow

8. **A08:2021 – Software and Data Integrity Failures**
   - Code signing for mobile releases
   - Integrity checks on critical operations
   - Secure CI/CD pipeline

9. **A09:2021 – Security Logging and Monitoring Failures**
   - Comprehensive audit logging
   - Failed authentication tracking
   - Suspicious pattern detection

10. **A10:2021 – Server-Side Request Forgery (SSRF)**
    - Validated and sanitized URLs
    - Whitelist-based approach for external requests

### OWASP ASVS 4.0 Level 2 Compliance

Level 2 is appropriate for applications that contain sensitive data requiring protection (e-commerce with PII and payment data).

Key requirements implemented:
- V1: Architecture, Design and Threat Modeling
- V2: Authentication
- V3: Session Management
- V4: Access Control
- V5: Validation, Sanitization and Encoding
- V6: Stored Cryptography
- V7: Error Handling and Logging
- V8: Data Protection
- V9: Communications
- V10: Malicious Code
- V13: API and Web Service

## 🛡️ Backend Security Requirements

### Transport Security

```typescript
// HTTPS enforcement
app.use(helmet.hsts({
  maxAge: 31536000,
  includeSubDomains: true,
  preload: true
}));
```

### Security Headers

Required headers:
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Content-Security-Policy: default-src 'self'; ...`
- `Permissions-Policy: geolocation=(), microphone=(), camera=()`

### Authentication

**JWT Configuration:**
- Access tokens: 15 minutes expiry
- Refresh tokens: 7 days expiry, stored securely
- Algorithm: RS256 (asymmetric)
- Tokens must include: userId, role, iat, exp

**Password Requirements:**
- Minimum 12 characters
- Must include: uppercase, lowercase, number, special character
- Hashing: Argon2id with parameters:
  - Memory: 64 MB
  - Iterations: 3
  - Parallelism: 4

### Authorization

```typescript
// Example guard usage
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin/products')
export class AdminProductsController {
  // Only authenticated admin users can access
}
```

### Input Validation

```typescript
// All DTOs must use class-validator
export class CreateProductDto {
  @IsString()
  @Length(3, 200)
  name: string;

  @IsNumber()
  @Min(0)
  price: number;

  @IsString()
  @IsOptional()
  description?: string;
}
```

### Rate Limiting

Apply to sensitive endpoints:
- `/auth/login`: 5 requests per 15 minutes per IP
- `/auth/register`: 3 requests per hour per IP
- `/auth/forgot-password`: 3 requests per hour per IP
- Admin endpoints: 100 requests per 15 minutes per user

### Secrets Management

**Never commit:**
- Database credentials
- JWT signing keys
- API keys (Stripe, email services, etc.)
- Environment files

**Use:**
- Environment variables
- Secret management services (Azure Key Vault, AWS Secrets Manager, etc.)
- `.env.example` for documentation

### Logging

**Do log:**
- Authentication attempts (success/failure)
- Authorization failures
- Input validation failures
- Admin actions
- Security-relevant events

**Never log:**
- Passwords
- Tokens
- Credit card numbers
- Personal identification numbers
- Raw request bodies with sensitive data

## 📱 Flutter Security Requirements

### No Hardcoded Secrets

```dart
// ❌ NEVER do this
const String apiKey = 'sk_live_abc123';

// ✅ DO this
final apiKey = Platform.environment['API_KEY'];
// Or fetch from backend when needed
```

### Secure Storage

**Mobile (Android/iOS):**
```dart
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

final storage = FlutterSecureStorage(
  aOptions: AndroidOptions(
    encryptedSharedPreferences: true,
  ),
  iOptions: IOSOptions(
    accessibility: KeychainAccessibility.first_unlock,
  ),
);

// Store refresh token
await storage.write(key: 'refresh_token', value: token);
```

**Web:**
- Use httpOnly cookies for refresh tokens
- Store access tokens in memory only
- Implement CSRF protection

### Network Security

**SSL Pinning (Mobile):**
```dart
import 'package:dio/dio.dart';
import 'package:dio_http_certificate_pinning/dio_http_certificate_pinning.dart';

final dio = Dio();
dio.interceptors.add(
  CertificatePinningInterceptor(
    allowedSHAFingerprints: [
      'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    ],
  ),
);
```

**HTTPS Only:**
```dart
// All API endpoints must use HTTPS
const String apiBaseUrl = 'https://api.solo-ecommerce.com';
```

### Code Obfuscation

**Release build configuration:**
```bash
flutter build apk --release --obfuscate --split-debug-info=build/debug-info
flutter build appbundle --release --obfuscate --split-debug-info=build/debug-info
flutter build ios --release --obfuscate --split-debug-info=build/debug-info
flutter build web --release --source-maps  # Web doesn't support obfuscation the same way
```

**Configuration in `android/app/build.gradle`:**
```gradle
buildTypes {
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
    }
}
```

### Sensitive Data in Logs

```dart
// ❌ NEVER log sensitive data
print('User token: $token');
debugPrint('Password: $password');

// ✅ Log safely
if (kDebugMode) {
  print('Authentication successful for user: ${user.id}');
}
```

### Root/Jailbreak Detection (Optional)

```dart
import 'package:flutter_jailbreak_detection/flutter_jailbreak_detection.dart';

final isJailbroken = await FlutterJailbreakDetection.jailbroken;
if (isJailbroken) {
  // Warn user or limit functionality
}
```

## 💳 Payment Security

**PCI DSS Compliance:**
- Never store CVV/CVC
- Never log card numbers
- Use payment provider's hosted pages or tokenization
- Stripe/PayPal recommended for card processing

**Implementation:**
```dart
// Flutter: Redirect to Stripe checkout
final checkoutUrl = await api.createCheckoutSession(orderId);
launchUrl(Uri.parse(checkoutUrl));

// Backend: Create Stripe session
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: items,
  mode: 'payment',
  success_url: 'https://app.com/order/success?session_id={CHECKOUT_SESSION_ID}',
  cancel_url: 'https://app.com/order/cancel',
});
```

## 🔍 Security Testing

### Automated Testing
- Dependency vulnerability scanning (npm audit, flutter pub outdated)
- Static analysis (ESLint, dart analyze)
- Unit tests for auth logic
- Integration tests for critical paths

### Manual Testing
- Penetration testing before production
- Code reviews focusing on security
- Regular security audits

## 📋 Security Checklist

### Pre-deployment
- [ ] All environment variables configured
- [ ] HTTPS certificates valid
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Code obfuscation enabled for mobile
- [ ] SSL pinning configured
- [ ] No secrets in code/repo
- [ ] Database backups configured
- [ ] Logging configured (without sensitive data)
- [ ] Error messages don't leak system info

### Post-deployment
- [ ] Monitor authentication failures
- [ ] Review access logs regularly
- [ ] Keep dependencies updated
- [ ] Conduct periodic security assessments
- [ ] Incident response plan ready

## 🚨 Incident Response

In case of security incident:
1. Isolate affected systems
2. Preserve logs and evidence
3. Notify security team immediately
4. Document timeline and impact
5. Implement fixes
6. Conduct post-mortem

## 📞 Contact

For security issues, contact: security@solo-ecommerce.com

**DO NOT** disclose security vulnerabilities publicly before coordinating with the security team.

## 📚 References

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP ASVS 4.0](https://owasp.org/www-project-application-security-verification-standard/)
- [Flutter Security Best Practices](https://docs.flutter.dev/security)
- [NestJS Security](https://docs.nestjs.com/security/authentication)
- [Prisma Security](https://www.prisma.io/docs/concepts/components/prisma-client/deployment#security)
