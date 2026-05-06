import { useState, useEffect, useRef } from 'react';
import { brandsApi } from '@/api/brands';
import { mediaApi } from '@/api/admin';
import type { BrandDto } from '@/types';
import styles from './Admin.module.css';

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<BrandDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BrandDto | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', slug: '', logoUrl: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    brandsApi.getAll().then(r => { setBrands(Array.isArray(r) ? r : []); setLoading(false); });
  };
  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', slug: '', logoUrl: '' });
    setDrawerOpen(true);
  };

  const openEdit = (b: BrandDto) => {
    setEditing(b);
    setForm({ name: b.name, slug: b.slug ?? '', logoUrl: b.logoUrl ?? b.logo ?? '' });
    setDrawerOpen(true);
  };

  const closeDrawer = () => { setDrawerOpen(false); setEditing(null); };

  const autoSlug = (name: string) =>
    name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/(^-|-$)/g, '');

  const handleNameChange = (name: string) => {
    setForm(f => ({ ...f, name, slug: !editing ? autoSlug(name) : f.slug }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await mediaApi.upload(file, 'brands');
      const url = res?.url ?? res?.data?.url;
      if (url) setForm(f => ({ ...f, logoUrl: url }));
      else alert('Upload succeeded but no URL was returned.');
    } catch (err: any) {
      alert(`Upload failed: ${err?.response?.data?.message ?? err?.message ?? 'Unknown error'}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      // Send `logo` and `logoUrl` for backwards compat; omit empty so URL validator
      // does not reject an empty string.
      const payload: any = {
        name: form.name.trim(),
        slug: form.slug.trim() || undefined,
      };
      if (form.logoUrl.trim()) {
        payload.logo = form.logoUrl.trim();
        payload.logoUrl = form.logoUrl.trim();
      } else {
        payload.logoUrl = '';
      }
      if (editing) await brandsApi.update(editing.id, payload);
      else await brandsApi.create(payload);
      closeDrawer();
      load();
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      alert(`Failed to save brand: ${Array.isArray(msg) ? msg.join(', ') : (msg ?? err?.message ?? 'Unknown error')}`);
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this brand and unlink all its products?')) return;
    await brandsApi.delete(id);
    load();
  };

  const filtered = brands.filter(b =>
    !search || b.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className={styles['header-v2']}>
        <div>
          <h1>Brands</h1>
          <span className={styles['header-v2-sub']}>Manage your product brands</span>
        </div>
        <button className={styles['btn-primary']} onClick={openCreate}>+ New Brand</button>
      </div>

      <div className={styles['admin-body']}>
        <div className={styles['toolbar-v2']}>
          <div className={styles['search-box']}>
            <span className={styles['search-icon']}>🔍</span>
            <input
              type="text"
              placeholder="Search brands…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span className={styles['count-chip']}>{filtered.length} brands</span>
        </div>

        {(() => {
          if (loading) return <div className="loading-spinner" />;
          if (filtered.length === 0) {
            return (
          <div className={styles['empty-state']}>
            <div className={styles['empty-state-icon']}>🏷️</div>
            <h3>{search ? 'No matches' : 'No brands yet'}</h3>
            <p>{search ? 'Try a different search term' : 'Create your first brand to get started'}</p>
          </div>
            );
          }
          return (
          <div className={styles['cards-grid']}>
            {filtered.map(b => (
              <div key={b.id} className={styles['card-item']}>
                <div className={styles['card-avatar']}>
                  {(b.logoUrl ?? b.logo) ? (
                    <img src={b.logoUrl ?? b.logo} alt={b.name} />
                  ) : (
                    <span>{b.name.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <div className={styles['card-info']}>
                  <strong>{b.name}</strong>
                </div>
                <div className={styles['card-actions']}>
                  <button className={styles['card-action-btn']} title="Edit" onClick={() => openEdit(b)}>✏️</button>
                  <button className={`${styles['card-action-btn']} ${styles['card-action-btn-danger']}`} title="Delete" onClick={() => remove(b.id)}>🗑️</button>
                </div>
                {(b as any).productCount != null && (
                  <div className={styles['card-badge']}>{(b as any).productCount} products</div>
                )}
              </div>
            ))}
          </div>
          );
        })()}
      </div>

      {/* ── Slide-over Drawer ── */}
      {drawerOpen && (
        <>
          <button type="button" aria-label="Close" className={styles['drawer-backdrop']} onClick={closeDrawer} />
          <div className={styles.drawer}>
            <div className={styles['drawer-header']}>
              <h2>{editing ? 'Edit Brand' : 'New Brand'}</h2>
              <button className={styles['drawer-close']} onClick={closeDrawer}>✕</button>
            </div>
            <div className={styles['drawer-body']}>
              <div className={styles.field}>
                <label>Logo Preview</label>
                <div className={styles['img-preview']}>
                  {form.logoUrl ? (
                    <img src={form.logoUrl} alt="Preview" />
                  ) : (
                    <div className={styles['img-preview-empty']}>
                      <div style={{ fontSize: 32, marginBottom: 4 }}>🏷️</div>
                      <div>Upload an image or paste a URL below</div>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="logo-upload">Upload Logo</label>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <input
                    id="logo-upload"
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    disabled={uploading}
                    style={{ flex: 1 }}
                  />
                  {uploading && <span className={styles['field-hint']}>Uploading…</span>}
                </div>
                <span className={styles['field-hint']}>PNG, JPG, SVG, or WebP. Max 5MB.</span>
              </div>

              <div className={styles.field}>
                <label htmlFor="logo-url">Logo URL</label>
                <input id="logo-url"
                  value={form.logoUrl}
                  onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))}
                  placeholder="https://example.com/logo.png (or upload above)"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="name">Name *</label>
                <input id="name"
                  value={form.name}
                  onChange={e => handleNameChange(e.target.value)}
                  placeholder="e.g. Le Creuset"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="slug">Slug</label>
                <input id="slug"
                  value={form.slug}
                  onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
                  placeholder="auto-generated"
                />
                <span className={styles['field-hint']}>URL-friendly identifier</span>
              </div>
            </div>
            <div className={styles['drawer-footer']}>
              <button className={styles['btn-secondary']} onClick={closeDrawer}>Cancel</button>
              <button className={styles['btn-primary']} onClick={save} disabled={!form.name.trim() || saving}>
                {(() => {
                  if (saving) return 'Saving…';
                  return editing ? 'Update Brand' : 'Create Brand';
                })()}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
