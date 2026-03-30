import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { stripeApi } from '@/api/stripe';
import { ordersApi } from '@/api/orders';
import { promoApi } from '@/api/promo';
import { accountApi } from '@/api/account';
import { config } from '@/config';
import type { PromoValidationResult } from '@/types';

export default function CheckoutPage() {
  const { items, total: cartTotal, itemCount, clearCart } = useCart();
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Address form
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'AE',
  });

  // Payment method
  const [paymentMethod, setPaymentMethod] = useState<'CASH_ON_DELIVERY' | 'CREDIT_CARD'>('CASH_ON_DELIVERY');

  // Promo
  const [promoCode, setPromoCode] = useState('');
  const [promoResult, setPromoResult] = useState<PromoValidationResult | null>(null);

  // Loyalty
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [loyaltyRedeem, setLoyaltyRedeem] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);

  const subtotal = cartTotal;
  const discount = promoResult?.valid ? promoResult.discount : 0;
  const redeemAmount = Math.min(
    parseFloat(loyaltyRedeem) || 0,
    loyaltyBalance,
    subtotal * config.loyaltyMaxRedeemPercent,
  );
  const total = Math.max(0, subtotal - discount - redeemAmount);

  // Load loyalty balance
  useEffect(() => {
    if (isAuthenticated) {
      accountApi.getLoyalty().then((data) => {
        const bal = Number(data.balanceAed ?? 0) || (Number(data.totalEarned ?? 0) - Number(data.totalRedeemed ?? 0));
        setLoyaltyBalance(bal);
      }).catch(() => {});
    }
  }, [isAuthenticated]);

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    try {
      const res = await promoApi.validate({ code: promoCode, orderAmount: subtotal });
      setPromoResult(res);
      if (!res.valid) toast.error(res.message ?? 'Invalid promo code');
      else toast.success('Promo code applied!');
    } catch {
      toast.error('Could not validate promo code');
    }
  };

  const handlePlaceOrder = async () => {
    if (!form.firstName || !form.lastName || !form.email || !form.addressLine1 || !form.city) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsProcessing(true);
    try {
      let paymentIntentId: string | undefined;

      if (paymentMethod === 'CREDIT_CARD') {
        const { paymentIntentId: piId } = await stripeApi.createPaymentIntent({
          amount: Math.round(total * 100),
          currency: 'aed',
        });
        await stripeApi.verifyPayment({ paymentIntentId: piId });
        paymentIntentId = piId;
      }

      const order = await ordersApi.create({
        paymentIntentId,
        paymentMethod,
        shippingMethod: 'STANDARD',
        shippingAddress: {
          firstName: form.firstName,
          lastName: form.lastName,
          street: form.addressLine1,
          apartment: form.addressLine2 || undefined,
          city: form.city,
          postalCode: form.postalCode || undefined,
          country: form.country || 'AE',
          phone: form.phone || undefined,
        },
        promoCode: promoResult?.valid ? promoCode : undefined,
        loyaltyRedeemAed: redeemAmount > 0 ? redeemAmount : undefined,
        notes: '',
        items: items.map((i) => ({
          productId: Number(i.productId),
          quantity: i.quantity,
        })),
      });

      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/account?tab=orders`);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      toast.error(Array.isArray(msg) ? msg[0] : (msg || 'Order failed. Please try again.'));
    } finally {
      setIsProcessing(false);
    }
  };

  if (items.length === 0) {
    return (
      <div style={{ maxWidth: 1320, margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>Nothing to checkout</h2>
        <Link to="/products" style={{ color: '#B8860B', textDecoration: 'underline' }}>
          Continue shopping
        </Link>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 1320, margin: '0 auto', padding: '32px 16px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Checkout</h1>

      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap' }}>
        {/* Left — Shipping form */}
        <div style={{ flex: 1, minWidth: 320 }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Shipping Address</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {([
              ['firstName', 'First Name *'],
              ['lastName', 'Last Name *'],
              ['email', 'Email *'],
              ['phone', 'Phone'],
              ['addressLine1', 'Address Line 1 *', true],
              ['addressLine2', 'Address Line 2', true],
              ['city', 'City *'],
              ['state', 'State / Emirate'],
              ['postalCode', 'Postal Code'],
            ] as const).map(([key, label, fullWidth]) => (
              <div key={key} style={fullWidth ? { gridColumn: 'span 2' } : {}}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#888', marginBottom: 4 }}>{label}</label>
                <input
                  type={key === 'email' ? 'email' : 'text'}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => update(key, e.target.value)}
                  style={{ width: '100%', border: '1px solid #ddd', borderRadius: 6, padding: '10px 12px', fontSize: 14, outline: 'none' }}
                />
              </div>
            ))}
          </div>

          {/* Payment method */}
          <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 16 }}>Payment Method</h2>
          <div style={{ display: 'flex', gap: 12 }}>
            {([
              ['CASH_ON_DELIVERY', 'Cash on Delivery'],
              ['CREDIT_CARD', 'Credit Card'],
            ] as const).map(([value, label]) => (
              <label key={value} style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: paymentMethod === value ? '2px solid #B8860B' : '1px solid #ddd',
                borderRadius: 8,
                padding: '14px 16px',
                cursor: 'pointer',
                background: paymentMethod === value ? '#faf6ed' : '#fff',
              }}>
                <input
                  type="radio"
                  checked={paymentMethod === value}
                  onChange={() => setPaymentMethod(value)}
                  style={{ accentColor: '#B8860B' }}
                />
                <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Right — Summary */}
        <div style={{ width: 400, flexShrink: 0 }}>
          <div style={{ border: '1px solid #e5e5e5', borderRadius: 12, padding: 24, position: 'sticky', top: 96 }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Order Summary</h2>

            {/* Items summary */}
            <div style={{ maxHeight: 240, overflowY: 'auto', marginBottom: 16 }}>
              {items.map((item) => (
                <div key={item.id} style={{ display: 'flex', gap: 12, fontSize: 14, marginBottom: 12 }}>
                  <img
                    src={item.imageUrl || '/placeholder.png'}
                    alt={item.name}
                    style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover', background: '#f5f5f5' }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                    <p style={{ color: '#999' }}>Qty: {item.quantity}</p>
                  </div>
                  <span style={{ fontWeight: 600, flexShrink: 0 }}>
                    {config.currency} {(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            {/* Promo code */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <input
                type="text"
                value={promoCode}
                onChange={(e) => setPromoCode(e.target.value)}
                placeholder="Promo code"
                style={{ flex: 1, border: '1px solid #ddd', borderRadius: 6, padding: '8px 12px', fontSize: 14, outline: 'none' }}
              />
              <button
                onClick={handleApplyPromo}
                style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, border: '1px solid #ddd', borderRadius: 6, background: '#fff', cursor: 'pointer' }}
              >
                Apply
              </button>
            </div>
            {promoResult?.valid && (
              <p style={{ fontSize: 14, color: '#16a34a', marginBottom: 12 }}>
                Discount: −{config.currency} {discount.toFixed(2)}
              </p>
            )}

            {/* Loyalty redemption */}
            {loyaltyBalance > 0 && (
              <div style={{ background: '#faf6ed', border: '1px solid #e8d5a0', borderRadius: 8, padding: 12, marginBottom: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#B8860B' }}>Loyalty Cash</span>
                  <span style={{ fontSize: 12, color: '#888' }}>Balance: {config.currency} {loyaltyBalance.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    type="number"
                    min="0"
                    max={Math.min(loyaltyBalance, subtotal * config.loyaltyMaxRedeemPercent)}
                    step="0.01"
                    value={loyaltyRedeem}
                    onChange={(e) => setLoyaltyRedeem(e.target.value)}
                    placeholder={`Max ${config.currency} ${Math.min(loyaltyBalance, subtotal * config.loyaltyMaxRedeemPercent).toFixed(2)}`}
                    style={{ flex: 1, border: '1px solid #ddd', borderRadius: 6, padding: '8px 12px', fontSize: 14, outline: 'none' }}
                  />
                  <button
                    onClick={() => setLoyaltyRedeem(Math.min(loyaltyBalance, subtotal * config.loyaltyMaxRedeemPercent).toFixed(2))}
                    style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, background: '#B8860B', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}
                  >
                    Use Max
                  </button>
                </div>
                <p style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Max 30% of subtotal</p>
              </div>
            )}

            {/* Totals */}
            <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: 16, marginTop: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                <span style={{ color: '#666' }}>Subtotal ({itemCount})</span>
                <span>{config.currency} {subtotal.toFixed(2)}</span>
              </div>
              {discount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#16a34a', marginBottom: 8 }}>
                  <span>Discount</span>
                  <span>−{config.currency} {discount.toFixed(2)}</span>
                </div>
              )}
              {redeemAmount > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#B8860B', marginBottom: 8 }}>
                  <span>Loyalty Cash</span>
                  <span>−{config.currency} {redeemAmount.toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
                <span style={{ color: '#666' }}>Shipping</span>
                <span style={{ color: '#16a34a' }}>Free</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, borderTop: '1px solid #e5e5e5', paddingTop: 12 }}>
                <span>Total</span>
                <span>{config.currency} {total.toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isProcessing}
              style={{
                marginTop: 24,
                width: '100%',
                background: isProcessing ? '#999' : 'linear-gradient(135deg, #D4A843, #B8860B)',
                color: '#fff',
                fontWeight: 700,
                textTransform: 'uppercase' as const,
                fontSize: 14,
                letterSpacing: '0.05em',
                padding: '14px 0',
                borderRadius: 8,
                border: 'none',
                cursor: isProcessing ? 'not-allowed' : 'pointer',
              }}
            >
              {isProcessing ? 'Processing...' : 'Place Order'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
