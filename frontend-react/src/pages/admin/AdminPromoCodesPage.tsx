import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { promoApi } from '@/api/promo';
import styles from './Admin.module.css';

const TYPE_TAG: Record<string, string> = {
  PERCENTAGE: 'table-tag-cyan',
  FIXED_AMOUNT: 'table-tag-green',
  FREE_SHIPPING: 'table-tag-violet',
};

/** Compute the real, end-to-end status for a promo (matches backend validation rules). */
function computePromoStatus(p: any): { label: string; tone: 'green' | 'amber' | 'red' | 'gray' } {
  const now = new Date();
  if (p.isActive === false) return { label: 'Inactive', tone: 'gray' };
  if (p.startsAt && new Date(p.startsAt) > now) return { label: 'Scheduled', tone: 'amber' };
  if (p.expiresAt && new Date(p.expiresAt) < now) return { label: 'Expired', tone: 'red' };
  if (p.usageLimit && (p.usageCount ?? p.timesUsed ?? 0) >= p.usageLimit) return { label: 'Limit reached', tone: 'red' };
  return { label: 'Active', tone: 'green' };
}

export default function AdminPromoCodesPage() {
  const [promos, setPromos] = useState<any[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({
    code: '', description: '', type: 'PERCENTAGE', value: '', minOrderAmount: '', maxDiscount: '',
    usageLimit: '', startsAt: '', expiresAt: '', isActive: true,
  });
  const [saving, setSaving] = useState(false);

  const load = () => { promoApi.list().then(r => setPromos(r.data ?? [])).catch(() => {}); };
  useEffect(load, []);

  const openNew = () => {
    setEditing(null);
    setForm({ code: '', description: '', type: 'PERCENTAGE', value: '', minOrderAmount: '', maxDiscount: '', usageLimit: '', startsAt: '', expiresAt: '', isActive: true });
    setDrawerOpen(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({
      code: p.code, description: p.description ?? '', type: p.type,
      value: String(p.value ?? ''), minOrderAmount: String(p.minOrderAmount ?? ''),
      maxDiscount: String(p.maxDiscount ?? ''), usageLimit: String(p.usageLimit ?? ''),
      startsAt: p.startsAt?.slice(0, 16) ?? '', expiresAt: p.expiresAt?.slice(0, 16) ?? '',
      isActive: p.isActive !== false,
    });
    setDrawerOpen(true);
  };

  const toggleActive = async (p: any) => {
    try {
      await promoApi.update(p.id, { isActive: !p.isActive } as any);
      toast.success(p.isActive ? `${p.code} disabled` : `${p.code} enabled`);
      load();
    } catch {
      toast.error('Failed to update status');
    }
  };

  const save = async () => {
    setSaving(true);
    const payload: any = {
      ...form,
      value: Number(form.value) || 0,
      minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : undefined,
      maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      startsAt: form.startsAt || new Date().toISOString(),
      expiresAt: form.expiresAt || undefined,
      isActive: form.isActive,
    };
    try {
      if (editing) {
        const { code, ...updatePayload } = payload;
        await promoApi.update(editing.id, updatePayload as any);
        toast.success(`${form.code} updated`);
      } else {
        await promoApi.create(payload as any);
        toast.success(`${form.code} created`);
      }
      setDrawerOpen(false);
      load();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Failed to save promo code'));
    }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this promo code?')) return;
    await promoApi.remove(id).catch(() => {});
    load();
  };

  const active = promos.filter(p => computePromoStatus(p).label === 'Active').length;
  const totalDiscount = promos.reduce((s, p) => s + (p.timesUsed ?? p.usageCount ?? 0), 0);

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
            <div className={styles['stat-value']}>{active}</div>
          </div>
          <div className={`${styles['stat-card']} ${styles['stat-card-cyan']}`}>
            <div className={styles['stat-label']}>Total Uses</div>
            <div className={styles['stat-value']}>{totalDiscount}</div>
          </div>
        </div>

        {/* Table */}
        <div className={styles['table-v2-wrap']}>
          <table className={styles['table-v2']}>
            <thead>
              <tr><th>Code</th><th>Type</th><th>Value</th><th>Min Order</th><th>Used</th><th>Status</th><th>Expires</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {promos.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>No promo codes yet</td></tr>
              ) : (
                promos.map(p => {
                  const status = computePromoStatus(p);
                  const toneClass = `table-tag-${status.tone === 'gray' ? 'gray' : status.tone === 'amber' ? 'amber' : status.tone === 'red' ? 'red' : 'green'}`;
                  const usedCount = p.timesUsed ?? p.usageCount ?? 0;
                  return (
                    <tr key={p.id} style={p.isActive === false ? { opacity: 0.65 } : undefined}>
                      <td>
                        <div className={styles['table-name']}>{p.code}</div>
                        {p.description && <div className={styles['table-sub']}>{p.description}</div>}
                      </td>
                      <td><span className={`${styles['table-tag']} ${styles[TYPE_TAG[p.type] ?? 'table-tag-gray']}`}>{p.type?.replace('_', ' ')}</span></td>
                      <td style={{ fontWeight: 600 }}>{p.type === 'PERCENTAGE' ? `${p.value}%` : p.type === 'FREE_SHIPPING' ? '—' : `AED ${p.value}`}</td>
                      <td>{p.minOrderAmount ? `AED ${p.minOrderAmount}` : '—'}</td>
                      <td>{usedCount}{p.usageLimit ? ` / ${p.usageLimit}` : ''}</td>
                      <td>
                        <span className={`${styles['table-tag']} ${styles[toneClass] ?? ''}`}>{status.label}</span>
                      </td>
                      <td>
                        {p.expiresAt
                          ? <span style={{ fontSize: 12 }}>{new Date(p.expiresAt).toLocaleDateString()}</span>
                          : <span style={{ color: 'var(--admin-text-muted)' }}>No expiry</span>}
                      </td>
                      <td>
                        <div className={styles['table-actions']}>
                          <button
                            className={styles['table-action-btn']}
                            title={p.isActive ? 'Disable' : 'Enable'}
                            onClick={() => toggleActive(p)}
                          >{p.isActive ? '⏸' : '▶'}</button>
                          <button className={styles['table-action-btn']} title="Edit" onClick={() => openEdit(p)}>✏️</button>
                          <button className={styles['table-action-btn-danger']} title="Delete" onClick={() => remove(p.id)}>🗑</button>
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
          <div className={styles['drawer-backdrop']} onClick={() => setDrawerOpen(false)} />
          <div className={styles['drawer']} style={{ maxWidth: 520 }}>
            <div className={styles['drawer-header']}>
              <h2>{editing ? 'Edit Promo Code' : 'New Promo Code'}</h2>
              <button className={styles['drawer-close']} onClick={() => setDrawerOpen(false)}>✕</button>
            </div>
            <div className={styles['drawer-body']}>
              <div className={styles['field-row']}>
                <div className={styles['field']}>
                  <label>Code</label>
                  <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="e.g. SUMMER20" />
                </div>
                <div className={styles['field']}>
                  <label>Type</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>
                    <option value="PERCENTAGE">Percentage</option>
                    <option value="FIXED_AMOUNT">Fixed Amount</option>
                    <option value="FREE_SHIPPING">Free Shipping</option>
                  </select>
                </div>
              </div>
              <div className={styles['field']}>
                <label>Description</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className={styles['field-row-3']}>
                <div className={styles['field']}>
                  <label>Value</label>
                  <input type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} />
                </div>
                <div className={styles['field']}>
                  <label>Min Order</label>
                  <input type="number" value={form.minOrderAmount} onChange={e => setForm({ ...form, minOrderAmount: e.target.value })} />
                </div>
                <div className={styles['field']}>
                  <label>Max Discount</label>
                  <input type="number" value={form.maxDiscount} onChange={e => setForm({ ...form, maxDiscount: e.target.value })} />
                </div>
              </div>
              <div className={styles['field']}>
                <label>Usage Limit</label>
                <input type="number" value={form.usageLimit} onChange={e => setForm({ ...form, usageLimit: e.target.value })} placeholder="Leave empty for unlimited" />
              </div>
              <div className={styles['field-row']}>
                <div className={styles['field']}>
                  <label>Starts At</label>
                  <input type="datetime-local" value={form.startsAt} onChange={e => setForm({ ...form, startsAt: e.target.value })} />
                </div>
                <div className={styles['field']}>
                  <label>Expires At</label>
                  <input type="datetime-local" value={form.expiresAt} onChange={e => setForm({ ...form, expiresAt: e.target.value })} />
                </div>
              </div>
              <div className={styles['field']}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={form.isActive}
                    onChange={e => setForm({ ...form, isActive: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: '#B8860B' }}
                  />
                  <span style={{ fontWeight: 600 }}>Active</span>
                  <span style={{ fontSize: 12, color: 'var(--admin-text-muted)' }}>— uncheck to disable this code without deleting it</span>
                </label>
              </div>
            </div>
            <div className={styles['drawer-footer']}>
              <button className={styles['btn-secondary']} onClick={() => setDrawerOpen(false)}>Cancel</button>
              <button className={styles['btn-primary']} disabled={saving || !form.code} onClick={save}>
                {saving ? 'Saving...' : editing ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
