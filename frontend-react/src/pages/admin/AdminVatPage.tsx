import { useState, useEffect } from 'react';
import { settingsApi } from '@/api/settings';
import styles from './Admin.module.css';

export default function AdminVatPage() {
  const [vatPercent, setVatPercent] = useState(5);
  const [label, setLabel] = useState('VAT');
  const [isEnabled, setIsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    settingsApi.getVatConfig()
      .then(c => {
        setVatPercent(c.vatPercent ?? 5);
        setLabel(c.label ?? 'VAT');
        setIsEnabled(c.isEnabled ?? true);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const save = async () => {
    setSaving(true);
    try { await settingsApi.saveVatConfig({ vatPercent, label, isEnabled }); } catch { /* */ }
    setSaving(false);
  };

  if (!loaded) return <div className={styles['admin-body']}><div className="loading-spinner" /></div>;

  const samplePrice = 100;
  const vatAmount = (samplePrice * vatPercent / 100).toFixed(2);
  const total = (samplePrice + Number(vatAmount)).toFixed(2);

  return (
    <>
      <div className={styles['header-v2']}>
        <div>
          <h1>VAT Settings</h1>
          <span className={styles['header-v2-sub']}>Configure tax calculation for all orders</span>
        </div>
      </div>
      <div className={styles['admin-body']}>

        {/* Stats */}
        <div className={styles['stats-grid-3']}>
          <div className={`${styles['stat-card']} ${styles['stat-card-accent']}`}>
            <div className={styles['stat-label']}>VAT Rate</div>
            <div className={styles['stat-value']}>{vatPercent}%</div>
          </div>
          <div className={`${styles['stat-card']} ${styles['stat-card-cyan']}`}>
            <div className={styles['stat-label']}>Label</div>
            <div className={styles['stat-value']}>{label}</div>
          </div>
          <div className={`${styles['stat-card']} ${styles[isEnabled ? 'stat-card-emerald' : 'stat-card-rose']}`}>
            <div className={styles['stat-label']}>Status</div>
            <div className={styles['stat-value']}>{isEnabled ? 'Active' : 'Disabled'}</div>
          </div>
        </div>

        <div className={`${styles['dash-grid']} ${styles['dash-grid-2']}`}>
          {/* Settings */}
          <div className={styles['settings-panel']}>
            <div className={styles['settings-card']}>
              <div className={styles['settings-row']}>
                <div className={styles['settings-row-label']}>
                  <strong>Enable VAT</strong>
                  <span>Apply VAT to all orders at checkout</span>
                </div>
                <button type="button" role="switch" aria-checked={isEnabled} className={`${styles['switch']} ${isEnabled ? styles['switch-on'] : ''}`} onClick={() => setIsEnabled(!isEnabled)}>
                  <div className={styles['switch-dot']} />
                </button>
              </div>
            </div>

            <div className={styles['settings-card']}>
              <div className={styles['field']}>
                <label htmlFor="vat-percentage">VAT Percentage</label>
                <input id="vat-percentage" type="number" min={0} max={100} step={0.5} value={vatPercent} onChange={e => setVatPercent(Number(e.target.value))} />
                <span className={styles['field-hint']}>Percentage applied to order subtotal</span>
              </div>
              <div className={styles['field']}>
                <label htmlFor="display-label">Display Label</label>
                <input id="display-label" value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. VAT, GST, Tax" />
                <span className={styles['field-hint']}>Shown to customers on invoices and receipts</span>
              </div>
              <button className={styles['btn-primary']} disabled={saving} onClick={save} style={{ marginTop: 8 }}>
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>

          {/* Preview */}
          <div>
            <div className={styles['callout-amber']}>
              <strong>UAE VAT</strong>
              <p>Standard VAT rate in the UAE is 5%. This applies to most goods and services. Make sure your rate complies with local regulations.</p>
            </div>

            <div className={styles['preview-box']} style={{ marginTop: 16 }}>
              <h4 style={{ marginBottom: 12, color: 'var(--admin-text)' }}>Preview (AED {samplePrice} product)</h4>
              <div className={styles['preview-row']}>
                <span className={styles['preview-row-label']}>Subtotal</span>
                <span className={styles['preview-row-value']}>AED {samplePrice.toFixed(2)}</span>
              </div>
              <div className={styles['preview-row']}>
                <span className={styles['preview-row-label']}>{label} ({vatPercent}%)</span>
                <span className={styles['preview-row-value']}>AED {vatAmount}</span>
              </div>
              <div className={`${styles['preview-row']} ${styles['preview-row-total']}`}>
                <span className={styles['preview-row-label']}>Total</span>
                <span className={styles['preview-row-value']}>AED {total}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
