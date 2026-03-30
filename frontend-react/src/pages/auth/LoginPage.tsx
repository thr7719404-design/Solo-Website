import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Auth.module.css';

export default function LoginPage() {
  const { login, error, isLoading, clearError } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    try {
      await login(email, password);
      navigate('/');
    } catch { /* error handled by context */ }
  };

  return (
    <div className={styles['auth-page']}>
      <div className={styles['auth-card']}>
        <h1>Sign In</h1>
        {error && <div className={styles['error-msg']}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className={styles['form-group']}>
            <label>Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
          </div>
          <div className={styles['form-group']}>
            <label>Password</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
          </div>
          <div style={{ textAlign: 'right', marginBottom: 8 }}>
            <Link to="/forgot-password" style={{ fontSize: 13, color: 'var(--color-accent)' }}>Forgot password?</Link>
          </div>
          <button type="submit" className={styles['submit-btn']} disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className={styles['auth-footer']}>
          Don't have an account? <Link to="/signup">Create one</Link>
        </div>
      </div>
    </div>
  );
}
