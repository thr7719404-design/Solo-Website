import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { ProductDto } from '../types';
import { favoritesApi } from '../api/favorites';
import { useAuth } from '../contexts/AuthContext';
import ProductCard from '../components/porto/ProductCard';

export default function FavoritesPage() {
  const { isAuthenticated } = useAuth();
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) { setLoading(false); return; }
    favoritesApi.getAll()
      .then(favs => setProducts(favs.map(f => f.product).filter(Boolean) as ProductDto[]))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2>Sign in to view your wishlist</h2>
        <Link to="/login" className="btn btn-primary" style={{ marginTop: 16 }}>Sign In</Link>
      </div>
    );
  }

  if (loading) return <div className="loading-spinner" />;

  return (
    <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: '24px 20px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 24 }}>
        My Wishlist ({products.length})
      </h1>
      {products.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--color-text-secondary)' }}>
          <p>Your wishlist is empty.</p>
          <Link to="/" className="btn btn-outline" style={{ marginTop: 16 }}>Browse Products</Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
