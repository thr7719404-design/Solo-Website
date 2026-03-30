import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authApi } from '@/api/auth';

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get('token');
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    authApi.verifyEmail(token).then(() => setStatus('success')).catch(() => setStatus('error'));
  }, [token]);

  return (
    <div className="auth-page">
      <div className="auth-card" style={{ textAlign: 'center' }}>
        {status === 'loading' && <div className="loading-spinner" />}
        {status === 'success' && (
          <>
            <h1>Email Verified!</h1>
            <p>Your email has been verified. You can now sign in.</p>
            <Link to="/login" className="btn btn-accent" style={{ marginTop: 16, display: 'inline-block' }}>Sign In</Link>
          </>
        )}
        {status === 'error' && (
          <>
            <h1>Verification Failed</h1>
            <p>The verification link is invalid or has expired.</p>
            <Link to="/login" className="btn btn-outline" style={{ marginTop: 16, display: 'inline-block' }}>Back to Sign In</Link>
          </>
        )}
      </div>
    </div>
  );
}
