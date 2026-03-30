import { Link } from 'react-router-dom';
import styles from './Footer.module.css';

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles['footer-grid']}>
        <div className={styles['footer-about']}>
          <h3>SOLO</h3>
          <p>
            Premium kitchenware and home essentials. Curated collections for the modern home.
          </p>
        </div>
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
            <li><Link to="/my-account">My Account</Link></li>
            <li><Link to="/my-account/orders">Order History</Link></li>
            <li><Link to="/favorites">Wishlist</Link></li>
            <li><Link to="/cart">Cart</Link></li>
          </ul>
        </div>
        <div>
          <h3>Help</h3>
          <ul>
            <li><Link to="/pages/shipping">Shipping</Link></li>
            <li><Link to="/pages/returns">Returns</Link></li>
            <li><Link to="/pages/contact">Contact Us</Link></li>
            <li><Link to="/pages/faq">FAQ</Link></li>
          </ul>
        </div>
      </div>
      <div className={styles['footer-bottom']}>
        © {new Date().getFullYear()} Solo E-Commerce. All rights reserved.
      </div>
    </footer>
  );
}
