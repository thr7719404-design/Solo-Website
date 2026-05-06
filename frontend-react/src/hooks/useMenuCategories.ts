import { useEffect, useState, useCallback } from 'react';
import { categoriesApi } from '../api/categories';
import type { CategoryDto } from '../types';

export interface MenuSubCategory {
  id: string;
  name: string;
  slug: string;
  productCount?: number;
}

export interface MenuCategory {
  id: string;
  name: string;
  slug: string;
  subCategories: MenuSubCategory[];
  productCount?: number;
  imageUrl?: string;
}

interface CacheShape {
  data: MenuCategory[] | null;
  promise: Promise<MenuCategory[]> | null;
}

const cache: CacheShape = { data: null, promise: null };

function normalize(cats: CategoryDto[]): MenuCategory[] {
  return (cats || [])
    .filter((c) => c.isActive !== false && !c.parentId)
    .map((c) => ({
      id: String(c.id),
      name: c.name,
      slug: c.slug || String(c.id),
      productCount: c.productCount,
      imageUrl: c.imageUrl || c.image,
      subCategories: (c.subcategories || c.children || [])
        .filter((s) => s.isActive !== false)
        .map((s) => ({
          id: String(s.id),
          name: s.name,
          slug: s.slug || String(s.id),
          productCount: s.productCount,
        })),
    }));
}

function loadCategories(): Promise<MenuCategory[]> {
  if (cache.data) return Promise.resolve(cache.data);
  if (cache.promise) return cache.promise;
  cache.promise = categoriesApi
    .getAll({ includeSubcategories: true })
    .then((cats) => {
      const normalized = normalize(cats);
      cache.data = normalized;
      cache.promise = null;
      return normalized;
    })
    .catch((err) => {
      cache.promise = null;
      throw err;
    });
  return cache.promise;
}

export function useMenuCategories() {
  const [categories, setCategories] = useState<MenuCategory[]>(cache.data || []);
  const [isLoading, setIsLoading] = useState<boolean>(!cache.data);
  const [error, setError] = useState<string | null>(null);

  const fetchNow = useCallback(() => {
    setIsLoading(true);
    setError(null);
    loadCategories()
      .then((data) => {
        setCategories(data);
        setIsLoading(false);
      })
      .catch((err) => {
        setError(err?.message || 'Failed to load categories');
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!cache.data) fetchNow();
  }, [fetchNow]);

  const retry = useCallback(() => {
    cache.data = null;
    cache.promise = null;
    fetchNow();
  }, [fetchNow]);

  return { categories, isLoading, error, retry };
}
