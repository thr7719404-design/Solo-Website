import { Link } from 'react-router-dom';
import { useNavMenu } from '@/hooks/useNavMenu';
import styles from './Footer.module.css';

const HIDDEN_URLS = ['/pages/shipping', '/pages/returns'];

export default function Footer() {
  const footerNav = useNavMenu('footer-nav');

  // Default columns when no CMS-managed footer-nav exists yet
  const fallbackColumns = (
    <>
      <div>
        <h3>Shop</h3>
        <ul>
          <li><Link to="/new-arrivals">New Arrivals</Link></li>
          <li><Link to="/best-sellers">Best Sellers</Link></li>
          <li><Link to="/featured">Featured</Link></li>
          <li><Link to="/sale">Sale</Link></li>
        </ul>
      </div>
      <div>
        <h3>Account</h3>
        <ul>
          <li><Link to="/account">My Account</Link></li>
          <li><Link to="/account/orders">Order History</Link></li>
          <li><Link to="/favorites">Wishlist</Link></li>
          <li><Link to="/cart">Cart</Link></li>
        </ul>
      </div>
      <div>
        <h3>Help</h3>
        <ul>
          <li><Link to="/pages/contact">Contact Us</Link></li>
          <li><Link to="/pages/faq">FAQ</Link></li>
          <li><Link to="/bulk-order">Bulk Orders</Link></li>
          <li><Link to="/pages/privacy">Privacy Policy</Link></li>
          <li><Link to="/pages/terms">Terms &amp; Conditions</Link></li>
        </ul>
      </div>
    </>
  );

  return (
    <footer className={styles.footer}>
      <div className={styles['footer-grid']}>
        <div className={styles['footer-about']}>
          <h3>SOLO</h3>
          <p>
            Premium kitchenware and home essentials. Curated collections for the modern home.
          </p>
          <p style={{ marginTop: '0.75rem', fontSize: '0.85rem', lineHeight: 1.5 }}>
            VUET0399 Compass Building - Al Hulaila,<br />
            Al Hulaila Industrial Zone-FZ,<br />
            Ras Al Khaimah, United Arab Emirates<br />
            Tel: <a href="tel:+971557133051" style={{ color: 'inherit' }}>0557133051</a>
          </p>
        </div>
        {footerNav.length > 0
          ? footerNav.map((column) => (
              <div key={column.id}>
                <h3>{column.label}</h3>
                <ul>
                  {(column.children ?? []).filter((c) => c.isActive && !HIDDEN_URLS.includes(c.url || '')).map((child) => (
                    <li key={child.id}>
                      <Link
                        to={child.url || '#'}
                        target={child.openInNewTab ? '_blank' : undefined}
                        rel={child.openInNewTab ? 'noopener noreferrer' : undefined}
                      >
                        {child.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))
          : fallbackColumns}
      </div>
      <div className={styles['footer-bottom']}>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '0.5rem', fontSize: '0.85rem' }}>
          <Link to="/pages/privacy" style={{ color: '#aaa' }}>Privacy Policy</Link>
          <span style={{ color: '#555' }}>|</span>
          <Link to="/pages/terms" style={{ color: '#aaa' }}>Terms &amp; Conditions</Link>
          <span style={{ color: '#555' }}>|</span>
          <Link to="/pages/faq" style={{ color: '#aaa' }}>FAQ</Link>
          <span style={{ color: '#555' }}>|</span>
          <Link to="/pages/contact" style={{ color: '#aaa' }}>Contact</Link>
        </div>
        © {new Date().getFullYear()} Solo E-Commerce. All rights reserved.
      </div>
    </footer>
  );
}

