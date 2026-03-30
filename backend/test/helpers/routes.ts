/**
 * Centralized API Routes for E2E Tests
 * 
 * This file defines all API routes used in tests.
 * Update these if the actual API routes change.
 */

// ============================================================================
// Public Routes
// ============================================================================
export const ROUTES = {
  // Auth
  AUTH: {
    REGISTER: '/auth/register',
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
    CHANGE_PASSWORD: '/auth/change-password',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
  },

  // Products (Public)
  PRODUCTS: {
    LIST: '/products',
    SEARCH: '/products/search',
    FEATURED: '/products/featured',
    BEST_SELLERS: '/products/best-sellers',
    NEW_ARRIVALS: '/products/new-arrivals',
    BY_ID: (id: string | number) => `/products/${id}`,
    RELATED: (id: string | number) => `/products/${id}/related`,
  },

  // Categories (Public)
  CATEGORIES: {
    LIST: '/categories',
    BY_ID: (id: string) => `/categories/${id}`,
    PRODUCTS: (id: string) => `/categories/${id}/products`,
    REORDER: '/categories/reorder',  // Admin route but on categories controller
  },

  // Brands (Public)
  BRANDS: {
    LIST: '/brands',
    BY_ID: (id: string) => `/brands/${id}`,
  },

  // Cart (Authenticated)
  CART: {
    GET: '/cart',
    ADD_ITEM: '/cart/items',
    UPDATE_ITEM: (itemId: string) => `/cart/items/${itemId}`,
    REMOVE_ITEM: (itemId: string) => `/cart/items/${itemId}`,
    CLEAR: '/cart/clear',
    VALIDATE: '/cart/validate',
  },

  // Favorites (Authenticated)
  FAVORITES: {
    LIST: '/favorites',
    ADD: (productId: string | number) => `/favorites/${productId}`,
    REMOVE: (productId: string | number) => `/favorites/${productId}`,
    CHECK: (productId: string | number) => `/favorites/check/${productId}`,
  },

  // Orders (Authenticated)
  ORDERS: {
    CREATE: '/orders',
    LIST: '/orders',
    BY_ID: (id: string) => `/orders/${id}`,
    CANCEL: (id: string) => `/orders/${id}/cancel`,
  },

  // Account (Authenticated)
  ACCOUNT: {
    PROFILE: '/account/profile',
    UPDATE_PROFILE: '/account/profile',
    ADDRESSES: '/account/addresses',
    ADD_ADDRESS: '/account/addresses',
    UPDATE_ADDRESS: (id: string) => `/account/addresses/${id}`,
    DELETE_ADDRESS: (id: string) => `/account/addresses/${id}`,
    ORDERS: '/account/orders',
  },

  // Content/CMS (Public)
  CONTENT: {
    PAGES: '/content/pages',
    PAGE_BY_SLUG: (slug: string) => `/content/pages/${slug}`,
    LOYALTY_CONFIG: '/content/loyalty-config',
    // Admin CMS routes
    ADMIN_PAGES: '/content/admin/pages',
    ADMIN_PAGE_BY_ID: (id: string) => `/content/admin/pages/${id}`,
    ADMIN_SECTIONS: (pageId: string) => `/content/admin/pages/${pageId}/sections`,
    ADMIN_REORDER_SECTIONS: (pageId: string) => `/content/admin/pages/${pageId}/sections/reorder`,
  },

  // Media (Authenticated)
  MEDIA: {
    UPLOAD: '/media/upload',
    UPLOAD_MULTIPLE: '/media/upload-multiple',
    BY_ID: (id: string) => `/media/${id}`,
    DELETE: (id: string) => `/media/${id}`,
  },

  // Admin Routes
  // NOTE: Most admin functionality uses role guards on existing routes
  // rather than separate /admin/* routes
  ADMIN: {
    // Dashboard & Stats
    STATS: '/admin/stats',
    
    // Order Management (via admin controller)
    ORDERS: '/admin/orders',
    ORDER_BY_ID: (id: string) => `/admin/orders/${id}`,
    ORDER_INVOICE: (id: string) => `/admin/orders/${id}/invoice/pdf`,
    
    // Customer Management (via customers controller)
    CUSTOMERS: '/admin/customers',
    CUSTOMER_BY_ID: (id: string) => `/admin/customers/${id}`,
    CUSTOMER_ADDRESSES: '/admin/customer-addresses',
    
    // NOTE: These routes DO NOT EXIST in the current implementation
    // The tests need to be updated or these routes need to be created
    // USERS: '/admin/users',  // Does not exist!
    // PRODUCTS: '/admin/products', // Does not exist!
    // CATEGORIES: '/admin/categories', // Does not exist!
  },
} as const;

/**
 * Expected HTTP status codes for common operations
 */
export const STATUS = {
  // Success
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  
  // Client Errors
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE: 422,
  
  // Server Errors
  INTERNAL_ERROR: 500,
  NOT_IMPLEMENTED: 501,
} as const;

/**
 * Test data constants
 */
export const TEST_DATA = {
  ADMIN_EMAIL: 'e2e-admin@test.com',
  ADMIN_PASSWORD: 'AdminTest123!',
  CUSTOMER_EMAIL: 'e2e-customer@test.com',
  CUSTOMER_PASSWORD: 'CustomerTest123!',
} as const;
