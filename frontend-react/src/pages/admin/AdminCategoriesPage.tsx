import { useState, useEffect } from 'react';
import { categoriesApi } from '@/api/categories';
import type { CategoryDto } from '@/types';
import styles from './Admin.module.css';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<CategoryDto | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', description: '', imageUrl: '', parentId: '' });

  const load = () => {
    setLoading(true);
    categoriesApi.getAll().then(r => { setCategories(Array.isArray(r) ? r : []); setLoading(false); });
  };

  useEffect(load, []);

  const resetForm = () => { setForm({ name: '', slug: '', description: '', imageUrl: '', parentId: '' }); setEditing(null); };

  const startEdit = (c: CategoryDto) => {
    setEditing(c);
    setForm({ name: c.name, slug: c.slug ?? '', description: c.description ?? '', imageUrl: c.imageUrl ?? '', parentId: c.parentId ?? '' });
  };

  const save = async () => {
    const payload: any = { ...form, parentId: form.parentId || undefined };
    if (editing) {
      await categoriesApi.update(editing.id, payload);
    } else {
      await categoriesApi.create(payload);
    }
    resetForm();
    load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    await categoriesApi.delete(id);
    load();
  };

  return (
    <>
      <div className={styles['admin-header']}><h1>Categories</h1></div>
      <div className={styles['admin-body']}>
        <div className={styles['admin-form']} style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 12 }}>{editing ? 'Edit Category' : 'Add Category'}</h3>
          <div className={styles['form-row']}>
            <div className={styles['form-group']}>
              <label>Name</label>
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
            <div className={styles['form-group']}>
              <label>Slug</label>
              <input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} />
            </div>
          </div>
          <div className={styles['form-group']}>
            <label>Description</label>
            <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className={styles['form-row']}>
            <div className={styles['form-group']}>
              <label>Image URL</label>
              <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} />
            </div>
            <div className={styles['form-group']}>
              <label>Parent Category</label>
              <select value={form.parentId} onChange={e => setForm(f => ({ ...f, parentId: e.target.value }))}>
                <option value="">— None (top-level) —</option>
                {categories.filter(c => !c.parentId && c.id !== editing?.id).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className={styles['form-actions']}>
            <button className="btn btn-accent" onClick={save}>Save</button>
            {editing && <button className="btn btn-outline" onClick={resetForm}>Cancel</button>}
          </div>
        </div>

        {loading ? <div className="loading-spinner" /> : (
          <div className={styles['admin-table-wrap']}>
            <table className={styles['admin-table']}>
              <thead>
                <tr><th>Image</th><th>Name</th><th>Slug</th><th>Parent</th><th>Products</th><th></th></tr>
              </thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c.id}>
                    <td>{c.imageUrl ? <img src={c.imageUrl} alt="" /> : '—'}</td>
                    <td>{c.name}</td>
                    <td>{c.slug}</td>
                    <td>{c.parentId ? categories.find(p => p.id === c.parentId)?.name ?? '—' : '—'}</td>
                    <td>{(c as any).productCount ?? '—'}</td>
                    <td>
                      <button onClick={() => startEdit(c)} style={{ fontSize: 13, color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', marginRight: 8 }}>Edit</button>
                      <button onClick={() => remove(c.id)} style={{ fontSize: 13, color: '#991b1b', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
