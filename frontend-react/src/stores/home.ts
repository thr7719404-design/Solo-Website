import { create } from 'zustand';
import type { LandingPageDto, ProductDto } from '@/types';
import { contentApi } from '@/api/content';
import { productsApi } from '@/api/products';

interface HomeState {
  page: LandingPageDto | null;
  isLoading: boolean;
  error: string | null;

  featured: ProductDto[];
  bestSellers: ProductDto[];
  newArrivals: ProductDto[];
  productLoading: Record<string, boolean>;

  loadHome: () => Promise<void>;
  getProductsForSource: (source: string, limit?: number) => ProductDto[];
}

export const useHomeStore = create<HomeState>((set, get) => ({
  page: null,
  isLoading: false,
  error: null,

  featured: [],
  bestSellers: [],
  newArrivals: [],
  productLoading: {},

  async loadHome() {
    set({ isLoading: true, error: null });
    try {
      const page = await contentApi.getHomePage();
      set({ page, isLoading: false });

      // Determine which product sources are needed
      const sources = new Set<string>();
      for (const s of page?.sections ?? []) {
        const src = s.data?.source as string | undefined;
        if (src) sources.add(src);
      }

      // Load product lists in parallel
      const jobs: Promise<void>[] = [];

      const toArray = (d: unknown): ProductDto[] => Array.isArray(d) ? d : [];

      if (sources.has('featured')) {
        set((s) => ({ productLoading: { ...s.productLoading, featured: true } }));
        jobs.push(
          productsApi.getFeatured(20).then((data) =>
            set((s) => ({ featured: toArray(data), productLoading: { ...s.productLoading, featured: false } })),
          ),
        );
      }

      if (sources.has('best_sellers')) {
        set((s) => ({ productLoading: { ...s.productLoading, best_sellers: true } }));
        jobs.push(
          productsApi.getBestSellers(20).then((data) =>
            set((s) => ({ bestSellers: toArray(data), productLoading: { ...s.productLoading, best_sellers: false } })),
          ),
        );
      }

      if (sources.has('new_arrivals')) {
        set((s) => ({ productLoading: { ...s.productLoading, new_arrivals: true } }));
        jobs.push(
          productsApi.getNewArrivals(20).then((data) =>
            set((s) => ({ newArrivals: toArray(data), productLoading: { ...s.productLoading, new_arrivals: false } })),
          ),
        );
      }

      await Promise.allSettled(jobs);
    } catch {
      set({ isLoading: false, error: 'Failed to load homepage' });
    }
  },

  getProductsForSource(source: string, limit = 12) {
    const state = get();
    let list: ProductDto[];
    switch (source) {
      case 'featured':
        list = state.featured;
        break;
      case 'best_sellers':
        list = state.bestSellers;
        break;
      case 'new_arrivals':
        list = state.newArrivals;
        break;
      default:
        list = [];
    }
    return Array.isArray(list) ? list.slice(0, limit) : [];
  },
}));
