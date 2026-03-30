import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { settingsApi, type LoyaltyConfig } from '@/api/settings';

export default function AdminLoyaltyPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [earnPercent, setEarnPercent] = useState(5);
  const [maxRedeemPercent, setMaxRedeemPercent] = useState(30);
  const [isEnabled, setIsEnabled] = useState(true);

  useEffect(() => {
    let cancelled = false;
    settingsApi.getLoyaltyConfig()
      .then((cfg: LoyaltyConfig) => {
        if (cancelled) return;
        setEarnPercent((cfg.earnPercent ?? 0.05) * 100);
        setMaxRedeemPercent((cfg.maxRedeemPercent ?? 0.30) * 100);
        setIsEnabled(cfg.isEnabled ?? true);
      })
      .catch(() => { if (!cancelled) toast.error('Failed to load loyalty config'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleSave = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (earnPercent < 0 || earnPercent > 100) {
      toast.error('Earn rate must be between 0 and 100');
      return;
    }
    if (maxRedeemPercent < 0 || maxRedeemPercent > 100) {
      toast.error('Max redeem % must be between 0 and 100');
      return;
    }
    setSaving(true);
    try {
      await settingsApi.saveLoyaltyConfig({
        earnPercent: earnPercent / 100,
        maxRedeemPercent: maxRedeemPercent / 100,
        isEnabled,
      });
      toast.success('Loyalty configuration saved');
    } catch {
      toast.error('Failed to save configuration');
    }
    setSaving(false);
  };

  if (loading) return <div className="py-12 text-center text-gray-400">Loading loyalty configuration...</div>;

  // Preview calculation
  const sampleSubtotal = 500;
  const earnAmount = isEnabled ? (sampleSubtotal * earnPercent) / 100 : 0;
  const maxRedeemAmount = isEnabled ? (sampleSubtotal * maxRedeemPercent) / 100 : 0;

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Loyalty Program</h1>
          <p className="text-sm text-gray-500 mt-0.5">Configure loyalty cashback earn & redeem settings</p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${isEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
          {isEnabled ? 'Active' : 'Disabled'}
        </span>
      </div>

      {/* Summary tiles */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-amber-600">{earnPercent}%</p>
          <p className="text-xs text-gray-500">Earn Rate</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className="text-2xl font-bold text-indigo-600">{maxRedeemPercent}%</p>
          <p className="text-xs text-gray-500">Max Redeem</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 text-center">
          <p className={`text-2xl font-bold ${isEnabled ? 'text-green-600' : 'text-gray-400'}`}>{isEnabled ? 'On' : 'Off'}</p>
          <p className="text-xs text-gray-500">Status</p>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-xs text-amber-700">
        <strong>How it works:</strong> Customers earn {earnPercent}% of their order subtotal as loyalty cash.
        They can redeem up to {maxRedeemPercent}% of the subtotal on future orders.
        Changes apply to new orders only — existing loyalty balances are not affected.
      </div>

      {/* Settings form */}
      <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
        <h2 className="text-sm font-semibold">Loyalty Settings</h2>

        <div>
          <label htmlFor="earn-rate" className="block text-xs font-medium text-gray-500 mb-1">Earn Rate (%)</label>
          <input
            id="earn-rate"
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={earnPercent}
            onChange={(e) => setEarnPercent(Number(e.target.value))}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <p className="text-[11px] text-gray-400 mt-1">Percentage of subtotal earned as loyalty cash (e.g. 5 = 5%)</p>
        </div>

        <div>
          <label htmlFor="max-redeem" className="block text-xs font-medium text-gray-500 mb-1">Max Redeem (%)</label>
          <input
            id="max-redeem"
            type="number"
            min={0}
            max={100}
            step={1}
            value={maxRedeemPercent}
            onChange={(e) => setMaxRedeemPercent(Number(e.target.value))}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
          <p className="text-[11px] text-gray-400 mt-1">Maximum percentage of subtotal a customer can pay with loyalty cash</p>
        </div>

        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-medium">{isEnabled ? 'Loyalty program is enabled' : 'Loyalty program is disabled'}</p>
            <p className="text-xs text-gray-400 mt-0.5">{isEnabled ? 'Customers earn and can redeem loyalty cash' : 'No loyalty cash earned or redeemed on orders'}</p>
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
            <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">Preview (AED 500 order)</h3>
            <div className="flex justify-between">
              <span className="text-gray-500">Order Subtotal</span>
              <span>AED {sampleSubtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-amber-600">
              <span>Loyalty Earned ({earnPercent}%)</span>
              <span>+ AED {earnAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-indigo-600">
              <span>Max Redeemable ({maxRedeemPercent}%)</span>
              <span>- AED {maxRedeemAmount.toFixed(2)}</span>
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
