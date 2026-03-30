import api from './client';
import type { CartDto, CartItemDto } from '../types';

/** Map backend cart item (product data nested in .product) to flat CartItemDto */
function mapCartItem(item: any): CartItemDto {
  const product = item.product;
  return {
    id: String(item.id),
    productId: String(item.productId),
    name: product?.name ?? 'Unknown product',
    imageUrl: product?.images?.[0]?.url ?? product?.imageUrl,
    price: typeof product?.price === 'number' ? product.price : 0,
    quantity: item.quantity,
    size: item.size,
    color: item.color,
    product,
  };
}

/** Normalise the raw backend cart response into CartDto */
function mapCart(raw: any): CartDto {
  const items: CartItemDto[] = (raw.items ?? []).map(mapCartItem);
  const total = raw.summary?.total ?? raw.total ?? items.reduce((s, i) => s + i.price * i.quantity, 0);
  return { id: String(raw.id), items, total };
}

export const cartApi = {
  get: () =>
    api.get('/cart').then(r => mapCart(r.data)),

  addItem: (data: { type?: string; itemId: string; quantity: number; customization?: string }) =>
    api.post('/cart/items', { type: 'PRODUCT', ...data }).then(r => mapCart(r.data)),

  updateItem: (cartItemId: string, quantity: number) =>
    api.patch(`/cart/items/${cartItemId}`, { quantity }).then(r => mapCart(r.data)),

  removeItem: (cartItemId: string) =>
    api.delete(`/cart/items/${cartItemId}`).then(r => r.data),

  clear: () =>
    api.delete('/cart').then(r => r.data),
};
