import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  productGroupsApi,
  type ProductGroupDto,
  type ProductGroupVariantDto,
  type AttributeInput,
} from '@/api/admin';
import { productsApi } from '@/api/products';
import type { ProductDto } from '@/types';
import styles from './Admin.module.css';

export default function AdminProductGroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const nav = useNavigate();
  const [group, setGroup] = useState<ProductGroupDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [meta, setMeta] = useState({ name: '', slug: '', category: '', description: '', tags: '', variantAxes: 'color' });

  // Add-variant search
  const [searchQ, setSearchQ] = useState('');
  const [searchResults, setSearchResults] = useState<ProductDto[]>([]);
  const [searching, setSearching] = useState(false);

  const reload = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const g = await productGroupsApi.get(id);
      setGroup(g);
      setMeta({
        name: g.name,
        slug: g.slug ?? '',
        category: g.category ?? '',
        description: g.description ?? '',
        tags: (g.tags ?? []).join(', '),
        variantAxes: (g.variantAxes ?? ['color']).join(', '),
      });
      setError(null);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { reload(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [id]);

  // Debounced product search
  useEffect(() => {
    const q = searchQ.trim();
    if (!q) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await productsApi.getAll({ search: q, limit: 12 });
        const linkedIds = new Set((group?.products ?? []).map(p => p.id));
        setSearchResults(res.items.filter(p => !linkedIds.has(Number(p.id))));
      } finally {
        setSearching(false);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [searchQ, group?.products]);

  const saveMeta = async () => {
    if (!group) return;
    setSaving(true);
    try {
      await productGroupsApi.update(group.id, {
        name: meta.name.trim(),
        slug: meta.slug.trim() || undefined,
        category: meta.category.trim() || undefined,
        description: meta.description.trim() || undefined,
        tags: meta.tags.split(',').map(t => t.trim()).filter(Boolean),
        variantAxes: meta.variantAxes.split(',').map(t => t.trim().toLowerCase()).filter(Boolean),
      });
      await reload();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const removeGroup = async () => {
    if (!group) return;
    if (!confirm(`Delete "${group.name}"? Variants will be unlinked.`)) return;
    try {
      await productGroupsApi.remove(group.id);
      nav('/admin/product-groups');
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Failed to delete');
    }
  };

  const addVariant = async (productId: number) => {
    if (!group) return;
    try {
      await productGroupsApi.addVariant(group.id, { productId });
      setSearchQ('');
      setSearchResults([]);
      await reload();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Failed to add variant');
    }
  };

  const removeVariant = async (productId: number) => {
    if (!group) return;
    if (!confirm('Remove this variant from the group?')) return;
    try {
      await productGroupsApi.removeVariant(group.id, productId);
      await reload();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Failed');
    }
  };

  const setDefault = async (productId: number) => {
    if (!group) return;
    try {
      await productGroupsApi.setDefault(group.id, productId);
      await reload();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Failed');
    }
  };

  const updateAttributes = async (variant: ProductGroupVariantDto, attrs: AttributeInput[]) => {
    if (!group) return;
    try {
      await productGroupsApi.addVariant(group.id, {
        productId: variant.id,
        attributes: attrs,
      });
      await reload();
    } catch (e: any) {
      alert(e?.response?.data?.message ?? 'Failed to update attributes');
    }
  };

  if (loading) return <div className={styles['empty-state']}>Loading…</div>;
  if (error || !group) return <div className={styles['empty-state']}>⚠️ {error ?? 'Not found'}</div>;

  return (
    <>
      <div className={styles['header-v2']}>
        <div>
          <h1 className={styles['header-v2-title']}>
            <Link to="/admin/product-groups" style={{ textDecoration: 'none' }}>← </Link>
            {group.name}
          </h1>
          <span className={styles['header-v2-sub']}>
            {group.products?.length ?? 0} variant(s) · slug <code>{group.slug}</code>
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`${styles['btn-secondary']}`} onClick={removeGroup} style={{ color: 'crimson' }}>
            Delete Group
          </button>
          <button className={styles['btn-primary']} onClick={saveMeta} disabled={saving || !meta.name.trim()}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>

      <div className={styles['admin-body']}>
        {/* Group meta */}
        <section style={{ marginBottom: 24 }}>
          <h3 style={{ marginTop: 0 }}>Group Details</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className={styles.field}>
              <label>Name *</label>
              <input value={meta.name} onChange={e => setMeta(m => ({ ...m, name: e.target.value }))} />
            </div>
            <div className={styles.field}>
              <label>Slug</label>
              <input value={meta.slug} onChange={e => setMeta(m => ({ ...m, slug: e.target.value }))} />
            </div>
            <div className={styles.field}>
              <label>Category</label>
              <input value={meta.category} onChange={e => setMeta(m => ({ ...m, category: e.target.value }))} />
            </div>
            <div className={styles.field}>
              <label>Variant Axes (comma-separated)</label>
              <input
                value={meta.variantAxes}
                onChange={e => setMeta(m => ({ ...m, variantAxes: e.target.value }))}
                placeholder="color, size"
              />
            </div>
            <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
              <label>Tags (comma-separated)</label>
              <input value={meta.tags} onChange={e => setMeta(m => ({ ...m, tags: e.target.value }))} />
            </div>
            <div className={styles.field} style={{ gridColumn: '1 / -1' }}>
              <label>Description</label>
              <textarea
                rows={3}
                value={meta.description}
                onChange={e => setMeta(m => ({ ...m, description: e.target.value }))}
              />
            </div>
          </div>
        </section>

        {/* Variants */}
        <section style={{ marginBottom: 24 }}>
          <h3>Variants ({group.products?.length ?? 0})</h3>
          {(!group.products || group.products.length === 0) ? (
            <div className={styles['empty-state']}>No variants yet. Add some below.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {group.products.map(v => (
                <VariantEditCard
                  key={v.id}
                  variant={v}
                  onSetDefault={() => setDefault(v.id)}
                  onRemove={() => removeVariant(v.id)}
                  onSaveAttrs={(attrs) => updateAttributes(v, attrs)}
                  axes={(group.variantAxes ?? ['color'])}
                />
              ))}
            </div>
          )}
        </section>

        {/* Add Variant */}
        <section>
          <h3>+ Add Variant</h3>
          <div className={styles['search-box']} style={{ maxWidth: 480 }}>
            <span className={styles['search-icon']}>🔍</span>
            <input
              placeholder="Search products by name or SKU…"
              value={searchQ}
              onChange={e => setSearchQ(e.target.value)}
            />
          </div>
          {searching && <div style={{ marginTop: 8, fontSize: 12 }}>Searching…</div>}
          {searchResults.length > 0 && (
            <div style={{ marginTop: 8, border: '1px solid var(--border, #e0e0e0)', borderRadius: 8, maxWidth: 480 }}>
              {searchResults.map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => addVariant(Number(p.id))}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left',
                    padding: '8px 12px', background: 'transparent', border: 'none',
                    borderBottom: '1px solid var(--border, #f0f0f0)', cursor: 'pointer',
                  }}
                >
                  <strong>{p.productName}</strong>{' '}
                  <span style={{ fontSize: 12, color: '#888' }}>· {p.sku}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>
    </>
  );
}

interface VariantEditCardProps {
  variant: ProductGroupVariantDto;
  axes: string[];
  onSetDefault: () => void;
  onRemove: () => void;
  onSaveAttrs: (attrs: AttributeInput[]) => Promise<void> | void;
}

function VariantEditCard({ variant, axes, onSetDefault, onRemove, onSaveAttrs }: VariantEditCardProps) {
  // Build initial attribute map keyed by axis (plus colorHex aux)
  const initial = useMemo(() => {
    const fromRel = new Map<string, AttributeInput>();
    for (const a of variant.variantAttrs ?? []) {
      fromRel.set(a.key, { key: a.key, value: a.value, colorHex: a.colorHex ?? null });
    }
    // Fallback to JSON cache if relational rows are empty
    if (fromRel.size === 0 && variant.variantAttributes) {
      const json = variant.variantAttributes;
      for (const [k, v] of Object.entries(json)) {
        if (k === 'colorHex') continue;
        if (v == null || v === '') continue;
        fromRel.set(k.toLowerCase(), {
          key: k.toLowerCase(),
          value: String(v),
          colorHex: (k.toLowerCase() === 'color' || k.toLowerCase() === 'colorname')
            ? (json.colorHex as string | undefined) ?? null
            : null,
        });
      }
    }
    return fromRel;
  }, [variant]);

  const [attrs, setAttrs] = useState<Map<string, AttributeInput>>(initial);
  const [busy, setBusy] = useState(false);
  useEffect(() => setAttrs(initial), [initial]);

  const dirty = useMemo(() => {
    if (attrs.size !== initial.size) return true;
    for (const [k, v] of attrs.entries()) {
      const i = initial.get(k);
      if (!i || i.value !== v.value || (i.colorHex ?? null) !== (v.colorHex ?? null)) return true;
    }
    return false;
  }, [attrs, initial]);

  const setAxis = (key: string, value: string) => {
    setAttrs(prev => {
      const next = new Map(prev);
      if (!value) next.delete(key);
      else next.set(key, { ...(next.get(key) ?? { key, value: '' }), key, value });
      return next;
    });
  };

  const setHex = (hex: string) => {
    setAttrs(prev => {
      const next = new Map(prev);
      const colorRow = next.get('color') ?? next.get('colorname');
      if (colorRow) next.set(colorRow.key, { ...colorRow, colorHex: hex || null });
      return next;
    });
  };

  const save = async () => {
    setBusy(true);
    try {
      await onSaveAttrs(Array.from(attrs.values()));
    } finally {
      setBusy(false);
    }
  };

  const colorRow = attrs.get('color') ?? attrs.get('colorname');
  const ensuredAxes = axes.length > 0 ? axes : ['color'];

  return (
    <div
      style={{
        border: variant.isDefaultVariant
          ? '2px solid var(--accent, #4a90e2)'
          : '1px solid var(--border, #e0e0e0)',
        borderRadius: 10,
        padding: 12,
        background: 'var(--surface, #fff)',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontWeight: 600 }}>{variant.productName}</div>
          <div style={{ fontSize: 12, color: '#888', fontFamily: 'inherit' }}>{variant.sku}</div>
        </div>
        {variant.isDefaultVariant && (
          <span
            style={{
              fontSize: 10, fontWeight: 700, padding: '2px 6px',
              borderRadius: 4, background: 'var(--accent, #4a90e2)', color: '#fff',
            }}
          >
            DEFAULT
          </span>
        )}
      </div>

      <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
        {ensuredAxes.map(axis => (
          <div key={axis} className={styles.field} style={{ margin: 0 }}>
            <label style={{ fontSize: 11, textTransform: 'uppercase' }}>{axis}</label>
            <input
              value={attrs.get(axis)?.value ?? ''}
              onChange={e => setAxis(axis, e.target.value)}
              placeholder={`e.g. ${axis === 'color' ? 'Ruby' : axis === 'size' ? 'Large' : '...'}`}
            />
          </div>
        ))}
        {colorRow && (
          <div className={styles.field} style={{ margin: 0 }}>
            <label style={{ fontSize: 11, textTransform: 'uppercase' }}>Color Hex</label>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
              <input
                type="color"
                value={colorRow.colorHex ?? '#cccccc'}
                onChange={e => setHex(e.target.value)}
                style={{ width: 40, height: 32, padding: 0, border: '1px solid #ccc' }}
              />
              <input
                value={colorRow.colorHex ?? ''}
                onChange={e => setHex(e.target.value)}
                placeholder="#9b111e"
                style={{ flex: 1 }}
              />
            </div>
          </div>
        )}
      </div>

      <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {!variant.isDefaultVariant && (
          <button className={styles['btn-secondary']} onClick={onSetDefault} style={{ fontSize: 12 }}>
            ★ Set Default
          </button>
        )}
        <button
          className={styles['btn-primary']}
          onClick={save}
          disabled={!dirty || busy}
          style={{ fontSize: 12 }}
        >
          {busy ? 'Saving…' : dirty ? 'Save Attrs' : 'Saved'}
        </button>
        <div style={{ flex: 1 }} />
        <button
          className={`${styles['card-action-btn']} ${styles['card-action-btn-danger']}`}
          onClick={onRemove}
          title="Remove from group"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}
