import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsApi } from '@/api/products';
import type { ProductDto } from '@/types';
import styles from './Admin.module.css';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    productsApi.getAll({ page, limit, search: search || undefined })
      .then(r => {
        setProducts(r.items ?? []);
        setTotal(r.total ?? 0);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [page, search]);

  const remove = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    await productsApi.delete(id);
    setProducts(prev => prev.filter(p => p.id !== id));
  };

  return (
    <>
      <div className={styles['admin-header']}>
        <h1>Products</h1>
        <Link to="/admin/products/new" className="btn btn-accent">+ Add Product</Link>
      </div>
      <div className={styles['admin-body']}>
        <div className={styles['admin-toolbar']}>
          <input
            type="search"
            placeholder="Search products…"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
          <span style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{total} products</span>
        </div>
        {loading ? <div className="loading-spinner" /> : (
          <div className={styles['admin-table-wrap']}>
            <table className={styles['admin-table']}>
              <thead>
                <tr><th>Image</th><th>Name</th><th>SKU</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id}>
                    <td><img src={p.images?.[0]?.url ?? '/placeholder.svg'} alt="" /></td>
                    <td><Link to={`/admin/products/${p.id}`}>{p.name}</Link></td>
                    <td>{p.sku ?? '—'}</td>
                    <td>${Number(p.price).toFixed(2)}</td>
                    <td>{p.stockQuantity ?? '—'}</td>
                    <td>{p.status ?? 'active'}</td>
                    <td>
                      <Link to={`/admin/products/${p.id}`} style={{ marginRight: 8, fontSize: 13, color: 'var(--color-accent)' }}>Edit</Link>
                      <button onClick={() => remove(p.id)} style={{ fontSize: 13, color: '#991b1b', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {total > limit && (
          <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
            <button className="btn btn-outline" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</button>
            <span style={{ padding: '8px 12px', fontSize: 14 }}>Page {page} of {Math.ceil(total / limit)}</span>
            <button className="btn btn-outline" disabled={page >= Math.ceil(total / limit)} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        )}
      </div>
    </>
  );
}
