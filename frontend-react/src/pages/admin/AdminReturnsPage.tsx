import { useState, useEffect, useCallback } from 'react';
import { adminReturnsApi } from '@/api/returns';
import styles from './Admin.module.css';

const RETURN_PIPELINE = ['REQUESTED', 'APPROVED', 'PICKED_UP', 'QC', 'CLOSED'] as const;
const RETURN_PIPELINE_IDX: Record<string, number> = Object.fromEntries(RETURN_PIPELINE.map((s, i) => [s, i]));
const RETURN_STEP_LABELS: Record<string, string> = {
  REQUESTED: 'Requested',
  APPROVED: 'Approved',
  PICKED_UP: 'Picked Up',
  QC: 'QC',
  CLOSED: 'Closed',
};

const STATUS_FLOW: Record<string, string[]> = {
  REQUESTED: ['APPROVED', 'REJECTED'],
  APPROVED: ['PICKED_UP'],
  PICKED_UP: ['QC'],
  QC: ['CLOSED'],
};
const REFUND_METHODS = ['ORIGINAL_PAYMENT', 'STORE_CREDIT', 'LOYALTY_CASH'];

const tagClass = (s: string) => {
  if (s === 'CLOSED') return 'table-tag-green';
  if (s === 'REJECTED' || s === 'CANCELLED') return 'table-tag-red';
  if (s === 'APPROVED' || s === 'PICKED_UP') return 'table-tag-blue';
  if (s === 'QC') return 'table-tag-violet';
  return 'table-tag-yellow';
};

export default function AdminReturnsPage() {
  const [returns, setReturns] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState({ status: '', refundMethod: '', refundAmount: '', adminNotes: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    adminReturnsApi.getAll({ status: filter || undefined, search: search || undefined })
      .then(r => setReturns(r.data ?? r)).catch(() => {});
    adminReturnsApi.getStats().then(setStats).catch(() => {});
  }, [filter, search]);

  useEffect(load, [load]);

  const openDetail = async (id: string) => {
    const detail = await adminReturnsApi.getById(id);
    setSelected(detail);
    setForm({ status: '', refundMethod: detail.refundMethod ?? '', refundAmount: detail.refundAmount ?? '', adminNotes: detail.adminNotes ?? '' });
    setDrawerOpen(true);
  };

  const save = async () => {
    if (!selected || !form.status) return;
    setSaving(true);
    try {
      await adminReturnsApi.update(selected.id, {
        status: form.status,
        refundMethod: form.refundMethod || undefined,
        refundAmount: form.refundAmount ? Number(form.refundAmount) : undefined,
        adminNotes: form.adminNotes || undefined,
      });
      setDrawerOpen(false);
      load();
    } catch { /* */ }
    setSaving(false);
  };

  const statCards = stats ? [
    { label: 'Pending', value: stats.requested ?? 0, color: 'accent' },
    { label: 'Approved', value: stats.approved ?? 0, color: 'blue' },
    { label: 'Picked Up', value: stats.pickedUp ?? 0, color: 'violet' },
    { label: 'QC', value: stats.qc ?? 0, color: 'violet' },
    { label: 'Closed', value: stats.closed ?? 0, color: 'emerald' },
    { label: 'Rejected', value: stats.rejected ?? 0, color: 'rose' },
  ] : [];

  const statuses = ['', 'REQUESTED', 'APPROVED', 'PICKED_UP', 'QC', 'CLOSED', 'REJECTED', 'CANCELLED'];
  const nextStatuses = selected ? (STATUS_FLOW[selected.status] ?? []) : [];

  return (
    <>
      <div className={styles['header-v2']}>
        <div>
          <h1>Returns</h1>
          <span className={styles['header-v2-sub']}>Process return requests and refunds</span>
        </div>
        <span className={styles['count-chip']}>{returns.length} returns</span>
      </div>
      <div className={styles['admin-body']}>

        {/* Stats */}
        {stats && (
          <div className={styles['stats-grid-5']}>
            {statCards.map(c => (
              <div key={c.label} className={`${styles['stat-card']} ${styles['stat-card-' + c.color]}`}>
                <div className={styles['stat-label']}>{c.label}</div>
                <div className={styles['stat-value']}>{c.value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Toolbar */}
        <div className={styles['toolbar-v2']}>
          <div className={styles['search-box']}>
            <span className={styles['search-icon']}>🔍</span>
            <input placeholder="Search returns..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className={styles['filter-pills']}>
            {statuses.map(st => (
              <button key={st} className={`${styles['filter-pill']} ${filter === st ? styles['filter-pill-active'] : ''}`}
                onClick={() => setFilter(st)}>{st || 'All'}</button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className={styles['table-v2-wrap']}>
          <table className={styles['table-v2']}>
            <thead>
              <tr><th>Return #</th><th>Order #</th><th>Customer</th><th>Reason</th><th>Status</th><th>Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {returns.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>No returns found</td></tr>
              ) : (
                returns.map((r: any) => (
                  <tr key={r.id}>
                    <td className={styles['table-name']}>#{r.returnNumber ?? r.id?.slice(0,8)}</td>
                    <td>#{r.order?.orderNumber ?? '—'}</td>
                    <td>{r.order?.user?.firstName ?? ''} {r.order?.user?.lastName ?? ''}</td>
                    <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.reason}</td>
                    <td><span className={`${styles['table-tag']} ${styles[tagClass(r.status)]}`}>{r.status}</span></td>
                    <td style={{ color: 'var(--admin-text-dim)' }}>{new Date(r.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className={styles['table-actions']}>
                        <button className={styles['table-action-btn']} onClick={() => openDetail(r.id)}>👁</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drawer */}
      {drawerOpen && (
        <>
          <button type="button" aria-label="Close" className={styles['drawer-backdrop']} onClick={() => setDrawerOpen(false)} />
          <div className={styles['drawer']}>
            <div className={styles['drawer-header']}>
              <h2>Return #{selected?.returnNumber ?? selected?.id?.slice(0,8)}</h2>
              <button className={styles['drawer-close']} onClick={() => setDrawerOpen(false)}>✕</button>
            </div>
            <div className={styles['drawer-body']}>
              {selected && (
                <>
                  {/* Info */}
                  <div className={styles['preview-box']}>
                    <div className={styles['preview-row']}>
                      <span className={styles['preview-row-label']}>Status</span>
                      <span className={`${styles['table-tag']} ${styles[tagClass(selected.status)]}`}>{selected.status}</span>
                    </div>
                    <div className={styles['preview-row']}>
                      <span className={styles['preview-row-label']}>Order</span>
                      <span>#{selected.order?.orderNumber}</span>
                    </div>
                    <div className={styles['preview-row']}>
                      <span className={styles['preview-row-label']}>Customer</span>
                      <span>{selected.order?.user?.firstName} {selected.order?.user?.lastName}</span>
                    </div>
                    <div className={styles['preview-row']}>
                      <span className={styles['preview-row-label']}>Reason</span>
                      <span>{selected.reason}</span>
                    </div>
                    {selected.refundAmount && (
                      <div className={`${styles['preview-row']} ${styles['preview-row-total']}`}>
                        <span className={styles['preview-row-label']}>Refund Amount</span>
                        <span>AED {Number(selected.refundAmount).toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  {/* Return Status Pipeline */}
                  {selected.status !== 'REJECTED' && selected.status !== 'CANCELLED' && (
                    <div style={{ margin: '16px 0', padding: '16px', background: 'var(--admin-bg-card, #fff)', borderRadius: 12, border: '1px solid var(--admin-border, #e5e7eb)' }}>
                      <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: 'var(--admin-text)' }}>Return Progress</h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 0, position: 'relative' }}>
                        {RETURN_PIPELINE.map((step, i) => {
                          const currentIdx = RETURN_PIPELINE_IDX[selected.status] ?? -1;
                          const isPast = i < currentIdx;
                          const isActive = i === currentIdx;
                          let bg: string;
                          if (isPast) bg = '#059669';
                          else if (isActive) bg = '#B8860B';
                          else bg = '#e5e7eb';
                          return (
                            <div key={step} style={{ display: 'flex', alignItems: 'center', flex: i < RETURN_PIPELINE.length - 1 ? 1 : 'none' }}>
                              <div style={{
                                width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 11, fontWeight: 600, flexShrink: 0,
                                background: bg,
                                color: isPast || isActive ? '#fff' : '#9ca3af',
                                boxShadow: isActive ? '0 0 0 3px rgba(184,134,11,0.2)' : 'none',
                              }}>
                                {isPast ? '✓' : i + 1}
                              </div>
                              {i < RETURN_PIPELINE.length - 1 && (
                                <div style={{
                                  flex: 1, height: 3, borderRadius: 2, margin: '0 2px',
                                  background: isPast ? '#059669' : '#e5e7eb',
                                }} />
                              )}
                            </div>
                          );
                        })}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                        {RETURN_PIPELINE.map((step, i) => {
                          const currentIdx = RETURN_PIPELINE_IDX[selected.status] ?? -1;
                          const isPast = i < currentIdx;
                          const isActive = i === currentIdx;
                          let labelColor: string;
                          if (isPast) labelColor = '#059669';
                          else if (isActive) labelColor = '#B8860B';
                          else labelColor = '#9ca3af';
                          return (
                            <span key={step} style={{
                              fontSize: 9, textAlign: 'center', width: `${100 / RETURN_PIPELINE.length}%`,
                              color: labelColor,
                              fontWeight: isActive ? 600 : 400,
                            }}>
                              {RETURN_STEP_LABELS[step]}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  {(selected.status === 'REJECTED' || selected.status === 'CANCELLED') && (
                    <div style={{ margin: '16px 0', padding: '12px 16px', borderRadius: 12, background: selected.status === 'REJECTED' ? '#fef2f2' : '#f3f4f6', border: `1px solid ${selected.status === 'REJECTED' ? '#fecaca' : '#e5e7eb'}`, display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontSize: 18 }}>{selected.status === 'REJECTED' ? '❌' : '🚫'}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: selected.status === 'REJECTED' ? '#dc2626' : '#6b7280' }}>
                        Return {selected.status === 'REJECTED' ? 'Rejected' : 'Cancelled'}
                      </span>
                    </div>
                  )}

                  {/* Items */}
                  {selected.items?.length > 0 && (
                    <div className={styles['glass-panel']} style={{ marginTop: 16 }}>
                      <div className={styles['glass-panel-header']}><h3>Items</h3></div>
                      <table className={styles['table-v2']}>
                        <thead><tr><th>Product</th><th>Qty</th><th>Condition</th></tr></thead>
                        <tbody>
                          {selected.items.map((it: any) => (
                            <tr key={it.id}>
                              <td>{it.product?.name ?? 'Product'}</td>
                              <td>{it.quantity}</td>
                              <td>{it.condition ?? '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Update Form */}
                  {nextStatuses.length > 0 && (
                    <div style={{ marginTop: 20 }}>
                      <h3 style={{ marginBottom: 12, color: 'var(--admin-text)' }}>Update Return</h3>
                      <div className={styles['field']}>
                        <label htmlFor="next-status">Next Status</label>
                        <select id="next-status" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                          <option value="">Select status...</option>
                          {nextStatuses.map(ns => <option key={ns} value={ns}>{ns}</option>)}
                        </select>
                      </div>
                      <div className={styles['field']}>
                        <label htmlFor="refund-method">Refund Method</label>
                        <select id="refund-method" value={form.refundMethod} onChange={e => setForm({ ...form, refundMethod: e.target.value })}>
                          <option value="">Select...</option>
                          {REFUND_METHODS.map(m => <option key={m} value={m}>{m.replaceAll(/_/g, ' ')}</option>)}
                        </select>
                      </div>
                      <div className={styles['field']}>
                        <label htmlFor="refund-amount-aed">Refund Amount (AED)</label>
                        <input id="refund-amount-aed" type="number" value={form.refundAmount} onChange={e => setForm({ ...form, refundAmount: e.target.value })} />
                      </div>
                      <div className={styles['field']}>
                        <label htmlFor="admin-notes">Admin Notes</label>
                        <textarea id="admin-notes" rows={3} value={form.adminNotes} onChange={e => setForm({ ...form, adminNotes: e.target.value })} />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            {nextStatuses.length > 0 && (
              <div className={styles['drawer-footer']}>
                <button className={styles['btn-secondary']} onClick={() => setDrawerOpen(false)}>Cancel</button>
                <button className={styles['btn-primary']} disabled={saving || !form.status} onClick={save}>
                  {saving ? 'Saving...' : 'Update Return'}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
