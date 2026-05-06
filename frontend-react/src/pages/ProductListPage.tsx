import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import type { ProductDto, CategoryDto } from '../types';
import { productsApi, type ProductFilters } from '../api/products';
import { useCatalog } from '../contexts/CatalogContext';
import ProductCard from '../components/porto/ProductCard';
import styles from './ProductListPage.module.css';
import { trackSearch } from '@/lib/analytics';

const COLLECTION_MAP: Record<string, { title: string; filter: Partial<ProductFilters> }> = {
  'new-arrivals': { title: 'New Arrivals', filter: { isNew: true } },
  'best-sellers': { title: 'Best Sellers', filter: { isBestSeller: true } },
  'featured': { title: 'Featured', filter: { isFeatured: true } },
  'sale': { title: 'Sale', filter: {} },
};

function getSubcategories(cat: CategoryDto | undefined): CategoryDto[] {
  if (!cat) return [];
  const arr = (cat as { subcategories?: CategoryDto[]; children?: CategoryDto[] }).subcategories
    || (cat as { children?: CategoryDto[] }).children
    || [];
  return arr.filter((c) => c.isActive !== false);
}

export default function ProductListPage() {
  const { slug, brandSlug } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const { categories, brands } = useCatalog();

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);

  const collection = searchParams.get('collection') || (window.location.pathname.split('/').pop() || '');
  const searchQuery = searchParams.get('q') || '';
  const subSlug = searchParams.get('sub') || '';
  const limit = 12;

  const currentCategory = useMemo(
    () => (slug ? categories.find((c) => c.slug === slug || c.id === slug) : undefined),
    [slug, categories],
  );
  const subcategories = useMemo(() => getSubcategories(currentCategory), [currentCategory]);
  const currentSub = useMemo(
    () => (subSlug ? subcategories.find((s) => s.slug === subSlug || s.id === subSlug) : undefined),
    [subSlug, subcategories],
  );

  // Determine page title and filters
  let title = 'All Products';
  const baseFilters: Partial<ProductFilters> = {};

  if (searchQuery) {
    title = `Search: "${searchQuery}"`;
    baseFilters.search = searchQuery;
  } else if (COLLECTION_MAP[collection]) {
    title = COLLECTION_MAP[collection].title;
    Object.assign(baseFilters, COLLECTION_MAP[collection].filter);
  } else if (slug) {
    if (currentCategory) {
      title = currentSub ? `${currentCategory.name} — ${currentSub.name}` : currentCategory.name;
      baseFilters.categoryId = currentCategory.id;
      if (currentSub) baseFilters.subcategoryId = currentSub.id;
    }
  } else if (brandSlug) {
    const currentBrand = brands.find((b) => b.slug === brandSlug || b.id === brandSlug);
    if (currentBrand) {
      baseFilters.brandId = currentBrand.id;
      title = currentBrand.name;
    } else {
      title = 'Brand Products';
    }
  }

  const currentBrand = brandSlug ? brands.find((b) => b.slug === brandSlug || b.id === brandSlug) : undefined;

  const loadProducts = useCallback(async () => {
    // Wait for categories/brands to load before filtering
    if (slug && categories.length === 0) return;
    if (brandSlug && brands.length === 0) return;

    setLoading(true);
    try {
      const res = await productsApi.getAll({
        ...baseFilters,
        page,
        limit,
        sortBy,
      });
      setProducts(res.items || []);
      setTotal(res.total || 0);
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortBy, slug, collection, searchQuery, brandSlug, subSlug, categories, brands]);

  useEffect(() => {
    setPage(1);
    if (searchQuery) trackSearch(searchQuery);
  }, [slug, collection, searchQuery, brandSlug, subSlug]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const totalPages = Math.ceil(total / limit);

  const setSub = (nextSub: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (nextSub) next.set('sub', nextSub);
    else next.delete('sub');
    setSearchParams(next, { replace: false });
  };

  const showSubcatSidebar = Boolean(currentCategory) && subcategories.length > 0;

  return (
    <div className={styles['product-list-page']}>
      <div className={styles['page-header']}>
        <h1>{title}</h1>
        <p>{total} product{total !== 1 ? 's' : ''}</p>
      </div>
      {currentBrand && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0 4px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: '#555' }}>Filtering by brand:</span>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            background: '#f5f0e8', border: '1px solid #d4af6a',
            borderRadius: 20, padding: '4px 12px', fontSize: 13, fontWeight: 600, color: '#7a5c1e'
          }}>
            {currentBrand.name}
            <Link to="/brands" style={{ marginLeft: 4, color: '#B8860B', fontWeight: 700, fontSize: 15, lineHeight: 1, textDecoration: 'none' }} title="Clear brand filter">✕</Link>
          </span>
        </div>
      )}

      <div className={styles['list-layout']}>
        <aside className={styles.sidebar}>
          {showSubcatSidebar ? (
            <div className={styles['filter-group']}>
              <h3>Shop {currentCategory?.name}</h3>
              <button
                type="button"
                className={`${styles['sub-link']} ${!currentSub ? styles['sub-link-active'] : ''}`}
                onClick={() => setSub(null)}
              >
                All {currentCategory?.name}
                {currentCategory?.productCount != null && (
                  <span className={styles['sub-count']}>({currentCategory.productCount})</span>
                )}
              </button>
              {subcategories.map((sub) => {
                const isActive = currentSub?.id === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    className={`${styles['sub-link']} ${isActive ? styles['sub-link-active'] : ''}`}
                    onClick={() => setSub(sub.slug || sub.id)}
                  >
                    {sub.name}
                    {sub.productCount != null && (
                      <span className={styles['sub-count']}>({sub.productCount})</span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className={styles['filter-group']}>
              <h3>Categories</h3>
              {categories.filter(c => c.isActive !== false && !c.parentId).map(cat => (
                <Link key={cat.id} to={`/category/${cat.slug || cat.id}`} className={styles['sub-link']}>
                  {cat.name}
                  {cat.productCount != null && (
                    <span className={styles['sub-count']}>({cat.productCount})</span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </aside>

        <div>
          <div className={styles.toolbar}>
            <span className={styles['toolbar-count']}>
              Showing {products.length} of {total}
            </span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A-Z</option>
            </select>
          </div>

          {(() => {
            if (loading) return <div className="loading-spinner" />;
            if (products.length === 0) {
              return (
                <div className={styles.empty}>
                  <h2>No products found</h2>
                  <p>Try adjusting your search or filters.</p>
                </div>
              );
            }
            return (
            <>
              <div className={styles['products-grid']}>
                {products.map(p => <ProductCard key={p.id} product={p} />)}
              </div>

              {totalPages > 1 && (
                <div className={styles.pagination}>
                  <button disabled={page <= 1} onClick={() => setPage(page - 1)}>←</button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).slice(
                    Math.max(0, page - 3),
                    page + 2
                  ).map(p => (
                    <button key={p} className={p === page ? styles.active : ''} onClick={() => setPage(p)}>
                      {p}
                    </button>
                  ))}
                  <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>→</button>
                </div>
              )}
            </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
