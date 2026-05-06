import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { settingsApi } from '@/api/settings';
import styles from './Admin.module.css';

export default function AdminShippingPage() {
  const [fee, setFee] = useState<number>(10);
  const [label, setLabel] = useState<string>('Shipping');
  const [freeThreshold, setFreeThreshold] = useState<number>(0);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    settingsApi.getShippingConfig()
      .then(c => {
        setFee(Number(c.fee ?? 10));
        setLabel(c.label ?? 'Shipping');
        setFreeThreshold(Number(c.freeShippingThreshold ?? 0));
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const save = async () => {
    if (fee === null || fee === undefined || Number.isNaN(Number(fee)) || Number(fee) < 0) {
      toast.error('Shipping fee is mandatory and must be 0 or greater');
      return;
    }
    if (Number.isNaN(Number(freeThreshold)) || Number(freeThreshold) < 0) {
      toast.error('Free shipping threshold must be 0 or greater');
      return;
    }
    setSaving(true);
    try {
      await settingsApi.saveShippingConfig({
        fee: Number(fee),
        label,
        freeShippingThreshold: Number(freeThreshold) || 0,
      });
      toast.success('Shipping settings saved');
    } catch {
      toast.error('Failed to save shipping settings');
    }
    setSaving(false);
  };

  if (!loaded) return <div className={styles['admin-body']}><div className="loading-spinner" /></div>;

  const sampleSubtotal = 250;
  const thresholdActive = Number(freeThreshold) > 0;
  const sampleQualifiesFree = thresholdActive && sampleSubtotal >= Number(freeThreshold);
  const sampleShipping = sampleQualifiesFree ? 0 : Number(fee || 0);
  const sampleTotal = sampleSubtotal + sampleShipping;
  const freeStatusText = thresholdActive
    ? `Free over AED ${Number(freeThreshold).toFixed(2)}`
    : 'Always Active';

  return (
    <>
      <div className={styles['header-v2']}>
        <div>
          <h1>Shipping</h1>
          <span className={styles['header-v2-sub']}>
            Mandatory shipping fee applied to every order across the storefront, checkout, invoices, and emails
          </span>
        </div>
      </div>
      <div className={styles['admin-body']}>

        {/* Stats */}
        <div className={styles['stats-grid-3']}>
          <div className={`${styles['stat-card']} ${styles['stat-card-accent']}`}>
            <div className={styles['stat-label']}>Current Fee</div>
            <div className={styles['stat-value']}>AED {Number(fee || 0).toFixed(2)}</div>
          </div>
          <div className={`${styles['stat-card']} ${styles['stat-card-cyan']}`}>
            <div className={styles['stat-label']}>Display Label</div>
            <div className={styles['stat-value']} style={{ fontSize: 22 }}>{label}</div>
          </div>
          <div className={`${styles['stat-card']} ${styles['stat-card-emerald']}`}>
            <div className={styles['stat-label']}>Status</div>
            <div className={styles['stat-value']} style={{ fontSize: 22 }}>{freeStatusText}</div>
          </div>
        </div>

        <div className={`${styles['dash-grid']} ${styles['dash-grid-2']}`}>
          {/* Settings */}
          <div className={styles['settings-panel']}>
            <div className={styles['settings-card']}>
              <div className={styles['field']}>
                <label htmlFor="shipping-fee">Shipping Fee (AED) <span style={{ color: '#dc2626' }}>*</span></label>
                <input
                  id="shipping-fee"
                  type="number"
                  min={0}
                  step={0.5}
                  value={fee}
                  onChange={e => setFee(Number(e.target.value))}
                  required
                />
                <span className={styles['field-hint']}>
                  This fee is added to every order. Mandatory — cannot be disabled or removed.
                </span>
              </div>
              <div className={styles['field']}>
                <label htmlFor="shipping-label">Display Label</label>
                <input
                  id="shipping-label"
                  type="text"
                  maxLength={40}
                  value={label}
                  onChange={e => setLabel(e.target.value)}
                  placeholder="Shipping"
                />
                <span className={styles['field-hint']}>Label shown on cart, checkout, invoices, and emails</span>
              </div>
              <div className={styles['field']}>
                <label htmlFor="shipping-free-threshold">Free Shipping Threshold (AED)</label>
                <input
                  id="shipping-free-threshold"
                  type="number"
                  min={0}
                  step={5}
                  value={freeThreshold}
                  onChange={e => setFreeThreshold(Number(e.target.value))}
                  placeholder="0 to disable"
                />
                <span className={styles['field-hint']}>
                  When the order subtotal reaches this amount, shipping is automatically free.
                  Set to <strong>0</strong> to always charge shipping. Common values: 250, 300, 500.
                </span>
              </div>
              <button className={styles['btn-primary']} disabled={saving} onClick={save} style={{ marginTop: 8 }}>
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>

          {/* Preview */}
          <div>
            <div className={styles['callout-amber']}>
              <strong>How it works</strong>
              <p>
                The shipping fee is applied to every order placed on the website. It appears in the cart,
                on the checkout total, on the order invoice, and in customer-facing email notifications.
                The fee is mandatory and cannot be deactivated; only the amount is editable.
                {' '}If <strong>Free Shipping Threshold</strong> is greater than 0, shipping is automatically waived
                whenever the order subtotal meets or exceeds that amount.
              </p>
            </div>

            <div className={styles['preview-box']} style={{ marginTop: 16 }}>
              <h4 style={{ marginBottom: 12, color: 'var(--admin-text)' }}>
                Preview (AED {sampleSubtotal} subtotal)
              </h4>
              <div className={styles['preview-row']}>
                <span className={styles['preview-row-label']}>Subtotal</span>
                <span className={styles['preview-row-value']}>AED {sampleSubtotal.toFixed(2)}</span>
              </div>
              <div className={styles['preview-row']}>
                <span className={styles['preview-row-label']}>{label}</span>
                <span className={styles['preview-row-value']}>
                  {sampleQualifiesFree ? 'FREE' : `AED ${Number(fee || 0).toFixed(2)}`}
                </span>
              </div>
              <div className={`${styles['preview-row']} ${styles['preview-row-total']}`}>
                <span className={styles['preview-row-label']}>Order Total</span>
                <span className={styles['preview-row-value']}>AED {sampleTotal.toFixed(2)}</span>
              </div>
              {thresholdActive && !sampleQualifiesFree && (
                <div className={styles['field-hint']} style={{ marginTop: 10 }}>
                  Add AED {(Number(freeThreshold) - sampleSubtotal).toFixed(2)} more to qualify for free shipping.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
