import { createContext, useContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { favoritesApi } from '../api/favorites';
import { useAuth } from './AuthContext';

interface FavoritesContextType {
  favoriteIds: Set<string>;
  isLoading: boolean;
  toggle: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: Readonly<{ children: ReactNode }>) {
  const { isAuthenticated } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);

  const loadFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setFavoriteIds(new Set());
      return;
    }
    setIsLoading(true);
    try {
      const ids = await favoritesApi.getIds();
      // Normalize to strings so they match product.id (which the backend returns as a string)
      setFavoriteIds(new Set(ids.map(String)));
    } catch {
      setFavoriteIds(new Set());
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const toggle = useCallback(async (productId: string) => {
    const key = String(productId);
    const prev = new Set(favoriteIds);
    const newSet = new Set(favoriteIds);
    if (newSet.has(key)) newSet.delete(key);
    else newSet.add(key);
    setFavoriteIds(newSet);
    try {
      await favoritesApi.toggle(key);
    } catch {
      setFavoriteIds(prev);
    }
  }, [favoriteIds]);

  const isFavorite = useCallback((productId: string) => favoriteIds.has(productId), [favoriteIds]);

  const value = useMemo(
    () => ({ favoriteIds, isLoading, toggle, isFavorite }),
    [favoriteIds, isLoading, toggle, isFavorite],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
