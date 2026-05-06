import { useState, useEffect } from 'react';
import { announcementsApi, type AnnouncementFull } from '@/api/announcements';
import styles from './Admin.module.css';

type AnnType = 'custom' | 'promo';

const empty = (): Partial<AnnouncementFull> & { _type: AnnType } => ({
  _type: 'custom' as AnnType,
  text: '', linkUrl: '', linkLabel: '', bgColor: '', textColor: '',
  isActive: true, sortOrder: 0, promoCodeId: null, startsAt: '', expiresAt: '',
});

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<AnnouncementFull[]>([]);
  const [promoCodes, setPromoCodes] = useState<{ id: string; code: string; type: string; value: number; minOrderAmount: number | null; isActive: boolean }[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<AnnouncementFull | null>(null);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);

  const load = () => { announcementsApi.getAll().then(setItems).catch(() => {}); };
  const loadPromos = () => { announcementsApi.getPromoCodes().then(setPromoCodes).catch(() => {}); };
  useEffect(() => { load(); loadPromos(); }, []);

  const openNew = () => { setEditing(null); setForm(empty()); setDrawerOpen(true); };

  const openEdit = (a: AnnouncementFull) => {
    setEditing(a);
    setForm({
      _type: a.promoCodeId ? 'promo' : 'custom',
      text: a.text, linkUrl: a.linkUrl ?? '', linkLabel: a.linkLabel ?? '',
      bgColor: a.bgColor ?? '', textColor: a.textColor ?? '',
      isActive: a.isActive, sortOrder: a.sortOrder, promoCodeId: a.promoCodeId ?? null,
      startsAt: a.startsAt?.slice(0, 16) ?? '', expiresAt: a.expiresAt?.slice(0, 16) ?? '',
    });
    setDrawerOpen(true);
  };

  const save = async () => {
    setSaving(true);
    const payload: any = {
      text: form.text,
      linkUrl: form.linkUrl || undefined,
      linkLabel: form.linkLabel || undefined,
      bgColor: form.bgColor || undefined,
      textColor: form.textColor || undefined,
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder) || 0,
      promoCodeId: form._type === 'promo' ? form.promoCodeId : null,
      startsAt: form.startsAt || undefined,
      expiresAt: form.expiresAt || undefined,
    };
    try {
      if (editing) await announcementsApi.update(editing.id, payload);
      else await announcementsApi.create(payload);
      setDrawerOpen(false);
      load();
    } catch { /* */ }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this announcement?')) return;
    await announcementsApi.remove(id).catch(() => {});
    load();
  };

  const toggle = async (a: AnnouncementFull) => {
    await announcementsApi.update(a.id, { isActive: !a.isActive }).catch(() => {});
    load();
  };

  const f = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <>
      <div className={styles['header-v2']}>
        <div>
          <h1>Announcements</h1>
          <span className={styles['header-v2-sub']}>Manage the top banner messages that rotate on your storefront</span>
        </div>
        <button className={styles['btn-primary']} onClick={openNew}>+ New Announcement</button>
      </div>

      <div className={styles['admin-body']}>
        {/* Info card */}
        <div style={{ padding: '14px 18px', background: 'var(--admin-glass)', border: '1px solid var(--admin-glass-border)', borderRadius: 12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>💡</span>
          <span style={{ fontSize: 13, color: 'var(--admin-text-dim)' }}>
            Active announcements rotate in the top banner. Use "Promo Code" type to link an announcement to a specific promo code.
          </span>
        </div>

        {/* Table */}
        <div className={styles['table-v2-wrap']}>
          <table className={styles['table-v2']}>
            <thead>
              <tr>
                <th>Order</th>
                <th>Message</th>
                <th>Type</th>
                <th>Status</th>
                <th>Schedule</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>No announcements yet</td></tr>
              ) : (
                items.map((a) => {
                  const now = new Date();
                  const started = new Date(a.startsAt) <= now;
                  const expired = a.expiresAt && new Date(a.expiresAt) < now;
                  const live = a.isActive && started && !expired;
                  let statusTag: string;
                  let statusLabel: string;
                  if (live) { statusTag = 'table-tag-green'; statusLabel = 'Live'; }
                  else if (expired) { statusTag = 'table-tag-red'; statusLabel = 'Expired'; }
                  else if (!a.isActive) { statusTag = 'table-tag-yellow'; statusLabel = 'Inactive'; }
                  else { statusTag = 'table-tag-blue'; statusLabel = 'Scheduled'; }
                  return (
                    <tr key={a.id}>
                      <td style={{ textAlign: 'center', fontWeight: 600 }}>{a.sortOrder}</td>
                      <td className={styles['table-name']} style={{ maxWidth: 320 }}>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.text}</div>
                        {a.linkUrl && <div style={{ fontSize: 11, color: 'var(--admin-text-muted)', marginTop: 2 }}>🔗 {a.linkUrl}</div>}
                      </td>
                      <td>
                        {a.promoCodeId && a.promoCode
                          ? <span className={`${styles['table-tag']} ${styles['table-tag-cyan']}`}>🏷 {a.promoCode.code}</span>
                          : <span style={{ color: 'var(--admin-text-muted)', fontSize: 12 }}>Custom</span>
                        }
                      </td>
                      <td>
                        <span
                          className={`${styles['table-tag']} ${styles[statusTag]}`}
                        >
                          {statusLabel}
                        </span>
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--admin-text-dim)' }}>
                        {new Date(a.startsAt).toLocaleDateString()}
                        {a.expiresAt && ` → ${new Date(a.expiresAt).toLocaleDateString()}`}
                      </td>
                      <td>
                        <div className={styles['table-actions']}>
                          <button className={styles['table-action-btn']} onClick={() => toggle(a)} title={a.isActive ? 'Deactivate' : 'Activate'}>
                            {a.isActive ? '⏸' : '▶'}
                          </button>
                          <button className={styles['table-action-btn']} onClick={() => openEdit(a)}>✏️</button>
                          <button className={styles['table-action-btn']} onClick={() => remove(a.id)}>🗑</button>
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
          <div className={styles['drawer']}>
            <div className={styles['drawer-header']}>
              <h2>{editing ? 'Edit Announcement' : 'New Announcement'}</h2>
              <button className={styles['drawer-close']} onClick={() => setDrawerOpen(false)}>✕</button>
            </div>
            <div className={styles['drawer-body']}>
              {/* Type toggle */}
              <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--admin-glass-border)' }}>
                <button
                  type="button"
                  onClick={() => { f('_type', 'custom'); f('promoCodeId', null); }}
                  style={{
                    flex: 1, padding: '10px 0', fontWeight: 600, fontSize: 13, cursor: 'pointer', border: 'none',
                    background: form._type === 'custom' ? 'var(--admin-accent)' : 'var(--admin-glass)',
                    color: form._type === 'custom' ? '#fff' : 'var(--admin-text-dim)',
                    transition: 'all .15s',
                  }}
                >
                  Custom Message
                </button>
                <button
                  type="button"
                  onClick={() => f('_type', 'promo')}
                  style={{
                    flex: 1, padding: '10px 0', fontWeight: 600, fontSize: 13, cursor: 'pointer', border: 'none',
                    borderLeft: '1px solid var(--admin-glass-border)',
                    background: form._type === 'promo' ? 'var(--admin-accent)' : 'var(--admin-glass)',
                    color: form._type === 'promo' ? '#fff' : 'var(--admin-text-dim)',
                    transition: 'all .15s',
                  }}
                >
                  Promo Code
                </button>
              </div>

              {form._type === 'promo' ? (
                <>
                  <div className={styles['field']}>
                    <label htmlFor="select-promo-code">Select Promo Code *</label>
                    <select id="select-promo-code"
                      value={form.promoCodeId ?? ''}
                      onChange={(e) => {
                        const pid = e.target.value || null;
                        f('promoCodeId', pid);
                        if (pid) {
                          const pc = promoCodes.find((p) => p.id === pid);
                          if (pc) {
                            let valueStr: string;
                            if (pc.type === 'PERCENTAGE') valueStr = `${pc.value}% off`;
                            else if (pc.type === 'FREE_SHIPPING') valueStr = 'Free shipping';
                            else valueStr = `AED ${pc.value} off`;
                            const minStr = pc.minOrderAmount ? ` on orders over AED ${pc.minOrderAmount}` : '';
                            f('text', `Use code ${pc.code} for ${valueStr}${minStr}`);
                          }
                        }
                      }}
                    >
                      <option value="">— Choose a promo code —</option>
                      {promoCodes.map((p) => {
                        let label: string;
                        if (p.type === 'PERCENTAGE') label = `${p.value}%`;
                        else if (p.type === 'FREE_SHIPPING') label = 'Free Ship';
                        else label = `AED ${p.value}`;
                        return (
                        <option key={p.id} value={p.id}>
                          {p.code} — {label}
                          {!p.isActive ? ' (inactive)' : ''}
                        </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className={styles['field']}>
                    <label htmlFor="display-text-auto-generated-ed">Display Text (auto-generated, editable)</label>
                    <textarea id="display-text-auto-generated-ed" rows={3} value={form.text} onChange={(e) => f('text', e.target.value)} placeholder="Auto-generated from promo code" />
                  </div>
                </>
              ) : (
                <div className={styles['field']}>
                  <label htmlFor="message-text">Message Text *</label>
                  <textarea id="message-text" rows={3} value={form.text} onChange={(e) => f('text', e.target.value)} placeholder="e.g. Free shipping on orders over AED 75" />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className={styles['field']}>
                  <label htmlFor="link-url">Link URL</label>
                  <input id="link-url" value={form.linkUrl ?? ''} onChange={(e) => f('linkUrl', e.target.value)} placeholder="/sale" />
                </div>
                <div className={styles['field']}>
                  <label htmlFor="link-label">Link Label</label>
                  <input id="link-label" value={form.linkLabel ?? ''} onChange={(e) => f('linkLabel', e.target.value)} placeholder="Shop Now" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div className={styles['field']}>
                  <label htmlFor="sort-order">Sort Order</label>
                  <input id="sort-order" type="number" value={form.sortOrder ?? 0} onChange={(e) => f('sortOrder', e.target.value)} />
                </div>
                <div className={styles['field']}>
                  <label htmlFor="bg-color">BG Color</label>
                  <input id="bg-color" value={form.bgColor ?? ''} onChange={(e) => f('bgColor', e.target.value)} placeholder="#1a1a2e" />
                </div>
                <div className={styles['field']}>
                  <label htmlFor="text-color">Text Color</label>
                  <input id="text-color" value={form.textColor ?? ''} onChange={(e) => f('textColor', e.target.value)} placeholder="#ffffff" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className={styles['field']}>
                  <label htmlFor="starts-at">Starts At</label>
                  <input id="starts-at" type="datetime-local" value={form.startsAt?.slice(0, 16) ?? ''} onChange={(e) => f('startsAt', e.target.value)} />
                </div>
                <div className={styles['field']}>
                  <label htmlFor="expires-at">Expires At</label>
                  <input id="expires-at" type="datetime-local" value={form.expiresAt?.slice(0, 16) ?? ''} onChange={(e) => f('expiresAt', e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 24, marginTop: 8 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                  <input type="checkbox" checked={form.isActive ?? true} onChange={(e) => f('isActive', e.target.checked)}
                    style={{ width: 18, height: 18, accentColor: 'var(--admin-accent)' }} />
                  Active
                </label>
              </div>

              {/* Preview */}
              <div style={{ marginTop: 16 }}>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1, color: 'var(--admin-text-muted)', marginBottom: 6 }}>Preview</label>
                <div style={{
                  background: form.bgColor || 'linear-gradient(135deg, #1a1a2e 0%, #2a2a2a 100%)',
                  color: form.textColor || '#fff',
                  textAlign: 'center',
                  padding: '8px 16px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontWeight: 500,
                  letterSpacing: 0.8,
                }}>
                  {form.text || 'Your announcement text will appear here'}
                  {form.linkLabel && <span style={{ marginLeft: 8, textDecoration: 'underline' }}>{form.linkLabel}</span>}
                </div>
              </div>
            </div>

            <div className={styles['drawer-footer']}>
              <button className={styles['btn-secondary']} onClick={() => setDrawerOpen(false)}>Cancel</button>
              <button className={styles['btn-primary']} disabled={saving || !form.text || (form._type === 'promo' && !form.promoCodeId)} onClick={save}>
                {(() => {
                  if (saving) return 'Saving...';
                  return editing ? 'Update' : 'Create';
                })()}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
