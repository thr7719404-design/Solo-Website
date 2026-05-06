import { useState, useEffect } from 'react';
import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import styles from './Admin.module.css';

type Theme = 'dark' | 'light';

function useAdminTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('admin-theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  useEffect(() => {
    localStorage.setItem('admin-theme', theme);
  }, [theme]);

  const toggle = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  return { theme, toggle };
}

export default function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();
  const { theme, toggle } = useAdminTheme();

  if (loading) return <div className="loading-spinner" />;
  if (!user || !isAdmin) return <Navigate to="/login" replace />;

  return (
    <div className={styles['admin-shell']} data-theme={theme}>
      <aside className={styles['admin-sidebar']}>
        <div className={styles['admin-logo']}><a href="/">SOLO</a> Admin</div>
        <ul className={styles['admin-nav']}>
          <li><NavLink to="/admin" end className={({ isActive }) => isActive ? styles.active : ''}>Dashboard</NavLink></li>
          <li><NavLink to="/admin/analytics" className={({ isActive }) => isActive ? styles.active : ''}>Analytics</NavLink></li>

          <li className={styles['admin-nav-group']}>Catalog</li>
          <li><NavLink to="/admin/products" className={({ isActive }) => isActive ? styles.active : ''}>Products</NavLink></li>
          <li><NavLink to="/admin/product-groups" className={({ isActive }) => isActive ? styles.active : ''}>Product Groups</NavLink></li>
          <li><NavLink to="/admin/categories" className={({ isActive }) => isActive ? styles.active : ''}>Categories</NavLink></li>
          <li><NavLink to="/admin/brands" className={({ isActive }) => isActive ? styles.active : ''}>Brands</NavLink></li>

          <li className={styles['admin-nav-group']}>Sales</li>
          <li><NavLink to="/admin/orders" className={({ isActive }) => isActive ? styles.active : ''}>Orders</NavLink></li>
          <li><NavLink to="/admin/bulk-orders" className={({ isActive }) => isActive ? styles.active : ''}>Bulk Orders</NavLink></li>
          <li><NavLink to="/admin/returns" className={({ isActive }) => isActive ? styles.active : ''}>Returns</NavLink></li>
          <li><NavLink to="/admin/customers" className={({ isActive }) => isActive ? styles.active : ''}>Customers</NavLink></li>

          <li className={styles['admin-nav-group']}>Content</li>
          <li><NavLink to="/admin/banners" className={({ isActive }) => isActive ? styles.active : ''}>Banners</NavLink></li>
  <li><NavLink to="/admin/announcements" className={({ isActive }) => isActive ? styles.active : ''}>Announcements</NavLink></li>
  <li><NavLink to="/admin/navigation" className={({ isActive }) => isActive ? styles.active : ''}>Navigation</NavLink></li>

          <li className={styles['admin-nav-group']}>Settings</li>
          <li><NavLink to="/admin/promo-codes" className={({ isActive }) => isActive ? styles.active : ''}>Promo Codes</NavLink></li>
          <li><NavLink to="/admin/loyalty" className={({ isActive }) => isActive ? styles.active : ''}>Loyalty Program</NavLink></li>
          <li><NavLink to="/admin/vat" className={({ isActive }) => isActive ? styles.active : ''}>VAT</NavLink></li>
          <li><NavLink to="/admin/shipping" className={({ isActive }) => isActive ? styles.active : ''}>Shipping</NavLink></li>
          <li><NavLink to="/admin/payments" className={({ isActive }) => isActive ? styles.active : ''}>Payments</NavLink></li>
        </ul>
        <div className={styles['theme-toggle-wrap']}>
          <button className={styles['theme-toggle']} onClick={toggle} type="button">
            <span>{theme === 'dark' ? '🌙' : '☀️'}</span>
            <div className={styles['theme-toggle-track']} data-on={String(theme === 'light')}>
              <div className={styles['theme-toggle-knob']} />
            </div>
            <span>{theme === 'dark' ? 'Dark' : 'Light'}</span>
          </button>
        </div>
      </aside>
      <div className={styles['admin-main']}>
        <Outlet />
      </div>
    </div>
  );
}
