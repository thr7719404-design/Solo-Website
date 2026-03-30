import styles from './Admin.module.css';

export default function AdminLandingPagesPage() {
  return (
    <>
      <div className={styles['admin-header']}><h1>Landing Pages</h1></div>
      <div className={styles['admin-body']}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Landing page editor — coming soon. Use the CMS API to manage landing pages and sections.</p>
      </div>
    </>
  );
}

export function AdminPromoCodesPage() {
  return (
    <>
      <div className={styles['admin-header']}><h1>Promo Codes</h1></div>
      <div className={styles['admin-body']}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Promo code management — coming soon.</p>
      </div>
    </>
  );
}

export function AdminCustomersPage() {
  return (
    <>
      <div className={styles['admin-header']}><h1>Customers</h1></div>
      <div className={styles['admin-body']}>
        <p style={{ color: 'var(--color-text-secondary)' }}>Customer management — coming soon.</p>
      </div>
    </>
  );
}
