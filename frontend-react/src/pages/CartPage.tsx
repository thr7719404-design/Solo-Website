import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { settingsApi } from '../api/settings';
import styles from './CartPage.module.css';
import { trackViewCart } from '@/lib/analytics';

export default function CartPage() {
  const { items, total, updateQuantity, removeItem, clearCart, notices, dismissNotice } = useCart();
  const navigate = useNavigate();

  const [shippingFee, setShippingFee] = useState(10);
  const [shippingLabel, setShippingLabel] = useState('Shipping');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(0);

  useEffect(() => {
    settingsApi.getPublicShippingConfig()
      .then(c => {
        setShippingFee(Number(c.fee ?? 10));
        setShippingLabel(c.label ?? 'Shipping');
        setFreeShippingThreshold(Number(c.freeShippingThreshold ?? 0));
      })
      .catch(() => {});
  }, []);

  // Track view_cart once when the page loads with items
  useEffect(() => {
    if (items.length === 0) return;
    trackViewCart(
      items.map(i => ({ item_id: i.productId, item_name: i.name, price: i.price, quantity: i.quantity })),
      items.reduce((s, i) => s + i.price * i.quantity, 0),
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const qualifiesFree = freeShippingThreshold > 0 && total >= freeShippingThreshold;
  const shippingApplied = qualifiesFree ? 0 : shippingFee;
  const grandTotal = total + shippingApplied;
  const remainingForFree = freeShippingThreshold > 0 && !qualifiesFree
    ? Math.max(0, freeShippingThreshold - total)
    : 0;

  const hasOutOfStock = items.some(item => item.inStock === false);

  if (!items.length) {
    return (
      <div className={styles['cart-page']}>
        <div className={styles['empty-cart']}>
          <h2>Your cart is empty</h2>
          <p>Browse our products and add something you love!</p>
          <Link to="/" className="btn btn-primary" style={{ marginTop: 16, display: 'inline-block' }}>
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['cart-page']}>
      <h1>Shopping Cart ({items.length} item{items.length !== 1 ? 's' : ''})</h1>
      <div className={styles['cart-layout']}>
        <div>
          {items.map(item => {
            const outOfStock = item.inStock === false;
            const limit = typeof item.available === 'number' && item.available > 0
              ? item.available
              : (item.stockQty ?? Number.POSITIVE_INFINITY);
            const atLimit = item.quantity >= limit;
            return (
            <div key={item.id} className={`${styles['cart-item']} ${outOfStock ? styles['cart-item-oos'] : ''}`}>
              <div className={styles['cart-item-image']}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} loading="lazy" width={80} height={80} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#eee' }} />
                )}
              </div>
              <div className={styles['cart-item-info']}>
                <h3><Link to={`/product/${item.productId}`}>{item.name}</Link></h3>
                {outOfStock && <span className={styles['oos-badge']}>Out of Stock</span>}
                {!outOfStock && Number.isFinite(limit) && limit <= 5 && (
                  <span style={{ fontSize: 12, color: '#B8860B', fontWeight: 600 }}>
                    Only {limit} left in stock
                  </span>
                )}
                <div className={styles['cart-item-price']}>AED {item.price.toFixed(2)}</div>
                <div className={styles['cart-item-actions']}>
                  <div className={styles['cart-qty']}>
                    <button disabled={outOfStock} onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}>−</button>
                    <span>{item.quantity}</span>
                    <button
                      disabled={outOfStock || atLimit}
                      title={atLimit ? `Only ${limit} available` : undefined}
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                    >+</button>
                  </div>
                  <button className={styles['cart-remove']} onClick={() => removeItem(item.id)}>Remove</button>
                </div>
                {notices[item.id] && (
                  <button
                    type="button"
                    aria-live="polite"
                    onClick={() => dismissNotice(item.id)}
                    style={{
                      marginTop: 8,
                      padding: '8px 12px',
                      background: '#FFF7E6',
                      border: '1px solid #F0C36D',
                      borderRadius: 6,
                      color: '#8A6100',
                      fontSize: 13,
                      cursor: 'pointer',
                      display: 'inline-block',
                      textAlign: 'left',
                      font: 'inherit',
                    }}
                  >
                    {notices[item.id]}
                  </button>
                )}
              </div>
              <div className={styles['cart-item-total']}>
                {outOfStock ? '—' : `AED ${(item.price * item.quantity).toFixed(2)}`}
              </div>
            </div>
            );
          })}
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-outline btn-sm" onClick={clearCart}>Clear Cart</button>
          </div>
        </div>
        <div className={styles['cart-summary']}>
          <h2>Order Summary</h2>
          <div className={styles['summary-row']}>
            <span>Subtotal</span>
            <span>AED {total.toFixed(2)}</span>
          </div>
          <div className={styles['summary-row']}>
            <span>{shippingLabel}</span>
            <span>{shippingApplied === 0 ? 'Free' : `AED ${shippingApplied.toFixed(2)}`}</span>
          </div>
          {remainingForFree > 0 && (
            <div className={styles['summary-row']} style={{ fontSize: 12, color: '#16a34a' }}>
              <span>Add AED {remainingForFree.toFixed(2)} more for free shipping</span>
            </div>
          )}
          <div className={styles['summary-total']}>
            <span>Total</span>
            <span>AED {grandTotal.toFixed(2)}</span>
          </div>
          <button
            className={`${styles['checkout-btn']} ${hasOutOfStock ? styles['checkout-btn-disabled'] : ''}`}
            disabled={hasOutOfStock}
            onClick={() => navigate('/checkout')}
          >
            Proceed to Checkout
          </button>
          {hasOutOfStock && (
            <p className={styles['oos-warning']}>
              Please remove out-of-stock items before checking out.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
