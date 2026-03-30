import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import styles from './CartPage.module.css';

export default function CartPage() {
  const { items, total, updateQuantity, removeItem, clearCart } = useCart();
  const navigate = useNavigate();

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
          {items.map(item => (
            <div key={item.id} className={styles['cart-item']}>
              <div className={styles['cart-item-image']}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#eee' }} />
                )}
              </div>
              <div className={styles['cart-item-info']}>
                <h3><Link to={`/product/${item.productId}`}>{item.name}</Link></h3>
                <div className={styles['cart-item-price']}>${item.price.toFixed(2)}</div>
                <div className={styles['cart-item-actions']}>
                  <div className={styles['cart-qty']}>
                    <button onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}>−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)}>+</button>
                  </div>
                  <button className={styles['cart-remove']} onClick={() => removeItem(item.id)}>Remove</button>
                </div>
              </div>
              <div className={styles['cart-item-total']}>
                ${(item.price * item.quantity).toFixed(2)}
              </div>
            </div>
          ))}
          <div style={{ marginTop: 16 }}>
            <button className="btn btn-outline btn-sm" onClick={clearCart}>Clear Cart</button>
          </div>
        </div>
        <div className={styles['cart-summary']}>
          <h2>Order Summary</h2>
          <div className={styles['summary-row']}>
            <span>Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className={styles['summary-row']}>
            <span>Shipping</span>
            <span>{total >= 75 ? 'Free' : '$9.99'}</span>
          </div>
          <div className={styles['summary-total']}>
            <span>Total</span>
            <span>${(total >= 75 ? total : total + 9.99).toFixed(2)}</span>
          </div>
          <button className={styles['checkout-btn']} onClick={() => navigate('/checkout')}>Proceed to Checkout</button>
        </div>
      </div>
    </div>
  );
}
