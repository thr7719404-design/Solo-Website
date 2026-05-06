import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { loadStripe, type Stripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { stripeApi } from '@/api/stripe';
import { bnplApi } from '@/api/bnpl';
import { ordersApi } from '@/api/orders';
import { promoApi } from '@/api/promo';
import { accountApi } from '@/api/account';
import { config } from '@/config';
import api from '@/api/client';
import type { PromoValidationResult, AddressDto } from '@/types';
import { trackBeginCheckout, trackAddPaymentInfo, trackPurchase } from '@/lib/analytics';

let stripePromise: Promise<Stripe | null> | null = null;
function getStripe() {
  stripePromise ??= stripeApi.getConfig().then(cfg =>
    cfg.publishableKey ? loadStripe(cfg.publishableKey) : null
  ).catch(() => null);
  return stripePromise;
}

/* Wrapper that provides Stripe Elements context */
export default function CheckoutPage() {
  const [stripeObj, setStripeObj] = useState<Stripe | null>(null);
  const [isMobile, setIsMobile] = useState(() => {
    if (typeof globalThis.window === 'undefined') {
      return false;
    }
    return globalThis.window.innerWidth <= 768;
  });

  useEffect(() => {
    getStripe().then(s => setStripeObj(s)).catch(() => {});
  }, []);

  useEffect(() => {
    if (typeof globalThis.window === 'undefined' || !globalThis.window?.matchMedia) {
      return;
    }

    const mediaQuery = globalThis.window.matchMedia('(max-width: 768px)');
    const handleChange = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    setIsMobile(mediaQuery.matches);

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return (
    <Elements stripe={stripeObj}>
      <CheckoutInner isMobile={isMobile} />
    </Elements>
  );
}

function loadLoyaltySettings(
  setLoyaltyEnabled: (v: boolean) => void,
  setLoyaltyMaxRedeem: (v: number) => void,
): Promise<void> {
  return api.get('/settings/loyalty').then(({ data }) => {
    if (data?.isEnabled != null) setLoyaltyEnabled(data.isEnabled);
    if (data?.maxRedeemPercent != null) setLoyaltyMaxRedeem(Number(data.maxRedeemPercent));
  }).catch(() => {});
}

function loadVatSettings(setVatPercent: (v: number) => void): Promise<void> {
  return api.get('/settings/vat').then(({ data }) => {
    if (data?.vatPercent != null) setVatPercent(Number(data.vatPercent));
  }).catch(() => {});
}

function loadShippingSettings(
  setShippingFee: (v: number) => void,
  setShippingLabel: (v: string) => void,
  setFreeShippingThreshold: (v: number) => void,
): Promise<void> {
  return api.get('/settings/shipping').then(({ data }) => {
    if (data?.fee != null) setShippingFee(Number(data.fee));
    if (data?.label) setShippingLabel(String(data.label));
    if (data?.freeShippingThreshold != null) setFreeShippingThreshold(Number(data.freeShippingThreshold));
  }).catch(() => {});
}

function buildAddressForm(addr: AddressDto, currentEmail: string, currentPhone: string) {
  return {
    firstName: addr.firstName || '',
    lastName: addr.lastName || '',
    email: addr.email || currentEmail,
    phone: addr.phone || currentPhone,
    addressLine1: addr.addressLine1 || '',
    addressLine2: addr.addressLine2 || '',
    city: addr.city || '',
    state: addr.state || '',
    postalCode: addr.postalCode || '',
    country: addr.country || 'AE',
  };
}

interface CheckoutFormState {
  firstName: string; lastName: string; email: string; phone: string;
  addressLine1: string; addressLine2: string; city: string; state: string;
  postalCode: string; country: string;
}

function isCheckoutFormValid(form: CheckoutFormState): boolean {
  return Boolean(form.firstName && form.lastName && form.email && form.addressLine1 && form.city);
}

function buildShippingAddressPayload(form: CheckoutFormState) {
  return {
    firstName: form.firstName,
    lastName: form.lastName,
    street: form.addressLine1,
    apartment: form.addressLine2 || undefined,
    city: form.city,
    postalCode: form.postalCode || undefined,
    country: form.country || 'AE',
    phone: form.phone || undefined,
  };
}

function extractErrorMessage(err: any, fallback: string): string {
  const msg = err?.response?.data?.message;
  if (Array.isArray(msg)) return msg[0];
  return msg || fallback;
}

interface OrderSummaryPanelProps {
  isMobile: boolean;
  items: any[];
  itemCount: number;
  promoCode: string;
  setPromoCode: (v: string) => void;
  handleApplyPromo: () => void;
  promoResult: PromoValidationResult | null;
  discount: number;
  loyaltyEnabled: boolean;
  loyaltyBalance: number;
  loyaltyMaxRedeem: number;
  loyaltyRedeem: string;
  setLoyaltyRedeem: (v: string) => void;
  subtotal: number;
  subtotalExclVat: number;
  vatPercent: number;
  vatAmount: number;
  redeemAmount: number;
  shippingApplied: number;
  shippingLabel: string;
  total: number;
  isProcessing: boolean;
  handlePlaceOrder: () => void;
}

function OrderSummaryPanel(props: Readonly<OrderSummaryPanelProps>) {
  const {
    isMobile, items, itemCount, promoCode, setPromoCode, handleApplyPromo,
    promoResult, discount, loyaltyEnabled, loyaltyBalance, loyaltyMaxRedeem,
    loyaltyRedeem, setLoyaltyRedeem, subtotal, subtotalExclVat, vatPercent,
    vatAmount, redeemAmount, shippingApplied, shippingLabel, total,
    isProcessing, handlePlaceOrder,
  } = props;
  return (
    <div style={{ width: isMobile ? '100%' : 400, flexShrink: 0, maxWidth: '100%' }}>
      <div style={{ border: '1px solid #e5e5e5', borderRadius: 12, padding: isMobile ? 18 : 24, position: isMobile ? 'static' : 'sticky', top: 96 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16 }}>Order Summary</h2>
        <div style={{ maxHeight: 240, overflowY: 'auto', marginBottom: 16 }}>
          {items.map((item) => (
            <div key={item.id} style={{ display: 'flex', gap: 12, fontSize: 14, marginBottom: 12, alignItems: 'flex-start' }}>
              <img src={item.imageUrl || '/placeholder.png'} alt={item.name} loading="lazy" width={48} height={48} style={{ width: 48, height: 48, borderRadius: 6, objectFit: 'cover', background: '#f5f5f5' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.name}</p>
                <p style={{ color: '#999' }}>Qty: {item.quantity}</p>
              </div>
              <span style={{ fontWeight: 600, flexShrink: 0 }}>{config.currency} {(item.price * item.quantity).toFixed(2)}</span>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexDirection: isMobile ? 'column' : 'row' }}>
          <input type="text" value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="Promo code"
            style={{ flex: 1, border: '1px solid #ddd', borderRadius: 6, padding: '8px 12px', fontSize: 14, outline: 'none' }} />
          <button onClick={handleApplyPromo}
            style={{ padding: '8px 16px', fontSize: 13, fontWeight: 600, border: '1px solid #ddd', borderRadius: 6, background: '#fff', cursor: 'pointer' }}>Apply</button>
        </div>
        {promoResult?.valid && (
          <p style={{ fontSize: 14, color: '#16a34a', marginBottom: 12 }}>Discount: −{config.currency} {discount.toFixed(2)}</p>
        )}
        {loyaltyEnabled && loyaltyBalance > 0 && (
          <div style={{ background: '#faf6ed', border: '1px solid #e8d5a0', borderRadius: 8, padding: 12, marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#B8860B' }}>Loyalty Cash</span>
              <span style={{ fontSize: 12, color: '#888' }}>Balance: {config.currency} {loyaltyBalance.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, flexDirection: isMobile ? 'column' : 'row' }}>
              <input type="number" min="0" max={Math.min(loyaltyBalance, subtotal * loyaltyMaxRedeem)} step="0.01"
                value={loyaltyRedeem} onChange={(e) => setLoyaltyRedeem(e.target.value)}
                placeholder={`Max ${config.currency} ${Math.min(loyaltyBalance, subtotal * loyaltyMaxRedeem).toFixed(2)}`}
                style={{ flex: 1, border: '1px solid #ddd', borderRadius: 6, padding: '8px 12px', fontSize: 14, outline: 'none' }} />
              <button onClick={() => setLoyaltyRedeem(Math.min(loyaltyBalance, subtotal * loyaltyMaxRedeem).toFixed(2))}
                style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600, background: '#B8860B', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>Use Max</button>
            </div>
            <p style={{ fontSize: 11, color: '#888', marginTop: 4 }}>Max {Math.round(loyaltyMaxRedeem * 100)}% of subtotal</p>
          </div>
        )}
        <div style={{ borderTop: '1px solid #e5e5e5', paddingTop: 16, marginTop: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
            <span style={{ color: '#666' }}>Subtotal excl. VAT ({itemCount})</span>
            <span>{config.currency} {subtotalExclVat.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
            <span style={{ color: '#666' }}>VAT ({vatPercent}%)</span>
            <span>{config.currency} {vatAmount.toFixed(2)}</span>
          </div>
          {discount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#16a34a', marginBottom: 8 }}>
              <span>Discount</span><span>−{config.currency} {discount.toFixed(2)}</span>
            </div>
          )}
          {redeemAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, color: '#B8860B', marginBottom: 8 }}>
              <span>Loyalty Cash</span><span>−{config.currency} {redeemAmount.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, marginBottom: 8 }}>
            <span style={{ color: '#666' }}>{shippingLabel}</span>
            {shippingApplied > 0
              ? <span>{config.currency} {shippingApplied.toFixed(2)}</span>
              : <span style={{ color: '#16a34a' }}>Free</span>}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 700, borderTop: '1px solid #e5e5e5', paddingTop: 12 }}>
            <span>Total</span><span>{config.currency} {total.toFixed(2)}</span>
          </div>
          <p style={{ fontSize: 11, color: '#999', marginTop: 4, textAlign: 'right' }}>All prices include VAT</p>
        </div>
        <button onClick={handlePlaceOrder} disabled={isProcessing}
          style={{
            marginTop: 24, width: '100%',
            background: isProcessing ? '#999' : 'linear-gradient(135deg, #D4A843, #B8860B)',
            color: '#fff', fontWeight: 700, textTransform: 'uppercase' as const,
            fontSize: 14, letterSpacing: '0.05em', padding: '14px 0',
            borderRadius: 8, border: 'none', cursor: isProcessing ? 'not-allowed' : 'pointer',
          }}>
          {isProcessing ? 'Processing...' : 'Place Order'}
        </button>
      </div>
    </div>
  );
}

function CheckoutInner({ isMobile }: Readonly<{ isMobile: boolean }>) {
  const stripe = useStripe();
  const elements = useElements();
  const { items, total: cartTotal, itemCount, clearCart } = useCart();
  const { isAuthenticated, user, register } = useAuth();
  const navigate = useNavigate();

  // Guest account creation
  const [guestPassword, setGuestPassword] = useState('');
  const [guestPasswordConfirm, setGuestPasswordConfirm] = useState('');

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
  const [paymentMethod, setPaymentMethod] = useState<'CASH_ON_DELIVERY' | 'CREDIT_CARD' | 'TABBY' | 'TAMARA'>('CASH_ON_DELIVERY');

  // BNPL availability
  const [tabbyEnabled, setTabbyEnabled] = useState(false);
  const [tamaraEnabled, setTamaraEnabled] = useState(false);

  // Promo
  const [promoCode, setPromoCode] = useState('');
  const [promoResult, setPromoResult] = useState<PromoValidationResult | null>(null);

  // Loyalty
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [loyaltyRedeem, setLoyaltyRedeem] = useState('');
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(false);
  const [loyaltyMaxRedeem, setLoyaltyMaxRedeem] = useState(0.3);

  // VAT
  const [vatPercent, setVatPercent] = useState(5);

  // Shipping (mandatory — applied to every order)
  const [shippingFee, setShippingFee] = useState(10);
  const [shippingLabel, setShippingLabel] = useState('Shipping');
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(0);

  const [isProcessing, setIsProcessing] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<AddressDto[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  const subtotal = cartTotal; // VAT-inclusive line total
  const vatRate = vatPercent / 100;
  const subtotalExclVat = Math.round((subtotal / (1 + vatRate)) * 100) / 100;
  const vatAmount = Math.round((subtotal - subtotalExclVat) * 100) / 100;
  const discount = promoResult?.valid ? promoResult.discount : 0;
  const redeemAmount = Math.min(
    Number.parseFloat(loyaltyRedeem) || 0,
    loyaltyBalance,
    subtotal * loyaltyMaxRedeem,
  );
  // Mandatory shipping fee — always added unless the order qualifies for free shipping
  // (subtotal >= configured threshold, where threshold > 0). Admin manages both in /admin/shipping.
  const qualifiesForFreeShipping = freeShippingThreshold > 0 && subtotal >= freeShippingThreshold;
  const shippingApplied = qualifiesForFreeShipping ? 0 : shippingFee;
  const total = Math.max(0, subtotal + shippingApplied - discount - redeemAmount);

  // Load loyalty balance + loyalty config + VAT config
  const applyAddress = (addr: AddressDto) => {
    setSelectedAddressId(addr.id);
    setForm(f => ({ ...f, ...buildAddressForm(addr, f.email, f.phone) }));
  };

  // Keep email in sync with logged-in user
  useEffect(() => {
    if (user?.email) setForm(f => ({ ...f, email: user.email }));
  }, [user?.email]);

  useEffect(() => {
    // Fire all checkout config loads in parallel — no waterfall.
    const tasks: Promise<unknown>[] = [
      loadLoyaltySettings(setLoyaltyEnabled, setLoyaltyMaxRedeem),
      loadVatSettings(setVatPercent),
      loadShippingSettings(setShippingFee, setShippingLabel, setFreeShippingThreshold),
      bnplApi.getTabbyConfig().then((cfg) => setTabbyEnabled(cfg.isEnabled)).catch(() => {}),
      bnplApi.getTamaraConfig().then((cfg) => setTamaraEnabled(cfg.isEnabled)).catch(() => {}),
    ];
    if (isAuthenticated) {
      tasks.push(
        accountApi.getAddresses().then((addrs) => {
          setSavedAddresses(addrs);
          const def = addrs.find(a => a.isDefault) ?? addrs[0];
          if (def) applyAddress(def);
        }).catch(() => {}),
        accountApi.getLoyalty().then((data) => {
          const bal = Number(data.balanceAed ?? 0) || (Number(data.totalEarned ?? 0) - Number(data.totalRedeemed ?? 0));
          setLoyaltyBalance(bal);
        }).catch(() => {}),
      );
    }
    Promise.all(tasks).catch(() => {});
  }, [isAuthenticated]);

  // Fire begin_checkout once when cart items are known
  useEffect(() => {
    if (items.length === 0) return;
    trackBeginCheckout(
      items.map(i => ({ item_id: i.productId, item_name: i.name, price: i.price, quantity: i.quantity })),
      cartTotal,
      promoResult?.valid ? promoCode : undefined,
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (key: string, value: string) => {
    setSelectedAddressId(null); // editing a field means user wants a custom address
    setForm((f) => ({ ...f, [key]: value }));
  };

  const handleApplyPromo = async () => {
    if (!promoCode.trim()) return;
    try {
      const res = await promoApi.validate({ code: promoCode, orderAmount: subtotal });
      setPromoResult(res);
      if (res.valid) toast.success('Promo code applied!');
      else toast.error(res.message ?? 'Invalid promo code');
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Could not validate promo code';
      toast.error(msg);
    }
  };

  const confirmStripePayment = async (): Promise<{ ok: boolean; paymentIntentId?: string }> => {
    if (!stripe || !elements) {
      toast.error('Payment system not ready. Please refresh and try again.');
      return { ok: false };
    }
    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      toast.error('Please enter your card details');
      return { ok: false };
    }
    const { clientSecret, paymentIntentId: piId } = await stripeApi.createPaymentIntent({
      amount: total,
      currency: 'aed',
    });
    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
      payment_method: { card: cardElement },
    });
    if (error) {
      toast.error(error.message ?? 'Payment failed');
      return { ok: false };
    }
    return { ok: true, paymentIntentId: paymentIntent?.id ?? piId };
  };

  const handleBnplCheckout = async (orderId: any): Promise<boolean> => {
    try {
      const session = paymentMethod === 'TABBY'
        ? await bnplApi.createTabbySession(orderId)
        : await bnplApi.createTamaraSession(orderId);
      clearCart();
      window.location.href = session.paymentUrl;
      return true;
    } catch (bnplErr: any) {
      const bnplMsg = bnplErr?.response?.data?.message;
      toast.error(bnplMsg || 'Failed to initialize payment. Please try another payment method.');
      return false;
    }
  };

  const handlePlaceOrder = async () => {
    if (!isCheckoutFormValid(form)) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (!isAuthenticated) {
      if (guestPassword.length < 8) {
        toast.error('Please choose a password of at least 8 characters');
        return;
      }
      if (guestPassword !== guestPasswordConfirm) {
        toast.error('Passwords do not match');
        return;
      }
    }

    setIsProcessing(true);
    try {
      // Create the user's account first when checking out as a guest, so the
      // order is placed with an authenticated session and is visible in their
      // account history.
      if (!isAuthenticated) {
        try {
          await register({
            email: form.email,
            password: guestPassword,
            firstName: form.firstName,
            lastName: form.lastName,
          });
        } catch (err: any) {
          const msg = err?.response?.data?.message;
          const message = Array.isArray(msg) ? msg[0] : msg;
          if (message && /exist/i.test(String(message))) {
            toast.error('An account with this email already exists. Please sign in to continue.');
          } else {
            toast.error(message || 'Could not create your account.');
          }
          setIsProcessing(false);
          return;
        }
      }

      let paymentIntentId: string | undefined;

      trackAddPaymentInfo(
        items.map(i => ({ item_id: i.productId, item_name: i.name, price: i.price, quantity: i.quantity })),
        total,
        paymentMethod,
        promoResult?.valid ? promoCode : undefined,
      );

      if (paymentMethod === 'CREDIT_CARD') {
        const result = await confirmStripePayment();
        if (!result.ok) {
          setIsProcessing(false);
          return;
        }
        paymentIntentId = result.paymentIntentId;
      }

      const order = await ordersApi.create({
        paymentIntentId,
        paymentMethod,
        shippingMethod: 'STANDARD',
        ...(selectedAddressId
          ? { shippingAddressId: selectedAddressId }
          : { shippingAddress: buildShippingAddressPayload(form) }),
        promoCode: promoResult?.valid ? promoCode : undefined,
        loyaltyRedeemAed: redeemAmount > 0 ? redeemAmount : undefined,
        notes: '',
        items: items.map((i) => ({
          productId: Number(i.productId),
          quantity: i.quantity,
        })),
      });

      trackPurchase({
        orderId: String(order.id),
        total,
        subtotal,
        tax: vatAmount,
        shipping: shippingApplied,
        coupon: promoResult?.valid ? promoCode : undefined,
        items: items.map(i => ({ item_id: i.productId, item_name: i.name, price: i.price, quantity: i.quantity })),
      });

      // For BNPL methods, create a payment session and redirect
      if (paymentMethod === 'TABBY' || paymentMethod === 'TAMARA') {
        const ok = await handleBnplCheckout(order.id);
        if (!ok) setIsProcessing(false);
        return;
      }

      clearCart();
      toast.success('Order placed successfully!');
      navigate(`/account?tab=orders`);
    } catch (err: any) {
      toast.error(extractErrorMessage(err, 'Order failed. Please try again.'));
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
    <div style={{ maxWidth: 1320, margin: '0 auto', padding: isMobile ? '24px 14px 40px' : '32px 16px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, marginBottom: 24 }}>Checkout</h1>

      <div style={{ display: 'flex', gap: isMobile ? 24 : 32, flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
        {/* Left — Shipping form */}
        <div style={{ flex: 1, minWidth: isMobile ? 0 : 320, width: isMobile ? '100%' : undefined }}>
          {!isAuthenticated && (
            <div style={{ marginBottom: 24, padding: 16, border: '1px solid #e8d5a0', borderRadius: 8, background: '#faf6ed' }}>
              <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 6, color: '#8a6a14' }}>Create your account</h2>
              <p style={{ fontSize: 13, color: '#6b5a30', marginBottom: 12 }}>
                We'll set up an account using your shipping email so you can track this order.
                Already have an account? <Link to="/login" style={{ color: '#B8860B', textDecoration: 'underline', fontWeight: 600 }}>Sign in</Link>.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 12 }}>
                <div>
                  <label htmlFor="guest-password" style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#888', marginBottom: 4 }}>Password * (min. 8 characters)</label>
                  <input id="guest-password"
                    type="password"
                    value={guestPassword}
                    onChange={(e) => setGuestPassword(e.target.value)}
                    autoComplete="new-password"
                    style={{ width: '100%', border: '1px solid #ddd', borderRadius: 6, padding: '10px 12px', fontSize: 14, outline: 'none' }}
                  />
                </div>
                <div>
                  <label htmlFor="guest-password-confirm" style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#888', marginBottom: 4 }}>Confirm Password *</label>
                  <input id="guest-password-confirm"
                    type="password"
                    value={guestPasswordConfirm}
                    onChange={(e) => setGuestPasswordConfirm(e.target.value)}
                    autoComplete="new-password"
                    style={{ width: '100%', border: '1px solid #ddd', borderRadius: 6, padding: '10px 12px', fontSize: 14, outline: 'none' }}
                  />
                </div>
              </div>
            </div>
          )}

          <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 16 }}>Shipping Address</h2>

          {/* Saved address picker */}
          {savedAddresses.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {savedAddresses.map(addr => (
                  <label key={addr.id} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 10,
                    border: selectedAddressId === addr.id ? '2px solid #B8860B' : '1px solid #ddd',
                    borderRadius: 8, padding: '12px 14px', cursor: 'pointer',
                    background: selectedAddressId === addr.id ? '#faf6ed' : '#fff',
                  }}>
                    <input
                      type="radio"
                      name="savedAddress"
                      checked={selectedAddressId === addr.id}
                      onChange={() => applyAddress(addr)}
                      style={{ marginTop: 3, accentColor: '#B8860B', flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, fontSize: 14 }}>
                      <p style={{ fontWeight: 600, marginBottom: 2 }}>
                        {addr.firstName} {addr.lastName}
                        {addr.isDefault && <span style={{ marginLeft: 6, fontSize: 11, color: '#B8860B', fontWeight: 500 }}>Default</span>}
                      </p>
                      <p style={{ color: '#555', marginBottom: 1 }}>
                        {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}
                      </p>
                      <p style={{ color: '#555' }}>
                        {addr.city}{addr.postalCode ? `, ${addr.postalCode}` : ''}
                      </p>
                      {addr.phone && <p style={{ color: '#888', fontSize: 12, marginTop: 2 }}>{addr.phone}</p>}
                    </div>
                  </label>
                ))}
                <label style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  border: selectedAddressId === null ? '2px solid #B8860B' : '1px solid #ddd',
                  borderRadius: 8, padding: '12px 14px', cursor: 'pointer',
                  background: selectedAddressId === null ? '#faf6ed' : '#fff',
                }}>
                  <input
                    type="radio"
                    name="savedAddress"
                    checked={selectedAddressId === null}
                    onChange={() => {
                      setSelectedAddressId(null);
                      setForm({ firstName: '', lastName: '', email: '', phone: '', addressLine1: '', addressLine2: '', city: '', state: '', postalCode: '', country: 'AE' });
                    }}
                    style={{ accentColor: '#B8860B', flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 500 }}>Use a different address</span>
                </label>
              </div>

            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 12 }}>
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
              <div key={key} style={fullWidth && !isMobile ? { gridColumn: 'span 2' } : {}}>
                <label htmlFor="label" style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#888', marginBottom: 4 }}>{label}</label>
                <input id="label"
                  type={key === 'email' ? 'email' : 'text'}
                  value={form[key as keyof typeof form]}
                  onChange={(e) => update(key, e.target.value)}
                  disabled={key === 'email' && !!user?.email}
                  style={{ width: '100%', border: '1px solid #ddd', borderRadius: 6, padding: '10px 12px', fontSize: 14, outline: 'none', background: key === 'email' && user?.email ? '#f5f5f5' : '#fff', color: key === 'email' && user?.email ? '#555' : 'inherit', cursor: key === 'email' && user?.email ? 'not-allowed' : 'text' }}
                />
              </div>
            ))}
          </div>

          {/* Payment method */}
          <h2 style={{ fontSize: 18, fontWeight: 600, marginTop: 32, marginBottom: 16 }}>Payment Method</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', flexDirection: isMobile ? 'column' : 'row' }}>
            {([
              ['CASH_ON_DELIVERY', 'Cash on Delivery', true],
              ['CREDIT_CARD', 'Credit Card', true],
              ['TABBY', 'Tabby — Pay in Installments', tabbyEnabled],
              ['TAMARA', 'Tamara — Buy Now Pay Later', tamaraEnabled],
            ] as const).filter(([, , enabled]) => enabled).map(([value, label]) => (
              <label key={value} style={{
                flex: isMobile ? '1 1 100%' : '1 1 calc(50% - 6px)',
                minWidth: isMobile ? 0 : 200,
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
                  onChange={() => setPaymentMethod(value as typeof paymentMethod)}
                  style={{ accentColor: '#B8860B' }}
                />
                <span style={{ fontSize: 14, fontWeight: 500 }}>{label}</span>
              </label>
            ))}
          </div>

          {/* Stripe Card Input */}
          {paymentMethod === 'CREDIT_CARD' && (
            <div style={{ marginTop: 16, border: '1px solid #ddd', borderRadius: 8, padding: 16, background: '#fafafa' }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 10, color: '#333' }}>Card Details</label>
              {stripe ? (
                <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 6, padding: '12px 14px' }}>
                  <CardElement options={{
                    style: {
                      base: {
                        fontSize: '15px',
                        color: '#1a1a1a',
                        '::placeholder': { color: '#aab7c4' },
                        fontFamily: 'inherit',
                      },
                      invalid: { color: '#e74c3c' },
                    },
                    hidePostalCode: true,
                  }} />
                </div>
              ) : (
                <p style={{ fontSize: 13, color: '#e74c3c' }}>
                  Card payments are not available at the moment. Please choose another payment method or try again later.
                </p>
              )}
            </div>
          )}

          {/* BNPL Info */}
          {(paymentMethod === 'TABBY' || paymentMethod === 'TAMARA') && (
            <div style={{ marginTop: 16, border: '1px solid #e8d5a0', borderRadius: 8, padding: 16, background: '#faf6ed' }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#B8860B', marginBottom: 6 }}>
                {paymentMethod === 'TABBY' ? 'Pay with Tabby' : 'Pay with Tamara'}
              </p>
              <p style={{ fontSize: 13, color: '#666' }}>
                {paymentMethod === 'TABBY'
                  ? 'Split your purchase into 4 interest-free payments. You will be redirected to Tabby to complete your payment after placing the order.'
                  : 'Buy now and pay later in easy installments. You will be redirected to Tamara to complete your payment after placing the order.'}
              </p>
            </div>
          )}
        </div>

        {/* Right — Summary */}
        <OrderSummaryPanel
          isMobile={isMobile}
          items={items}
          itemCount={itemCount}
          promoCode={promoCode}
          setPromoCode={setPromoCode}
          handleApplyPromo={handleApplyPromo}
          promoResult={promoResult}
          discount={discount}
          loyaltyEnabled={loyaltyEnabled}
          loyaltyBalance={loyaltyBalance}
          loyaltyMaxRedeem={loyaltyMaxRedeem}
          loyaltyRedeem={loyaltyRedeem}
          setLoyaltyRedeem={setLoyaltyRedeem}
          subtotal={subtotal}
          subtotalExclVat={subtotalExclVat}
          vatPercent={vatPercent}
          vatAmount={vatAmount}
          redeemAmount={redeemAmount}
          shippingApplied={shippingApplied}
          shippingLabel={shippingLabel}
          total={total}
          isProcessing={isProcessing}
          handlePlaceOrder={handlePlaceOrder}
        />
      </div>
    </div>
  );
}
