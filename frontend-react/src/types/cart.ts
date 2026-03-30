// ============================================================================
// Cart Types — matches NestJS backend /cart/*
// ============================================================================

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  imageUrl: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discount: number;
  total: number;
  promoCode?: string;
}

export interface AddCartItemRequest {
  type: string;
  itemId: string;
  quantity: number;
  customization?: Record<string, unknown>;
}
