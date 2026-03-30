import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import type { CartItemDto } from '../types';
import { cartApi } from '../api/cart';
import { useAuth } from './AuthContext';

interface CartContextType {
  items: CartItemDto[];
  itemCount: number;
  total: number;
  isLoading: boolean;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadCart = useCallback(async () => {
    if (!isAuthenticated) {
      setItems([]);
      return;
    }
    setIsLoading(true);
    try {
      const cart = await cartApi.get();
      setItems(cart.items || []);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadCart();
  }, [loadCart]);

  const addItem = useCallback(async (productId: string, quantity = 1) => {
    try {
      const cart = await cartApi.addItem({ itemId: productId, quantity });
      setItems(cart.items || []);
    } catch (err) {
      console.error('Failed to add to cart', err);
      throw err;
    }
  }, []);

  const updateQuantity = useCallback(async (cartItemId: string, quantity: number) => {
    const prev = items;
    setItems(items.map(i => i.id === cartItemId ? { ...i, quantity } : i));
    try {
      const cart = await cartApi.updateItem(cartItemId, quantity);
      setItems(cart.items || []);
    } catch {
      setItems(prev);
    }
  }, [items]);

  const removeItem = useCallback(async (cartItemId: string) => {
    const prev = items;
    setItems(items.filter(i => i.id !== cartItemId));
    try {
      await cartApi.removeItem(cartItemId);
    } catch {
      setItems(prev);
    }
  }, [items]);

  const clearCart = useCallback(async () => {
    setItems([]);
    try {
      await cartApi.clear();
    } catch { /* ignore */ }
  }, []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, itemCount, total, isLoading, addItem, updateQuantity, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
