// ============================================================================
// Order Types — matches NestJS backend /orders/*
// ============================================================================

export interface OrderDto {
  id: string;
  orderNumber: string;
  status: string;
  items: OrderItemDto[];
  subtotal: number;
  discount: number;
  shippingCost: number;
  vatAmount: number;
  total: number;
  shippingAddress?: AddressDto;
  billingAddress?: AddressDto;
  paymentMethod?: string;
  paymentIntentId?: string;
  notes?: string;
  trackingNumber?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItemDto {
  id: string;
  productId: string;
  name: string;
  sku: string;
  imageUrl: string;
  price: number;
  quantity: number;
  total: number;
}

// -- Address ------------------------------------------------------------------

export interface AddressDto {
  id: string;
  label?: string;
  firstName: string;
  lastName: string;
  email?: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  phone?: string;
  isDefault: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateAddressRequest {
  label?: string;
  firstName: string;
  lastName: string;
  email?: string;
  company?: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  isDefault?: boolean;
}
