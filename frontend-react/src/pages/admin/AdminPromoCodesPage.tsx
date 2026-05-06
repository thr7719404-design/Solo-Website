import { useState, useEffect, useCallback } from 'react';
import { promoApi } from '@/api/promo';
import styles from './Admin.module.css';

const TYPE_TAG: Record<string, string> = {
  PERCENTAGE: 'table-tag-cyan',
  FIXED_AMOUNT: 'table-tag-green',
  FREE_SHIPPING: 'table-tag-violet',
};

const STATUS_TAG: Record<string, string> = {
  PENDING: 'table-tag-amber',
  PROCESSING: 'table-tag-cyan',
  SHIPPED: 'table-tag-violet',
  DELIVERED: 'table-tag-green',
  CANCELLED: 'table-tag-red',
  REFUNDED: 'table-tag-red',
};

/** Convert a UTC ISO string to local datetime-local format (YYYY-MM-DDTHH:MM) */
const toLocalDT = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function AdminPromoCodesPage() {
  const [promos, setPromos] = useState<any[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    code: '', description: '', type: 'PERCENTAGE', value: '', minOrderAmount: '', maxDiscount: '',
    usageLimit: '', startsAt: '', expiresAt: '',
  });
  const [saving, setSaving] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Usage modal state
  const [usageModal, setUsageModal] = useState<{ open: boolean; promo: any | null; orders: any[]; loading: boolean; totalDiscount: number }>({
    open: false, promo: null, orders: [], loading: false, totalDiscount: 0,
  });

  const load = () => { promoApi.list().then(r => setPromos(r.data ?? [])).catch(() => {}); };
  useEffect(load, []);

  const openNew = () => {
    setEditing(null);
    setForm({ code: '', description: '', type: 'PERCENTAGE', value: '', minOrderAmount: '', maxDiscount: '', usageLimit: '', startsAt: '', expiresAt: '' });
    setDrawerOpen(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      code: p.code, description: p.description ?? '', type: p.type,
      value: String(p.value ?? ''), minOrderAmount: String(p.minOrderAmount ?? ''),
      maxDiscount: String(p.maxDiscount ?? ''), usageLimit: String(p.usageLimit ?? ''),
      startsAt: toLocalDT(p.startsAt), expiresAt: toLocalDT(p.expiresAt),
    });
    setDrawerOpen(true);
  };

  const save = async () => {
    setSaving(true);
    const payload = {
      ...form,
      type: form.type as 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING',
      value: Number(form.value) || 0,
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : new Date().toISOString(),
      expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
    };
    try {
      if (editing) {
        const { code, ...updatePayload } = payload;
        await promoApi.update(editing.id, updatePayload);
      } else await promoApi.create(payload);
      setDrawerOpen(false);
      load();
    } catch { /* */ }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this promo code?')) return;
    await promoApi.remove(id).catch(() => {});
    load();
  };

  const toggleActive = async (p: any) => {
    setTogglingId(p.id);
    try {
      await promoApi.toggleActive(p.id, !p.isActive);
      setPromos(prev => prev.map(x => x.id === p.id ? { ...x, isActive: !x.isActive } : x));
    } catch { /* */ }
    setTogglingId(null);
  };

  const openUsage = useCallback(async (p: any) => {
    setUsageModal({ open: true, promo: p, orders: [], loading: true, totalDiscount: 0 });
    try {
      const res = await promoApi.getOrders(p.id);
      const orders: any[] = res.orders ?? [];
      const totalDiscount = orders.reduce((s: number, o: any) => s + (o.discount ?? 0), 0);
      setUsageModal({ open: true, promo: p, orders, loading: false, totalDiscount });
    } catch {
      setUsageModal(prev => ({ ...prev, loading: false }));
    }
  }, []);

  const activeCount = promos.filter(p => (p.status ?? (p.isActive ? 'ACTIVE' : 'INACTIVE')) === 'ACTIVE').length;
  const totalUses = promos.reduce((s, p) => s + (p.usageCount ?? 0), 0);

  return (
    <>
      <div className={styles['header-v2']}>
        <div>
          <h1>Promo Codes</h1>
          <span className={styles['header-v2-sub']}>Create and manage discount codes</span>
        </div>
        <button className={styles['btn-primary']} onClick={openNew}>+ New Code</button>
      </div>
      <div className={styles['admin-body']}>

        {/* Stats */}
        <div className={styles['stats-grid-3']}>
          <div className={`${styles['stat-card']} ${styles['stat-card-accent']}`}>
            <div className={styles['stat-label']}>Total Codes</div>
            <div className={styles['stat-value']}>{promos.length}</div>
          </div>
          <div className={`${styles['stat-card']} ${styles['stat-card-emerald']}`}>
            <div className={styles['stat-label']}>Active</div>
            <div className={styles['stat-value']}>{activeCount}</div>
          </div>
          <div className={`${styles['stat-card']} ${styles['stat-card-cyan']}`}>
            <div className={styles['stat-label']}>Total Uses</div>
            <div className={styles['stat-value']}>{totalUses}</div>
          </div>
        </div>

        {/* Table */}
        <div className={styles['table-v2-wrap']}>
          <table className={styles['table-v2']}>
            <thead>
              <tr><th>Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Used</th><th>Expires</th><th>Active</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {promos.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>No promo codes yet</td></tr>
              ) : (
                promos.map(p => {
                  const status: string = p.status ?? (p.isActive ? 'ACTIVE' : 'INACTIVE');
                  const expired = status === 'EXPIRED';
                  const exhausted = status === 'EXHAUSTED';
                  return (
                    <tr key={p.id}>
                      <td>
                        <div className={styles['table-name']}>{p.code}</div>
                        {p.description && <div className={styles['table-sub']}>{p.description}</div>}
                      </td>
                      <td><span className={`${styles['table-tag']} ${styles[TYPE_TAG[p.type] ?? 'table-tag-gray']}`}>{p.type?.replace('_', ' ')}</span></td>
                      <td style={{ fontWeight: 600 }}>{(() => {
                        if (p.type === 'PERCENTAGE') return `${p.value}%`;
                        if (p.type === 'FREE_SHIPPING') return '—';
                        return `AED ${p.value}`;
                      })()}</td>
                      <td>{p.minOrderAmount ? `AED ${p.minOrderAmount}` : '—'}</td>
                      <td>
                        <span style={{ color: exhausted ? 'var(--admin-rose)' : undefined, fontWeight: exhausted ? 600 : undefined }}>
                          {p.usageCount ?? 0}{p.usageLimit ? ` / ${p.usageLimit}` : ''}
                        </span>
                        {exhausted && <span className={`${styles['table-tag']} ${styles['table-tag-red']}`} style={{ marginLeft: 6 }}>Used Up</span>}
                      </td>
                      <td>
                        {p.expiresAt ? (
                          <span className={`${styles['table-tag']} ${expired ? styles['table-tag-red'] : styles['table-tag-green']}`}>
                            {expired ? 'Expired' : new Date(p.expiresAt).toLocaleDateString()}
                          </span>
                        ) : <span style={{ color: 'var(--admin-text-muted)' }}>No expiry</span>}
                      </td>
                      <td>
                        {/* Active toggle */}
                        <button
                          onClick={() => toggleActive(p)}
                          disabled={togglingId === p.id}
                          title={p.isActive ? 'Click to deactivate' : 'Click to activate'}
                          style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer',
                            padding: '4px 10px', borderRadius: 20, border: 'none', fontSize: 12, fontWeight: 600,
                            background: p.isActive ? 'var(--admin-emerald, #10b981)' : 'var(--admin-surface-2, #374151)',
                            color: p.isActive ? '#fff' : 'var(--admin-text-muted)',
                            opacity: togglingId === p.id ? 0.6 : 1,
                            transition: 'background 0.2s',
                          }}
                        >
                          <span style={{
                            width: 10, height: 10, borderRadius: '50%',
                            background: p.isActive ? '#fff' : '#6b7280',
                            display: 'inline-block',
                          }} />
                          {p.isActive ? 'ON' : 'OFF'}
                        </button>
                      </td>
                      <td>
                        <div className={styles['table-actions']}>
                          <button
                            className={styles['table-action-btn']}
                            onClick={() => openUsage(p)}
                            title="View orders using this code"
                          >📊</button>
                          <button className={styles['table-action-btn']} onClick={() => openEdit(p)}>✏️</button>
                          <button className={styles['table-action-btn-danger']} onClick={() => remove(p.id)}>🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <>
          <button type="button" aria-label="Close" className={styles['drawer-backdrop']} onClick={() => setDrawerOpen(false)} />
          <div className={styles['drawer']} style={{ maxWidth: 520 }}>
            <div className={styles['drawer-header']}>
              <h2>{editing ? 'Edit Promo Code' : 'New Promo Code'}</h2>
              <button className={styles['drawer-close']} onClick={() => setDrawerOpen(false)}>✕</button>
            </div>
            <div className={styles['drawer-body']}>
              <div className={styles['field-row']}>
                <div className={styles['field']}>
                  <label htmlFor="code">Code</label>
                  <input id="code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. SUMMER20" />
                </div>
                <div className={styles['field']}>
                  <label htmlFor="type">Type</label>
                  <select id="type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED_AMOUNT">Fixed Amount</option>
                    <option value="FREE_SHIPPING">Free Shipping</option>
                  </select>
                </div>
              </div>
              <div className={styles['field']}>
                <label htmlFor="description">Description</label>
                <input id="description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className={styles['field-row-3']}>
                <div className={styles['field']}>
                  <label htmlFor="value">Value</label>
                  <input id="value" type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} />
                </div>
                <div className={styles['field']}>
                  <label htmlFor="min-order">Min Order</label>
                  <input id="min-order" type="number" value={form.minOrderAmount} onChange={e => setForm({ ...form, minOrderAmount: e.target.value })} />
                </div>
                <div className={styles['field']}>
                  <label htmlFor="max-discount">Max Discount</label>
                  <input id="max-discount" type="number" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })} />
                </div>
              </div>
              <div className={styles['field']}>
                <label htmlFor="usage-limit">Usage Limit</label>
                <input id="usage-limit" type="number" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })} placeholder="Leave empty for unlimited" />
              </div>
              <div className={styles['field-row']}>
                <div className={styles['field']}>
                  <label htmlFor="starts-at">Starts At</label>
                  <input id="starts-at" type="datetime-local" value={form.startsAt} onChange={e => setForm({ ...form, startsAt: e.target.value })} />
                </div>
                <div className={styles['field']}>
                  <label htmlFor="expires-at">Expires At</label>
                  <input id="expires-at" type="datetime-local" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} />
                </div>
              </div>
            </div>
            <div className={styles['drawer-footer']}>
              <button className={styles['btn-secondary']} onClick={() => setDrawerOpen(false)}>Cancel</button>
              <button className={styles['btn-primary']} disabled={saving || !form.code} onClick={save}>
                {(() => {
                  if (saving) return 'Saving...';
                  return editing ? 'Update' : 'Create';
                })()}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Usage / Orders Modal */}
      {usageModal.open && (
        <>
          <button
            type="button"
            aria-label="Close"
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 900, border: 'none' }}
            onClick={() => setUsageModal(s => ({ ...s, open: false }))}
          />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
            background: 'var(--admin-surface, #1f2937)', borderRadius: 12, zIndex: 901,
            width: 'min(96vw, 860px)', maxHeight: '85vh', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 60px rgba(0,0,0,0.5)',
          }}>
            {/* Modal header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--admin-border, #374151)' }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>
                  Orders using <span style={{ color: 'var(--admin-accent, #6366f1)' }}>{usageModal.promo?.code}</span>
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--admin-text-muted)' }}>
                  {usageModal.promo?.description}
                </p>
              </div>
              <button
                onClick={() => setUsageModal(s => ({ ...s, open: false }))}
                style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer', color: 'var(--admin-text-muted)', lineHeight: 1 }}
              >✕</button>
            </div>

            {/* Summary bar */}
            {!usageModal.loading && (
              <div style={{ display: 'flex', gap: 24, padding: '14px 24px', borderBottom: '1px solid var(--admin-border, #374151)', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Orders</div>
                  <div style={{ fontSize: 20, fontWeight: 700 }}>{usageModal.orders.length}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Total Discount Given</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--admin-emerald, #10b981)' }}>AED {usageModal.totalDiscount.toFixed(2)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Discount Type</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{usageModal.promo?.type?.replace('_', ' ')}</div>
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', textTransform: 'uppercase', letterSpacing: 1 }}>Value</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>
                    {usageModal.promo?.type === 'PERCENTAGE' ? `${usageModal.promo?.value}%` : `AED ${usageModal.promo?.value}`}
                    {usageModal.promo?.maxDiscount ? ` (max AED ${usageModal.promo.maxDiscount})` : ''}
                  </div>
                </div>
              </div>
            )}

            {/* Body */}
            <div style={{ overflowY: 'auto', flex: 1 }}>
              {(() => {
                if (usageModal.loading) {
                  return <div style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-muted)' }}>Loading orders...</div>;
                }
                if (usageModal.orders.length === 0) {
                  return <div style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-muted)' }}>No orders have used this promo code yet.</div>;
                }
                return (
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--admin-border, #374151)' }}>
                      {['Order #', 'Customer', 'Date', 'Order Total', 'Discount', 'Status'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', color: 'var(--admin-text-muted)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {usageModal.orders.map((o: any) => (
                      <tr key={o.id} style={{ borderBottom: '1px solid var(--admin-border, #374151)' }}>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>#{o.orderNumber}</td>
                        <td style={{ padding: '12px 16px' }}>
                          {o.customer ? (
                            <div>
                              <div style={{ fontWeight: 500 }}>{[o.customer.firstName, o.customer.lastName].filter(Boolean).join(' ') || '—'}</div>
                              <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{o.customer.email}</div>
                            </div>
                          ) : '—'}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--admin-text-muted)', whiteSpace: 'nowrap' }}>
                          {new Date(o.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                          <div style={{ fontSize: 11 }}>{new Date(o.createdAt).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</div>
                        </td>
                        <td style={{ padding: '12px 16px', fontWeight: 600 }}>AED {Number(o.total).toFixed(2)}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--admin-emerald, #10b981)', fontWeight: 700 }}>
                          − AED {Number(o.discount ?? 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '12px 16px' }}>
                          <span className={`${styles['table-tag']} ${styles[STATUS_TAG[o.status] ?? 'table-tag-gray']}`} style={{ fontSize: 11 }}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                );
              })()}
            </div>
          </div>
        </>
      )}
    </>
  );
}
