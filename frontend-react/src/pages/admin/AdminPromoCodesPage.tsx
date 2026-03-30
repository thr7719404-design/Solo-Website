import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { promoApi, type PromoCode, type CreatePromoCodeBody } from '@/api/promo';

const TYPE_LABELS: Record<string, string> = {
  PERCENTAGE: 'Percentage',
  FIXED_AMOUNT: 'Fixed Amount',
  FREE_SHIPPING: 'Free Shipping',
};
const TYPE_COLORS: Record<string, string> = {
  PERCENTAGE: 'bg-purple-100 text-purple-700',
  FIXED_AMOUNT: 'bg-blue-100 text-blue-700',
  FREE_SHIPPING: 'bg-green-100 text-green-700',
};

const EMPTY_FORM: CreatePromoCodeBody = {
  code: '', type: 'PERCENTAGE', value: 0, startsAt: new Date().toISOString().slice(0, 16),
};

export default function AdminPromoCodesPage() {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  // dialog
  const [editing, setEditing] = useState<PromoCode | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreatePromoCodeBody>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);

  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    promoApi.list(page, limit)
      .then((res) => { if (!cancelled) { setPromos(res.data); setTotal(res.total); } })
      .catch(() => { if (!cancelled) toast.error('Failed to load promo codes'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [page, refreshKey]);

  const reload = useCallback(() => {
    setLoading(true);
    setRefreshKey((k) => k + 1);
  }, []);

  const totalPages = Math.max(1, Math.ceil(total / limit));

  const openCreate = () => {
    setEditing(null);
    setForm({ ...EMPTY_FORM, startsAt: new Date().toISOString().slice(0, 16) });
    setShowForm(true);
  };

  const openEdit = (p: PromoCode) => {
    setEditing(p);
    setForm({
      code: p.code, type: p.type, value: p.value,
      description: p.description ?? '', minOrderAmount: p.minOrderAmount,
      maxDiscount: p.maxDiscount, usageLimit: p.usageLimit,
      isActive: p.isActive, startsAt: p.startsAt?.slice(0, 16) ?? '',
      expiresAt: p.expiresAt?.slice(0, 16) ?? undefined,
    });
    setShowForm(true);
  };

  const handleSave = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!form.code || !form.startsAt) { toast.error('Code and start date are required'); return; }
    setSaving(true);
    try {
      const body = {
        ...form,
        code: form.code.toUpperCase(),
        startsAt: new Date(form.startsAt).toISOString(),
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : undefined,
      };
      if (editing) {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { code: _omit, ...rest } = body;
        await promoApi.update(editing.id, rest);
        toast.success('Promo updated');
      } else {
        await promoApi.create(body);
        toast.success('Promo created');
      }
      setShowForm(false);
      reload();
    } catch { toast.error('Failed to save'); }
    setSaving(false);
  };

  const handleToggle = async (p: PromoCode) => {
    try {
      await promoApi.update(p.id, { isActive: !p.isActive });
      toast.success(p.isActive ? 'Deactivated' : 'Activated');
      reload();
    } catch { toast.error('Failed'); }
  };

  const handleDelete = async (p: PromoCode) => {
    if (!confirm(`Delete promo "${p.code}"?`)) return;
    try { await promoApi.remove(p.id); toast.success('Deleted'); reload(); } catch { toast.error('Failed'); }
  };

  const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString() : '—';
  const fmtValue = (p: PromoCode) => {
    if (p.type === 'PERCENTAGE') return `${p.value}%`;
    if (p.type === 'FREE_SHIPPING') return 'Free';
    return `AED ${p.value.toFixed(2)}`;
  };
  const isExpired = (p: PromoCode) => p.expiresAt && new Date(p.expiresAt) < new Date();

  // Stats
  const activeCount = promos.filter((p) => p.isActive && !isExpired(p)).length;
  const totalUses = promos.reduce((n, p) => n + p.usageCount, 0);

  const statusPill = (p: PromoCode) => {
    if (isExpired(p)) return { cls: 'bg-red-100 text-red-600', text: 'Expired' };
    if (p.isActive) return { cls: 'bg-green-100 text-green-700', text: 'Active' };
    return { cls: 'bg-gray-200 text-gray-500', text: 'Inactive' };
  };

  const set = (k: string, v: unknown) => setForm((prev) => ({ ...prev, [k]: v }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold">Promo Codes</h1>
        <button onClick={openCreate} className="px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded hover:bg-indigo-700">+ New Promo</button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold">{total}</p><p className="text-xs text-gray-500">Total Codes</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{activeCount}</p><p className="text-xs text-gray-500">Active</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">{totalUses}</p><p className="text-xs text-gray-500">Total Uses</p>
        </div>
      </div>

      {loading ? <p className="text-gray-400 py-8 text-center">Loading...</p> : (
        <div className="space-y-3">
          {promos.length === 0 && <p className="text-gray-400 py-8 text-center">No promo codes yet.</p>}
          {promos.map((p) => (
            <div key={p.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-sm tracking-wider">{p.code}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${TYPE_COLORS[p.type] ?? 'bg-gray-100'}`}>{TYPE_LABELS[p.type]}</span>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusPill(p).cls}`}>
                  {statusPill(p).text}
                </span>
              </div>
              {p.description && <p className="text-xs text-gray-500 mb-2">{p.description}</p>}
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mb-3">
                <span>Discount: <strong className="text-gray-700">{fmtValue(p)}</strong></span>
                {p.minOrderAmount != null && <span>Min: AED {p.minOrderAmount}</span>}
                {p.maxDiscount != null && <span>Max discount: AED {p.maxDiscount}</span>}
                <span>Uses: {p.usageCount}{p.usageLimit ? `/${p.usageLimit}` : ''}</span>
                <span>Starts: {fmtDate(p.startsAt)}</span>
                <span>Expires: {fmtDate(p.expiresAt)}</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEdit(p)} className="text-xs text-indigo-600 hover:underline">Edit</button>
                <button onClick={() => handleToggle(p)} className="text-xs text-amber-600 hover:underline">{p.isActive ? 'Deactivate' : 'Activate'}</button>
                <button onClick={() => handleDelete(p)} className="text-xs text-red-600 hover:underline">Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-gray-500">Page {page} of {totalPages}</span>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="px-3 py-1.5 text-sm border rounded disabled:opacity-30">Prev</button>
            <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="px-3 py-1.5 text-sm border rounded disabled:opacity-30">Next</button>
          </div>
        </div>
      )}

      {/* Create / Edit dialog */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <form onSubmit={handleSave} className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-semibold mb-4">{editing ? 'Edit Promo Code' : 'Create Promo Code'}</h2>
            <div className="space-y-3">
              <div>
                <label htmlFor="pc-code" className="block text-xs font-medium text-gray-500 mb-1">Code</label>
                <input id="pc-code" value={form.code} onChange={(e) => set('code', e.target.value.toUpperCase())} disabled={!!editing} required className="w-full border border-gray-300 rounded px-3 py-2 text-sm disabled:bg-gray-100 font-mono uppercase" />
              </div>
              <div>
                <label htmlFor="pc-desc" className="block text-xs font-medium text-gray-500 mb-1">Description</label>
                <input id="pc-desc" value={form.description ?? ''} onChange={(e) => set('description', e.target.value)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
              </div>
              <div>
                <span className="block text-xs font-medium text-gray-500 mb-1">Type</span>
                <div className="flex gap-2">
                  {(['PERCENTAGE', 'FIXED_AMOUNT', 'FREE_SHIPPING'] as const).map((t) => (
                    <button key={t} type="button" onClick={() => set('type', t)} className={`px-3 py-1.5 text-xs rounded border ${form.type === t ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'}`}>
                      {TYPE_LABELS[t]}
                    </button>
                  ))}
                </div>
              </div>
              {form.type !== 'FREE_SHIPPING' && (
                <div>
                  <label htmlFor="pc-val" className="block text-xs font-medium text-gray-500 mb-1">Value {form.type === 'PERCENTAGE' ? '(%)' : '(AED)'}</label>
                  <input id="pc-val" type="number" min={0} step={form.type === 'PERCENTAGE' ? 1 : 0.01} value={form.value} onChange={(e) => set('value', Number(e.target.value))} required className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="pc-min" className="block text-xs font-medium text-gray-500 mb-1">Min Order (AED)</label>
                  <input id="pc-min" type="number" min={0} step={0.01} value={form.minOrderAmount ?? ''} onChange={(e) => set('minOrderAmount', e.target.value ? Number(e.target.value) : undefined)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label htmlFor="pc-max" className="block text-xs font-medium text-gray-500 mb-1">Max Discount (AED)</label>
                  <input id="pc-max" type="number" min={0} step={0.01} value={form.maxDiscount ?? ''} onChange={(e) => set('maxDiscount', e.target.value ? Number(e.target.value) : undefined)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label htmlFor="pc-limit" className="block text-xs font-medium text-gray-500 mb-1">Usage Limit (blank = unlimited)</label>
                <input id="pc-limit" type="number" min={1} value={form.usageLimit ?? ''} onChange={(e) => set('usageLimit', e.target.value ? Number(e.target.value) : undefined)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="pc-start" className="block text-xs font-medium text-gray-500 mb-1">Starts At</label>
                  <input id="pc-start" type="datetime-local" value={form.startsAt?.slice(0, 16) ?? ''} onChange={(e) => set('startsAt', e.target.value)} required className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                </div>
                <div>
                  <label htmlFor="pc-exp" className="block text-xs font-medium text-gray-500 mb-1">Expires At</label>
                  <input id="pc-exp" type="datetime-local" value={form.expiresAt?.slice(0, 16) ?? ''} onChange={(e) => set('expiresAt', e.target.value || undefined)} className="w-full border border-gray-300 rounded px-3 py-2 text-sm" />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
