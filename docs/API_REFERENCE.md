# Solo E-Commerce - API Reference

## Base URL
```
http://localhost:3000
```

## Authentication
All protected endpoints require a JWT Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

---

## Auth Module

### POST /auth/register
Register a new user account.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201):**
```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER"
  }
}
```

### POST /auth/login
Authenticate user and receive tokens.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "CUSTOMER"
  }
}
```

### POST /auth/refresh
Refresh access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "eyJhbG..."
}
```

**Response (200):**
```json
{
  "accessToken": "eyJhbG...",
  "refreshToken": "eyJhbG..."
}
```

### POST /auth/logout 🔒
Revoke refresh token and logout.

**Request Body:**
```json
{
  "refreshToken": "eyJhbG..."
}
```

**Response (200):**
```json
{
  "message": "Logged out successfully"
}
```

### GET /auth/me 🔒
Get current authenticated user profile.

**Response (200):**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+971501234567",
  "role": "CUSTOMER",
  "isActive": true,
  "emailVerified": true,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### POST /auth/change-password 🔒
Change user password.

**Request Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass456!"
}
```

### POST /auth/forgot-password
Request password reset email.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

### POST /auth/reset-password
Reset password with token.

**Request Body:**
```json
{
  "token": "reset-token-here",
  "newPassword": "NewPass456!"
}
```

---

## Products Module

### GET /products
List products with filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 20) |
| search | string | Search query |
| categoryId | string | Filter by category |
| brandId | string | Filter by brand |
| minPrice | number | Minimum price |
| maxPrice | number | Maximum price |
| isFeatured | boolean | Featured products only |
| isNew | boolean | New arrivals only |
| isBestSeller | boolean | Best sellers only |
| sortBy | string | Sort field (newest, price_asc, price_desc, name_asc) |

**Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "sku": "PROD-001",
      "name": "Product Name",
      "description": "Product description",
      "price": 299.00,
      "priceInclVat": 313.95,
      "salePrice": null,
      "imageUrl": "https://...",
      "images": [...],
      "category": { "id": 1, "name": "Category" },
      "brand": { "id": 1, "name": "Brand" },
      "isFeatured": true,
      "isNew": false,
      "isBestSeller": false,
      "inStock": true
    }
  ],
  "meta": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

### GET /products/featured
Get featured products.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| limit | number | Number of products (default: 8) |

### GET /products/best-sellers
Get best-selling products.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| limit | number | Number of products (default: 8) |

### GET /products/new-arrivals
Get newly added products.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| limit | number | Number of products (default: 8) |

### GET /products/:slugOrId
Get single product details.

**Response (200):**
```json
{
  "id": 1,
  "sku": "PROD-001",
  "name": "Product Name",
  "description": "Short description",
  "fullDescription": "Detailed description...",
  "highlights": ["Feature 1", "Feature 2"],
  "specs": [
    { "key": "Material", "value": "Stainless Steel" },
    { "key": "Weight", "value": "500g" }
  ],
  "price": 299.00,
  "priceInclVat": 313.95,
  "salePrice": null,
  "imageUrl": "https://...",
  "images": [
    { "id": 1, "url": "https://...", "isPrimary": true }
  ],
  "category": { "id": 1, "name": "Cookware" },
  "subcategory": { "id": 1, "name": "Pots & Pans" },
  "brand": { "id": 1, "name": "Le Creuset" },
  "dimensions": {
    "width": 30,
    "height": 15,
    "depth": 30
  },
  "deliveryNote": "Ships within 2-3 business days",
  "returnsNote": "30-day return policy"
}
```

### GET /products/:id/related
Get related products.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| limit | number | Number of products (default: 6) |

### POST /products 🔒👑
Create product override.

**Request Body:**
```json
{
  "inventorySku": "INV-SKU-001",
  "isFeatured": true,
  "isNew": true,
  "customPrice": 249.00,
  "customSalePrice": 199.00,
  "metaTitle": "SEO Title",
  "metaDescription": "SEO Description"
}
```

### PATCH /products/:id 🔒👑
Update product override.

### DELETE /products/:id 🔒👑
Delete product override.

---

## Categories Module

### GET /categories
List all categories with hierarchy.

**Response (200):**
```json
[
  {
    "id": "uuid",
    "name": "Kitchen",
    "slug": "kitchen",
    "description": "Kitchen products",
    "image": "https://...",
    "departmentId": "uuid",
    "parentId": null,
    "children": [
      {
        "id": "uuid",
        "name": "Cookware",
        "slug": "cookware",
        "parentId": "parent-uuid"
      }
    ]
  }
]
```

### GET /categories/:id
Get single category.

### POST /categories 🔒👑
Create category.

**Request Body:**
```json
{
  "name": "New Category",
  "slug": "new-category",
  "description": "Category description",
  "departmentId": "dept-uuid",
  "parentId": null,
  "image": "https://...",
  "sortOrder": 0
}
```

### PATCH /categories/:id 🔒👑
Update category.

### DELETE /categories/:id 🔒👑
Delete category.

---

## Cart Module

### GET /cart 🔒
Get user's shopping cart.

**Response (200):**
```json
{
  "id": "cart-uuid",
  "items": [
    {
      "id": "item-uuid",
      "type": "PRODUCT",
      "productId": 1,
      "quantity": 2,
      "product": {
        "id": 1,
        "name": "Product Name",
        "price": 99.00,
        "imageUrl": "https://..."
      }
    }
  ],
  "itemCount": 2,
  "subtotal": 198.00
}
```

### POST /cart/items 🔒
Add item to cart.

**Request Body:**
```json
{
  "productId": 1,
  "quantity": 1
}
```

### PATCH /cart/items/:id 🔒
Update cart item quantity.

**Request Body:**
```json
{
  "quantity": 3
}
```

### DELETE /cart/items/:id 🔒
Remove item from cart.

### DELETE /cart 🔒
Clear entire cart.

---

## Orders Module

### POST /orders 🔒
Create new order.

**Request Body:**
```json
{
  "shippingAddressId": "address-uuid",
  "billingAddressId": "address-uuid",
  "shippingMethod": "STANDARD",
  "paymentMethod": "CREDIT_CARD",
  "promoCode": "SAVE10",
  "loyaltyRedeemAed": 50.00,
  "notes": "Please leave at door"
}
```

**Response (201):**
```json
{
  "id": "order-uuid",
  "orderNumber": "ORD-2024-0001",
  "status": "PENDING",
  "paymentStatus": "PENDING",
  "subtotal": 599.00,
  "shipping": 0.00,
  "discount": 59.90,
  "tax": 26.96,
  "total": 566.06,
  "createdAt": "2024-01-15T10:30:00Z"
}
```

### GET /orders 🔒
Get user's order history.

**Response (200):**
```json
[
  {
    "id": "order-uuid",
    "orderNumber": "ORD-2024-0001",
    "status": "DELIVERED",
    "total": 566.06,
    "itemCount": 3,
    "createdAt": "2024-01-15T10:30:00Z"
  }
]
```

### GET /orders/:id 🔒
Get order details.

### GET /orders/:id/invoice/pdf 🔒
Download order invoice as PDF.

---

## Content Module

### GET /content/home
Get homepage CMS layout.

**Response (200):**
```json
{
  "id": "page-uuid",
  "title": "Home",
  "slug": "home",
  "sections": [
    {
      "id": "section-uuid",
      "type": "HERO_SLIDER",
      "title": null,
      "data": {...},
      "displayOrder": 0
    }
  ]
}
```

### GET /content/banners
Get active banners.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| placement | string | Banner placement (HOME_HERO, etc.) |

**Response (200):**
```json
[
  {
    "id": "banner-uuid",
    "placement": "HOME_HERO",
    "title": "Summer Sale",
    "subtitle": "Up to 50% off",
    "ctaText": "Shop Now",
    "ctaUrl": "/sale",
    "imageDesktopUrl": "https://...",
    "imageMobileUrl": "https://..."
  }
]
```

### GET /content/pages/:slug
Get landing page by slug.

### GET /content/loyalty-config
Get loyalty program configuration.

---

## Admin Module 🔒👑

### GET /admin/stats
Get dashboard statistics.

**Response (200):**
```json
{
  "totalRevenue": 125000.00,
  "totalOrders": 450,
  "totalCustomers": 1200,
  "pendingOrders": 12,
  "recentOrders": [...],
  "topProducts": [...],
  "salesByDay": [...]
}
```

### GET /admin/orders
List all orders with filters.

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| status | string | Filter by status |
| page | number | Page number |
| limit | number | Items per page |
| search | string | Search query |

### GET /admin/orders/:id
Get order details (admin view).

### GET /admin/orders/:id/invoice/pdf
Download order invoice.

---

## Media Module 🔒👑

### POST /media/upload
Upload single file.

**Request (multipart/form-data):**
| Field | Type | Description |
|-------|------|-------------|
| file | File | File to upload |
| folder | string | Target folder |
| optimize | boolean | Optimize image |

**Response (201):**
```json
{
  "url": "https://localhost:3000/uploads/products/image.jpg",
  "filename": "image.jpg",
  "size": 125000,
  "mimeType": "image/jpeg"
}
```

### POST /media/upload-multiple
Upload multiple files (max 10).

### DELETE /media/delete
Delete uploaded file.

**Request Body:**
```json
{
  "url": "https://localhost:3000/uploads/products/image.jpg"
}
```

---

## Legend

- 🔒 = Requires authentication (JWT Bearer token)
- 👑 = Requires ADMIN or SUPER_ADMIN role

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": ["email must be an email"],
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized"
}
```

### 403 Forbidden
```json
{
  "statusCode": 403,
  "message": "Forbidden resource"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found"
}
```

### 429 Too Many Requests
```json
{
  "statusCode": 429,
  "message": "ThrottlerException: Too Many Requests"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```
