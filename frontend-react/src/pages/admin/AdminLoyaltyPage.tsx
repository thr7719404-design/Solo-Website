import { useState, useEffect } from 'react';
import { settingsApi } from '@/api/settings';
import styles from './Admin.module.css';

export default function AdminLoyaltyPage() {
  const [earnPercent, setEarnPercent] = useState(5);
  const [maxRedeemPercent, setMaxRedeemPercent] = useState(20);
  const [isEnabled, setIsEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    settingsApi.getLoyaltyConfig()
      .then(c => {
        setEarnPercent(Math.round((c.earnPercent ?? 0.05) * 100 * 100) / 100);
        setMaxRedeemPercent(Math.round((c.maxRedeemPercent ?? 0.30) * 100 * 100) / 100);
        setIsEnabled(c.isEnabled ?? true);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const save = async () => {
    setSaving(true);
    try { await settingsApi.saveLoyaltyConfig({ earnPercent: earnPercent / 100, maxRedeemPercent: maxRedeemPercent / 100, isEnabled }); } catch { /* */ }
    setSaving(false);
  };

  if (!loaded) return <div className={styles['admin-body']}><div className="loading-spinner" /></div>;

  const sampleOrder = 500;
  const pointsEarned = (sampleOrder * earnPercent / 100).toFixed(2);
  const maxRedeem = (sampleOrder * maxRedeemPercent / 100).toFixed(2);

  return (
    <>
      <div className={styles['header-v2']}>
        <div>
          <h1>Loyalty Program</h1>
          <span className={styles['header-v2-sub']}>Configure points earning and redemption rules</span>
        </div>
      </div>
      <div className={styles['admin-body']}>

        {/* Stats */}
        <div className={styles['stats-grid-3']}>
          <div className={`${styles['stat-card']} ${styles['stat-card-accent']}`}>
            <div className={styles['stat-label']}>Earn Rate</div>
            <div className={styles['stat-value']}>{earnPercent}%</div>
          </div>
          <div className={`${styles['stat-card']} ${styles['stat-card-cyan']}`}>
            <div className={styles['stat-label']}>Max Redeem</div>
            <div className={styles['stat-value']}>{maxRedeemPercent}%</div>
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
                  <strong>Enable Loyalty Program</strong>
                  <span>Allow customers to earn and redeem points</span>
                </div>
                <div className={`${styles['switch']} ${isEnabled ? styles['switch-on'] : ''}`} onClick={() => setIsEnabled(!isEnabled)}>
                  <div className={styles['switch-dot']} />
                </div>
              </div>
            </div>

            <div className={styles['settings-card']}>
              <div className={styles['field']}>
                <label>Earn Percentage</label>
                <input type="number" min={0} max={100} step={0.5} value={earnPercent} onChange={e => setEarnPercent(Number(e.target.value))} />
                <span className={styles['field-hint']}>Percentage of order total earned as points</span>
              </div>
              <div className={styles['field']}>
                <label>Max Redeem Percentage</label>
                <input type="number" min={0} max={100} step={1} value={maxRedeemPercent} onChange={e => setMaxRedeemPercent(Number(e.target.value))} />
                <span className={styles['field-hint']}>Maximum percentage of order payable with points</span>
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
              <p>Customers earn points on every purchase. Points can be redeemed as discount on future orders, up to the max redeem percentage.</p>
            </div>

            <div className={styles['preview-box']} style={{ marginTop: 16 }}>
              <h4 style={{ marginBottom: 12, color: 'var(--admin-text)' }}>Preview (AED {sampleOrder} order)</h4>
              <div className={styles['preview-row']}>
                <span className={styles['preview-row-label']}>Points Earned</span>
                <span className={styles['preview-row-value']}>{pointsEarned} pts</span>
              </div>
              <div className={styles['preview-row']}>
                <span className={styles['preview-row-label']}>Max Redeemable</span>
                <span className={styles['preview-row-value']}>AED {maxRedeem}</span>
              </div>
              <div className={`${styles['preview-row']} ${styles['preview-row-total']}`}>
                <span className={styles['preview-row-label']}>Min Payment</span>
                <span className={styles['preview-row-value']}>AED {(sampleOrder - Number(maxRedeem)).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
