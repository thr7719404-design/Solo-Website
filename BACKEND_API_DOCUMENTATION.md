# Backend API Documentation
## NestJS REST API

**Framework:** NestJS 10.x  
**Language:** TypeScript  
**Database ORM:** Prisma  
**Authentication:** JWT (Access + Refresh Tokens)  
**Base URL:** `http://localhost:3000`

---

## Table of Contents

1. [API Overview](#api-overview)
2. [Authentication](#authentication)
3. [Products API](#products-api)
4. [Cart API](#cart-api)
5. [Orders API](#orders-api)
6. [Users API](#users-api)
7. [Categories API](#categories-api)
8. [Brands API](#brands-api)
9. [Error Handling](#error-handling)
10. [Rate Limiting](#rate-limiting)

---

## API Overview

### Base Configuration

```typescript
// Main Application Entry
// File: src/main.ts

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Global prefix
  app.setGlobalPrefix('api');
  
  // CORS
  app.enableCors({
    origin: ['http://localhost:5000'],
    credentials: true,
  });
  
  // Security
  app.use(helmet());
  
  // Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  await app.listen(3000);
}
```

### Response Format

**Success Response:**
```json
{
  "status": "success",
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "statusCode": 400,
  "message": "Error description",
  "error": "Bad Request"
}
```

### Common Headers

```
Content-Type: application/json
Authorization: Bearer {access_token}
```

---

## Authentication

### Module Structure
**Files:**
- `src/auth/auth.controller.ts`
- `src/auth/auth.service.ts`
- `src/auth/strategies/jwt.strategy.ts`
- `src/auth/strategies/refresh-token.strategy.ts`

### 1. Register User

**Endpoint:** `POST /auth/register`  
**Authentication:** None  
**Rate Limit:** 3 requests/hour

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+971501234567"
}
```

**Validation Rules:**
- `email`: Valid email format, unique
- `password`: Min 8 chars, 1 uppercase, 1 lowercase, 1 number
- `firstName`: Min 2 chars
- `lastName`: Min 2 chars
- `phone`: Optional, valid phone format

**Response:** `201 Created`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER",
    "createdAt": "2025-12-27T10:00:00Z"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

---

### 2. Login

**Endpoint:** `POST /auth/login`  
**Authentication:** None  
**Rate Limit:** 5 requests/15 minutes

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER"
  },
  "tokens": {
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

**Errors:**
- `401 Unauthorized`: Invalid credentials
- `403 Forbidden`: Account deactivated

---

### 3. Refresh Token

**Endpoint:** `POST /auth/refresh`  
**Authentication:** None

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### 4. Logout

**Endpoint:** `POST /auth/logout`  
**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

---

### 5. Get Current User

**Endpoint:** `GET /auth/me`  
**Authentication:** Required (JWT)

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+971501234567",
  "role": "CUSTOMER",
  "emailVerified": true,
  "createdAt": "2025-12-27T10:00:00Z"
}
```

---

## Products API

### Module Structure
**Files:**
- `src/products/products.controller.ts`
- `src/products/products.service.ts`
- `src/products/dto/*.ts`

### 1. List Products

**Endpoint:** `GET /products`  
**Authentication:** Optional

**Query Parameters:**
```
?page=1
&limit=20
&sortBy=newest|price_low|price_high|name|rating
&categoryId=uuid
&departmentId=uuid
&brandId=uuid
&brandIds[]=uuid1&brandIds[]=uuid2
&minPrice=100
&maxPrice=1000
&search=teapot
&isFeatured=true
&isNew=true
&isBestSeller=true
&inStock=true
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "sku": "115030",
      "name": "Serving fork 11 cm 3 pcs.",
      "description": "Eva Trio has developed a complete range...",
      "price": 145.00,
      "oldPrice": null,
      "imageUrl": "https://...",
      "images": ["https://..."],
      "categoryId": "uuid",
      "category": {
        "id": "uuid",
        "name": "Tea & Coffee"
      },
      "brandId": "uuid",
      "brand": {
        "id": "uuid",
        "name": "Eva Trio"
      },
      "rating": 4.5,
      "reviewCount": 23,
      "stock": 15,
      "inStock": true,
      "isFeatured": false,
      "isNew": false,
      "isBestSeller": true,
      "discount": null,
      "specifications": {
        "material": "Stainless steel",
        "dimensions": "11 cm",
        "dishwasherSafe": true
      }
    }
  ],
  "meta": {
    "total": 805,
    "page": 1,
    "limit": 20,
    "totalPages": 41
  }
}
```

**Sort Options:**
- `newest`: Newest first (default)
- `price_low`: Price low to high
- `price_high`: Price high to low
- `name`: Alphabetical A-Z
- `rating`: Highest rated first

---

### 2. Get Product by ID

**Endpoint:** `GET /products/:id`  
**Authentication:** Optional

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "sku": "115030",
  "name": "Serving fork 11 cm 3 pcs.",
  "description": "Full detailed description...",
  "price": 145.00,
  "priceInclVat": 152.25,
  "oldPrice": null,
  "imageUrl": "https://...",
  "images": ["https://...", "https://..."],
  "category": {
    "id": "uuid",
    "name": "Tea & Coffee",
    "slug": "tea-coffee"
  },
  "brand": {
    "id": "uuid",
    "name": "Eva Trio",
    "logo": "https://...",
    "website": "https://..."
  },
  "department": {
    "id": "uuid",
    "name": "Kitchen"
  },
  "rating": 4.5,
  "reviewCount": 23,
  "stock": 15,
  "inStock": true,
  "specifications": {
    "material": "Stainless steel",
    "dimensions": "11 cm x 3 cm",
    "weight": "0.06 kg",
    "dishwasherSafe": true,
    "colliSize": 6,
    "countryOfOrigin": "CHN",
    "ean": "5709296003485"
  },
  "features": [
    "Long-handled for deep pots",
    "Stainless steel construction",
    "Set of 3 forks",
    "Dishwasher safe"
  ],
  "dimensions": {
    "length": 11,
    "width": 1,
    "height": 1,
    "weight": 0.06,
    "unit": "cm"
  },
  "packaging": {
    "type": "Box",
    "colliSize": 6,
    "colliWeight": 2.504,
    "colliDimensions": "30x20x15"
  },
  "isFeatured": false,
  "isNew": false,
  "isBestSeller": true,
  "createdAt": "2025-12-27T10:00:00Z",
  "updatedAt": "2025-12-27T10:00:00Z"
}
```

**Errors:**
- `404 Not Found`: Product doesn't exist

---

### 3. Featured Products

**Endpoint:** `GET /products/featured`  
**Authentication:** Optional

**Query Parameters:**
```
?limit=8
```

**Response:** `200 OK`
```json
{
  "data": [
    { /* Product object */ }
  ],
  "count": 8
}
```

---

### 4. Best Sellers

**Endpoint:** `GET /products/best-sellers`  
**Authentication:** Optional

**Query Parameters:**
```
?limit=8
```

**Response:** Same as Featured Products

---

### 5. New Arrivals

**Endpoint:** `GET /products/new-arrivals`  
**Authentication:** Optional

**Query Parameters:**
```
?limit=8
```

**Response:** Same as Featured Products

---

### 6. Related Products

**Endpoint:** `GET /products/:id/related`  
**Authentication:** Optional

**Query Parameters:**
```
?limit=6
```

**Response:** `200 OK`
```json
{
  "data": [
    { /* Similar products from same category/brand */ }
  ],
  "count": 6
}
```

---

### 7. Create Product (Admin)

**Endpoint:** `POST /products`  
**Authentication:** Required (Admin role)

**Request Body:**
```json
{
  "sku": "NEW001",
  "name": "New Product",
  "description": "Product description...",
  "price": 199.99,
  "categoryId": "uuid",
  "departmentId": "uuid",
  "brandId": "uuid",
  "imageUrl": "https://...",
  "images": ["https://..."],
  "stock": 50,
  "specifications": { ... },
  "isFeatured": false
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "sku": "NEW001",
  "name": "New Product",
  ...
}
```

---

### 8. Update Product (Admin)

**Endpoint:** `PATCH /products/:id`  
**Authentication:** Required (Admin role)

**Request Body:** (Partial update)
```json
{
  "price": 179.99,
  "stock": 45,
  "isFeatured": true
}
```

**Response:** `200 OK` (Updated product)

---

### 9. Delete Product (Admin)

**Endpoint:** `DELETE /products/:id`  
**Authentication:** Required (Admin role)

**Response:** `200 OK`
```json
{
  "message": "Product deleted successfully"
}
```

---

## Cart API

### Module Structure
**Files:**
- `src/cart/cart.controller.ts`
- `src/cart/cart.service.ts`
- `src/cart/dto/*.ts`

**Note:** All cart endpoints require authentication.

### 1. Get Cart

**Endpoint:** `GET /cart`  
**Authentication:** Required (JWT)

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "userId": "uuid",
  "items": [
    {
      "id": "uuid",
      "productId": "uuid",
      "product": {
        "id": "uuid",
        "sku": "115030",
        "name": "Serving fork 11 cm 3 pcs.",
        "price": 145.00,
        "imageUrl": "https://...",
        "inStock": true,
        "stock": 15
      },
      "quantity": 2,
      "price": 145.00,
      "subtotal": 290.00
    }
  ],
  "subtotal": 290.00,
  "tax": 14.50,
  "total": 304.50,
  "itemCount": 2,
  "createdAt": "2025-12-27T10:00:00Z",
  "updatedAt": "2025-12-27T10:30:00Z"
}
```

---

### 2. Add Item to Cart

**Endpoint:** `POST /cart/items`  
**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "productId": "uuid",
  "quantity": 1
}
```

**Validation:**
- `quantity`: Min 1, Max 99
- `productId`: Must exist and be in stock

**Response:** `201 Created`
```json
{
  "item": {
    "id": "uuid",
    "productId": "uuid",
    "quantity": 1,
    "price": 145.00
  },
  "cart": {
    /* Full cart object */
  }
}
```

**Errors:**
- `404 Not Found`: Product doesn't exist
- `400 Bad Request`: Out of stock
- `400 Bad Request`: Quantity exceeds stock

---

### 3. Update Cart Item

**Endpoint:** `PATCH /cart/items/:id`  
**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "quantity": 3
}
```

**Response:** `200 OK` (Updated cart)

**Special Cases:**
- Setting `quantity: 0` removes the item
- Cannot exceed available stock

---

### 4. Remove Cart Item

**Endpoint:** `DELETE /cart/items/:id`  
**Authentication:** Required (JWT)

**Response:** `200 OK`
```json
{
  "message": "Item removed from cart",
  "cart": {
    /* Updated cart object */
  }
}
```

---

### 5. Clear Cart

**Endpoint:** `DELETE /cart`  
**Authentication:** Required (JWT)

**Response:** `200 OK`
```json
{
  "message": "Cart cleared successfully"
}
```

---

## Orders API

### Module Structure
**Files:**
- `src/orders/orders.controller.ts`
- `src/orders/orders.service.ts`
- `src/orders/dto/*.ts`

### 1. Create Order

**Endpoint:** `POST /orders`  
**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "shippingAddressId": "uuid",
  "billingAddressId": "uuid",
  "paymentMethod": "CARD",
  "notes": "Please deliver in the morning"
}
```

**Payment Methods:**
- `CARD`: Credit/Debit card
- `COD`: Cash on delivery
- `BANK_TRANSFER`: Bank transfer

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "orderNumber": "ORD-20251227-001",
  "userId": "uuid",
  "status": "PENDING",
  "items": [
    {
      "id": "uuid",
      "productId": "uuid",
      "product": {
        "name": "Serving fork 11 cm 3 pcs.",
        "imageUrl": "https://..."
      },
      "quantity": 2,
      "price": 145.00,
      "subtotal": 290.00
    }
  ],
  "subtotal": 290.00,
  "tax": 14.50,
  "shippingCost": 25.00,
  "discount": 0,
  "total": 329.50,
  "paymentMethod": "CARD",
  "paymentStatus": "PENDING",
  "shippingAddress": {
    "street": "123 Main St",
    "city": "Dubai",
    "state": "Dubai",
    "country": "UAE",
    "postalCode": "00000"
  },
  "billingAddress": { ... },
  "notes": "Please deliver in the morning",
  "createdAt": "2025-12-27T10:00:00Z"
}
```

**Process:**
1. Validates cart has items
2. Validates addresses
3. Checks product availability
4. Creates order
5. Reduces stock
6. Clears cart
7. Sends confirmation email (planned)

**Errors:**
- `400 Bad Request`: Cart is empty
- `400 Bad Request`: Product out of stock
- `404 Not Found`: Address not found

---

### 2. Get User Orders

**Endpoint:** `GET /orders`  
**Authentication:** Required (JWT)

**Query Parameters:**
```
?page=1
&limit=10
&status=PENDING|CONFIRMED|SHIPPED|DELIVERED|CANCELLED
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "orderNumber": "ORD-20251227-001",
      "status": "PENDING",
      "total": 329.50,
      "itemCount": 2,
      "createdAt": "2025-12-27T10:00:00Z"
    }
  ],
  "meta": {
    "total": 15,
    "page": 1,
    "limit": 10,
    "totalPages": 2
  }
}
```

---

### 3. Get Order Details

**Endpoint:** `GET /orders/:id`  
**Authentication:** Required (JWT)

**Response:** `200 OK` (Full order object)

**Errors:**
- `404 Not Found`: Order doesn't exist
- `403 Forbidden`: Not user's order

---

### 4. Cancel Order

**Endpoint:** `POST /orders/:id/cancel`  
**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "reason": "Changed my mind"
}
```

**Response:** `200 OK`
```json
{
  "message": "Order cancelled successfully",
  "order": {
    "id": "uuid",
    "status": "CANCELLED",
    "cancellationReason": "Changed my mind",
    "cancelledAt": "2025-12-27T11:00:00Z"
  }
}
```

**Restrictions:**
- Can only cancel if status is PENDING or CONFIRMED
- Cannot cancel SHIPPED or DELIVERED orders

---

### 5. Update Order Status (Admin)

**Endpoint:** `PATCH /orders/:id/status`  
**Authentication:** Required (Admin role)

**Request Body:**
```json
{
  "status": "SHIPPED",
  "trackingNumber": "TRK123456789"
}
```

**Status Flow:**
```
PENDING → CONFIRMED → SHIPPED → DELIVERED
         ↓
      CANCELLED
```

**Response:** `200 OK` (Updated order)

---

## Users API

### Module Structure
**Files:**
- `src/users/users.controller.ts`
- `src/users/users.service.ts`
- `src/users/dto/*.ts`

**Base Path:** `/account`  
**Authentication:** All endpoints require JWT

### 1. Get Profile

**Endpoint:** `GET /account/profile`  
**Authentication:** Required (JWT)

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+971501234567",
  "role": "CUSTOMER",
  "emailVerified": true,
  "isActive": true,
  "createdAt": "2025-12-27T10:00:00Z",
  "lastLoginAt": "2025-12-27T10:00:00Z"
}
```

---

### 2. Update Profile

**Endpoint:** `PATCH /account/profile`  
**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "firstName": "Jane",
  "lastName": "Smith",
  "phone": "+971509876543"
}
```

**Response:** `200 OK` (Updated profile)

---

### 3. Change Password

**Endpoint:** `POST /account/change-password`  
**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password changed successfully"
}
```

**Errors:**
- `400 Bad Request`: Current password incorrect
- `400 Bad Request`: New password doesn't meet requirements

---

### 4. Get Addresses

**Endpoint:** `GET /account/addresses`  
**Authentication:** Required (JWT)

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "type": "SHIPPING",
      "isDefault": true,
      "fullName": "John Doe",
      "phone": "+971501234567",
      "street": "123 Main Street",
      "building": "Building A",
      "apartment": "Apt 401",
      "city": "Dubai",
      "state": "Dubai",
      "country": "UAE",
      "postalCode": "00000",
      "landmark": "Near Metro Station"
    }
  ]
}
```

---

### 5. Create Address

**Endpoint:** `POST /account/addresses`  
**Authentication:** Required (JWT)

**Request Body:**
```json
{
  "type": "SHIPPING",
  "isDefault": false,
  "fullName": "John Doe",
  "phone": "+971501234567",
  "street": "123 Main Street",
  "city": "Dubai",
  "state": "Dubai",
  "country": "UAE",
  "postalCode": "00000"
}
```

**Address Types:**
- `SHIPPING`: Delivery address
- `BILLING`: Invoice address
- `BOTH`: Can be used for both

**Response:** `201 Created` (Created address)

---

### 6. Update Address

**Endpoint:** `PATCH /account/addresses/:id`  
**Authentication:** Required (JWT)

**Request Body:** (Partial update)
```json
{
  "apartment": "Apt 501",
  "isDefault": true
}
```

**Response:** `200 OK` (Updated address)

---

### 7. Delete Address

**Endpoint:** `DELETE /account/addresses/:id`  
**Authentication:** Required (JWT)

**Response:** `200 OK`
```json
{
  "message": "Address deleted successfully"
}
```

**Restrictions:**
- Cannot delete if it's the only address
- Cannot delete if used in pending orders

---

## Categories API

### 1. List Categories

**Endpoint:** `GET /categories`  
**Authentication:** Optional

**Query Parameters:**
```
?includeSubcategories=true
&includeProducts=false
```

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Tea & Coffee",
      "slug": "tea-coffee",
      "description": "Brewing essentials and accessories",
      "imageUrl": "https://...",
      "productCount": 252,
      "subcategories": [
        {
          "id": "uuid",
          "name": "Teapots",
          "productCount": 45
        }
      ],
      "displayOrder": 1,
      "isActive": true
    }
  ]
}
```

---

### 2. Get Category Products

**Endpoint:** `GET /categories/:id/products`  
**Authentication:** Optional

**Query Parameters:** Same as Products List

**Response:** Same as Products List API

---

## Brands API

### 1. List Brands

**Endpoint:** `GET /brands`  
**Authentication:** Optional

**Response:** `200 OK`
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Eva Solo",
      "slug": "eva-solo",
      "description": "Danish design since 1939",
      "logo": "https://...",
      "website": "https://evasolo.com",
      "productCount": 554,
      "isActive": true
    }
  ]
}
```

---

### 2. Get Brand Products

**Endpoint:** `GET /brands/:id/products`  
**Authentication:** Optional

**Query Parameters:** Same as Products List

**Response:** Same as Products List API

---

## Error Handling

### Standard Error Codes

| Code | Status | Description |
|------|--------|-------------|
| 400 | Bad Request | Invalid input data |
| 401 | Unauthorized | Missing or invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource |
| 422 | Unprocessable Entity | Validation failed |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |

### Error Response Format

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "email must be a valid email address"
    },
    {
      "field": "password",
      "message": "password must be longer than or equal to 8 characters"
    }
  ]
}
```

---

## Rate Limiting

### Global Limits
- **Default**: 100 requests per minute per IP
- **Applied to**: All endpoints

### Endpoint-Specific Limits

| Endpoint | Limit | Window |
|----------|-------|--------|
| POST /auth/register | 3 requests | 1 hour |
| POST /auth/login | 5 requests | 15 minutes |
| POST /auth/refresh | 10 requests | 15 minutes |

### Headers

**Response Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1703682000
```

**Rate Limit Exceeded:**
```json
{
  "statusCode": 429,
  "message": "Too many requests, please try again later.",
  "error": "Too Many Requests"
}
```

---

## Security Features

### Implemented Protections

1. **JWT Authentication**
   - Access tokens (15 min expiry)
   - Refresh tokens (7 day expiry)
   - Token rotation on refresh

2. **Password Security**
   - bcrypt hashing (10 rounds)
   - Min 8 characters requirement
   - Complexity validation

3. **Input Validation**
   - class-validator decorators
   - Whitelist unknown properties
   - Transform and sanitize inputs

4. **HTTP Security Headers** (Helmet.js)
   - XSS Protection
   - Content Security Policy
   - HSTS
   - Frame protection

5. **CORS**
   - Configured allowed origins
   - Credentials support

6. **SQL Injection Protection**
   - Prisma parameterized queries
   - No raw SQL execution

7. **Rate Limiting**
   - Per-endpoint limits
   - IP-based throttling

---

**Document:** BACKEND_API_DOCUMENTATION.md  
**Generated:** December 27, 2025  
**Framework:** NestJS 10.x, Prisma ORM
