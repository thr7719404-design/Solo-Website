import { useState, useEffect, useCallback } from 'react';
import { bulkOrdersApi, BulkOrderRequest } from '@/api/bulkOrders';
import styles from './Admin.module.css';

const STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  IN_PROGRESS: 'In Progress',
  CLOSED: 'Closed',
};

const tagClass = (s: string) => {
  const map: Record<string, string> = {
    CLOSED: 'table-tag-green',
    IN_PROGRESS: 'table-tag-blue',
  };
  return map[s] ?? 'table-tag-yellow';
};

export default function AdminBulkOrdersPage() {
  const [orders, setOrders] = useState<BulkOrderRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  // Drawer state
  const [selected, setSelected] = useState<BulkOrderRequest | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState({ status: '', adminNotes: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await bulkOrdersApi.getAll({ page, status: filter || undefined });
      setOrders(res.items);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch { /* ignore */ }
    setLoading(false);
  }, [page, filter]);

  useEffect(() => { load(); }, [load]);

  const openDetail = (order: BulkOrderRequest) => {
    setSelected(order);
    setForm({ status: order.status, adminNotes: order.adminNotes || '' });
    setDrawerOpen(true);
  };

  const save = async () => {
    if (!selected || !form.status) return;
    setSaving(true);
    try {
      const updated = await bulkOrdersApi.updateStatus(
        selected.id,
        form.status as 'NEW' | 'IN_PROGRESS' | 'CLOSED',
        form.adminNotes || undefined,
      );
      setSelected(updated);
      setOrders(prev => prev.map(o => o.id === updated.id ? updated : o));
    } catch { /* ignore */ }
    setSaving(false);
  };

  const closeDrawer = () => { setDrawerOpen(false); setSelected(null); };

  // Stats
  const newCount = orders.filter(o => o.status === 'NEW').length;
  const inProgressCount = orders.filter(o => o.status === 'IN_PROGRESS').length;
  const closedCount = orders.filter(o => o.status === 'CLOSED').length;
  const requestLabel = total === 1 ? 'request' : 'requests';

  return (
    <div style={{ padding: '24px 32px' }}>
      {/* Header */}
      <div className={styles['admin-header']}>
        <h1>Bulk Orders</h1>
        <span style={{ fontSize: 14, opacity: 0.6 }}>{total} total {requestLabel}</span>
      </div>

      {/* Stats */}
      <div className={`${styles['stats-grid']} ${styles['stats-grid-3']}`} style={{ marginBottom: 24 }}>
        <div className={`${styles['stat-card']} ${styles['stat-card-accent']}`}>
          <div className={styles['stat-label']}>New</div>
          <div className={styles['stat-value']}>{newCount}</div>
        </div>
        <div className={`${styles['stat-card']} ${styles['stat-card-blue']}`}>
          <div className={styles['stat-label']}>In Progress</div>
          <div className={styles['stat-value']}>{inProgressCount}</div>
        </div>
        <div className={`${styles['stat-card']} ${styles['stat-card-emerald']}`}>
          <div className={styles['stat-label']}>Closed</div>
          <div className={styles['stat-value']}>{closedCount}</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {['', 'NEW', 'IN_PROGRESS', 'CLOSED'].map(s => (
          <button key={s} onClick={() => { setFilter(s); setPage(1); }}
            style={{
              padding: '6px 16px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)',
              background: filter === s ? 'var(--admin-accent)' : 'var(--admin-glass)',
              color: filter === s ? '#000' : 'var(--admin-text-dim)',
              cursor: 'pointer', fontSize: 13, fontWeight: 500,
            }}>
            {s ? STATUS_LABELS[s] : 'All'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className={styles['admin-table-wrap']}>
        <table className={styles['admin-table']}>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Date</th>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Items</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              if (loading) return <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32 }}>Loading...</td></tr>;
              if (orders.length === 0) return <tr><td colSpan={8} style={{ textAlign: 'center', padding: 32, opacity: 0.5 }}>No bulk order requests</td></tr>;
              return orders.map(order => (
              <tr key={order.id}>
                <td style={{ fontWeight: 700, color: 'var(--admin-accent)' }}>
                  BO-{String(order.orderNumber).padStart(4, '0')}
                </td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td style={{ fontWeight: 500 }}>{order.name}</td>
                <td>{order.email}</td>
                <td>{order.countryCode} {order.phone}</td>
                <td>{order.items.length} product{order.items.length !== 1 ? 's' : ''}</td>
                <td>
                  <span className={`${styles['table-tag']} ${styles[tagClass(order.status)]}`}>
                    {STATUS_LABELS[order.status]}
                  </span>
                </td>
                <td>
                  <button onClick={() => openDetail(order)} style={{
                    background: 'var(--admin-glass)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--admin-accent)', cursor: 'pointer', padding: '4px 12px',
                    borderRadius: 4, fontSize: 12, fontWeight: 500,
                  }}>View</button>
                </td>
              </tr>
            ));
            })()}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
          <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
            style={{ padding: '6px 12px', borderRadius: 4, background: 'var(--admin-glass)', border: 'none', color: 'var(--admin-text)', cursor: 'pointer' }}>
            ← Prev
          </button>
          <span style={{ padding: '6px 12px', opacity: 0.6 }}>Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
            style={{ padding: '6px 12px', borderRadius: 4, background: 'var(--admin-glass)', border: 'none', color: 'var(--admin-text)', cursor: 'pointer' }}>
            Next →
          </button>
        </div>
      )}

      {/* Drawer / Detail Panel */}
      {drawerOpen && selected && (
        <>
          <button type="button" aria-label="Close" className={styles['drawer-backdrop']} onClick={closeDrawer} />
          <aside className={`${styles.drawer} ${styles['drawer-wide']}`}>
            <div className={styles['drawer-header']}>
              <h2>Bulk Order BO-{String(selected.orderNumber).padStart(4, '0')}</h2>
              <button className={styles['drawer-close']} onClick={closeDrawer}>✕</button>
            </div>
            <div className={styles['drawer-body']}>
              {/* Customer info */}
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1 }}>Customer</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div><span style={{ opacity: 0.5, fontSize: 12 }}>Name</span><br />{selected.name}</div>
                  <div><span style={{ opacity: 0.5, fontSize: 12 }}>Email</span><br />{selected.email}</div>
                  <div><span style={{ opacity: 0.5, fontSize: 12 }}>Phone</span><br />{selected.countryCode} {selected.phone}</div>
                  <div><span style={{ opacity: 0.5, fontSize: 12 }}>Submitted</span><br />{new Date(selected.createdAt).toLocaleString()}</div>
                </div>
              </div>

              {/* Products table */}
              <div style={{ marginBottom: 20 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1 }}>Requested Products</h3>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.1)', opacity: 0.5 }}>Product</th>
                      <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.1)', opacity: 0.5 }}>SKU</th>
                      <th style={{ textAlign: 'center', padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.1)', opacity: 0.5 }}>Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selected.items.map((item, i) => (
                      <tr key={`${item.sku ?? item.productName}-${i}`}>
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{item.productName}</td>
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>{item.sku || '-'}</td>
                        <td style={{ padding: '8px 10px', borderBottom: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', fontWeight: 600 }}>{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Status Update */}
              <div style={{ marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1 }}>Update Status</h3>
                <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                  {(['NEW', 'IN_PROGRESS', 'CLOSED'] as const).map(s => (
                    <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))}
                      style={{
                        padding: '8px 16px', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 500,
                        border: form.status === s ? '2px solid var(--admin-accent)' : '1px solid rgba(255,255,255,0.1)',
                        background: form.status === s ? 'var(--admin-accent-glow)' : 'var(--admin-glass)',
                        color: form.status === s ? 'var(--admin-accent)' : 'var(--admin-text-dim)',
                      }}>
                      {STATUS_LABELS[s]}
                    </button>
                  ))}
                </div>
                <label htmlFor="admin-notes" style={{ display: 'block', fontSize: 12, fontWeight: 500, opacity: 0.6, marginBottom: 4 }}>Admin Notes</label>
                <textarea id="admin-notes" value={form.adminNotes} onChange={e => setForm(f => ({ ...f, adminNotes: e.target.value }))}
                  rows={3} style={{
                    width: '100%', boxSizing: 'border-box', padding: '8px 12px', borderRadius: 6,
                    background: 'var(--admin-glass)', border: '1px solid rgba(255,255,255,0.1)',
                    color: 'var(--admin-text)', fontSize: 13, resize: 'vertical',
                  }} placeholder="Internal notes about this request..." />
              </div>
            </div>
            <div className={styles['drawer-footer']}>
              <button onClick={closeDrawer} style={{
                padding: '8px 20px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)',
                background: 'transparent', color: 'var(--admin-text-dim)', cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={save} disabled={saving || form.status === selected.status} style={{
                padding: '8px 20px', borderRadius: 6, border: 'none',
                background: saving ? 'var(--admin-glass)' : 'var(--admin-accent)',
                color: '#000', cursor: saving ? 'not-allowed' : 'pointer', fontWeight: 600,
              }}>
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
