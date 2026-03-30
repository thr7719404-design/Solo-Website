import { useEffect, useState, useCallback, useRef, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsApi } from '@/api/products';
import { categoriesApi } from '@/api/categories';
import ProductCard from '@/components/product/ProductCard';
import { useCartStore } from '@/stores/cart';
import type { ProductDto, CategoryDto, PaginationMeta } from '@/types';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Relevance' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'name_asc', label: 'Name: A → Z' },
];
const LIMIT = 20;

/* Extracted sub-components to reduce cognitive complexity */
function ResultSummary({ meta, loading, activeQuery }: Readonly<{ meta: PaginationMeta | null; loading: boolean; activeQuery: string }>) {
  if (meta) return <><span className="font-semibold text-gray-900">{meta.total}</span> results for &ldquo;{activeQuery}&rdquo;</>;
  if (loading) return <>Searching&hellip;</>;
  return <>No results for &ldquo;{activeQuery}&rdquo;</>;
}

function ProductGrid({
  loading, products, meta, page, onAddToCart, onLoadMore,
}: Readonly<{
  loading: boolean; products: ProductDto[]; meta: PaginationMeta | null;
  page: number; onAddToCart: (p: ProductDto) => void; onLoadMore: () => void;
}>) {
  if (loading && products.length === 0) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-[3px] border-gray-200 border-t-[#B8860B] rounded-full animate-spin" />
      </div>
    );
  }
  if (products.length > 0) {
    return (
      <>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} onAddToCart={() => onAddToCart(p)} />
          ))}
        </div>
        {meta && page < meta.totalPages && (
          <div className="flex justify-center mt-10">
            <button
              onClick={onLoadMore}
              disabled={loading}
              className="px-8 py-3 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition disabled:opacity-50"
            >
              {loading ? 'Loading…' : 'Load More'}
            </button>
          </div>
        )}
      </>
    );
  }
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-3xl mb-4">🔍</div>
      <h2 className="text-lg font-semibold text-gray-700 mb-1">No products found</h2>
      <p className="text-sm text-gray-400 max-w-sm">
        Try adjusting your search or filters to find what you&apos;re looking for.
      </p>
    </div>
  );
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const inputRef = useRef<HTMLInputElement>(null);

  const [query, setQuery] = useState(searchParams.get('q') ?? '');
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const addItem = useCartStore((s) => s.addItem);

  // Load categories once
  useEffect(() => {
    categoriesApi.getCategories().then(setCategories).catch(() => {});
  }, []);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const search = useCallback(
    async (q: string, pageNum: number, sort: string, catId: string, append = false) => {
      if (!q.trim()) { setProducts([]); setMeta(null); return; }
      setLoading(true);
      try {
        const params: Record<string, unknown> = {
          search: q.trim(),
          page: pageNum,
          limit: LIMIT,
          sortBy: sort,
        };
        if (catId) params.categoryId = catId;
        const res = await productsApi.getProducts(params as never);
        setProducts((prev) => (append ? [...prev, ...res.data] : res.data));
        setMeta(res.meta);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  // Trigger search when URL ?q= changes
  useEffect(() => {
    const q = searchParams.get('q') ?? '';
    setQuery(q);
    setPage(1);
    search(q, 1, sortBy, selectedCategory);
  }, [searchParams, sortBy, selectedCategory, search]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    }
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    search(query, next, sortBy, selectedCategory, true);
  };

  const handleAddToCart = (p: ProductDto) => {
    addItem({ type: 'product', itemId: p.id, quantity: 1 });
  };

  const activeQuery = searchParams.get('q') ?? '';

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Search Bar */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="relative max-w-2xl mx-auto">
          <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for products…"
            className="w-full pl-12 pr-24 py-4 text-lg border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#B8860B]/30 focus:border-[#B8860B] bg-white shadow-sm"
          />
          {query && (
            <button
              type="button"
              onClick={() => { setQuery(''); setSearchParams({}); }}
              className="absolute right-20 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          )}
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 bg-[#B8860B] text-white text-sm font-medium rounded-xl hover:bg-[#9A7209] transition"
          >
            Search
          </button>
        </div>
      </form>

      {/* Results area */}
      {activeQuery ? (
        <>
          {/* Info bar + filters toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <p className="text-sm text-gray-600">
                <ResultSummary meta={meta} loading={loading} activeQuery={activeQuery} />
              </p>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="text-sm text-[#B8860B] font-medium hover:underline sm:hidden"
              >
                {showFilters ? 'Hide Filters' : 'Filters'}
              </button>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="hidden sm:inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 px-3 py-1.5 rounded-lg"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                {showFilters ? 'Hide Filters' : 'Filters'}
              </button>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 focus:ring-2 focus:ring-[#B8860B]/30"
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filters panel */}
          {showFilters && (
            <div className="mb-6 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Category</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedCategory('')}
                  className={`px-3 py-1.5 text-sm rounded-full border transition ${
                    selectedCategory
                      ? 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                      : 'bg-[#B8860B] text-white border-[#B8860B]'
                  }`}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 text-sm rounded-full border transition ${
                      selectedCategory === cat.id
                        ? 'bg-[#B8860B] text-white border-[#B8860B]'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
              {selectedCategory && (
                <button
                  onClick={() => setSelectedCategory('')}
                  className="mt-3 text-xs text-gray-500 hover:text-gray-700"
                >
                  Reset filters
                </button>
              )}
            </div>
          )}

          {/* Product grid */}
          <ProductGrid
            loading={loading}
            products={products}
            meta={meta}
            page={page}
            onAddToCart={handleAddToCart}
            onLoadMore={loadMore}
          />
        </>
      ) : (
        /* Empty state — no search query yet */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-full bg-gray-50 flex items-center justify-center text-4xl mb-5">🔎</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Search our collection</h2>
          <p className="text-sm text-gray-400 max-w-md">
            Type a product name, category, or keyword above to browse our catalog.
          </p>
        </div>
      )}
    </div>
  );
}
