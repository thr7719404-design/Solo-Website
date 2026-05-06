import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authApi } from '@/api/auth';
import styles from './Auth.module.css';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const token = params.get('token') ?? '';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [status, setStatus] = useState<'form' | 'success' | 'error'>('form');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) return;
    setSubmitting(true);
    try {
      await authApi.resetPassword(token, password);
      setStatus('success');
    } catch {
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  if (status === 'success') {
    return (
      <div className={styles['auth-page']}>
        <div className={styles['auth-card']} style={{ textAlign: 'center' }}>
          <h1>Password Reset!</h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 20 }}>Your password has been changed. You can now sign in.</p>
          <Link to="/login" className={styles['submit-btn']} style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}>Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['auth-page']}>
      <div className={styles['auth-card']}>
        <h1>Reset Password</h1>
        {status === 'error' && <div className={styles['error-msg']}>Failed to reset password. The link may have expired.</div>}
        <form onSubmit={submit}>
          <div className={styles['form-group']}>
            <label htmlFor="new-password">New Password</label>
            <input id="new-password" type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} autoFocus />
          </div>
          <div className={styles['form-group']}>
            <label htmlFor="confirm-password">Confirm Password</label>
            <input id="confirm-password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={8} />
          </div>
          {password && confirm && password !== confirm && (
            <div className={styles['error-msg']}>Passwords do not match</div>
          )}
          <button className={styles['submit-btn']} type="submit" disabled={submitting || password !== confirm}>
            {submitting ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>
        <div className={styles['auth-footer']}>
          Remember your password? <Link to="/login">Sign In</Link>
        </div>
      </div>
    </div>
  );
}
