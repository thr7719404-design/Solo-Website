import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { contentApi } from '@/api/content';
import type { LandingPageDto, LandingSectionDto } from '@/types';

const SECTION_TYPES = [
  'HERO',
  'RICH_TEXT',
  'FEATURED_PRODUCTS',
  'CATEGORY_TILES',
  'BANNER',
  'GALLERY',
  'FAQ',
  'CTA',
  'CUSTOM',
];

export default function AdminPageEditPage() {
  const { id } = useParams<{ id: string }>();

  const [page, setPage] = useState<LandingPageDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Page meta form
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [description, setDescription] = useState('');
  const [metaTitle, setMetaTitle] = useState('');
  const [metaDescription, setMetaDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Section creation
  const [addingSection, setAddingSection] = useState(false);
  const [newSectionType, setNewSectionType] = useState(SECTION_TYPES[0]);
  const [newSectionTitle, setNewSectionTitle] = useState('');

  const load = useCallback(() => {
    if (!id) return;
    setLoading(true);
    contentApi
      .getLandingPage(id)
      .then((p) => {
        setPage(p);
        setTitle(p.title);
        setSlug(p.slug);
        setSubtitle(p.subtitle ?? '');
        setDescription(p.description ?? '');
        setMetaTitle(p.metaTitle ?? '');
        setMetaDescription(p.metaDescription ?? '');
        setIsActive(p.isActive);
      })
      .catch(() => toast.error('Failed to load page'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(load, [load]);

  /* ── Save page metadata ── */
  const handleSave = async () => {
    if (!id || !title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      await contentApi.updateLandingPage(id, {
        title: title.trim(),
        slug: slug.trim() || undefined,
        subtitle: subtitle.trim() || undefined,
        description: description.trim() || undefined,
        metaTitle: metaTitle.trim() || undefined,
        metaDescription: metaDescription.trim() || undefined,
        isActive,
      });
      toast.success('Page saved');
      load();
    } catch {
      toast.error('Save failed');
    } finally {
      setSaving(false);
    }
  };

  /* ── Add section ── */
  const handleAddSection = async () => {
    if (!id) return;
    try {
      await contentApi.createSection(id, {
        type: newSectionType,
        title: newSectionTitle.trim() || undefined,
        data: {},
        displayOrder: (page?.sections.length ?? 0) + 1,
        isActive: true,
      });
      toast.success('Section added');
      setAddingSection(false);
      setNewSectionTitle('');
      load();
    } catch {
      toast.error('Failed to add section');
    }
  };

  /* ── Delete section ── */
  const handleDeleteSection = async (s: LandingSectionDto) => {
    if (!confirm(`Delete section "${s.title || s.type}"?`)) return;
    try {
      await contentApi.deleteSection(s.id);
      toast.success('Section removed');
      load();
    } catch {
      toast.error('Failed to delete section');
    }
  };

  /* ── Toggle section active ── */
  const toggleSectionActive = async (s: LandingSectionDto) => {
    try {
      await contentApi.updateSection(s.id, { isActive: !s.isActive });
      load();
    } catch {
      toast.error('Failed');
    }
  };

  /* ── Move section ── */
  const moveSection = async (s: LandingSectionDto, dir: -1 | 1) => {
    if (!page) return;
    const sorted = [...page.sections].sort((a, b) => a.displayOrder - b.displayOrder);
    const idx = sorted.findIndex((x) => x.id === s.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const orders = sorted.map((sec, i) => {
      if (i === idx) return { id: sec.id, order: sorted[swapIdx].displayOrder };
      if (i === swapIdx) return { id: sec.id, order: sorted[idx].displayOrder };
      return { id: sec.id, order: sec.displayOrder };
    });
    try {
      await contentApi.reorderSections(page.id, orders);
      load();
    } catch {
      toast.error('Reorder failed');
    }
  };

  /* ── Loading / Error ── */
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="w-8 h-8 border-[3px] border-gray-200 border-t-indigo-500 rounded-full animate-spin" />
      </div>
    );
  }
  if (!page) {
    return (
      <div className="py-20 text-center">
        <p className="text-gray-500 mb-4">Page not found</p>
        <Link to="/admin/pages" className="text-indigo-600 text-sm hover:underline">← Back to pages</Link>
      </div>
    );
  }

  const sorted = [...page.sections].sort((a, b) => a.displayOrder - b.displayOrder);

  return (
    <div className="space-y-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link to="/admin/pages" className="hover:text-indigo-600">Pages</Link>
        <span>/</span>
        <span className="text-gray-900 font-medium truncate">{page.title}</span>
      </div>

      {/* ═══ Page Metadata ═══ */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Page Details</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="pe-title" className="block text-xs font-medium text-gray-600 mb-1">Title *</label>
            <input
              id="pe-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label htmlFor="pe-slug" className="block text-xs font-medium text-gray-600 mb-1">Slug</label>
            <input
              id="pe-slug"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-mono"
            />
          </div>
          <div>
            <label htmlFor="pe-subtitle" className="block text-xs font-medium text-gray-600 mb-1">Subtitle</label>
            <input
              id="pe-subtitle"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
          </div>
          <div className="flex items-end gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={() => setIsActive(!isActive)}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
              />{' '}
              <span>Active</span>
            </label>
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="pe-desc" className="block text-xs font-medium text-gray-600 mb-1">Description</label>
            <textarea
              id="pe-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none resize-none"
            />
          </div>
        </div>

        {/* SEO */}
        <details className="mt-4">
          <summary className="text-xs font-semibold text-gray-500 uppercase tracking-wider cursor-pointer hover:text-gray-700">
            SEO Settings
          </summary>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-3">
            <div>
              <label htmlFor="pe-meta-title" className="block text-xs font-medium text-gray-600 mb-1">Meta Title</label>
              <input
                id="pe-meta-title"
                value={metaTitle}
                onChange={(e) => setMetaTitle(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label htmlFor="pe-meta-desc" className="block text-xs font-medium text-gray-600 mb-1">Meta Description</label>
              <input
                id="pe-meta-desc"
                value={metaDescription}
                onChange={(e) => setMetaDescription(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
        </details>

        <div className="flex justify-end mt-5">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
          >
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </div>

      {/* ═══ Sections ═══ */}
      <div className="bg-white border border-gray-200 rounded-xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Sections ({sorted.length})</h2>
          <button
            onClick={() => setAddingSection(true)}
            className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700"
          >
            + Add Section
          </button>
        </div>

        {sorted.length === 0 ? (
          <p className="py-8 text-center text-sm text-gray-400">
            No sections yet. Add one to start building this page.
          </p>
        ) : (
          <div className="space-y-2">
            {sorted.map((s, i) => (
              <div
                key={s.id}
                className={`flex items-center gap-3 px-4 py-3 border rounded-lg ${
                  s.isActive ? 'border-gray-200 bg-white' : 'border-gray-100 bg-gray-50/60'
                }`}
              >
                {/* Order arrows */}
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveSection(s, -1)}
                    disabled={i === 0}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-25 text-xs"
                  >
                    ▲
                  </button>
                  <button
                    onClick={() => moveSection(s, 1)}
                    disabled={i === sorted.length - 1}
                    className="text-gray-400 hover:text-gray-600 disabled:opacity-25 text-xs"
                  >
                    ▼
                  </button>
                </div>

                {/* Type badge */}
                <span className="text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-wider">
                  {s.type}
                </span>

                {/* Title */}
                <span className="flex-1 text-sm text-gray-700 truncate">
                  {s.title || <span className="text-gray-400 italic">Untitled</span>}
                </span>

                {/* Active toggle */}
                <button
                  onClick={() => toggleSectionActive(s)}
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                    s.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {s.isActive ? 'Active' : 'Inactive'}
                </button>

                {/* Delete */}
                <button
                  onClick={() => handleDeleteSection(s)}
                  className="text-gray-400 hover:text-red-500 transition"
                  title="Delete section"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add section modal */}
        {addingSection && (
          <div className="mt-4 p-4 border border-indigo-100 rounded-lg bg-indigo-50/30">
            <p className="text-xs font-semibold text-gray-600 mb-3">New Section</p>
            <div className="flex flex-col sm:flex-row gap-3">
              <select
                value={newSectionType}
                onChange={(e) => setNewSectionType(e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              >
                {SECTION_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <input
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                placeholder="Section title (optional)"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleAddSection}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700"
                >
                  Add
                </button>
                <button
                  onClick={() => setAddingSection(false)}
                  className="px-4 py-2 border border-gray-200 text-sm text-gray-600 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview link */}
      {page.isActive && (
        <div className="text-center">
          <Link
            to={`/page/${page.slug}`}
            className="text-sm text-indigo-600 hover:underline"
            target="_blank"
          >
            Preview page: /page/{page.slug} →
          </Link>
        </div>
      )}
    </div>
  );
}
