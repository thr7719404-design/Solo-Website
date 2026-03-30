import { NavLink, Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import styles from './Admin.module.css';

export default function AdminLayout() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) return <div className="loading-spinner" />;
  if (!user || !isAdmin) return <Navigate to="/login" replace />;

  return (
    <div className={styles['admin-shell']}>
      <aside className={styles['admin-sidebar']}>
        <div className={styles['admin-logo']}><a href="/">SOLO</a> Admin</div>
        <ul className={styles['admin-nav']}>
          <li><NavLink to="/admin" end className={({ isActive }) => isActive ? styles.active : ''}>Dashboard</NavLink></li>

          <li className={styles['admin-nav-group']}>Catalog</li>
          <li><NavLink to="/admin/products" className={({ isActive }) => isActive ? styles.active : ''}>Products</NavLink></li>
          <li><NavLink to="/admin/categories" className={({ isActive }) => isActive ? styles.active : ''}>Categories</NavLink></li>
          <li><NavLink to="/admin/brands" className={({ isActive }) => isActive ? styles.active : ''}>Brands</NavLink></li>

          <li className={styles['admin-nav-group']}>Sales</li>
          <li><NavLink to="/admin/orders" className={({ isActive }) => isActive ? styles.active : ''}>Orders</NavLink></li>
          <li><NavLink to="/admin/returns" className={({ isActive }) => isActive ? styles.active : ''}>Returns</NavLink></li>
          <li><NavLink to="/admin/customers" className={({ isActive }) => isActive ? styles.active : ''}>Customers</NavLink></li>

          <li className={styles['admin-nav-group']}>Content</li>
          <li><NavLink to="/admin/banners" className={({ isActive }) => isActive ? styles.active : ''}>Banners</NavLink></li>
          <li><NavLink to="/admin/landing-pages" className={({ isActive }) => isActive ? styles.active : ''}>Landing Pages</NavLink></li>

          <li className={styles['admin-nav-group']}>Settings</li>
          <li><NavLink to="/admin/promo-codes" className={({ isActive }) => isActive ? styles.active : ''}>Promo Codes</NavLink></li>
          <li><NavLink to="/admin/loyalty" className={({ isActive }) => isActive ? styles.active : ''}>Loyalty Program</NavLink></li>
          <li><NavLink to="/admin/vat" className={({ isActive }) => isActive ? styles.active : ''}>VAT</NavLink></li>
        </ul>
      </aside>
      <div className={styles['admin-main']}>
        <Outlet />
      </div>
    </div>
  );
}
