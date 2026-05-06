import { useState, useEffect } from 'react';
import { collectionsApi, type ProductCollection, type CollectionStrategy } from '@/api/collections';
import styles from './Admin.module.css';

const empty = (): Partial<ProductCollection> => ({
  key: '', title: '', subtitle: '', strategy: 'MANUAL' as CollectionStrategy,
  ruleJson: '', limit: 12, sortOrder: 0, isActive: true,
});

export default function AdminCollectionsPage() {
  const [items, setItems] = useState<ProductCollection[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<ProductCollection | null>(null);
  const [form, setForm] = useState(empty());
  const [saving, setSaving] = useState(false);

  // Items modal
  const [itemsModal, setItemsModal] = useState<ProductCollection | null>(null);
  const [newProductId, setNewProductId] = useState('');

  const load = () => collectionsApi.list().then(setItems).catch(() => {});
  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm(empty()); setDrawerOpen(true); };
  const openEdit = (c: ProductCollection) => {
    setEditing(c);
    setForm({
      key: c.key, title: c.title, subtitle: c.subtitle ?? '', strategy: c.strategy,
      ruleJson: c.ruleJson ?? '', limit: c.limit, sortOrder: c.sortOrder, isActive: c.isActive,
    });
    setDrawerOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload: Partial<ProductCollection> = {
        ...form,
        limit: Number(form.limit) || 12,
        sortOrder: Number(form.sortOrder) || 0,
        ruleJson: form.ruleJson || null,
        subtitle: form.subtitle || null,
      };
      if (editing) await collectionsApi.update(editing.id, payload);
      else await collectionsApi.create(payload);
      setDrawerOpen(false);
      load();
    } catch (e: unknown) {
      alert((e as { message?: string })?.message || 'Save failed');
    }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this collection?')) return;
    await collectionsApi.remove(id).catch(() => {});
    load();
  };

  const openItems = async (c: ProductCollection) => {
    const fresh = await collectionsApi.get(c.id).catch(() => null);
    setItemsModal(fresh ?? c);
    setNewProductId('');
  };

  const addProduct = async () => {
    if (!itemsModal || !newProductId) return;
    const id = Number(newProductId);
    if (Number.isNaN(id)) { alert('Product ID must be a number'); return; }
    try {
      await collectionsApi.addItem(itemsModal.id, id, (itemsModal.items?.length ?? 0));
      const fresh = await collectionsApi.get(itemsModal.id);
      setItemsModal(fresh);
      setNewProductId('');
    } catch (e: unknown) {
      alert((e as { message?: string })?.message || 'Add failed');
    }
  };

  const removeProduct = async (productId: number) => {
    if (!itemsModal) return;
    if (!confirm(`Remove product #${productId} from collection?`)) return;
    await collectionsApi.removeItem(itemsModal.id, productId).catch(() => {});
    const fresh = await collectionsApi.get(itemsModal.id);
    setItemsModal(fresh);
  };

  const f = (k: keyof ProductCollection, v: unknown) => setForm((p) => ({ ...p, [k]: v }));

  return (
    <>
      <div className={styles['header-v2']}>
        <div>
          <h1>Collections</h1>
          <span className={styles['header-v2-sub']}>Curated product groupings shown on the storefront</span>
        </div>
        <button className={styles['btn-primary']} onClick={openNew}>+ New Collection</button>
      </div>

      <div className={styles['admin-body']}>
        <div className={styles['table-v2-wrap']}>
          <table className={styles['table-v2']}>
            <thead>
              <tr><th>Order</th><th>Title</th><th>Key</th><th>Strategy</th><th>Items</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>No collections yet</td></tr>
              ) : items.map((c) => (
                <tr key={c.id}>
                  <td style={{ textAlign: 'center', fontWeight: 600 }}>{c.sortOrder}</td>
                  <td className={styles['table-name']}>
                    <div>{c.title}</div>
                    {c.subtitle && <div style={{ fontSize: 11, color: 'var(--admin-text-muted)' }}>{c.subtitle}</div>}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--admin-text-dim)' }}>{c.key}</td>
                  <td>
                    <span className={`${styles['table-tag']} ${styles[c.strategy === 'MANUAL' ? 'table-tag-cyan' : 'table-tag-violet']}`}>
                      {c.strategy}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>{c.items?.length ?? 0}</td>
                  <td>
                    <span className={`${styles['table-tag']} ${styles[c.isActive ? 'table-tag-green' : 'table-tag-gray']}`}>
                      {c.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className={styles['table-actions']}>
                      {c.strategy === 'MANUAL' && (
                        <button className={styles['table-action-btn']} title="Manage items" onClick={() => openItems(c)}>📦</button>
                      )}
                      <button className={styles['table-action-btn']} onClick={() => openEdit(c)}>✏️</button>
                      <button className={styles['table-action-btn']} onClick={() => remove(c.id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit drawer */}
      {drawerOpen && (
        <>
          <button type="button" aria-label="Close" className={styles['drawer-backdrop']} onClick={() => setDrawerOpen(false)} />
          <div className={styles['drawer']}>
            <div className={styles['drawer-header']}>
              <h2>{editing ? 'Edit Collection' : 'New Collection'}</h2>
              <button className={styles['drawer-close']} onClick={() => setDrawerOpen(false)}>✕</button>
            </div>
            <div className={styles['drawer-body']}>
              <div className={styles['field']}>
                <label htmlFor="col-key">Key * <span style={{ color: 'var(--admin-text-muted)', fontWeight: 400 }}>(unique)</span></label>
                <input id="col-key" value={form.key ?? ''} onChange={(e) => f('key', e.target.value)} disabled={!!editing} />
              </div>
              <div className={styles['field']}>
                <label htmlFor="col-title">Title *</label>
                <input id="col-title" value={form.title ?? ''} onChange={(e) => f('title', e.target.value)} />
              </div>
              <div className={styles['field']}>
                <label htmlFor="col-subtitle">Subtitle</label>
                <input id="col-subtitle" value={form.subtitle ?? ''} onChange={(e) => f('subtitle', e.target.value)} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div className={styles['field']}>
                  <label htmlFor="col-strategy">Strategy</label>
                  <select id="col-strategy" value={form.strategy ?? 'MANUAL'} onChange={(e) => f('strategy', e.target.value as CollectionStrategy)}>
                    <option value="MANUAL">Manual</option>
                    <option value="AUTO">Auto (rule-based)</option>
                  </select>
                </div>
                <div className={styles['field']}>
                  <label htmlFor="col-limit">Limit</label>
                  <input id="col-limit" type="number" value={form.limit ?? 12} onChange={(e) => f('limit', e.target.value)} />
                </div>
                <div className={styles['field']}>
                  <label htmlFor="col-sort">Sort Order</label>
                  <input id="col-sort" type="number" value={form.sortOrder ?? 0} onChange={(e) => f('sortOrder', e.target.value)} />
                </div>
              </div>
              {form.strategy === 'AUTO' && (
                <div className={styles['field']}>
                  <label htmlFor="col-rule">Rule JSON</label>
                  <textarea id="col-rule" rows={4} value={form.ruleJson ?? ''} onChange={(e) => f('ruleJson', e.target.value)} placeholder='{"categoryId":"…","sort":"newest"}' />
                </div>
              )}
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, marginTop: 8 }}>
                <input type="checkbox" checked={form.isActive ?? true} onChange={(e) => f('isActive', e.target.checked)} style={{ width: 18, height: 18, accentColor: 'var(--admin-accent)' }} />
                Active
              </label>
            </div>
            <div className={styles['drawer-footer']}>
              <button className={styles['btn-secondary']} onClick={() => setDrawerOpen(false)}>Cancel</button>
              <button className={styles['btn-primary']} onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save'}</button>
            </div>
          </div>
        </>
      )}

      {/* Items modal */}
      {itemsModal && (
        <>
          <button type="button" aria-label="Close" className={styles['drawer-backdrop']} onClick={() => setItemsModal(null)} />
          <div className={styles['drawer']}>
            <div className={styles['drawer-header']}>
              <h2>Items in {itemsModal.title}</h2>
              <button className={styles['drawer-close']} onClick={() => setItemsModal(null)}>✕</button>
            </div>
            <div className={styles['drawer-body']}>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <input
                  type="number"
                  placeholder="Product ID"
                  value={newProductId}
                  onChange={(e) => setNewProductId(e.target.value)}
                  style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid var(--admin-glass-border)', background: 'var(--admin-glass)', color: '#fff' }}
                />
                <button className={styles['btn-primary']} onClick={addProduct}>+ Add</button>
              </div>
              <div className={styles['table-v2-wrap']}>
                <table className={styles['table-v2']}>
                  <thead>
                    <tr><th>Order</th><th>Product ID</th><th>Actions</th></tr>
                  </thead>
                  <tbody>
                    {(itemsModal.items ?? []).length === 0 ? (
                      <tr><td colSpan={3} style={{ textAlign: 'center', padding: 24, color: 'var(--admin-text-muted)' }}>No products yet</td></tr>
                    ) : (itemsModal.items ?? []).sort((a, b) => a.sortOrder - b.sortOrder).map((it) => (
                      <tr key={it.id}>
                        <td style={{ textAlign: 'center' }}>{it.sortOrder}</td>
                        <td>#{it.productId}</td>
                        <td>
                          <button className={styles['table-action-btn']} onClick={() => removeProduct(it.productId)}>🗑</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className={styles['drawer-footer']}>
              <button className={styles['btn-secondary']} onClick={() => setItemsModal(null)}>Close</button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
