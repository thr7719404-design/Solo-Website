import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/auth';
import styles from './Auth.module.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles['auth-page']}>
      <div className={styles['auth-card']}>
        <h1>Reset Password</h1>
        {sent ? (
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: 16 }}>If an account exists with that email, a reset link has been sent.</p>
            <Link to="/login" className="btn btn-primary">Back to Sign In</Link>
          </div>
        ) : (
          <>
            {error && <div className={styles['error-msg']}>{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className={styles['form-group']}>
                <label>Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
              </div>
              <button type="submit" className={styles['submit-btn']} disabled={loading}>
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>
            <div className={styles['auth-footer']}>
              <Link to="/login">Back to Sign In</Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
