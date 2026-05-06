import { useState, useEffect } from 'react';
import { contentApi } from '@/api/content';
import ImageUploadField from '@/components/admin/ImageUploadField';
import styles from './Admin.module.css';

const PLACEMENTS = [
  { value: 'HOME_HERO', label: 'Home Hero (full-width carousel)' },
  { value: 'HOME_MID', label: 'Home Mid (narrow strip)' },
  { value: 'HOME_BOTTOM', label: 'Home Bottom (narrow strip)' },
];

const defaultForm = {
  title: '',
  subtitle: '',
  imageDesktopUrl: '',
  imageMobileUrl: '',
  ctaText: '',
  ctaUrl: '',
  placement: 'HOME_HERO',
  isActive: true,
  displayOrder: 0,
};

interface CategoryTile {
  title?: string;
  description?: string;
  imageUrl?: string;
  linkUrl?: string;
  isEnabled?: boolean;
}

const defaultTileForm = { title: '', description: '', imageUrl: '', linkUrl: '' };

export default function AdminBannersPage() {
  const [activeTab, setActiveTab] = useState<'banners' | 'tiles'>('banners');

  // ── Promotional Banners ──────────────────────────────────────────────────
  const [banners, setBanners] = useState<any[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ ...defaultForm });
  const [saving, setSaving] = useState(false);

  const load = () => { contentApi.getAllBanners().then(setBanners).catch(() => {}); };
  useEffect(load, []);

  const openNew = () => {
    setEditing(null);
    setForm({ ...defaultForm });
    setDrawerOpen(true);
  };

  const openEdit = (b: any) => {
    setEditing(b);
    setForm({
      title: b.title ?? '',
      subtitle: b.subtitle ?? '',
      imageDesktopUrl: b.imageDesktopUrl ?? '',
      imageMobileUrl: b.imageMobileUrl ?? '',
      ctaText: b.ctaText ?? '',
      ctaUrl: b.ctaUrl ?? '',
      placement: b.placement ?? 'HOME_HERO',
      isActive: b.isActive ?? true,
      displayOrder: b.displayOrder ?? 0,
    });
    setDrawerOpen(true);
  };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) await contentApi.updateBanner(editing.id, form);
      else await contentApi.createBanner(form);
      setDrawerOpen(false);
      load();
    } catch { /* */ }
    setSaving(false);
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    await contentApi.deleteBanner(id).catch(() => {});
    load();
  };

  const placementLabel = (p: string) => PLACEMENTS.find(pl => pl.value === p)?.label ?? p;
  const posTag = (p: string) => {
    if (p === 'HOME_HERO') return 'table-tag-cyan';
    if (p.startsWith('HOME')) return 'table-tag-violet';
    return 'table-tag-blue';
  };

  // ── Category Tiles ───────────────────────────────────────────────────────
  const [tiles, setTiles] = useState<CategoryTile[]>([]);
  const [tilesColumns, setTilesColumns] = useState(4);
  const [tilesSectionId, setTilesSectionId] = useState<string | null>(null);
  const [tilesLoading, setTilesLoading] = useState(false);
  const [tilesSaving, setTilesSaving] = useState(false);
  const [tileDrawerOpen, setTileDrawerOpen] = useState(false);
  const [editingTileIdx, setEditingTileIdx] = useState<number | null>(null);
  const [tileForm, setTileForm] = useState({ ...defaultTileForm });
  const [tilesSaveMsg, setTilesSaveMsg] = useState('');

  const loadTiles = async () => {
    setTilesLoading(true);
    try {
      const home = await (contentApi.getHome() as Promise<any>);
      const sec = (home?.sections ?? []).find((s: any) => s.type === 'CATEGORY_TILES');
      if (sec) {
        const data: any = typeof sec.data === 'string' ? JSON.parse(sec.data) : (sec.data ?? {});
        setTilesSectionId(sec.id);
        setTilesColumns((data.columns as number) ?? 4);
        setTiles((data.tiles as CategoryTile[]) ?? []);
      }
    } catch { /* */ }
    setTilesLoading(false);
  };

  useEffect(() => { if (activeTab === 'tiles') loadTiles(); }, [activeTab]);

  const saveTiles = async () => {
    if (!tilesSectionId) return;
    setTilesSaving(true);
    try {
      await contentApi.updateSection(tilesSectionId, { data: JSON.stringify({ tiles, columns: tilesColumns }) } as any);
      setTilesSaveMsg('Saved!');
      setTimeout(() => setTilesSaveMsg(''), 2500);
    } catch { setTilesSaveMsg('Error saving'); setTimeout(() => setTilesSaveMsg(''), 3000); }
    setTilesSaving(false);
  };

  const openNewTile = () => {
    setEditingTileIdx(null);
    setTileForm({ ...defaultTileForm });
    setTileDrawerOpen(true);
  };

  const openEditTile = (idx: number) => {
    const t = tiles[idx];
    setEditingTileIdx(idx);
    setTileForm({ title: t.title ?? '', description: t.description ?? '', imageUrl: t.imageUrl ?? '', linkUrl: t.linkUrl ?? '' });
    setTileDrawerOpen(true);
  };

  const saveTileForm = () => {
    const newTile: CategoryTile = { ...tileForm, isEnabled: true };
    if (editingTileIdx !== null) {
      setTiles(prev => prev.map((t, i) => i === editingTileIdx ? newTile : t));
    } else {
      setTiles(prev => [...prev, newTile]);
    }
    setTileDrawerOpen(false);
  };

  const removeTile = (idx: number) => {
    if (!confirm('Remove this tile?')) return;
    setTiles(prev => prev.filter((_, i) => i !== idx));
  };

  const moveTile = (idx: number, dir: -1 | 1) => {
    const next = idx + dir;
    if (next < 0 || next >= tiles.length) return;
    setTiles(prev => {
      const arr = [...prev];
      [arr[idx], arr[next]] = [arr[next], arr[idx]];
      return arr;
    });
  };

  // ── Tab styles (inline) ──────────────────────────────────────────────────
  const tabBar: React.CSSProperties = { display: 'flex', gap: 0, borderBottom: '2px solid var(--admin-border)', marginBottom: 0, paddingLeft: 24, paddingTop: 8 };
  const tab = (active: boolean): React.CSSProperties => ({
    padding: '10px 20px', cursor: 'pointer', fontWeight: active ? 700 : 500,
    fontSize: 14, color: active ? 'var(--admin-accent)' : 'var(--admin-text-muted)',
    borderBottom: active ? '2px solid var(--admin-accent)' : '2px solid transparent',
    marginBottom: -2, background: 'none', border: 'none', borderBottomStyle: 'solid',
    borderBottomWidth: 2, borderBottomColor: active ? 'var(--admin-accent)' : 'transparent',
    transition: 'color 0.15s',
  });

  return (
    <>
      <div className={styles['header-v2']}>
        <div>
          <h1>Banners &amp; Content</h1>
          <span className={styles['header-v2-sub']}>Manage banners and homepage category tiles</span>
        </div>
        {activeTab === 'banners' && (
          <button className={styles['btn-primary']} onClick={openNew}>+ New Banner</button>
        )}
        {activeTab === 'tiles' && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {tilesSaveMsg && <span style={{ fontSize: 13, color: tilesSaveMsg.startsWith('Error') ? '#e74c3c' : '#27ae60' }}>{tilesSaveMsg}</span>}
            <button className={styles['btn-secondary']} onClick={openNewTile}>+ Add Tile</button>
            <button className={styles['btn-primary']} disabled={tilesSaving || !tilesSectionId} onClick={saveTiles}>
              {tilesSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      {/* Tab bar */}
      <div style={tabBar}>
        <button style={tab(activeTab === 'banners')} onClick={() => setActiveTab('banners')}>Promotional Banners</button>
        <button style={tab(activeTab === 'tiles')} onClick={() => setActiveTab('tiles')}>Category Tiles</button>
      </div>

      {/* ── Banners Tab ── */}
      {activeTab === 'banners' && (
        <div className={styles['admin-body']}>
          <div className={styles['table-v2-wrap']}>
            <table className={styles['table-v2']}>
              <thead>
                <tr><th>Preview</th><th>Title</th><th>Position</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {banners.length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>No banners yet</td></tr>
                ) : (
                  banners.map(b => {
                    // Backend now returns a computed `status` (ACTIVE/SCHEDULED/EXPIRED/INACTIVE).
                    // Fall back to a local computation for older payloads so the UI never lies.
                    const now = new Date();
                    const fallback = (() => {
                      if (!b.isActive) return 'INACTIVE';
                      if (b.startAt && new Date(b.startAt) > now) return 'SCHEDULED';
                      if (b.endAt && new Date(b.endAt) < now) return 'EXPIRED';
                      return 'ACTIVE';
                    })();
                    const status: string = (b as any).status ?? fallback;
                    const tagClass =
                      status === 'ACTIVE' ? 'table-tag-green' :
                      status === 'SCHEDULED' ? 'table-tag-amber' :
                      status === 'EXPIRED' ? 'table-tag-red' :
                      'table-tag-gray';
                    const label =
                      status === 'ACTIVE' ? 'Live' :
                      status === 'SCHEDULED' ? 'Scheduled' :
                      status === 'EXPIRED' ? 'Expired' :
                      'Inactive';
                    return (
                    <tr key={b.id}>
                      <td>
                        {b.imageDesktopUrl ? (
                          <img src={b.imageDesktopUrl} alt="" className={styles['table-thumb']} style={{ borderRadius: 6, width: 80, height: 40, objectFit: 'cover' }} />
                        ) : <div className={styles['table-thumb']} style={{ borderRadius: 6, width: 80, height: 40 }} />}
                      </td>
                      <td>
                        <div className={styles['table-name']}>{b.title}</div>
                        {b.subtitle && <div className={styles['table-sub']}>{b.subtitle}</div>}
                      </td>
                      <td><span className={`${styles['table-tag']} ${styles[posTag(b.placement)]}`}>{placementLabel(b.placement)}</span></td>
                      <td>
                        <span className={`${styles['table-tag']} ${styles[tagClass]}`}>
                          {label}
                        </span>
                      </td>
                      <td>
                        <div className={styles['table-actions']}>
                          <button className={styles['table-action-btn']} onClick={() => openEdit(b)} title="Edit">✏️</button>
                          <button className={styles['table-action-btn-danger']} onClick={() => remove(b.id)} title="Delete">🗑</button>
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
      )}

      {/* ── Category Tiles Tab ── */}
      {activeTab === 'tiles' && (
        <div className={styles['admin-body']}>
          {/* Column count control */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, padding: '14px 20px', background: 'var(--admin-glass)', borderRadius: 10, border: '1px solid var(--admin-border)' }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Columns per row:</span>
            {[2, 3, 4, 5, 6].map(n => (
              <button
                key={n}
                onClick={() => setTilesColumns(n)}
                style={{
                  width: 36, height: 36, borderRadius: 8, border: '2px solid',
                  borderColor: tilesColumns === n ? 'var(--admin-accent)' : 'var(--admin-border)',
                  background: tilesColumns === n ? 'var(--admin-accent)' : 'transparent',
                  color: tilesColumns === n ? '#fff' : 'var(--admin-text)',
                  fontWeight: 700, cursor: 'pointer', fontSize: 14,
                }}
              >{n}</button>
            ))}
            <span style={{ fontSize: 12, color: 'var(--admin-text-muted)', marginLeft: 8 }}>
              Tiles will always stretch to fill the 75% width area
            </span>
          </div>

          {tilesLoading ? (
            <div style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>Loading...</div>
          ) : (
            <div className={styles['table-v2-wrap']}>
              <table className={styles['table-v2']}>
                <thead>
                  <tr><th>Image</th><th>Title</th><th>Description</th><th>Link URL</th><th>Order</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {tiles.length === 0 ? (
                    <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-muted)' }}>No tiles yet — click "+ Add Tile"</td></tr>
                  ) : (
                    tiles.map((tile, idx) => (
                      <tr key={`${tile.title ?? tile.linkUrl ?? 'tile'}-${idx}`}>
                        <td>
                          {tile.imageUrl ? (
                            <img src={tile.imageUrl} alt="" style={{ borderRadius: 6, width: 70, height: 52, objectFit: 'cover' }} />
                          ) : <div style={{ borderRadius: 6, width: 70, height: 52, background: 'var(--admin-glass)' }} />}
                        </td>
                        <td><div className={styles['table-name']}>{tile.title || <em style={{ opacity: 0.5 }}>Untitled</em>}</div></td>
                        <td><div className={styles['table-sub']} style={{ maxWidth: 200 }}>{tile.description || <em style={{ opacity: 0.4 }}>—</em>}</div></td>
                        <td><span style={{ fontFamily: 'inherit', fontSize: 12, opacity: 0.8 }}>{tile.linkUrl || '—'}</span></td>
                        <td>
                          <div style={{ display: 'flex', gap: 4 }}>
                            <button className={styles['table-action-btn']} onClick={() => moveTile(idx, -1)} disabled={idx === 0} title="Move up" style={{ fontSize: 12, padding: '4px 8px' }}>↑</button>
                            <button className={styles['table-action-btn']} onClick={() => moveTile(idx, 1)} disabled={idx === tiles.length - 1} title="Move down" style={{ fontSize: 12, padding: '4px 8px' }}>↓</button>
                          </div>
                        </td>
                        <td>
                          <div className={styles['table-actions']}>
                            <button className={styles['table-action-btn']} onClick={() => openEditTile(idx)} title="Edit">✏️</button>
                            <button className={styles['table-action-btn-danger']} onClick={() => removeTile(idx)} title="Remove">🗑</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── Banner Drawer ── */}
      {drawerOpen && (
        <>
          <button type="button" aria-label="Close" className={styles['drawer-backdrop']} onClick={() => setDrawerOpen(false)} />
          <div className={styles['drawer']}>
            <div className={styles['drawer-header']}>
              <h2>{editing ? 'Edit Banner' : 'New Banner'}</h2>
              <button className={styles['drawer-close']} onClick={() => setDrawerOpen(false)}>✕</button>
            </div>
            <div className={styles['drawer-body']}>
              <div className={styles['field']}>
                <label htmlFor="title">Title</label>
                <input id="title" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className={styles['field']}>
                <label htmlFor="subtitle">Subtitle</label>
                <input id="subtitle" value={form.subtitle} onChange={e => setForm({ ...form, subtitle: e.target.value })} />
              </div>
              <div className={styles['field']}>
                <ImageUploadField
                  label="Desktop Image"
                  value={form.imageDesktopUrl}
                  onChange={(url) => setForm({ ...form, imageDesktopUrl: url })}
                  folder="banners"
                  required
                />
              </div>
              <div className={styles['field']}>
                <ImageUploadField
                  label="Mobile Image (optional)"
                  value={form.imageMobileUrl}
                  onChange={(url) => setForm({ ...form, imageMobileUrl: url })}
                  folder="banners"
                />
              </div>
              <div className={styles['field']}>
                <label htmlFor="cta-text">CTA Text</label>
                <input id="cta-text" value={form.ctaText} onChange={e => setForm({ ...form, ctaText: e.target.value })} placeholder="e.g. Shop Now" />
              </div>
              <div className={styles['field']}>
                <label htmlFor="cta-link">CTA Link</label>
                <input id="cta-link" value={form.ctaUrl} onChange={e => setForm({ ...form, ctaUrl: e.target.value })} placeholder="/collections/new-arrivals" />
              </div>
              <div className={styles['field-row']}>
                <div className={styles['field']}>
                  <label htmlFor="placement">Placement</label>
                  <select id="placement" value={form.placement} onChange={e => setForm({ ...form, placement: e.target.value })}>
                    {PLACEMENTS.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                  </select>
                </div>
                <div className={styles['field']}>
                  <label htmlFor="display-order">Display Order</label>
                  <input id="display-order" type="number" value={form.displayOrder} onChange={e => setForm({ ...form, displayOrder: Number(e.target.value) })} min={0} />
                </div>
              </div>
              <div className={styles['field']}>
                <label>Status</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button type="button" role="switch" aria-checked={form.isActive} className={`${styles['switch']} ${form.isActive ? styles['switch-on'] : ''}`} onClick={() => setForm({ ...form, isActive: !form.isActive })}>
                    <div className={styles['switch-dot']} />
                  </button>
                  <span className={styles['field-hint']}>{form.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
            </div>
            <div className={styles['drawer-footer']}>
              {!form.imageDesktopUrl && <span style={{ fontSize: 12, color: '#e74c3c', marginRight: 'auto' }}>Desktop image is required</span>}
              <button className={styles['btn-secondary']} onClick={() => setDrawerOpen(false)}>Cancel</button>
              <button className={styles['btn-primary']} disabled={saving || !form.title || !form.imageDesktopUrl} onClick={save}>
                {(() => {
                  if (saving) return 'Saving...';
                  return editing ? 'Update' : 'Create';
                })()}
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Tile Drawer ── */}
      {tileDrawerOpen && (
        <>
          <button type="button" aria-label="Close" className={styles['drawer-backdrop']} onClick={() => setTileDrawerOpen(false)} />
          <div className={styles['drawer']}>
            <div className={styles['drawer-header']}>
              <h2>{editingTileIdx !== null ? 'Edit Tile' : 'Add Tile'}</h2>
              <button className={styles['drawer-close']} onClick={() => setTileDrawerOpen(false)}>✕</button>
            </div>
            <div className={styles['drawer-body']}>
              <div className={styles['field']}>
                <label htmlFor="title-2">Title</label>
                <input id="title-2"
                  value={tileForm.title}
                  onChange={e => setTileForm({ ...tileForm, title: e.target.value })}
                  placeholder="e.g. Cookware"
                />
              </div>
              <div className={styles['field']}>
                <label>Description <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional — shown below the title)</span></label>
                <input
                  value={tileForm.description}
                  onChange={e => setTileForm({ ...tileForm, description: e.target.value })}
                  placeholder="e.g. Premium pots & pans"
                />
              </div>
              <div className={styles['field']}>
                <ImageUploadField
                  label="Tile Image"
                  value={tileForm.imageUrl}
                  onChange={(url) => setTileForm({ ...tileForm, imageUrl: url })}
                  folder="category-tiles"
                  required
                />
              </div>
              <div className={styles['field']}>
                <label htmlFor="link-url">Link URL</label>
                <input id="link-url"
                  value={tileForm.linkUrl}
                  onChange={e => setTileForm({ ...tileForm, linkUrl: e.target.value })}
                  placeholder="e.g. /category/cookware"
                />
                <span className={styles['field-hint']}>Where clicking the tile navigates to</span>
              </div>
            </div>
            <div className={styles['drawer-footer']}>
              {!tileForm.imageUrl && <span style={{ fontSize: 12, color: '#e74c3c', marginRight: 'auto' }}>Image is required</span>}
              <button className={styles['btn-secondary']} onClick={() => setTileDrawerOpen(false)}>Cancel</button>
              <button className={styles['btn-primary']} disabled={!tileForm.title || !tileForm.imageUrl} onClick={saveTileForm}>
                {editingTileIdx !== null ? 'Update Tile' : 'Add Tile'}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

