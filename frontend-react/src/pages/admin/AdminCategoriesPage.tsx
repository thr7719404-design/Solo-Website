import { useState, useEffect, useRef } from 'react';
import { categoriesApi } from '@/api/categories';
import { mediaApi } from '@/api/media';
import type { CategoryDto } from '@/types';
import styles from './Admin.module.css';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CategoryDto | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ name: '', slug: '', description: '', imageUrl: '', parentId: '' });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image must be smaller than 5 MB');
      return;
    }
    setUploadError(null);
    setUploading(true);
    try {
      const result = await mediaApi.uploadFile(file, 'categories');
      setForm(f => ({ ...f, imageUrl: result.url }));
    } catch (err: any) {
      setUploadError(err?.response?.data?.message || err?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const clearImage = () => {
    setForm(f => ({ ...f, imageUrl: '' }));
    setUploadError(null);
  };

  const load = () => {
    setLoading(true);
    categoriesApi.getAll().then(r => { setCategories(Array.isArray(r) ? r : []); setLoading(false); });
  };

  useEffect(load, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', slug: '', description: '', imageUrl: '', parentId: '' });
    setDrawerOpen(true);
  };

  const openEdit = (c: CategoryDto) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug ?? '', description: c.description ?? '', imageUrl: c.imageUrl ?? c.image ?? '', parentId: c.parentId ?? '' });
    setDrawerOpen(true);
  };

  const closeDrawer = () => { setDrawerOpen(false); setEditing(null); };

  const autoSlug = (name: string) =>
    name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/(^-|-$)/g, '');

  const handleNameChange = (name: string) => {
    setForm(f => ({ ...f, name, slug: !editing ? autoSlug(name) : f.slug }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const payload: any = { ...form, parentId: form.parentId || undefined };
      if (editing) {
        const updated = await categoriesApi.update(editing.id, payload);
        // Update local state directly — the GET endpoint has a 5-min server-side cache
        // so a fresh load() would return stale data.
        setCategories(cats => cats.map(c =>
          String(c.id) === String(editing.id)
            ? { ...c, name: updated.name ?? form.name, slug: updated.slug ?? form.slug, description: updated.description ?? form.description, imageUrl: form.imageUrl, image: form.imageUrl, parentId: form.parentId || undefined }
            : c,
        ));
      } else {
        await categoriesApi.create(payload);
        load(); // fresh fetch needed to get the new ID from the server
      }
      closeDrawer();
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this category? Products in this category will be unlinked.')) return;
    await categoriesApi.delete(id);
    setCategories(cats => cats.filter(c => String(c.id) !== String(id)));
  };

  const filtered = categories.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className={styles['header-v2']}>
        <div>
          <h1>Categories</h1>
          <span className={styles['header-v2-sub']}>Organize your product catalog</span>
        </div>
        <button className={styles['btn-primary']} onClick={openCreate}>+ New Category</button>
      </div>

      <div className={styles['admin-body']}>
        <div className={styles['toolbar-v2']}>
          <div className={styles['search-box']}>
            <span className={styles['search-icon']}>🔍</span>
            <input
              type="text"
              placeholder="Search categories…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <span className={styles['count-chip']}>{filtered.length} categories</span>
        </div>

        {(() => {
          if (loading) return <div className="loading-spinner" />;
          if (filtered.length === 0) {
            return (
          <div className={styles['empty-state']}>
            <div className={styles['empty-state-icon']}>📂</div>
            <h3>{search ? 'No matches' : 'No categories yet'}</h3>
            <p>{search ? 'Try a different search term' : 'Create your first category to get started'}</p>
          </div>
            );
          }
          return (
          <div className={styles['table-v2-wrap']}>
            <table className={styles['table-v2']}>
              <thead>
                <tr>
                  <th style={{ width: 60 }}></th>
                  <th>Category</th>
                  <th>Slug</th>
                  <th>Parent</th>
                  <th style={{ textAlign: 'center' }}>Products</th>
                  <th style={{ width: 100 }}></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} onDoubleClick={() => openEdit(c)}>
                    <td>
                      {(c.imageUrl || c.image) ? (
                        <img src={c.imageUrl || c.image} alt="" className={styles['table-thumb']} />
                      ) : (
                        <div className={styles['table-thumb']} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                          📁
                        </div>
                      )}
                    </td>
                    <td>
                      <div className={styles['table-name']}>{c.name}</div>
                      {c.description && <div className={styles['table-sub']}>{c.description}</div>}
                    </td>
                    <td><code style={{ fontSize: 13, color: '#6b7280' }}>{c.slug}</code></td>
                    <td>
                      {c.parentId ? (
                        <span className={styles['table-tag'] + ' ' + styles['table-tag-yellow']}>
                          {categories.find(p => p.id === c.parentId)?.name ?? '—'}
                        </span>
                      ) : (
                        <span className={styles['table-tag'] + ' ' + styles['table-tag-gray']}>Top-level</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <span className={styles['table-tag'] + ' ' + styles['table-tag-green']}>{(c as any).productCount ?? 0}</span>
                    </td>
                    <td>
                      <div className={styles['table-actions']}>
                        <button className={styles['table-action-btn']} title="Edit" onClick={() => openEdit(c)}>✏️</button>
                        <button className={`${styles['table-action-btn']} ${styles['table-action-btn-danger']}`} title="Delete" onClick={() => remove(c.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
              <h2>{editing ? 'Edit Category' : 'New Category'}</h2>
              <button className={styles['drawer-close']} onClick={closeDrawer}>✕</button>
            </div>
            <div className={styles['drawer-body']}>
              <div className={styles.field}>
                <label>Category Image</label>
                <div className={styles['img-preview']}>
                  {form.imageUrl ? (
                    <img src={form.imageUrl} alt="Preview" />
                  ) : (
                    <div className={styles['img-preview-empty']}>
                      <div style={{ fontSize: 32, marginBottom: 4 }}>🖼️</div>
                      <div>No image uploaded yet</div>
                    </div>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) void handleImageUpload(file);
                  }}
                />
                <div style={{ display: 'flex', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                  <button
                    type="button"
                    className={styles['btn-secondary']}
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {(() => {
                      if (uploading) return 'Uploading…';
                      return form.imageUrl ? '🔄 Replace image' : '📤 Upload image';
                    })()}
                  </button>
                  {form.imageUrl && !uploading && (
                    <button
                      type="button"
                      className={styles['btn-secondary']}
                      onClick={clearImage}
                    >
                      🗑️ Remove
                    </button>
                  )}
                </div>
                {uploadError && (
                  <div style={{ color: '#dc2626', fontSize: 13, marginTop: 6 }}>{uploadError}</div>
                )}
                <span className={styles['field-hint']}>PNG, JPG, or WebP — up to 5 MB</span>
              </div>

              <div className={styles['field-row']}>
                <div className={styles.field}>
                  <label htmlFor="name">Name *</label>
                  <input id="name"
                    value={form.name}
                    onChange={e => handleNameChange(e.target.value)}
                    placeholder="e.g. Cookware"
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

              <div className={styles.field}>
                <label htmlFor="description">Description</label>
                <textarea id="description"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of this category…"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="parent-category">Parent Category</label>
                <select id="parent-category" value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}>
                  <option value="">— None (top-level) —</option>
                  {categories.filter(c => !c.parentId && c.id !== editing?.id).map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className={styles['drawer-footer']}>
              <button className={styles['btn-secondary']} onClick={closeDrawer}>Cancel</button>
              <button className={styles['btn-primary']} onClick={save} disabled={!form.name.trim() || saving}>
                {(() => {
                  if (saving) return 'Saving…';
                  return editing ? 'Update Category' : 'Create Category';
                })()}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
