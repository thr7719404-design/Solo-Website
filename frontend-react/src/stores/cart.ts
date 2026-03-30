import { create } from 'zustand';
import { cartApi } from '@/api/cart';
import { getAccessToken } from '@/api/client';
import type { Cart, CartItem, AddCartItemRequest } from '@/types';

interface CartState {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  isLoading: boolean;

  fetchCart: () => Promise<void>;
  addItem: (body: AddCartItemRequest) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

function summarise(cart: Cart) {
  return {
    items: cart.items ?? [],
    itemCount: (cart.items ?? []).reduce((n, i) => n + i.quantity, 0),
    subtotal: cart.subtotal ?? 0,
  };
}

function isLoggedIn(): boolean {
  return !!getAccessToken();
}

export const useCartStore = create<CartState>((set) => ({
  items: [],
  itemCount: 0,
  subtotal: 0,
  isLoading: false,

  async fetchCart() {
    if (!isLoggedIn()) return;
    set({ isLoading: true });
    try {
      const cart = await cartApi.getCart();
      set({ ...summarise(cart), isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  async addItem(body) {
    if (!isLoggedIn()) {
      globalThis.location.href = '/login';
      return;
    }
    set({ isLoading: true });
    try {
      const cart = await cartApi.addItem(body);
      set({ ...summarise(cart), isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  async updateQuantity(cartItemId, quantity) {
    if (!isLoggedIn()) return;
    set({ isLoading: true });
    try {
      const cart = await cartApi.updateItemQuantity(cartItemId, quantity);
      set({ ...summarise(cart), isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  async removeItem(cartItemId) {
    if (!isLoggedIn()) return;
    set({ isLoading: true });
    try {
      const cart = await cartApi.removeItem(cartItemId);
      set({ ...summarise(cart), isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  async clearCart() {
    if (!isLoggedIn()) return;
    set({ isLoading: true });
    try {
      const cart = await cartApi.clearCart();
      set({ ...summarise(cart), isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },
}));
