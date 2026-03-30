import { create } from 'zustand';
import { favoritesApi } from '@/api/favorites';

interface FavoritesState {
  ids: Set<string>;
  loaded: boolean;
  /** Load favorite IDs for the current user. No-op if unauthenticated. */
  load: () => Promise<void>;
  /** Toggle a product's favorite status. Returns the new state. */
  toggle: (productId: string) => Promise<boolean>;
  /** Clear local state (on logout). */
  clear: () => void;
}

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  ids: new Set<string>(),
  loaded: false,

  load: async () => {
    try {
      const ids = await favoritesApi.getFavoriteIds();
      set({ ids: new Set(ids), loaded: true });
    } catch {
      // Not logged in or endpoint unavailable — silently ignore
      set({ ids: new Set(), loaded: true });
    }
  },

  toggle: async (productId: string) => {
    const prev = get().ids;
    const wasFav = prev.has(productId);

    // Optimistic update
    const next = new Set(prev);
    if (wasFav) next.delete(productId);
    else next.add(productId);
    set({ ids: next });

    try {
      const res = await favoritesApi.toggleFavorite(productId);
      // Reconcile with server truth
      const synced = new Set(get().ids);
      if (res.isFavorite) synced.add(productId);
      else synced.delete(productId);
      set({ ids: synced });
      return res.isFavorite;
    } catch {
      // Revert on failure
      set({ ids: prev });
      return wasFav;
    }
  },

  clear: () => set({ ids: new Set(), loaded: false }),
}));
