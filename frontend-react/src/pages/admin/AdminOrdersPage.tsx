import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '@/api/admin';
import type { OrderDto } from '@/types';
import styles from './Admin.module.css';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<OrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  useEffect(() => {
    setLoading(true);
    adminApi.getOrders({ page, limit }).then(r => {
      setOrders(r.items ?? []);
      setTotal(r.total ?? 0);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [page]);

  return (
    <>
      <div className={styles['admin-header']}><h1>Orders</h1></div>
      <div className={styles['admin-body']}>
        {loading ? <div className="loading-spinner" /> : (
          <div className={styles['admin-table-wrap']}>
            <table className={styles['admin-table']}>
              <thead>
                <tr><th>Order #</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th>Date</th></tr>
              </thead>
              <tbody>
                {orders.map(o => (
                  <tr key={o.id}>
                    <td><Link to={`/admin/orders/${o.id}`}>{o.orderNumber ?? o.id.slice(0, 8)}</Link></td>
                    <td>{(o as any).customer?.email ?? (o as any).customerEmail ?? '—'}</td>
                    <td>{o.items?.length ?? 0}</td>
                    <td>${Number(o.total).toFixed(2)}</td>
                    <td>{o.status}</td>
                    <td>{new Date(o.createdAt).toLocaleDateString()}</td>
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
