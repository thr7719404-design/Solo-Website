import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{ textAlign: 'center', padding: '80px 20px' }}>
      <h1 style={{ fontSize: 72, fontWeight: 700, color: 'var(--color-border)' }}>404</h1>
      <p style={{ fontSize: 18, marginBottom: 24 }}>Page not found</p>
      <Link to="/" className="btn btn-accent">Back to Home</Link>
    </div>
  );
}
