import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { bnplApi } from '@/api/bnpl';

type Status = 'verifying' | 'success' | 'failed' | 'cancelled';

export default function PaymentCallbackPage() {
  const [searchParams] = useSearchParams();
  const provider = searchParams.get('provider'); // 'tabby' or 'tamara'
  const status = searchParams.get('status');      // 'success', 'failure', 'cancel'
  const orderId = searchParams.get('order_id');

  const [pageStatus, setPageStatus] = useState<Status>('verifying');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    if (!orderId || !provider) {
      setPageStatus('failed');
      setMessage('Invalid payment callback. Missing order information.');
      return;
    }

    if (status === 'cancel') {
      setPageStatus('cancelled');
      setMessage('Payment was cancelled. Your order is still saved — you can retry payment from your orders page.');
      return;
    }

    if (status === 'failure') {
      setPageStatus('failed');
      setMessage('Payment failed. Please try again or choose a different payment method from your orders page.');
      return;
    }

    // Verify payment with backend
    const verify = async () => {
      try {
        const result = provider === 'tabby'
          ? await bnplApi.verifyTabbyPayment(orderId)
          : await bnplApi.verifyTamaraPayment(orderId);

        if (result.status === 'authorized') {
          setPageStatus('success');
          setMessage('Payment authorized successfully! Your order is being processed.');
        } else {
          setPageStatus('failed');
          setMessage(result.message || 'Payment verification failed. Please contact support.');
        }
      } catch {
        setPageStatus('failed');
        setMessage('Unable to verify payment status. Please check your orders page for the latest status.');
      }
    };

    verify();
  }, [orderId, provider, status]);

  const iconMap: Record<Status, { icon: string; color: string }> = {
    verifying: { icon: '⏳', color: '#B8860B' },
    success: { icon: '✓', color: '#16a34a' },
    failed: { icon: '✕', color: '#dc2626' },
    cancelled: { icon: '↩', color: '#B8860B' },
  };

  const { icon, color } = iconMap[pageStatus];

  let bgColor: string;
  if (pageStatus === 'success') bgColor = '#dcfce7';
  else if (pageStatus === 'failed') bgColor = '#fee2e2';
  else bgColor = '#faf6ed';

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', padding: '80px 16px', textAlign: 'center' }}>
      <div style={{
        width: 64,
        height: 64,
        borderRadius: '50%',
        background: bgColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        margin: '0 auto 24px',
        fontSize: 28,
        color,
      }}>
        {icon}
      </div>

      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 12 }}>
        {pageStatus === 'verifying' && 'Verifying Payment...'}
        {pageStatus === 'success' && 'Payment Successful'}
        {pageStatus === 'failed' && 'Payment Failed'}
        {pageStatus === 'cancelled' && 'Payment Cancelled'}
      </h1>

      <p style={{ fontSize: 15, color: '#666', marginBottom: 32, lineHeight: 1.6 }}>
        {message}
      </p>

      {provider && (
        <p style={{ fontSize: 13, color: '#999', marginBottom: 24 }}>
          Payment provider: {provider.charAt(0).toUpperCase() + provider.slice(1)}
        </p>
      )}

      <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
        <Link
          to="/account?tab=orders"
          style={{
            padding: '12px 24px',
            background: 'linear-gradient(135deg, #D4A843, #B8860B)',
            color: '#fff',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 14,
            textDecoration: 'none',
          }}
        >
          View My Orders
        </Link>
        <Link
          to="/products"
          style={{
            padding: '12px 24px',
            border: '1px solid #ddd',
            color: '#333',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 14,
            textDecoration: 'none',
          }}
        >
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
