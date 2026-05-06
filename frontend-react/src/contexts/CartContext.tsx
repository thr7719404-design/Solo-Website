import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import toast from 'react-hot-toast';
import type { CartItemDto } from '../types';
import { cartApi } from '../api/cart';
import { productsApi } from '../api/products';
import { useAuth } from './AuthContext';
import { trackRemoveFromCart } from '@/lib/analytics';

const GUEST_CART_KEY = 'solo_guest_cart_v1';

function readGuestCart(): CartItemDto[] {
  try {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeGuestCart(items: CartItemDto[]) {
  try {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  } catch { /* quota / privacy mode — ignore */ }
}

function clearGuestCart() {
  try { localStorage.removeItem(GUEST_CART_KEY); } catch { /* ignore */ }
}

interface CartContextType {
  items: CartItemDto[];
  itemCount: number;
  total: number;
  isLoading: boolean;
  /** Per-item transient notices (e.g. "Only 1 left in stock") keyed by cart item id. */
  notices: Record<string, string>;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  removeItem: (cartItemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  dismissNotice: (cartItemId: string) => void;
}

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { isAuthenticated } = useAuth();
  const [items, setItems] = useState<CartItemDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notices, setNotices] = useState<Record<string, string>>({});
  const noticeTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const showNotice = useCallback((cartItemId: string, message: string) => {
    setNotices((n) => ({ ...n, [cartItemId]: message }));
    if (noticeTimers.current[cartItemId]) {
      clearTimeout(noticeTimers.current[cartItemId]);
    }
    noticeTimers.current[cartItemId] = setTimeout(() => {
      setNotices((n) => {
        const { [cartItemId]: _drop, ...rest } = n;
        return rest;
      });
      delete noticeTimers.current[cartItemId];
    }, 4000);
  }, []);

  const dismissNotice = useCallback((cartItemId: string) => {
    if (noticeTimers.current[cartItemId]) {
      clearTimeout(noticeTimers.current[cartItemId]);
      delete noticeTimers.current[cartItemId];
    }
    setNotices((n) => {
      const { [cartItemId]: _drop, ...rest } = n;
      return rest;
    });
  }, []);

  useEffect(() => {
    return () => {
      Object.values(noticeTimers.current).forEach(clearTimeout);
      noticeTimers.current = {};
    };
  }, []);

  const loadCart = useCallback(async () => {
    if (!isAuthenticated) {
      setItems(readGuestCart());
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

  // Merge guest cart into server cart when the user logs in / signs up.
  const mergedRef = useRef(false);
  useEffect(() => {
    if (!isAuthenticated) {
      mergedRef.current = false;
      loadCart();
      return;
    }
    if (mergedRef.current) {
      loadCart();
      return;
    }
    mergedRef.current = true;
    const guest = readGuestCart();
    if (guest.length === 0) {
      loadCart();
      return;
    }
    (async () => {
      setIsLoading(true);
      try {
        for (const g of guest) {
          try { await cartApi.addItem({ itemId: g.productId, quantity: g.quantity }); } catch { /* skip */ }
        }
        clearGuestCart();
        const cart = await cartApi.get();
        setItems(cart.items || []);
      } catch {
        await loadCart();
      } finally {
        setIsLoading(false);
      }
    })();
  }, [isAuthenticated, loadCart]);

  const addItem = useCallback(async (productId: string, quantity = 1) => {
    if (!isAuthenticated) {
      // Guest: persist locally with a product snapshot
      try {
        const existing = readGuestCart();
        const found = existing.find(i => i.productId === productId);
        if (found) {
          found.quantity += quantity;
          writeGuestCart(existing);
          setItems([...existing]);
          return;
        }
        const product = await productsApi.getById(productId);
        const item: CartItemDto = {
          id: `guest-${productId}`,
          productId,
          name: product.name,
          imageUrl: product.imageUrl ?? product.images?.[0]?.url,
          price: product.price,
          quantity,
          available: product.stock ?? undefined,
          inStock: product.inStock !== false,
        };
        const next = [...existing, item];
        writeGuestCart(next);
        setItems(next);
      } catch (err: any) {
        toast.error('Could not add to cart');
        throw err;
      }
      return;
    }
    try {
      const cart = await cartApi.addItem({ itemId: productId, quantity });
      setItems(cart.items || []);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      const message = Array.isArray(msg) ? msg[0] : msg;
      if (message) toast.error(message);
      console.error('Failed to add to cart', err);
      throw err;
    }
  }, [isAuthenticated]);

  const updateQuantity = useCallback(async (cartItemId: string, quantity: number) => {
    const target = items.find((i) => i.id === cartItemId);
    if (!target) return;

    // Guest cart: localStorage only
    if (!isAuthenticated) {
      const limit = typeof target.available === 'number' ? target.available : undefined;
      const finalQty = typeof limit === 'number' ? Math.min(Math.max(1, quantity), Math.max(1, limit)) : Math.max(1, quantity);
      if (typeof limit === 'number' && quantity > limit) {
        const msg = limit <= 0 ? `${target.name} is out of stock` : `Only ${limit} unit${limit === 1 ? '' : 's'} available`;
        showNotice(cartItemId, msg);
      }
      const next = readGuestCart().map(i => i.id === cartItemId ? { ...i, quantity: finalQty } : i);
      writeGuestCart(next);
      setItems(next);
      return;
    }

    // Client-side guard: if we already know the limit, refuse to send a doomed request.
    // This is what stops the "spam +" race that otherwise lets the optimistic state
    // drift past real stock when concurrent rejections roll back to stale snapshots.
    const limit = typeof target.available === 'number' ? target.available : undefined;
    if (typeof limit === 'number' && quantity > limit) {
      let msg: string;
      if (limit <= 0) {
        msg = `${target.name} is out of stock`;
      } else {
        const unitLabel = limit === 1 ? '' : 's';
        msg = `Only ${limit} unit${unitLabel} available`;
      }
      showNotice(cartItemId, msg);
      // Pin the displayed quantity to the real cap (don't let the UI drift up).
      setItems((curr) =>
        curr.map((i) => (i.id === cartItemId ? { ...i, quantity: Math.max(1, limit) } : i)),
      );
      return;
    }

    // Optimistic update.
    setItems((curr) => curr.map((i) => (i.id === cartItemId ? { ...i, quantity } : i)));
    try {
      const cart = await cartApi.updateItem(cartItemId, quantity);
      setItems(cart.items || []);
    } catch (err: any) {
      await rollbackQuantityUpdate(err, cartItemId);
    }
  }, [items, showNotice, isAuthenticated]);

  async function rollbackQuantityUpdate(err: any, cartItemId: string) {
    // Authoritative rollback: refetch the cart from the server instead of trusting
    // a local snapshot, which may itself be a stale optimistic value when several
    // requests race.
    const raw = err?.response?.data?.message;
    const message = Array.isArray(raw) ? raw[0] : raw;
    if (message) showNotice(cartItemId, String(message));
    try {
      const cart = await cartApi.get();
      setItems(cart.items || []);
    } catch {
      /* leave items as-is; next loadCart will recover */
    }
  }

  const removeItem = useCallback(async (cartItemId: string) => {
    if (!isAuthenticated) {
      const removing = readGuestCart().find(i => i.id === cartItemId);
      if (removing) trackRemoveFromCart({ item_id: removing.productId, item_name: removing.name, price: removing.price }, removing.quantity);
      const next = readGuestCart().filter(i => i.id !== cartItemId);
      writeGuestCart(next);
      setItems(next);
      return;
    }
    const removing = items.find(i => i.id === cartItemId);
    if (removing) trackRemoveFromCart({ item_id: removing.productId, item_name: removing.name, price: removing.price }, removing.quantity);
    setItems(items.filter(i => i.id !== cartItemId));
    try {
      const cart = await cartApi.removeItem(cartItemId);
      setItems(cart.items || []);
    } catch {
      await loadCart();
    }
  }, [items, loadCart, isAuthenticated]);

  const clearCart = useCallback(async () => {
    setItems([]);
    clearGuestCart();
    if (!isAuthenticated) return;
    try {
      await cartApi.clear();
    } catch { /* ignore */ }
  }, [isAuthenticated]);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const total = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

  const value = useMemo(
    () => ({ items, itemCount, total, isLoading, notices, addItem, updateQuantity, removeItem, clearCart, dismissNotice }),
    [items, itemCount, total, isLoading, notices, addItem, updateQuantity, removeItem, clearCart, dismissNotice],
  );

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
