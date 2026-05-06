import { useState, useEffect, useMemo } from 'react';
import { categoriesApi } from '@/api/categories';
import { subcategoriesApi, type SubcategoryAdminDto } from '@/api/subcategories';
import type { CategoryDto } from '@/types';
import styles from './Admin.module.css';

interface FormState {
  categoryId: string;
  name: string;
  name_ar: string;
  slug: string;
  description: string;
  sort_order: string;
  isActive: boolean;
}

const emptyForm = (categoryId = ''): FormState => ({
  categoryId,
  name: '',
  name_ar: '',
  slug: '',
  description: '',
  sort_order: '0',
  isActive: true,
});

const autoSlug = (name: string) =>
  name.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-').replaceAll(/(^-|-$)/g, '');

export default function AdminSubcategoriesPage() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [subs, setSubs] = useState<SubcategoryAdminDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategoryId, setFilterCategoryId] = useState<string>('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<SubcategoryAdminDto | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);

  const loadCategories = () => {
    categoriesApi.getAll().then((r) => setCategories(Array.isArray(r) ? r : []));
  };

  const loadSubs = () => {
    setLoading(true);
    subcategoriesApi
      .list(filterCategoryId || undefined)
      .then((r) => setSubs(Array.isArray(r) ? r : []))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadSubs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterCategoryId]);

  const categoryById = useMemo(() => {
    const m = new Map<string, CategoryDto>();
    categories.forEach((c) => m.set(String(c.id), c));
    return m;
  }, [categories]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return subs;
    return subs.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.slug.toLowerCase().includes(term),
    );
  }, [subs, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm(filterCategoryId));
    setDrawerOpen(true);
  };

  const openEdit = (s: SubcategoryAdminDto) => {
    setEditing(s);
    setForm({
      categoryId: String(s.categoryId),
      name: s.name,
      name_ar: s.name_ar ?? '',
      slug: s.slug,
      description: s.description ?? '',
      sort_order: String(s.sort_order ?? 0),
      isActive: s.isActive,
    });
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
    setEditing(null);
  };

  const handleNameChange = (name: string) => {
    setForm((f) => ({ ...f, name, slug: !editing ? autoSlug(name) : f.slug }));
  };

  const save = async () => {
    if (!form.name.trim() || !form.categoryId) return;
    setSaving(true);
    try {
      const payload = {
        categoryId: Number.parseInt(form.categoryId, 10),
        name: form.name.trim(),
        name_ar: form.name_ar.trim() || null,
        slug: form.slug.trim() || undefined,
        description: form.description.trim() || null,
        sort_order: Number.parseInt(form.sort_order, 10) || 0,
        isActive: form.isActive,
      };
      if (editing) {
        await subcategoriesApi.update(editing.id, payload);
      } else {
        await subcategoriesApi.create(payload);
      }
      closeDrawer();
      loadSubs();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to save subcategory');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (s: SubcategoryAdminDto) => {
    if (
      !confirm(
        `Delete subcategory "${s.name}"? ${s.productCount} product(s) will be unlinked (kept in category).`,
      )
    )
      return;
    try {
      await subcategoriesApi.remove(s.id);
      loadSubs();
    } catch (err: any) {
      alert(err?.response?.data?.message ?? 'Failed to delete');
    }
  };

  return (
    <>
      <div className={styles['header-v2']}>
        <div>
          <h1>Subcategories</h1>
          <span className={styles['header-v2-sub']}>
            Refine categories with subgroupings used in filters and search
          </span>
        </div>
        <button className={styles['btn-primary']} onClick={openCreate}>
          + New Subcategory
        </button>
      </div>

      <div className={styles['admin-body']}>
        <div className={styles['toolbar-v2']}>
          <div className={styles['search-box']}>
            <span className={styles['search-icon']}>🔍</span>
            <input
              type="text"
              placeholder="Search subcategories…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            value={filterCategoryId}
            onChange={(e) => setFilterCategoryId(e.target.value)}
            style={{ minWidth: 200 }}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <span className={styles['count-chip']}>{filtered.length} subcategories</span>
        </div>

        {(() => {
          if (loading) return <div className="loading-spinner" />;
          if (filtered.length === 0) {
            return (
              <div className={styles['empty-state']}>
                <div className={styles['empty-state-icon']}>🏷️</div>
                <h3>{search ? 'No matches' : 'No subcategories yet'}</h3>
                <p>
                  {search
                    ? 'Try a different search term'
                    : 'Create a subcategory to start grouping products within a category'}
                </p>
              </div>
            );
          }
          return (
            <div className={styles['table-v2-wrap']}>
              <table className={styles['table-v2']}>
                <thead>
                  <tr>
                    <th>Subcategory</th>
                    <th>Category</th>
                    <th>Slug</th>
                    <th style={{ textAlign: 'center' }}>Order</th>
                    <th style={{ textAlign: 'center' }}>Active</th>
                    <th style={{ textAlign: 'center' }}>Products</th>
                    <th style={{ width: 100 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((s) => {
                    const cat = categoryById.get(String(s.categoryId));
                    return (
                      <tr key={s.id} onDoubleClick={() => openEdit(s)}>
                        <td>
                          <div className={styles['table-name']}>{s.name}</div>
                          {s.name_ar && (
                            <div className={styles['table-sub']} dir="rtl">
                              {s.name_ar}
                            </div>
                          )}
                        </td>
                        <td>
                          <span
                            className={
                              styles['table-tag'] + ' ' + styles['table-tag-yellow']
                            }
                          >
                            {cat?.name ?? `#${s.categoryId}`}
                          </span>
                        </td>
                        <td>
                          <code style={{ fontSize: 13, color: '#6b7280' }}>{s.slug}</code>
                        </td>
                        <td style={{ textAlign: 'center' }}>{s.sort_order}</td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className={
                              styles['table-tag'] +
                              ' ' +
                              (s.isActive
                                ? styles['table-tag-green']
                                : styles['table-tag-gray'])
                            }
                          >
                            {s.isActive ? 'Active' : 'Hidden'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <span
                            className={
                              styles['table-tag'] + ' ' + styles['table-tag-green']
                            }
                          >
                            {s.productCount}
                          </span>
                        </td>
                        <td>
                          <div className={styles['table-actions']}>
                            <button
                              className={styles['table-action-btn']}
                              title="Edit"
                              onClick={() => openEdit(s)}
                            >
                              ✏️
                            </button>
                            <button
                              className={`${styles['table-action-btn']} ${styles['table-action-btn-danger']}`}
                              title="Delete"
                              onClick={() => remove(s)}
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>

      {drawerOpen && (
        <>
          <button
            type="button"
            aria-label="Close"
            className={styles['drawer-backdrop']}
            onClick={closeDrawer}
          />
          <div className={styles.drawer}>
            <div className={styles['drawer-header']}>
              <h2>{editing ? 'Edit Subcategory' : 'New Subcategory'}</h2>
              <button className={styles['drawer-close']} onClick={closeDrawer}>
                ✕
              </button>
            </div>
            <div className={styles['drawer-body']}>
              <div className={styles.field}>
                <label htmlFor="sub-category">Category *</label>
                <select
                  id="sub-category"
                  value={form.categoryId}
                  onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
                >
                  <option value="">— Select category —</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className={styles['field-row']}>
                <div className={styles.field}>
                  <label htmlFor="sub-name">Name *</label>
                  <input
                    id="sub-name"
                    value={form.name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="e.g. Frying Pans"
                  />
                </div>
                <div className={styles.field}>
                  <label htmlFor="sub-slug">Slug</label>
                  <input
                    id="sub-slug"
                    value={form.slug}
                    onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                    placeholder="auto-generated"
                  />
                  <span className={styles['field-hint']}>URL-friendly identifier</span>
                </div>
              </div>

              <div className={styles.field}>
                <label htmlFor="sub-name-ar">Arabic Name</label>
                <input
                  id="sub-name-ar"
                  value={form.name_ar}
                  onChange={(e) => setForm((f) => ({ ...f, name_ar: e.target.value }))}
                  placeholder="الاسم بالعربية"
                  dir="rtl"
                />
              </div>

              <div className={styles.field}>
                <label htmlFor="sub-description">Description</label>
                <textarea
                  id="sub-description"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  placeholder="Brief description of this subcategory…"
                />
              </div>

              <div className={styles['field-row']}>
                <div className={styles.field}>
                  <label htmlFor="sub-order">Sort Order</label>
                  <input
                    id="sub-order"
                    type="number"
                    value={form.sort_order}
                    onChange={(e) => setForm((f) => ({ ...f, sort_order: e.target.value }))}
                  />
                  <span className={styles['field-hint']}>Lower values shown first</span>
                </div>
                <div className={styles.field}>
                  <label htmlFor="sub-active" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      id="sub-active"
                      type="checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                    />
                    <span>Active (visible to customers)</span>
                  </label>
                </div>
              </div>
            </div>
            <div className={styles['drawer-footer']}>
              <button className={styles['btn-secondary']} onClick={closeDrawer}>
                Cancel
              </button>
              <button
                className={styles['btn-primary']}
                onClick={save}
                disabled={!form.name.trim() || !form.categoryId || saving}
              >
                {(() => {
                  if (saving) return 'Saving…';
                  return editing ? 'Update Subcategory' : 'Create Subcategory';
                })()}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
