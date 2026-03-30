import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import { favoritesApi } from '../api/favorites';
import { useAuth } from './AuthContext';

interface FavoritesContextType {
  favoriteIds: Set<string>;
  isLoading: boolean;
  toggle: (productId: string) => Promise<void>;
  isFavorite: (productId: string) => boolean;
}

const FavoritesContext = createContext<FavoritesContextType | null>(null);

export function FavoritesProvider({ children }: { children: ReactNode }) {
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
      setFavoriteIds(new Set(ids));
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
    const prev = new Set(favoriteIds);
    const newSet = new Set(favoriteIds);
    if (newSet.has(productId)) newSet.delete(productId);
    else newSet.add(productId);
    setFavoriteIds(newSet);
    try {
      await favoritesApi.toggle(productId);
    } catch {
      setFavoriteIds(prev);
    }
  }, [favoriteIds]);

  const isFavorite = useCallback((productId: string) => favoriteIds.has(productId), [favoriteIds]);

  return (
    <FavoritesContext.Provider value={{ favoriteIds, isLoading, toggle, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}
