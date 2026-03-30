import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import type { CategoryDto, BrandDto } from '../types';
import { categoriesApi } from '../api/categories';
import { brandsApi } from '../api/brands';

interface CatalogContextType {
  categories: CategoryDto[];
  brands: BrandDto[];
  isLoading: boolean;
  refresh: () => Promise<void>;
}

const CatalogContext = createContext<CatalogContextType | null>(null);

export function CatalogProvider({ children }: { children: ReactNode }) {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [brands, setBrands] = useState<BrandDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    try {
      const [cats, brnds] = await Promise.all([
        categoriesApi.getAll({ includeSubcategories: true }),
        brandsApi.getAll(),
      ]);
      setCategories(cats);
      setBrands(brnds);
    } catch (err) {
      console.error('Failed to load catalog', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <CatalogContext.Provider value={{ categories, brands, isLoading, refresh: load }}>
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error('useCatalog must be used within CatalogProvider');
  return ctx;
}
