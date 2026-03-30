import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { useCatalog } from '../../contexts/CatalogContext';
import styles from './Header.module.css';

export default function Header() {
  const { isAuthenticated, isAdmin, user, logout } = useAuth();
  const { itemCount } = useCart();
  const { categories } = useCatalog();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className={styles.header}>
      <div className={styles['header-top']}>
        Free shipping on orders over $75 · Free returns
      </div>
      <div className={styles['header-main']}>
        <button className={styles['mobile-menu-btn']} onClick={() => setMenuOpen(!menuOpen)}>
          ☰
        </button>
        <div className={styles['header-logo']}>
          <Link to="/">SOLO</Link>
        </div>
        <form className={styles['header-search']} onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button type="submit">🔍</button>
        </form>
        <div className={styles['header-actions']}>
          {isAuthenticated ? (
            <>
              <Link to="/account">
                {user?.firstName || 'Account'}
              </Link>
              {isAdmin && <Link to="/admin">Admin</Link>}
              <button onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <Link to="/login">Sign In</Link>
          )}
          <Link to="/favorites">♡</Link>
          <Link to="/cart" style={{ position: 'relative' }}>
            🛒
            {itemCount > 0 && <span className={styles['cart-count']}>{itemCount}</span>}
          </Link>
        </div>
      </div>
      <nav className={`${styles['header-nav']} ${menuOpen ? styles.open : ''}`}>
        <ul>
          <li><Link to="/" className={location.pathname === '/' ? styles.active : ''}>Home</Link></li>
          {categories.filter(c => c.isActive !== false).slice(0, 6).map(cat => (
            <li key={cat.id}>
              <Link
                to={`/category/${cat.slug || cat.id}`}
                className={location.pathname.includes(`/category/${cat.slug || cat.id}`) ? styles.active : ''}
              >
                {cat.name}
              </Link>
            </li>
          ))}
          <li><Link to="/new-arrivals">New Arrivals</Link></li>
          <li><Link to="/best-sellers">Best Sellers</Link></li>
        </ul>
      </nav>
    </header>
  );
}
