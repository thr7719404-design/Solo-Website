import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '@/api/admin';
import styles from './Admin.module.css';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const limit = 15;

  useEffect(() => {
    adminApi.getOrders({ page, limit, search: search || undefined, status: statusFilter || undefined })
      .then(r => { setOrders(r.items ?? []); setTotal(r.total ?? 0); })
      .catch(() => {});
  }, [page, search, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const statuses = [
    { value: '', label: 'All' },
    { value: 'PENDING', label: 'Pending' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'SHIPPED', label: 'Shipped' },
    { value: 'DELIVERED', label: 'Delivered' },
    { value: 'CANCELLED', label: 'Cancelled' },
  ];

  const tagClass = (s: string) => {
    const sl = s.toLowerCase();
    return sl === 'delivered' ? 'table-tag-green'
    : sl === 'shipped' ? 'table-tag-violet'
    : sl === 'processing' ? 'table-tag-blue'
    : sl === 'cancelled' ? 'table-tag-red'
    : 'table-tag-yellow';
  };

  const formatPaymentMethod = (m?: string | null) => {
    if (!m) return '—';
    if (m === 'CASH_ON_DELIVERY') return 'COD';
    return m
      .toLowerCase()
      .split('_')
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  };

  return (
    <>
      <div className={styles['header-v2']}>
        <div>
          <h1>Orders</h1>
          <span className={styles['header-v2-sub']}>Manage and track all customer orders</span>
        </div>
        <span className={styles['count-chip']}>{total} orders</span>
      </div>
      <div className={styles['admin-body']}>

        {/* Toolbar */}
        <div className={styles['toolbar-v2']}>
          <div className={styles['search-box']}>
            <span className={styles['search-icon']}>🔍</span>
            <input
              placeholder="Search orders..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className={styles['filter-pills']}>
            {statuses.map(st => (
              <button
                key={st.value}
                className={`${styles['filter-pill']} ${statusFilter === st.value ? styles['filter-pill-active'] : ''}`}
                onClick={() => { setStatusFilter(st.value); setPage(1); }}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className={styles['table-v2-wrap']}>
          <table className={styles['table-v2']}>
            <thead>
              <tr>
                <th>Order #</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>City</th>
                <th>Items</th>
                <th>Total</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={10} style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>No orders found</td></tr>
              ) : (
                orders.map(o => (
                  <tr key={o.id}>
                    <td><Link to={`/admin/orders/${o.id}`} className={styles['table-name']}>#{o.orderNumber}</Link></td>
                    <td>{o.customer?.name ?? `${o.user?.firstName ?? ''} ${o.user?.lastName ?? ''}`}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{o.customerPhone ?? o.customer?.phone ?? '—'}</td>
                    <td>{o.shippingCity ?? '—'}</td>
                    <td>{o.itemCount ?? o.items?.length ?? '—'}</td>
                    <td style={{ fontWeight: 600 }}>AED {Number(o.total).toFixed(2)}</td>
                    <td style={{ whiteSpace: 'nowrap' }}>{formatPaymentMethod(o.paymentMethod)}</td>
                    <td><span className={`${styles['table-tag']} ${styles[tagClass(o.status)]}`}>{o.status}</span></td>
                    <td style={{ color: 'var(--admin-text-dim)' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className={styles['table-actions']}>
                        <Link to={`/admin/orders/${o.id}`} className={styles['table-action-btn']} title="View">👁</Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className={styles['pagination']}>
            <button className={styles['page-btn']} onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>← Prev</button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let p: number;
              if (totalPages <= 7) p = i + 1;
              else if (page <= 4) p = i + 1;
              else if (page >= totalPages - 3) p = totalPages - 6 + i;
              else p = page - 3 + i;
              return (
                <button key={p} className={`${styles['page-btn']} ${p === page ? styles['page-btn-active'] : ''}`} onClick={() => setPage(p)}>
                  {p}
                </button>
              );
            })}
            <button className={styles['page-btn']} onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>Next →</button>
          </div>
        )}

      </div>
    </>
  );
}
