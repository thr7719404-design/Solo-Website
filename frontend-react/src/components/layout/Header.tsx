import { useState, useEffect, useRef, useCallback, type FormEvent } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useCart } from '../../contexts/CartContext';
import { announcementsApi, type AnnouncementDto } from '../../api/announcements';
import { useNavMenu } from '../../hooks/useNavMenu';
import HamburgerButton from '../navigation/HamburgerButton';
import MenuDrawer from '../navigation/MenuDrawer';
import styles from './Header.module.css';

export default function Header() {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const hamburgerRef = useRef<HTMLDivElement>(null);
  const [scrolled, setScrolled] = useState(false);

  // Announcements rotation
  const [announcements, setAnnouncements] = useState<AnnouncementDto[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [fade, setFade] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // CMS-driven navigation menus (managed via Admin → Navigation)
  const mainNavItems = useNavMenu('main-nav');
  const topLinks = useNavMenu('top-links');

  useEffect(() => {
    announcementsApi.getActive().then(setAnnouncements).catch(() => {});
  }, []);

  const rotate = useCallback(() => {
    setFade(false);
    setTimeout(() => {
      setCurrentIdx((i) => (i + 1) % (announcements.length || 1));
      setFade(true);
    }, 300);
  }, [announcements.length]);

  useEffect(() => {
    if (announcements.length <= 1) return;
    timerRef.current = setInterval(rotate, 4000);
    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
      }
    };
  }, [announcements.length, rotate]);

  // Close drawer on navigation
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname, location.search]);

  // Subtle shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/search?q=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header className={`${styles.header} ${scrolled ? styles.scrolled : ''}`}>
      <div className={styles['header-top']}>
        {announcements.length > 0 && (
          <span
            style={{
              opacity: fade ? 1 : 0,
              transition: 'opacity 0.3s ease',
              display: 'inline-block',
            }}
          >
            {announcements[currentIdx]?.linkUrl ? (
              <a
                href={announcements[currentIdx].linkUrl}
                style={{ color: 'inherit', textDecoration: 'underline' }}
              >
                {announcements[currentIdx].text}
                {announcements[currentIdx].linkLabel
                  ? ` — ${announcements[currentIdx].linkLabel}`
                  : ''}
              </a>
            ) : (
              announcements[currentIdx]?.text
            )}
          </span>
        )}
      </div>
      <div className={styles['header-main']}>
        <div ref={hamburgerRef} className={styles['hamburger-wrap']}>
          <HamburgerButton
            isOpen={menuOpen}
            onToggle={() => setMenuOpen((o) => !o)}
          />
        </div>
        <div className={styles['header-logo']}>
          <Link to="/">SOLO</Link>
        </div>
        <form className={styles['header-search']} onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button type="submit">🔍</button>
        </form>
        <div className={styles['header-actions']}>
          {isAuthenticated ? (
            <>
              <Link to="/account" className={styles['account-link']}>
                Account
              </Link>
              {isAdmin && (
                <Link to="/admin" className={styles['admin-link']}>
                  Admin
                </Link>
              )}
              <button onClick={handleLogout} className={styles['logout-btn']}>
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" className={styles['account-link']}>
              Sign In
            </Link>
          )}
          <Link to="/favorites" className={styles['icon-link']}>
            ♡
          </Link>
          <Link
            to="/cart"
            className={styles['icon-link']}
            style={{ position: 'relative' }}
          >
            🛒
            {itemCount > 0 && (
              <span className={styles['cart-count']}>{itemCount}</span>
            )}
          </Link>
        </div>
      </div>

      <MenuDrawer
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        returnFocusRef={hamburgerRef}
      />

      {mainNavItems.length > 0 && (
        <nav className={styles['header-nav']} aria-label="Main navigation">
          <ul className={styles['header-nav-list']}>
            {mainNavItems.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.url || '#'}
                  target={item.openInNewTab ? '_blank' : undefined}
                  rel={item.openInNewTab ? 'noopener noreferrer' : undefined}
                >
                  {item.label}
                  {item.badge && (
                    <span
                      className={styles['header-nav-badge']}
                      style={{ background: item.badgeColor || '#dc3545' }}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
