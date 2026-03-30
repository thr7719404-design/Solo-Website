import { useState, useEffect } from 'react';
import { brandsApi } from '@/api/brands';
import type { BrandDto } from '@/types';
import styles from './Admin.module.css';

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<BrandDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BrandDto | null>(null);
  const [form, setForm] = useState({ name: '', slug: '', logoUrl: '' });

  const load = () => {
    setLoading(true);
    brandsApi.getAll().then(r => { setBrands(Array.isArray(r) ? r : []); setLoading(false); });
  };
  useEffect(load, []);

  const resetForm = () => { setForm({ name: '', slug: '', logoUrl: '' }); setEditing(null); };

  const startEdit = (b: BrandDto) => {
    setEditing(b);
    setForm({ name: b.name, slug: b.slug ?? '', logoUrl: b.logoUrl ?? '' });
  };

  const save = async () => {
    if (editing) await brandsApi.update(editing.id, form);
    else await brandsApi.create(form);
    resetForm(); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this brand?')) return;
    await brandsApi.delete(id);
    load();
  };

  return (
    <>
      <div className={styles['admin-header']}><h1>Brands</h1></div>
      <div className={styles['admin-body']}>
        <div className={styles['admin-form']} style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 12 }}>{editing ? 'Edit Brand' : 'Add Brand'}</h3>
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
            <label>Logo URL</label>
            <input value={form.logoUrl} onChange={e => setForm(f => ({ ...f, logoUrl: e.target.value }))} />
          </div>
          <div className={styles['form-actions']}>
            <button className="btn btn-accent" onClick={save}>Save</button>
            {editing && <button className="btn btn-outline" onClick={resetForm}>Cancel</button>}
          </div>
        </div>
        {loading ? <div className="loading-spinner" /> : (
          <div className={styles['admin-table-wrap']}>
            <table className={styles['admin-table']}>
              <thead><tr><th>Logo</th><th>Name</th><th>Slug</th><th></th></tr></thead>
              <tbody>
                {brands.map(b => (
                  <tr key={b.id}>
                    <td>{b.logoUrl ? <img src={b.logoUrl} alt="" /> : '—'}</td>
                    <td>{b.name}</td>
                    <td>{b.slug}</td>
                    <td>
                      <button onClick={() => startEdit(b)} style={{ fontSize: 13, color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', marginRight: 8 }}>Edit</button>
                      <button onClick={() => remove(b.id)} style={{ fontSize: 13, color: '#991b1b', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
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
