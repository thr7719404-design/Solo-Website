import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock the API + token modules so the store calls them without HTTP
const mockGetCart = vi.fn();
const mockAddItem = vi.fn();
const mockUpdate = vi.fn();
const mockRemove = vi.fn();
const mockClear = vi.fn();
const mockGetAccessToken = vi.fn();

vi.mock('@/api/cart', () => ({
  cartApi: {
    getCart: (...a: any[]) => mockGetCart(...a),
    addItem: (...a: any[]) => mockAddItem(...a),
    updateItemQuantity: (...a: any[]) => mockUpdate(...a),
    removeItem: (...a: any[]) => mockRemove(...a),
    clearCart: (...a: any[]) => mockClear(...a),
  },
}));

vi.mock('@/api/client', () => ({
  getAccessToken: () => mockGetAccessToken(),
}));

import { useCartStore } from './cart';

const cartFixture = {
  items: [
    { id: 'ci-1', productId: 'p1', quantity: 2, price: 50 },
    { id: 'ci-2', productId: 'p2', quantity: 1, price: 30 },
  ],
  subtotal: 130,
};

beforeEach(() => {
  mockGetCart.mockReset();
  mockAddItem.mockReset();
  mockUpdate.mockReset();
  mockRemove.mockReset();
  mockClear.mockReset();
  mockGetAccessToken.mockReset();
  // Reset the store between tests
  useCartStore.setState({
    items: [],
    itemCount: 0,
    subtotal: 0,
    isLoading: false,
  });
});

describe('useCartStore', () => {
  it('does not fetch when logged out', async () => {
    mockGetAccessToken.mockReturnValue(null);
    await useCartStore.getState().fetchCart();
    expect(mockGetCart).not.toHaveBeenCalled();
  });

  it('fetchCart populates items + computed counts', async () => {
    mockGetAccessToken.mockReturnValue('token-abc');
    mockGetCart.mockResolvedValue(cartFixture);
    await useCartStore.getState().fetchCart();
    const s = useCartStore.getState();
    expect(s.items).toHaveLength(2);
    expect(s.itemCount).toBe(3);
    expect(s.subtotal).toBe(130);
    expect(s.isLoading).toBe(false);
  });

  it('addItem refreshes the cart from the API response', async () => {
    mockGetAccessToken.mockReturnValue('token-abc');
    mockAddItem.mockResolvedValue(cartFixture);
    await useCartStore
      .getState()
      .addItem({ type: 'PRODUCT', itemId: 'p1', quantity: 2 } as any);
    expect(mockAddItem).toHaveBeenCalledTimes(1);
    expect(useCartStore.getState().itemCount).toBe(3);
  });

  it('clearCart resets the cart from API', async () => {
    mockGetAccessToken.mockReturnValue('token-abc');
    useCartStore.setState({ items: cartFixture.items as any, itemCount: 3, subtotal: 130 });
    mockClear.mockResolvedValue({ items: [], subtotal: 0 });
    await useCartStore.getState().clearCart();
    expect(useCartStore.getState().itemCount).toBe(0);
    expect(useCartStore.getState().subtotal).toBe(0);
  });

  it('isLoading flips back to false on API failure', async () => {
    mockGetAccessToken.mockReturnValue('token-abc');
    mockGetCart.mockRejectedValue(new Error('boom'));
    await useCartStore.getState().fetchCart();
    expect(useCartStore.getState().isLoading).toBe(false);
  });
});
