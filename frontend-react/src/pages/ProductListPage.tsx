import { useEffect, useState, useCallback } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import type { ProductDto } from '../types';
import { productsApi, type ProductFilters } from '../api/products';
import { useCatalog } from '../contexts/CatalogContext';
import ProductCard from '../components/porto/ProductCard';
import styles from './ProductListPage.module.css';

const COLLECTION_MAP: Record<string, { title: string; filter: Partial<ProductFilters> }> = {
  'new-arrivals': { title: 'New Arrivals', filter: { isNew: true } },
  'best-sellers': { title: 'Best Sellers', filter: { isBestSeller: true } },
  'featured': { title: 'Featured', filter: { isFeatured: true } },
  'sale': { title: 'Sale', filter: {} },
};

export default function ProductListPage() {
  const { slug, id: brandId } = useParams();
  const [searchParams] = useSearchParams();
  const { categories } = useCatalog();

  const [products, setProducts] = useState<ProductDto[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const [loading, setLoading] = useState(true);

  const collection = searchParams.get('collection') || (window.location.pathname.split('/').pop() || '');
  const searchQuery = searchParams.get('q') || '';
  const limit = 12;

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
    const cat = categories.find(c => c.slug === slug || c.id === slug);
    if (cat) {
      title = cat.name;
      baseFilters.categoryId = cat.id;
    }
  } else if (brandId) {
    baseFilters.brandId = brandId;
    title = 'Brand Products';
  }

  const loadProducts = useCallback(async () => {
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
  }, [page, sortBy, slug, collection, searchQuery, brandId]);

  useEffect(() => {
    setPage(1);
  }, [slug, collection, searchQuery, brandId]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className={styles['product-list-page']}>
      <div className={styles['page-header']}>
        <h1>{title}</h1>
        <p>{total} product{total !== 1 ? 's' : ''}</p>
      </div>

      <div className={styles['list-layout']}>
        <aside className={styles.sidebar}>
          <div className={styles['filter-group']}>
            <h3>Categories</h3>
            {categories.filter(c => c.isActive !== false).map(cat => (
              <label key={cat.id}>
                <a href={`/category/${cat.slug || cat.id}`}>{cat.name}</a>
                {cat.productCount != null && <span>({cat.productCount})</span>}
              </label>
            ))}
          </div>
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

          {loading ? (
            <div className="loading-spinner" />
          ) : products.length === 0 ? (
            <div className={styles.empty}>
              <h2>No products found</h2>
              <p>Try adjusting your search or filters.</p>
            </div>
          ) : (
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
          )}
        </div>
      </div>
    </div>
  );
}
