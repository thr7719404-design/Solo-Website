import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import api from '../api/client';
import styles from './CartPage.module.css';

export default function CartPage() {
  const { items, total, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [shippingLabel, setShippingLabel] = useState<string>('Shipping');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(0);

  useEffect(() => {
    api.get<{ fee?: number; label?: string; freeShippingThreshold?: number }>('/settings/shipping').then(({ data }) => {
      if (data?.fee != null) setShippingFee(Number(data.fee));
      if (data?.label) setShippingLabel(String(data.label));
      if (data?.freeShippingThreshold != null) setFreeShippingThreshold(Number(data.freeShippingThreshold));
    }).catch(() => {});
  }, []);

  const freeShippingActive = freeShippingThreshold > 0 && total >= freeShippingThreshold;
  const effectiveShipping = freeShippingActive ? 0 : shippingFee;
  const grandTotal = total + effectiveShipping;

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
            return (
            <div key={item.id} className={`${styles['cart-item']} ${outOfStock ? styles['cart-item-oos'] : ''}`}>
              <div className={styles['cart-item-image']}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#eee' }} />
                )}
              </div>
              <div className={styles['cart-item-info']}>
                <h3><Link to={`/product/${item.productId}`}>{item.name}</Link></h3>
                {outOfStock && <span className={styles['oos-badge']}>Available on Request</span>}
                <div className={styles['cart-item-price']}>AED {item.price.toFixed(2)}</div>
                <div className={styles['cart-item-actions']}>
                  <div className={styles['cart-qty']}>
                    <button disabled={outOfStock} onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}>−</button>
                    <span>{item.quantity}</span>
                    <button disabled={outOfStock} onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <button className={styles['cart-remove']} onClick={() => removeItem(item.id)}>Remove</button>
                </div>
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
            <span>{freeShippingActive ? 'Free' : `AED ${effectiveShipping.toFixed(2)}`}</span>
          </div>
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
