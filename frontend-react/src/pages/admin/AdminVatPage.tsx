import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { settingsApi, type VatConfig } from '@/api/settings';

export default function AdminVatPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [vatPercent, setVatPercent] = useState(5);
  const [label, setLabel] = useState('VAT');
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    let cancelled = false;
    settingsApi.getVatConfig()
      .then((cfg: VatConfig) => {
        if (cancelled) return;
        setVatPercent(cfg.vatPercent ?? 5);
        setLabel(cfg.label ?? 'VAT');
        setIsEnabled(cfg.isEnabled ?? true);
      })
      .catch(() => { if (!cancelled) toast.error('Failed to load VAT config'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleSave = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (vatPercent < 0 || vatPercent > 100) {
      toast.error('VAT rate must be between 0 and 100');
      return;
    }
    setSaving(true);
    try {
      await settingsApi.saveVatConfig({ vatPercent, isEnabled, label: label || 'VAT' });
      toast.success('VAT configuration saved');
    } catch {
      toast.error('Failed to save configuration');
    }
    setSaving(false);
  };

  if (loading) return <div className="py-12 text-center text-gray-400">Loading VAT configuration...</div>;

  // Preview calculation
  const sampleSubtotal = 100;
  const vatAmount = isEnabled ? (sampleSubtotal * vatPercent) / 100 : 0;
  const total = sampleSubtotal + vatAmount;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">VAT Configuration</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure VAT rate applied to all orders</p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${isEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
          {isEnabled ? `${vatPercent}% Active` : 'Disabled'}
        </span>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold">{vatPercent}%</p>
          <p className="text-xs text-gray-500">Current Rate</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className={`text-2xl font-bold ${isEnabled ? 'text-green-600' : 'text-gray-400'}`}>{isEnabled ? 'On' : 'Off'}</p>
          <p className="text-xs text-gray-500">Status</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">{label}</p>
          <p className="text-xs text-gray-500">Label</p>
        </div>
      </div>

      {/* Warning banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700">
        Changes to VAT settings apply to new orders immediately. Existing orders are not affected.
      </div>

      {/* Settings form */}
      <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
        <h2 className="text-sm font-semibold">VAT Settings</h2>

        <div>
          <label htmlFor="vat-rate" className="block text-xs font-medium text-gray-500 mb-1">VAT Rate (%)</label>
          <input
            id="vat-rate"
            type="number"
            min={0}
            max={100}
            step={0.01}
            value={vatPercent}
            onChange={(e) => setVatPercent(Number(e.target.value))}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <p className="text-[11px] text-gray-400 mt-1">Enter a value between 0 and 100</p>
        </div>

        <div>
          <label htmlFor="vat-label" className="block text-xs font-medium text-gray-500 mb-1">Display Label</label>
          <input
            id="vat-label"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="VAT"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <p className="text-[11px] text-gray-400 mt-1">Displayed on invoices and checkout</p>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium">{isEnabled ? 'VAT collection is enabled' : 'VAT collection is disabled'}</p>
            <p className="text-xs text-gray-400 mt-0.5">{isEnabled ? 'VAT will be charged on all new orders' : 'No VAT will be applied to orders'}</p>
          </div>
          <button
            type="button"
            onClick={() => setIsEnabled(!isEnabled)}
            className={`relative w-11 h-6 rounded-full transition-colors ${isEnabled ? 'bg-indigo-600' : 'bg-gray-300'}`}
            role="switch"
            aria-checked={isEnabled}
          >
            <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${isEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
          </button>
        </div>

        {/* Preview */}
        {isEnabled && (
          <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Preview (AED 100 order)</h3>
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>AED {sampleSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">{label} ({vatPercent}%)</span>
              <span>AED {vatAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold border-t border-gray-200 pt-2 mt-2">
              <span>Total</span>
              <span>AED {total.toFixed(2)}</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full py-2.5 bg-indigo-600 text-white text-sm font-semibold rounded hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </button>
      </form>
    </div>
  );
}
