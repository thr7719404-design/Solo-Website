# Admin Dashboard API

## Overview
Admin dashboard endpoints for real-time business metrics and order management.

## Authentication
All endpoints require:
- Valid JWT token in Authorization header
- User role: ADMIN or SUPER_ADMIN

## Endpoints

### GET /api/admin/stats
Get comprehensive dashboard statistics including orders, revenue, customers, top products, low stock alerts, and recent orders.

**Authentication:** Required (ADMIN/SUPER_ADMIN)

**Response:**
```json
{
  "ordersToday": 5,
  "ordersThisWeek": 23,
  "ordersThisMonth": 89,
  "revenueToday": 1234.56,
  "revenueThisWeek": 8901.23,
  "revenueThisMonth": 34567.89,
  "totalCustomers": 156,
  "newCustomersToday": 3,
  "topProducts": [
    {
      "id": "product-id",
      "sku": "SKU123",
      "name": "Product Name",
      "imageUrl": "https://example.com/image.jpg",
      "totalOrders": 45,
      "totalRevenue": 2345.67,
      "totalQuantity": 89
    }
  ],
  "lowStockProducts": [
    {
      "id": "product-id",
      "sku": "SKU456",
      "name": "Product Name",
      "imageUrl": "https://example.com/image.jpg",
      "stock": 3,
      "threshold": 10
    }
  ],
  "activeBanners": 5,
  "totalBanners": 8,
  "recentOrders": [
    {
      "id": "order-id",
      "orderNumber": "ORD-20240315-12345",
      "customerName": "John Doe",
      "total": 234.56,
      "status": "PENDING",
      "createdAt": "2024-03-15T10:30:00Z"
    }
  ],
  "ordersByStatus": [
    {
      "status": "PENDING",
      "count": 12,
      "percentage": 25.5
    },
    {
      "status": "CONFIRMED",
      "count": 18,
      "percentage": 38.3
    }
  ]
}
```

**Stats Included:**
- **Orders:** Count for today, this week, this month
- **Revenue:** Total for today, this week, this month (excludes CANCELLED orders)
- **Customers:** Total count and new signups today
- **Top Products:** Top 5 by revenue with order count and quantity sold
- **Low Stock:** Products with stock < 10, sorted by lowest first
- **Banners:** Active and total count
- **Recent Orders:** Last 10 orders with customer names
- **Orders by Status:** Distribution with counts and percentages

---

### GET /api/admin/orders
Get paginated admin order list with filtering and search.

**Authentication:** Required (ADMIN/SUPER_ADMIN)

**Query Parameters:**
- `status` (optional): Filter by order status (PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20)
- `search` (optional): Search by order number, customer email, or customer name

**Example Requests:**
```
GET /api/admin/orders
GET /api/admin/orders?status=PENDING&page=1&limit=10
GET /api/admin/orders?search=john@example.com
GET /api/admin/orders?status=SHIPPED&search=john
```

**Response:**
```json
{
  "data": [
    {
      "id": "order-id",
      "orderNumber": "ORD-20240315-12345",
      "customerName": "John Doe",
      "customerEmail": "john@example.com",
      "itemCount": 3,
      "total": 234.56,
      "status": "PENDING",
      "createdAt": "2024-03-15T10:30:00Z"
    }
  ],
  "meta": {
    "total": 156,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

**Order Statuses:**
- `PENDING`: Order placed, awaiting confirmation
- `CONFIRMED`: Order confirmed, being prepared
- `SHIPPED`: Order shipped, in transit
- `DELIVERED`: Order delivered to customer
- `CANCELLED`: Order cancelled

---

## Dashboard Stats Calculation Details

### Time Ranges
- **Today:** Midnight (00:00) to current time
- **This Week:** Last 7 days from current time
- **This Month:** 1st of current month to current time

### Top Products Algorithm
1. Group order items by product ID
2. Aggregate: sum(quantity), sum(subtotal), count(distinct orders)
3. Sort by total revenue descending
4. Return top 5 with product details (SKU, name, image)

### Low Stock Detection
- Products with `stock < 10`
- Sorted by stock ascending (lowest first)
- Returns top 5
- Threshold value (10) is hardcoded but can be made configurable

### Order Search
Searches across:
- Order number (exact or partial match)
- Customer email (partial match)
- Customer first name (partial match)
- Customer last name (partial match)

All searches are case-insensitive using PostgreSQL ILIKE.

---

## Performance Considerations

### Dashboard Stats Endpoint
- Uses 13 parallel database queries via `Promise.all()`
- Typical response time: 200-500ms depending on data volume
- Optimized with database indexes on:
  - `orders.createdAt`
  - `orders.status`
  - `users.role`
  - `users.createdAt`
  - `orderItems.productId`
  - `products.stock`

### Caching Recommendations
- Frontend: Cache stats for 5-10 minutes
- Backend: Consider Redis caching for high traffic
- Invalidate cache on order status changes

---

## Error Responses

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

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

---

## Flutter Integration Example

```dart
// Fetch dashboard stats
final stats = await ApiService.admin.getDashboardStats();

// Display in UI
Text('Orders Today: ${stats.ordersToday}')
Text('Revenue: \$${stats.revenueToday.toStringAsFixed(2)}')

// Fetch filtered orders
final result = await ApiService.admin.getOrders(
  status: 'PENDING',
  page: 1,
  limit: 20,
  search: 'john',
);

// Display orders list
for (final order in result['data']) {
  // Render order card
}
```

---

## Database Schema Dependencies

### Required Tables:
- `orders` (id, orderNumber, userId, total, status, createdAt)
- `order_items` (productId, quantity, subtotal, orderId)
- `products` (id, sku, name, stock)
- `product_images` (productId, url, sortOrder)
- `users` (id, firstName, lastName, email, role, createdAt)
- `banners` (id, isActive)

### Required Enums:
- `OrderStatus`: PENDING, CONFIRMED, SHIPPED, DELIVERED, CANCELLED
- `UserRole`: CUSTOMER, ADMIN, SUPER_ADMIN
