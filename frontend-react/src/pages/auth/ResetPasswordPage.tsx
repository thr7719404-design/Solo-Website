import { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { authApi } from '@/api/auth';

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
      <div className="auth-page">
        <div className="auth-card" style={{ textAlign: 'center' }}>
          <h1>Password Reset!</h1>
          <p>Your password has been changed. You can now sign in.</p>
          <Link to="/login" className="btn btn-accent" style={{ marginTop: 16, display: 'inline-block' }}>Sign In</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Reset Password</h1>
        {status === 'error' && <div className="error-box">Failed to reset password. The link may have expired.</div>}
        <form onSubmit={submit}>
          <div className="form-group">
            <label>New Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required minLength={8} />
          </div>
          <button className="btn btn-accent" style={{ width: '100%' }} type="submit" disabled={submitting || password !== confirm}>
            {submitting ? 'Resetting…' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
}
