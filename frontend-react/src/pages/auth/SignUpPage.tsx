import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import styles from './Auth.module.css';

export default function SignUpPage() {
  const { register, error, isLoading, clearError } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '', confirm: '' });
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError('');
    if (form.password !== form.confirm) {
      setLocalError('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      setLocalError('Password must be at least 8 characters');
      return;
    }
    try {
      await register({ email: form.email, password: form.password, firstName: form.firstName, lastName: form.lastName });
      navigate('/');
    } catch { /* handled */ }
  };

  const errMsg = localError || error;

  return (
    <div className={styles['auth-page']}>
      <div className={styles['auth-card']}>
        <h1>Create Account</h1>
        {errMsg && <div className={styles['error-msg']}>{errMsg}</div>}
        <form onSubmit={handleSubmit}>
          <div className={styles['form-row']}>
            <div className={styles['form-group']}>
              <label>First Name</label>
              <input value={form.firstName} onChange={e => setForm({ ...form, firstName: e.target.value })} required />
            </div>
            <div className={styles['form-group']}>
              <label>Last Name</label>
              <input value={form.lastName} onChange={e => setForm({ ...form, lastName: e.target.value })} required />
            </div>
          </div>
          <div className={styles['form-group']}>
            <label>Email</label>
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div className={styles['form-group']}>
            <label>Password</label>
            <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
          </div>
          <div className={styles['form-group']}>
            <label>Confirm Password</label>
            <input type="password" value={form.confirm} onChange={e => setForm({ ...form, confirm: e.target.value })} required />
          </div>
          <button type="submit" className={styles['submit-btn']} disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Account'}
          </button>
        </form>
        <div className={styles['auth-footer']}>
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
