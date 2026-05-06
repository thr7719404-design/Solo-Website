import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin';
import { downloadOrderInvoice } from '@/api/invoices';
import styles from './Admin.module.css';

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loadError, setLoadError] = useState<string | null>(null);
  const limit = 15;

  useEffect(() => {
    setLoadError(null);
    adminApi.getOrders({ page, limit, search: search || undefined, status: statusFilter || undefined })
      .then(r => { setOrders(r.items ?? []); setTotal(r.total ?? 0); })
      .catch((err: any) => {
        const status = err?.response?.status;
        const msg = err?.response?.data?.message || err?.message || 'Unknown error';
        const statusPart = status ? ' (HTTP ' + status + ')' : '';
        setOrders([]);
        setTotal(0);
        setLoadError(`Failed to load orders${statusPart}: ${msg}`);
        // eslint-disable-next-line no-console
        console.error('[AdminOrdersPage] getOrders failed', err);
      });
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
    const map: Record<string, string> = {
      delivered: 'table-tag-green',
      shipped: 'table-tag-violet',
      processing: 'table-tag-blue',
      cancelled: 'table-tag-red',
    };
    return map[sl] ?? 'table-tag-yellow';
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

        {loadError && (
          <div
            role="alert"
            style={{
              background: 'rgba(220, 38, 38, 0.08)',
              border: '1px solid rgba(220, 38, 38, 0.4)',
              color: '#b91c1c',
              padding: '12px 16px',
              borderRadius: 8,
              marginBottom: 16,
              fontSize: 14,
            }}
          >
            {loadError}
          </div>
        )}

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
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th style={{ width: 80 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>No orders found</td></tr>
              ) : (
                orders.map(o => (
                  <tr key={o.id}>
                    <td><Link to={`/admin/orders/${o.id}`} className={styles['table-name']}>#{o.orderNumber}</Link></td>
                    <td>{o.customer?.name ?? `${o.user?.firstName ?? ''} ${o.user?.lastName ?? ''}`}</td>
                    <td>{o.itemCount ?? o.items?.length ?? '—'}</td>
                    <td style={{ fontWeight: 600 }}>AED {Number(o.total).toFixed(2)}</td>
                    <td><span className={`${styles['table-tag']} ${styles[tagClass(o.status)]}`}>{o.status}</span></td>
                    <td style={{ color: 'var(--admin-text-dim)' }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className={styles['table-actions']}>
                        <Link to={`/admin/orders/${o.id}`} className={styles['table-action-btn']} title="View">👁</Link>
                        <button
                          type="button"
                          onClick={() => downloadOrderInvoice(o.id, o.orderNumber).catch(() => toast.error('Failed to download invoice'))}
                          className={styles['table-action-btn']}
                          title="Download Invoice"
                        >📄</button>
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
