import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authApi } from '@/api/auth';
import styles from './Auth.module.css';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    authApi.verifyEmail(token).then(() => setStatus('success')).catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className={styles['auth-page']}>
      <div className={styles['auth-card']} style={{ textAlign: 'center' }}>
        {status === 'loading' && <div className="loading-spinner" />}
        {status === 'success' && (
          <>
            <h1>Email Verified!</h1>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 20 }}>Your email has been verified. You can now sign in.</p>
            <Link to="/login" className={styles['submit-btn']} style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}>Sign In</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <h1>Verification Failed</h1>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 20 }}>The verification link is invalid or has expired.</p>
            <Link to="/login" className={styles['submit-btn']} style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center', background: 'var(--color-bg)', color: 'var(--color-text)', border: '1.5px solid var(--color-border)' }}>Back to Sign In</Link>
          </>
        )}
      </div>
    </div>
  );
}
