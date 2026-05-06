import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  productGroupsApi,
  type ProductGroupDto,
  type AutoGroupByNameResult,
} from '@/api/admin';
import styles from './Admin.module.css';

export default function AdminProductGroupsPage() {
  const [groups, setGroups] = useState<ProductGroupDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: '', slug: '', category: '', description: '' });
  const [creating, setCreating] = useState(false);

  const [autoOpen, setAutoOpen] = useState(false);
  const [autoSkus, setAutoSkus] = useState('');
  const [autoName, setAutoName] = useState('');
  const [autoCategory, setAutoCategory] = useState('');
  const [autoBusy, setAutoBusy] = useState(false);

  const [byNameBusy, setByNameBusy] = useState(false);
  const [byNameResult, setByNameResult] = useState<AutoGroupByNameResult | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await productGroupsApi.list();
      setGroups(res.data);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'Failed to load product groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return groups;
    return groups.filter(g =>
      g.name.toLowerCase().includes(q) ||
      g.slug?.toLowerCase().includes(q) ||
      (g.category ?? '').toLowerCase().includes(q),
    );
  }, [groups, search]);

  const submitCreate = async () => {
    if (!createForm.name.trim()) return;
    setCreating(true);
    try {
      await productGroupsApi.create({
        name: createForm.name.trim(),
        slug: createForm.slug.trim() || undefined,
        category: createForm.category.trim() || undefined,
        description: createForm.description.trim() || undefined,
      });
      setCreateOpen(false);
      setCreateForm({ name: '', slug: '', category: '', description: '' });
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Failed to create group');
    } finally {
      setCreating(false);
    }
  };

  const submitAuto = async () => {
    const skus = autoSkus
      .split(/[\n,]/)
      .map(s => s.trim())
      .filter(Boolean);
    if (skus.length === 0 || !autoName.trim()) return;
    setAutoBusy(true);
    try {
      await productGroupsApi.autoGroup({
        skus,
        groupName: autoName.trim(),
        category: autoCategory.trim() || undefined,
      });
      setAutoOpen(false);
      setAutoSkus(''); setAutoName(''); setAutoCategory('');
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Failed to auto-group');
    } finally {
      setAutoBusy(false);
    }
  };

  const runByName = async (dryRun: boolean) => {
    setByNameBusy(true);
    setByNameResult(null);
    try {
      const res = await productGroupsApi.autoGroupByName(dryRun);
      setByNameResult(res);
      if (!dryRun) await load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Failed');
    } finally {
      setByNameBusy(false);
    }
  };

  const remove = async (g: ProductGroupDto) => {
    if (!confirm(`Delete group "${g.name}"? Variants will be unlinked.`)) return;
    try {
      await productGroupsApi.remove(g.id);
      await load();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Failed to delete');
    }
  };

  return (
    <>
      <div className={styles['header-v2']}>
        <div>
          <h1 className={styles['header-v2-title']}>Product Groups</h1>
          <span className={styles['header-v2-sub']}>Group SKUs as variants of one product</span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={styles['btn-secondary']} onClick={() => setAutoOpen(true)}>
            ⚡ Auto-Group by SKU
          </button>
          <button className={styles['btn-primary']} onClick={() => setCreateOpen(true)}>
            + New Group
          </button>
        </div>
      </div>

      <div className={styles['admin-body']}>
        <div className={styles['toolbar-v2']}>
          <div className={styles['search-box']}>
            <span className={styles['search-icon']}>🔍</span>
            <input
              placeholder="Search groups…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span className={styles['count-chip']}>{filtered.length} groups</span>
          <div style={{ flex: 1 }} />
          <button
            className={styles['btn-secondary']}
            disabled={byNameBusy}
            onClick={() => runByName(true)}
            title='Scan products with " | " in name and preview groups'
          >
            {byNameBusy ? 'Scanning…' : '🔍 Dry-run from names'}
          </button>
          {byNameResult?.dryRun && byNameResult.groupsCreated > 0 && (
            <button
              className={styles['btn-primary']}
              disabled={byNameBusy}
              onClick={() => runByName(false)}
            >
              Apply ({byNameResult.groupsCreated} groups)
            </button>
          )}
        </div>

        {byNameResult && (
          <div
            style={{
              padding: 12,
              border: '1px solid var(--border, #e0e0e0)',
              borderRadius: 8,
              margin: '0 0 16px',
              background: 'var(--surface, #fafafa)',
            }}
          >
            <strong>{byNameResult.dryRun ? 'Dry-run' : 'Applied'}:</strong>{' '}
            {byNameResult.groupsCreated} groups · {byNameResult.productsLinked} products linked ·{' '}
            {byNameResult.ungroupedProducts} ungrouped remaining
            {byNameResult.skippedBaseNames.length > 0 && (
              <details style={{ marginTop: 6 }}>
                <summary>Skipped (single-variant) base names: {byNameResult.skippedBaseNames.length}</summary>
                <div style={{ fontSize: 12, marginTop: 4 }}>
                  {byNameResult.skippedBaseNames.slice(0, 30).join(' · ')}
                  {byNameResult.skippedBaseNames.length > 30 && ' …'}
                </div>
              </details>
            )}
          </div>
        )}

        {error && <div className={styles['empty-state']}>⚠️ {error}</div>}

        {loading ? (
          <div className={styles['empty-state']}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div className={styles['empty-state']}>
            <div className={styles['empty-state-icon']}>🧩</div>
            <p>No product groups yet. Create one to start grouping variants.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border, #e0e0e0)', textAlign: 'left' }}>
                  <th style={{ padding: 8 }}>Name</th>
                  <th style={{ padding: 8 }}>Slug</th>
                  <th style={{ padding: 8 }}>Category</th>
                  <th style={{ padding: 8 }}>Variants</th>
                  <th style={{ padding: 8 }}>Axes</th>
                  <th style={{ padding: 8, width: 120 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(g => (
                  <tr key={g.id} style={{ borderBottom: '1px solid var(--border, #f0f0f0)' }}>
                    <td style={{ padding: 8 }}>
                      <Link to={`/admin/product-groups/${g.id}`} style={{ fontWeight: 600 }}>
                        {g.name}
                      </Link>
                      {g.description && (
                        <div style={{ fontSize: 12, color: 'var(--text-secondary, #777)' }}>
                          {g.description}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: 8, fontFamily: 'inherit', fontSize: 12 }}>{g.slug}</td>
                    <td style={{ padding: 8 }}>{g.category ?? '—'}</td>
                    <td style={{ padding: 8 }}>
                      <span className={styles['count-chip']}>{g.products?.length ?? 0}</span>
                      {g.products && g.products.length > 0 && (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                          {g.products.slice(0, 5).map(v => (
                            <VariantChip key={v.id} variant={v} />
                          ))}
                          {g.products.length > 5 && (
                            <span style={{ fontSize: 11, color: '#888' }}>
                              +{g.products.length - 5}
                            </span>
                          )}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: 8, fontSize: 12 }}>
                      {(g.variantAxes ?? []).join(', ')}
                    </td>
                    <td style={{ padding: 8, textAlign: 'right' }}>
                      <Link to={`/admin/product-groups/${g.id}`} className={styles['card-action-btn']} title="Edit">
                        ✏️
                      </Link>
                      <button
                        className={`${styles['card-action-btn']} ${styles['card-action-btn-danger']}`}
                        onClick={() => remove(g)}
                        title="Delete"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create drawer */}
      {createOpen && (
        <>
          <button type="button" aria-label="Close" className={styles['drawer-backdrop']} onClick={() => setCreateOpen(false)} />
          <div className={styles.drawer}>
            <div className={styles['drawer-header']}>
              <h2>New Product Group</h2>
              <button className={styles['drawer-close']} onClick={() => setCreateOpen(false)}>✕</button>
            </div>
            <div className={styles['drawer-body']}>
              <div className={styles.field}>
                <label>Name *</label>
                <input
                  value={createForm.name}
                  onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Ruby Glass Jug"
                />
              </div>
              <div className={styles.field}>
                <label>Slug</label>
                <input
                  value={createForm.slug}
                  onChange={e => setCreateForm(f => ({ ...f, slug: e.target.value }))}
                  placeholder="auto-generated from name"
                />
              </div>
              <div className={styles.field}>
                <label>Category</label>
                <input
                  value={createForm.category}
                  onChange={e => setCreateForm(f => ({ ...f, category: e.target.value }))}
                  placeholder="e.g. Glassware"
                />
              </div>
              <div className={styles.field}>
                <label>Description</label>
                <textarea
                  rows={3}
                  value={createForm.description}
                  onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>
            <div className={styles['drawer-footer']}>
              <button className={styles['btn-secondary']} onClick={() => setCreateOpen(false)}>Cancel</button>
              <button
                className={styles['btn-primary']}
                onClick={submitCreate}
                disabled={!createForm.name.trim() || creating}
              >
                {creating ? 'Creating…' : 'Create Group'}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Auto-group drawer */}
      {autoOpen && (
        <>
          <button type="button" aria-label="Close" className={styles['drawer-backdrop']} onClick={() => setAutoOpen(false)} />
          <div className={styles.drawer}>
            <div className={styles['drawer-header']}>
              <h2>Auto-Group by SKUs</h2>
              <button className={styles['drawer-close']} onClick={() => setAutoOpen(false)}>✕</button>
            </div>
            <div className={styles['drawer-body']}>
              <div className={styles.field}>
                <label>Group Name *</label>
                <input
                  value={autoName}
                  onChange={e => setAutoName(e.target.value)}
                  placeholder="e.g. Ruby Glass Jug"
                />
              </div>
              <div className={styles.field}>
                <label>Category</label>
                <input
                  value={autoCategory}
                  onChange={e => setAutoCategory(e.target.value)}
                  placeholder="optional"
                />
              </div>
              <div className={styles.field}>
                <label>SKUs * (one per line or comma-separated)</label>
                <textarea
                  rows={8}
                  value={autoSkus}
                  onChange={e => setAutoSkus(e.target.value)}
                  placeholder={'SKU-001\nSKU-002\nSKU-003'}
                  style={{ fontFamily: 'inherit' }}
                />
                <span className={styles['field-hint']}>
                  All matching products will be linked. Color/size from each product fills attributes.
                </span>
              </div>
            </div>
            <div className={styles['drawer-footer']}>
              <button className={styles['btn-secondary']} onClick={() => setAutoOpen(false)}>Cancel</button>
              <button
                className={styles['btn-primary']}
                onClick={submitAuto}
                disabled={!autoName.trim() || !autoSkus.trim() || autoBusy}
              >
                {autoBusy ? 'Grouping…' : 'Create Group'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function VariantChip({ variant }: { variant: NonNullable<ProductGroupDto['products']>[number] }) {
  const v = variant.variantAttributes ?? {};
  const label = v.color ?? v.colorName ?? v.size ?? variant.sku;
  const hex = typeof v.colorHex === 'string' ? v.colorHex : undefined;
  return (
    <span
      title={variant.productName}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 6px',
        borderRadius: 10,
        background: 'var(--surface-alt, #f3f3f3)',
        fontSize: 11,
        fontWeight: variant.isDefaultVariant ? 700 : 500,
        border: variant.isDefaultVariant ? '1px solid var(--accent, #4a90e2)' : '1px solid transparent',
      }}
    >
      {hex && (
        <span
          style={{
            width: 10, height: 10, borderRadius: '50%',
            background: hex, border: '1px solid #0002',
          }}
        />
      )}
      {label}
    </span>
  );
}
