import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { stripeApi, type StripeAdminConfig, type SaveStripeConfigBody } from '@/api/stripe';

export default function AdminStripePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<StripeAdminConfig | null>(null);

  const [publishableKey, setPublishableKey] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [webhookSecret, setWebhookSecret] = useState('');

  useEffect(() => {
    let cancelled = false;
    stripeApi.getAdminConfig()
      .then((cfg) => {
        if (cancelled) return;
        setConfig(cfg);
        setPublishableKey(cfg.publishableKey ?? '');
      })
      .catch(() => { if (!cancelled) toast.error('Failed to load Stripe config'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const handleSave = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    if (!publishableKey || !secretKey) {
      toast.error('Publishable key and secret key are required');
      return;
    }
    setSaving(true);
    try {
      const body: SaveStripeConfigBody = { publishableKey, secretKey };
      if (webhookSecret) body.webhookSecret = webhookSecret;
      await stripeApi.saveAdminConfig(body);
      toast.success('Stripe configuration saved');
      // Reload to get masked keys
      const updated = await stripeApi.getAdminConfig();
      setConfig(updated);
      setPublishableKey(updated.publishableKey ?? '');
      setSecretKey('');
      setWebhookSecret('');
    } catch {
      toast.error('Failed to save configuration');
    }
    setSaving(false);
  };

  if (loading) return <div className="py-12 text-center text-gray-400">Loading Stripe configuration...</div>;

  const isConfigured = config?.isEnabled ?? false;
  const isTestMode = publishableKey.startsWith('pk_test_') || secretKey.startsWith('sk_test_');

  return (
    <div className="max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Stripe Configuration</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage payment gateway integration</p>
        </div>
        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${isConfigured ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
          {isConfigured ? 'Active' : 'Not Configured'}
        </span>
      </div>

      {/* API Keys form */}
      <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-lg p-6 space-y-5">
        <h2 className="text-sm font-semibold">API Keys</h2>

        <div>
          <label htmlFor="stripe-pk" className="block text-xs font-medium text-gray-500 mb-1">Publishable Key</label>
          <input
            id="stripe-pk"
            value={publishableKey}
            onChange={(e) => setPublishableKey(e.target.value)}
            placeholder="pk_test_..."
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono"
          />
          <p className="text-[11px] text-gray-400 mt-1">This key is visible to your customers</p>
        </div>

        <div>
          <label htmlFor="stripe-sk" className="block text-xs font-medium text-gray-500 mb-1">Secret Key</label>
          <input
            id="stripe-sk"
            type="password"
            value={secretKey}
            onChange={(e) => setSecretKey(e.target.value)}
            placeholder={config?.secretKey ? `Current: ${config.secretKey}` : 'sk_test_...'}
            required
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono"
          />
          <p className="text-[11px] text-gray-400 mt-1">Never shared publicly</p>
        </div>

        <div>
          <label htmlFor="stripe-wh" className="block text-xs font-medium text-gray-500 mb-1">Webhook Secret <span className="text-gray-300">(optional)</span></label>
          <input
            id="stripe-wh"
            type="password"
            value={webhookSecret}
            onChange={(e) => setWebhookSecret(e.target.value)}
            placeholder={config?.webhookSecret ? `Current: ${config.webhookSecret}` : 'whsec_...'}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm font-mono"
          />
        </div>

        {/* Test mode info */}
        {(publishableKey || secretKey) && (
          <div className={`text-xs rounded-lg px-4 py-3 ${isTestMode ? 'bg-blue-50 text-blue-700' : 'bg-amber-50 text-amber-700'}`}>
            {isTestMode
              ? 'You are using test-mode keys (pk_test_ / sk_test_). No real charges will be made.'
              : 'You are using live keys. Real charges will be processed.'}
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
