import { useState, useEffect } from 'react';
import { contentApi } from '@/api/content';
import type { BannerDto } from '@/types';
import styles from './Admin.module.css';

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<BannerDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<BannerDto | null>(null);
  const [form, setForm] = useState({ title: '', subtitle: '', imageUrl: '', linkUrl: '', position: 'hero', isActive: true });

  const load = () => {
    setLoading(true);
    contentApi.getAllBanners().then(r => { setBanners(Array.isArray(r) ? r : []); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(load, []);

  const resetForm = () => { setForm({ title: '', subtitle: '', imageUrl: '', linkUrl: '', position: 'hero', isActive: true }); setEditing(null); };

  const startEdit = (b: BannerDto) => {
    setEditing(b);
    setForm({ title: b.title, subtitle: b.subtitle ?? '', imageUrl: b.imageUrl ?? b.imageDesktopUrl ?? '', linkUrl: b.linkUrl ?? b.ctaUrl ?? '', position: b.position ?? b.placement ?? 'hero', isActive: b.isActive ?? true });
  };

  const save = async () => {
    if (editing) await contentApi.updateBanner(editing.id, form);
    else await contentApi.createBanner(form);
    resetForm(); load();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this banner?')) return;
    await contentApi.deleteBanner(id);
    load();
  };

  return (
    <>
      <div className={styles['admin-header']}><h1>Banners</h1></div>
      <div className={styles['admin-body']}>
        <div className={styles['admin-form']} style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 12 }}>{editing ? 'Edit Banner' : 'Add Banner'}</h3>
          <div className={styles['form-row']}>
            <div className={styles['form-group']}>
              <label>Title</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
            </div>
            <div className={styles['form-group']}>
              <label>Position</label>
              <select value={form.position} onChange={e => setForm(f => ({ ...f, position: e.target.value }))}>
                <option value="hero">Hero</option>
                <option value="sidebar">Sidebar</option>
                <option value="footer">Footer</option>
              </select>
            </div>
          </div>
          <div className={styles['form-group']}>
            <label>Subtitle</label>
            <input value={form.subtitle} onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))} />
          </div>
          <div className={styles['form-row']}>
            <div className={styles['form-group']}>
              <label>Image URL</label>
              <input value={form.imageUrl} onChange={e => setForm(f => ({ ...f, imageUrl: e.target.value }))} />
            </div>
            <div className={styles['form-group']}>
              <label>Link URL</label>
              <input value={form.linkUrl} onChange={e => setForm(f => ({ ...f, linkUrl: e.target.value }))} />
            </div>
          </div>
          <label style={{ fontSize: 13 }}><input type="checkbox" checked={form.isActive} onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))} /> Active</label>
          <div className={styles['form-actions']}>
            <button className="btn btn-accent" onClick={save}>Save</button>
            {editing && <button className="btn btn-outline" onClick={resetForm}>Cancel</button>}
          </div>
        </div>
        {loading ? <div className="loading-spinner" /> : (
          <div className={styles['admin-table-wrap']}>
            <table className={styles['admin-table']}>
              <thead><tr><th>Image</th><th>Title</th><th>Position</th><th>Active</th><th></th></tr></thead>
              <tbody>
                {banners.map(b => (
                  <tr key={b.id}>
                    <td>{b.imageUrl ? <img src={b.imageUrl} alt="" /> : '—'}</td>
                    <td>{b.title}</td>
                    <td>{b.position}</td>
                    <td>{b.isActive ? '✓' : '✗'}</td>
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
