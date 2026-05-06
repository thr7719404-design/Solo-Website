import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { settingsApi, type PaymentsConfig } from '@/api/settings';
import styles from './Admin.module.css';

export default function AdminPaymentsPage() {
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);

  // Cash on Delivery
  const [codEnabled, setCodEnabled] = useState(true);

  // Stripe (Credit / Debit Card)
  const [stripeEnabled, setStripeEnabled] = useState(false);
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [stripeWebhookSecret, setStripeWebhookSecret] = useState('');
  const [stripePublishableSaved, setStripePublishableSaved] = useState<string | null>(null);
  const [stripeSecretMasked, setStripeSecretMasked] = useState<string | null>(null);
  const [stripeWebhookMasked, setStripeWebhookMasked] = useState<string | null>(null);
  const [showStripeSecret, setShowStripeSecret] = useState(false);
  const [showStripeWebhook, setShowStripeWebhook] = useState(false);

  // Tabby
  const [tabbyEnabled, setTabbyEnabled] = useState(false);
  const [tabbyPublicKey, setTabbyPublicKey] = useState('');
  const [tabbySecretKey, setTabbySecretKey] = useState('');
  const [tabbyPublicMasked, setTabbyPublicMasked] = useState<string | null>(null);
  const [tabbySecretMasked, setTabbySecretMasked] = useState<string | null>(null);
  const [showTabbyPublic, setShowTabbyPublic] = useState(false);
  const [showTabbySecret, setShowTabbySecret] = useState(false);

  // Tamara
  const [tamaraEnabled, setTamaraEnabled] = useState(false);
  const [tamaraSandbox, setTamaraSandbox] = useState(false);
  const [tamaraToken, setTamaraToken] = useState('');
  const [tamaraTokenMasked, setTamaraTokenMasked] = useState<string | null>(null);
  const [showTamaraToken, setShowTamaraToken] = useState(false);

  const apply = (cfg: PaymentsConfig) => {
    setCodEnabled(cfg.codEnabled);
    setStripeEnabled(cfg.stripeEnabled);
    setStripePublishableSaved(cfg.stripePublishableKey);
    setStripeSecretMasked(cfg.stripeSecretKeyMasked);
    setStripeWebhookMasked(cfg.stripeWebhookSecretMasked);
    setTabbyEnabled(cfg.tabbyEnabled);
    setTabbyPublicMasked(cfg.tabbyPublicKeyMasked);
    setTabbySecretMasked(cfg.tabbySecretKeyMasked);
    setTamaraEnabled(cfg.tamaraEnabled);
    setTamaraSandbox(cfg.tamaraSandbox);
    setTamaraTokenMasked(cfg.tamaraApiTokenMasked);
  };

  useEffect(() => {
    settingsApi.getPaymentsConfig()
      .then(apply)
      .catch(() => toast.error('Failed to load payment settings'))
      .finally(() => setLoaded(true));
  }, []);

  const save = async () => {
    if (stripeEnabled && !stripePublishableSaved && !stripePublishableKey.trim()) {
      toast.error('Stripe Publishable Key is required to enable Credit Card payments');
      return;
    }
    if (stripeEnabled && !stripeSecretMasked && !stripeSecretKey.trim()) {
      toast.error('Stripe Secret Key is required to enable Credit Card payments');
      return;
    }
    if (tabbyEnabled && !tabbyPublicMasked && !tabbyPublicKey.trim()) {
      toast.error('Tabby Public Key is required to enable Tabby');
      return;
    }
    if (tabbyEnabled && !tabbySecretMasked && !tabbySecretKey.trim()) {
      toast.error('Tabby Secret Key is required to enable Tabby');
      return;
    }
    if (tamaraEnabled && !tamaraTokenMasked && !tamaraToken.trim()) {
      toast.error('Tamara API Token is required to enable Tamara');
      return;
    }

    setSaving(true);
    try {
      await settingsApi.savePaymentsConfig({
        codEnabled,
        stripeEnabled,
        stripePublishableKey: stripePublishableKey.trim() || undefined,
        stripeSecretKey: stripeSecretKey.trim() || undefined,
        stripeWebhookSecret: stripeWebhookSecret.trim() || undefined,
        tabbyEnabled,
        tabbyPublicKey: tabbyPublicKey.trim() || undefined,
        tabbySecretKey: tabbySecretKey.trim() || undefined,
        tamaraEnabled,
        tamaraSandbox,
        tamaraApiToken: tamaraToken.trim() || undefined,
      });
      toast.success('Payment settings saved');
      // Reload to refresh masks and clear input fields
      const cfg = await settingsApi.getPaymentsConfig();
      apply(cfg);
      setStripePublishableKey('');
      setStripeSecretKey('');
      setStripeWebhookSecret('');
      setTabbyPublicKey('');
      setTabbySecretKey('');
      setTamaraToken('');
      setShowStripeSecret(false);
      setShowStripeWebhook(false);
      setShowTabbyPublic(false);
      setShowTabbySecret(false);
      setShowTamaraToken(false);
    } catch {
      toast.error('Failed to save payment settings');
    }
    setSaving(false);
  };

  if (!loaded) {
    return <div className={styles['admin-body']}><div className="loading-spinner" /></div>;
  }

  const tabbyConfigured = !!tabbyPublicMasked && !!tabbySecretMasked;
  const tamaraConfigured = !!tamaraTokenMasked;
  const stripeConfigured = !!stripePublishableSaved && !!stripeSecretMasked;
  const tabbyStatusText = tabbyEnabled && tabbyConfigured ? 'Live' : (tabbyConfigured ? 'Disabled' : 'Not Configured');
  const tamaraStatusText = tamaraEnabled && tamaraConfigured
    ? (tamaraSandbox ? 'Sandbox' : 'Live')
    : (tamaraConfigured ? 'Disabled' : 'Not Configured');
  const stripeStatusText = stripeEnabled && stripeConfigured ? 'Live' : (stripeConfigured ? 'Disabled' : 'Not Configured');
  const codStatusText = codEnabled ? 'Enabled' : 'Disabled';
  const activeMethodCount = [
    codEnabled,
    stripeEnabled && stripeConfigured,
    tabbyEnabled && tabbyConfigured,
    tamaraEnabled && tamaraConfigured,
  ].filter(Boolean).length;

  // Visual badge styles for section headers
  type BadgeKind = 'active' | 'configured' | 'disabled' | 'missing';
  const badgeStyles: Record<BadgeKind, React.CSSProperties> = {
    active:     { background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' },
    configured: { background: '#dcfce7', color: '#15803d', border: '1px solid #86efac' },
    disabled:   { background: '#f3f4f6', color: '#6b7280', border: '1px solid #d1d5db' },
    missing:    { background: '#fef3c7', color: '#b45309', border: '1px solid #fcd34d' },
  };
  const Badge = ({ kind, label }: { kind: BadgeKind; label: string }) => (
    <span style={{
      ...badgeStyles[kind],
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
      padding: '3px 9px',
      borderRadius: 999,
      display: 'inline-flex',
      alignItems: 'center',
      gap: 4,
      lineHeight: 1.4,
    }}>
      <span style={{
        width: 6, height: 6, borderRadius: '50%',
        background: kind === 'active' || kind === 'configured' ? '#16a34a' : (kind === 'missing' ? '#d97706' : '#9ca3af'),
      }} />
      {label}
    </span>
  );
  const codBadge: BadgeKind = codEnabled ? 'active' : 'disabled';
  const stripeBadge: BadgeKind = (stripeEnabled && stripeConfigured) ? 'active' : (stripeConfigured ? 'disabled' : 'missing');
  const tabbyBadge: BadgeKind = (tabbyEnabled && tabbyConfigured) ? 'active' : (tabbyConfigured ? 'disabled' : 'missing');
  const tamaraBadge: BadgeKind = (tamaraEnabled && tamaraConfigured) ? 'active' : (tamaraConfigured ? 'disabled' : 'missing');
  const activeStatStyle: React.CSSProperties = {
    boxShadow: 'inset 0 0 0 2px #16a34a',
  };

  return (
    <>
      <div className={styles['header-v2']}>
        <div>
          <h1>Payments</h1>
          <span className={styles['header-v2-sub']}>
            Configure payment methods available at checkout: Cash on Delivery, Credit/Debit Card (Stripe), and Buy-Now-Pay-Later (Tabby &amp; Tamara). Toggle availability and update API credentials without redeploying.
          </span>
        </div>
      </div>
      <div className={styles['admin-body']}>

        {/* Status cards */}
        <div className={styles['stats-grid-3']}>
          <div className={styles['stat-card']} style={codBadge === 'active' ? activeStatStyle : undefined}>
            <div className={styles['stat-label']}>Cash on Delivery</div>
            <div className={styles['stat-value']} style={{ fontSize: 22 }}>{codStatusText}</div>
            <div style={{ marginTop: 8 }}><Badge kind={codBadge} label={codBadge === 'active' ? 'Active' : 'Inactive'} /></div>
          </div>
          <div className={`${styles['stat-card']} ${styles['stat-card-violet'] || ''}`} style={stripeBadge === 'active' ? activeStatStyle : undefined}>
            <div className={styles['stat-label']}>Credit Card (Stripe)</div>
            <div className={styles['stat-value']} style={{ fontSize: 22 }}>{stripeStatusText}</div>
            <div style={{ marginTop: 8 }}><Badge kind={stripeBadge} label={stripeBadge === 'active' ? 'Active' : (stripeBadge === 'disabled' ? 'Configured · Off' : 'Setup Needed')} /></div>
          </div>
          <div className={`${styles['stat-card']} ${styles['stat-card-accent']}`} style={tabbyBadge === 'active' ? activeStatStyle : undefined}>
            <div className={styles['stat-label']}>Tabby</div>
            <div className={styles['stat-value']} style={{ fontSize: 22 }}>{tabbyStatusText}</div>
            <div style={{ marginTop: 8 }}><Badge kind={tabbyBadge} label={tabbyBadge === 'active' ? 'Active' : (tabbyBadge === 'disabled' ? 'Configured · Off' : 'Setup Needed')} /></div>
          </div>
          <div className={`${styles['stat-card']} ${styles['stat-card-cyan']}`} style={tamaraBadge === 'active' ? activeStatStyle : undefined}>
            <div className={styles['stat-label']}>Tamara</div>
            <div className={styles['stat-value']} style={{ fontSize: 22 }}>{tamaraStatusText}</div>
            <div style={{ marginTop: 8 }}><Badge kind={tamaraBadge} label={tamaraBadge === 'active' ? 'Active' : (tamaraBadge === 'disabled' ? 'Configured · Off' : 'Setup Needed')} /></div>
          </div>
          <div className={`${styles['stat-card']} ${styles['stat-card-emerald']}`}>
            <div className={styles['stat-label']}>Active Methods</div>
            <div className={styles['stat-value']} style={{ color: activeMethodCount > 0 ? '#16a34a' : undefined }}>
              {activeMethodCount} / 4
            </div>
            <div style={{ marginTop: 6, fontSize: 12, color: 'var(--admin-text-muted)' }}>
              {activeMethodCount === 0 ? 'No methods enabled' : `${activeMethodCount} live at checkout`}
            </div>
          </div>
        </div>

        <div className={`${styles['dash-grid']} ${styles['dash-grid-2']}`}>

          {/* Cash on Delivery */}
          <div className={styles['settings-panel']}>
            <div className={styles['settings-card']}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                <h3 style={{ margin: 0 }}>Cash on Delivery (COD)</h3>
                <Badge kind={codBadge} label={codBadge === 'active' ? 'Active' : 'Disabled'} />
              </div>
              <p style={{ marginTop: 0, color: 'var(--admin-text-muted)', fontSize: 13 }}>
                Customers pay in cash when their order is delivered. No API credentials required &mdash; this method is
                always available unless disabled here.
              </p>

              <div className={styles['field']}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textTransform: 'none', letterSpacing: 0, fontSize: 14, fontWeight: 500, marginBottom: 0, color: 'var(--admin-text)' }}>
                  <input
                    type="checkbox"
                    checked={codEnabled}
                    onChange={e => setCodEnabled(e.target.checked)}
                  />
                  <span>Enable Cash on Delivery at checkout</span>
                </label>
                <span className={styles['field-hint']}>
                  When off, COD is hidden from the payment options on checkout. Customers must use a card or BNPL provider.
                </span>
              </div>
            </div>
          </div>

          {/* Stripe (Credit / Debit Card) */}
          <div className={styles['settings-panel']}>
            <div className={styles['settings-card']}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                <h3 style={{ margin: 0 }}>Credit &amp; Debit Card &mdash; Stripe</h3>
                <Badge kind={stripeBadge} label={stripeBadge === 'active' ? 'Active' : (stripeBadge === 'disabled' ? 'Configured · Off' : 'Setup Needed')} />
              </div>
              <p style={{ marginTop: 0, color: 'var(--admin-text-muted)', fontSize: 13 }}>
                Accept Visa, Mastercard, Amex and other cards via Stripe. Get your API keys from the
                {' '}<a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noreferrer">Stripe Dashboard &rarr; Developers &rarr; API Keys</a>.
                Use test keys (<code>pk_test_...</code> / <code>sk_test_...</code>) while integrating.
              </p>

              <div className={styles['field']}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textTransform: 'none', letterSpacing: 0, fontSize: 14, fontWeight: 500, marginBottom: 0, color: 'var(--admin-text)' }}>
                  <input
                    type="checkbox"
                    checked={stripeEnabled}
                    onChange={e => setStripeEnabled(e.target.checked)}
                  />
                  <span>Enable Credit Card at checkout</span>
                </label>
                <span className={styles['field-hint']}>
                  When off, the Credit Card option is hidden from checkout.
                </span>
              </div>

              <div className={styles['field']}>
                <label htmlFor="stripe-publishable">Publishable Key</label>
                <input
                  id="stripe-publishable"
                  type="text"
                  value={stripePublishableKey}
                  onChange={e => setStripePublishableKey(e.target.value)}
                  placeholder={stripePublishableSaved ? `Current: ${stripePublishableSaved}` : 'pk_test_...'}
                />
                <span className={styles['field-hint']}>
                  Safe to expose to the browser. Used to render the Stripe card input on checkout.
                  Leave blank to keep the current key.
                </span>
              </div>

              <div className={styles['field']}>
                <label htmlFor="stripe-secret">Secret Key</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    id="stripe-secret"
                    type={showStripeSecret ? 'text' : 'password'}
                    value={stripeSecretKey}
                    onChange={e => setStripeSecretKey(e.target.value)}
                    placeholder={stripeSecretMasked ? `Current: ${stripeSecretMasked}` : 'sk_test_...'}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className={styles['btn-secondary']}
                    onClick={() => setShowStripeSecret(s => !s)}
                  >
                    {showStripeSecret ? 'Hide' : 'Show'}
                  </button>
                </div>
                <span className={styles['field-hint']}>
                  Server-side credential used to create payment intents. Never exposed to the browser.
                  Leave blank to keep the current key.
                </span>
              </div>

              <div className={styles['field']}>
                <label htmlFor="stripe-webhook">Webhook Signing Secret <span style={{ fontWeight: 400, color: 'var(--admin-text-muted)' }}>(optional)</span></label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    id="stripe-webhook"
                    type={showStripeWebhook ? 'text' : 'password'}
                    value={stripeWebhookSecret}
                    onChange={e => setStripeWebhookSecret(e.target.value)}
                    placeholder={stripeWebhookMasked ? `Current: ${stripeWebhookMasked}` : 'whsec_...'}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className={styles['btn-secondary']}
                    onClick={() => setShowStripeWebhook(s => !s)}
                  >
                    {showStripeWebhook ? 'Hide' : 'Show'}
                  </button>
                </div>
                <span className={styles['field-hint']}>
                  Used to verify Stripe webhook signatures (e.g. <code>payment_intent.succeeded</code>). Leave blank to keep the current value.
                </span>
              </div>
            </div>
          </div>

          {/* Tabby */}
          <div className={styles['settings-panel']}>
            <div className={styles['settings-card']}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                <h3 style={{ margin: 0 }}>Tabby — Pay in 4 Installments</h3>
                <Badge kind={tabbyBadge} label={tabbyBadge === 'active' ? 'Active' : (tabbyBadge === 'disabled' ? 'Configured · Off' : 'Setup Needed')} />
              </div>
              <p style={{ marginTop: 0, color: 'var(--admin-text-muted)', fontSize: 13 }}>
                Tabby lets shoppers split payments into 4 interest-free installments. Get your API keys from the
                Tabby Merchant Dashboard.
              </p>

              <div className={styles['field']}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textTransform: 'none', letterSpacing: 0, fontSize: 14, fontWeight: 500, marginBottom: 0, color: 'var(--admin-text)' }}>
                  <input
                    type="checkbox"
                    checked={tabbyEnabled}
                    onChange={e => setTabbyEnabled(e.target.checked)}
                  />
                  <span>Enable Tabby at checkout</span>
                </label>
                <span className={styles['field-hint']}>
                  When off, Tabby is hidden from the payment options on checkout.
                </span>
              </div>

              <div className={styles['field']}>
                <label htmlFor="tabby-public">Public Key</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    id="tabby-public"
                    type={showTabbyPublic ? 'text' : 'password'}
                    value={tabbyPublicKey}
                    onChange={e => setTabbyPublicKey(e.target.value)}
                    placeholder={tabbyPublicMasked ? `Current: ${tabbyPublicMasked}` : 'pk_test_...'}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className={styles['btn-secondary']}
                    onClick={() => setShowTabbyPublic(s => !s)}
                  >
                    {showTabbyPublic ? 'Hide' : 'Show'}
                  </button>
                </div>
                <span className={styles['field-hint']}>
                  Used by the storefront to render the Tabby promo widget. Leave blank to keep current key.
                </span>
              </div>

              <div className={styles['field']}>
                <label htmlFor="tabby-secret">Secret Key</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    id="tabby-secret"
                    type={showTabbySecret ? 'text' : 'password'}
                    value={tabbySecretKey}
                    onChange={e => setTabbySecretKey(e.target.value)}
                    placeholder={tabbySecretMasked ? `Current: ${tabbySecretMasked}` : 'sk_test_...'}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className={styles['btn-secondary']}
                    onClick={() => setShowTabbySecret(s => !s)}
                  >
                    {showTabbySecret ? 'Hide' : 'Show'}
                  </button>
                </div>
                <span className={styles['field-hint']}>
                  Server-side credential for creating checkout sessions. Never exposed to the browser.
                  Leave blank to keep current key.
                </span>
              </div>
            </div>
          </div>

          {/* Tamara */}
          <div className={styles['settings-panel']}>
            <div className={styles['settings-card']}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 4 }}>
                <h3 style={{ margin: 0 }}>Tamara — Buy Now, Pay Later</h3>
                <Badge kind={tamaraBadge} label={tamaraBadge === 'active' ? (tamaraSandbox ? 'Active · Sandbox' : 'Active') : (tamaraBadge === 'disabled' ? 'Configured · Off' : 'Setup Needed')} />
              </div>
              <p style={{ marginTop: 0, color: 'var(--admin-text-muted)', fontSize: 13 }}>
                Tamara offers split payments and pay-later options across the GCC. Generate the API token in the
                Tamara merchant portal.
              </p>

              <div className={styles['field']}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textTransform: 'none', letterSpacing: 0, fontSize: 14, fontWeight: 500, marginBottom: 0, color: 'var(--admin-text)' }}>
                  <input
                    type="checkbox"
                    checked={tamaraEnabled}
                    onChange={e => setTamaraEnabled(e.target.checked)}
                  />
                  <span>Enable Tamara at checkout</span>
                </label>
              </div>

              <div className={styles['field']}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', textTransform: 'none', letterSpacing: 0, fontSize: 14, fontWeight: 500, marginBottom: 0, color: 'var(--admin-text)' }}>
                  <input
                    type="checkbox"
                    checked={tamaraSandbox}
                    onChange={e => setTamaraSandbox(e.target.checked)}
                  />
                  <span>Use Tamara <strong>Sandbox</strong> environment</span>
                </label>
                <span className={styles['field-hint']}>
                  Off = production (<code>api.tamara.co</code>) · On = sandbox (<code>api-sandbox.tamara.co</code>).
                  Toggle takes effect on the next checkout — no restart needed.
                </span>
              </div>

              <div className={styles['field']}>
                <label htmlFor="tamara-token">API Token</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    id="tamara-token"
                    type={showTamaraToken ? 'text' : 'password'}
                    value={tamaraToken}
                    onChange={e => setTamaraToken(e.target.value)}
                    placeholder={tamaraTokenMasked ? `Current: ${tamaraTokenMasked}` : 'Bearer token from Tamara portal'}
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className={styles['btn-secondary']}
                    onClick={() => setShowTamaraToken(s => !s)}
                  >
                    {showTamaraToken ? 'Hide' : 'Show'}
                  </button>
                </div>
                <span className={styles['field-hint']}>
                  Server-side credential. Leave blank to keep current token.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Save bar */}
        <div className={styles['callout-amber']} style={{ marginTop: 16 }}>
          <strong>Heads up</strong>
          <p>
            Secret credentials are stored securely on the backend and never returned in plaintext to the admin UI —
            you only see the last 4 characters. To rotate a key, paste the new value and save; leaving the field blank preserves the existing one.
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
          <button className={styles['btn-primary']} disabled={saving} onClick={save}>
            {saving ? 'Saving...' : 'Save Payment Settings'}
          </button>
        </div>
      </div>
    </>
  );
}
