import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { contentApi } from '@/api/content';
import type { LandingPageDto } from '@/types';

export default function AdminPagesPage() {
  const [pages, setPages] = useState<LandingPageDto[]>([]);
  const [loading, setLoading] = useState(true);

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: '', slug: '', subtitle: '', description: '', metaTitle: '', metaDescription: '', isActive: true });
  const [saving, setSaving] = useState(false);

  const load = () => { setLoading(true); contentApi.getLandingPages().then((p) => { setPages(p); setLoading(false); }); };
  useEffect(load, []);

  const openCreate = () => { setForm({ title: '', slug: '', subtitle: '', description: '', metaTitle: '', metaDescription: '', isActive: true }); setCreating(true); };

  const handleSave = async () => {
    if (!form.title) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      await contentApi.createLandingPage({
        title: form.title, slug: form.slug || undefined, subtitle: form.subtitle || undefined,
        description: form.description || undefined, metaTitle: form.metaTitle || undefined,
        metaDescription: form.metaDescription || undefined, isActive: form.isActive,
      });
      toast.success('Page created');
      setCreating(false); load();
    } catch { toast.error('Failed to create page'); } finally { setSaving(false); }
  };

  const handleDelete = async (p: LandingPageDto) => {
    if (!confirm(`Delete "${p.title}"?`)) return;
    try { await contentApi.deleteLandingPage(p.id); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
  };

  const toggleActive = async (p: LandingPageDto) => {
    try { await contentApi.toggleLandingPageActive(p.id, !p.isActive); load(); } catch { toast.error('Failed'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Landing Pages</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded hover:bg-indigo-700">+ New Page</button>
      </div>

      {loading ? <p className="text-gray-400 py-8 text-center">Loading...</p> : (
        <table className="w-full text-sm border-collapse">
          <thead><tr className="border-b border-gray-200 text-left text-xs text-gray-500 uppercase">
            <th className="py-2 pr-4">Title</th><th className="py-2 pr-4">Slug</th><th className="py-2 pr-4">Sections</th><th className="py-2 pr-4">Status</th><th className="py-2 pr-4">Updated</th><th className="py-2">Actions</th>
          </tr></thead>
          <tbody>
            {pages.map((p) => (
              <tr key={p.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2.5 pr-4 font-medium">{p.title}</td>
                <td className="py-2.5 pr-4 text-gray-500">{p.slug}</td>
                <td className="py-2.5 pr-4">{p.sections?.length ?? 0}</td>
                <td className="py-2.5 pr-4">
                  <button onClick={() => toggleActive(p)} className={`text-xs px-2 py-0.5 rounded ${p.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {p.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="py-2.5 pr-4 text-gray-400">{new Date(p.updatedAt).toLocaleDateString()}</td>
                <td className="py-2.5 flex gap-2">
                  <Link to={`/admin/pages/${p.id}`} className="text-indigo-600 hover:underline text-xs">Edit</Link>
                  <button onClick={() => handleDelete(p)} className="text-red-600 hover:underline text-xs">Delete</button>
                </td>
              </tr>
            ))}
            {pages.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-400">No pages found</td></tr>}
          </tbody>
        </table>
      )}

      {creating && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setCreating(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-semibold mb-4">New Page</h2>
            <div className="space-y-3">
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Title *</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Slug</label><input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Subtitle</label><input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Meta Title</label><input value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" /></div>
              <div><label className="block text-xs font-medium text-gray-500 mb-1">Meta Description</label><input value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" /></div>
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="w-4 h-4" /> Active</label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button onClick={() => setCreating(false)} className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
              <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving...' : 'Create'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
