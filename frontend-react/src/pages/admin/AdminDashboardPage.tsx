import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '@/api/admin';
import type { DashboardStatsDto, OrderDto } from '@/types';
import styles from './Admin.module.css';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStatsDto | null>(null);
  const [recentOrders, setRecentOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      adminApi.getStats().catch(() => null),
      adminApi.getOrders({ page: 1, limit: 5 }).catch(() => ({ items: [], total: 0 })),
    ]).then(([s, o]) => {
      setStats(s as DashboardStatsDto | null);
      setRecentOrders((o as any)?.items ?? []);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className={styles['admin-body']}><div className="loading-spinner" /></div>;

  return (
    <>
      <div className={styles['admin-header']}><h1>Dashboard</h1></div>
      <div className={styles['admin-body']}>
        <div className={styles['stats-grid']}>
          <div className={styles['stat-card']}>
            <div className={styles['stat-label']}>Total Revenue</div>
            <div className={styles['stat-value']}>${stats?.totalRevenue?.toFixed(2) ?? '0.00'}</div>
          </div>
          <div className={styles['stat-card']}>
            <div className={styles['stat-label']}>Orders</div>
            <div className={styles['stat-value']}>{stats?.totalOrders ?? 0}</div>
          </div>
          <div className={styles['stat-card']}>
            <div className={styles['stat-label']}>Customers</div>
            <div className={styles['stat-value']}>{stats?.totalCustomers ?? 0}</div>
          </div>
          <div className={styles['stat-card']}>
            <div className={styles['stat-label']}>Products</div>
            <div className={styles['stat-value']}>{stats?.totalProducts ?? 0}</div>
          </div>
        </div>

        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Recent Orders</h2>
        <div className={styles['admin-table-wrap']}>
          <table className={styles['admin-table']}>
            <thead>
              <tr><th>Order #</th><th>Customer</th><th>Total</th><th>Status</th><th>Date</th></tr>
            </thead>
            <tbody>
              {recentOrders.length === 0 && <tr><td colSpan={5}>No orders yet.</td></tr>}
              {recentOrders.map(o => (
                <tr key={o.id}>
                  <td><Link to={`/admin/orders/${o.id}`}>{o.orderNumber ?? o.id.slice(0, 8)}</Link></td>
                  <td>{(o as any).customer?.email ?? '—'}</td>
                  <td>${Number(o.total).toFixed(2)}</td>
                  <td>{o.status}</td>
                  <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
