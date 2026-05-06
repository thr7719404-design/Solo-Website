import {
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { createPortal } from 'react-dom';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import styles from './MenuDrawer.module.css';
import CategoryRow from './CategoryRow';
import SubCategoryTray from './SubCategoryTray';
import { useMenuCategories, type MenuCategory, type MenuSubCategory } from '../../hooks/useMenuCategories';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { useAuth } from '../../contexts/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

type StaticSub = MenuSubCategory & { to: string };
type StaticSection = {
  id: string;
  name: string;
  label: string;
  subs: StaticSub[];
};

type State = {
  activeCategoryId: string | null;
  activeSubCategoryId: string | null;
};

type Action =
  | { type: 'TOGGLE_CATEGORY'; id: string }
  | { type: 'SET_ACTIVE'; categoryId: string | null; subCategoryId: string | null }
  | { type: 'RESET' };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'TOGGLE_CATEGORY':
      return {
        ...state,
        activeCategoryId: state.activeCategoryId === action.id ? null : action.id,
        activeSubCategoryId: null,
      };
    case 'SET_ACTIVE':
      return {
        ...state,
        activeCategoryId: action.categoryId,
        activeSubCategoryId: action.subCategoryId,
      };
    case 'RESET':
      return { activeCategoryId: null, activeSubCategoryId: null };
    default:
      return state;
  }
}

const initialState: State = {
  activeCategoryId: null,
  activeSubCategoryId: null,
};

export default function MenuDrawer({ isOpen, onClose, returnFocusRef }: Props) {
  const { categories, isLoading, error, retry } = useMenuCategories();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const drawerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [state, dispatch] = useReducer(reducer, initialState);
  const [searchQuery, setSearchQuery] = useState('');

  useBodyScrollLock(isOpen);
  useFocusTrap(drawerRef, isOpen);

  // Sync active state with current URL
  useEffect(() => {
    const m = location.pathname.match(/^\/category\/([^/]+)/);
    if (!m) {
      // Not on a category page — leave UI state as-is
      return;
    }
    const slug = decodeURIComponent(m[1]);
    const cat = categories.find((c) => c.slug === slug);
    if (!cat) return;
    const subSlug = searchParams.get('sub');
    const sub = subSlug ? cat.subCategories.find((s) => s.slug === subSlug) : null;
    dispatch({
      type: 'SET_ACTIVE',
      categoryId: cat.id,
      subCategoryId: sub ? sub.id : null,
    });
  }, [location.pathname, searchParams, categories]);

  // ESC to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // Return focus to trigger on close + clear search when drawer closes
  useEffect(() => {
    if (!isOpen) {
      setSearchQuery('');
      if (returnFocusRef?.current) returnFocusRef.current.focus();
    }
  }, [isOpen, returnFocusRef]);

  const closeWithDelay = (ms = 0) => {
    if (ms <= 0) onClose();
    else window.setTimeout(onClose, ms);
  };

  const handleCategoryClick = (cat: MenuCategory) => {
    if (cat.subCategories.length === 0) {
      navigate(`/category/${cat.slug}`);
      closeWithDelay(300);
      return;
    }
    dispatch({ type: 'TOGGLE_CATEGORY', id: cat.id });
  };

  const handleAllInCategory = (cat: MenuCategory) => {
    dispatch({
      type: 'SET_ACTIVE',
      categoryId: cat.id,
      subCategoryId: null,
    });
    navigate(`/category/${cat.slug}`);
    closeWithDelay(300);
  };

  const handleSubClick = (cat: MenuCategory, sub: MenuSubCategory) => {
    dispatch({
      type: 'SET_ACTIVE',
      categoryId: cat.id,
      subCategoryId: sub.id,
    });
    navigate(`/category/${cat.slug}?sub=${encodeURIComponent(sub.slug)}`);
    closeWithDelay(300);
  };

  const handleStaticSubClick = (section: StaticSection, sub: StaticSub) => {
    dispatch({ type: 'SET_ACTIVE', categoryId: section.id, subCategoryId: sub.id });
    if (sub.id === '__logout__') {
      void logout();
      closeWithDelay(0);
      return;
    }
    navigate(sub.to);
    closeWithDelay(300);
  };

  const shopBySection: StaticSection = {
    id: '__shop_by__',
    name: 'Shop By',
    label: 'Browse by Badge',
    subs: [
      { id: 'sb-best', name: 'Best Sellers', slug: 'best-sellers', to: '/best-sellers' },
      { id: 'sb-new', name: 'New Arrivals', slug: 'new-arrivals', to: '/new-arrivals' },
      { id: 'sb-feat', name: 'Featured', slug: 'featured', to: '/featured' },
      { id: 'sb-sale', name: 'On Sale', slug: 'sale', to: '/sale' },
    ],
  };

  const accountSection: StaticSection = isAuthenticated
    ? {
        id: '__account__',
        name: 'My Account',
        label: user ? `Hi, ${user.firstName ?? 'there'}` : 'Account',
        subs: [
          { id: 'ac-profile', name: 'Profile', slug: 'profile', to: '/account' },
          { id: 'ac-orders', name: 'Orders', slug: 'orders', to: '/account/orders' },
          { id: 'ac-returns', name: 'Returns', slug: 'returns', to: '/account/returns' },
          { id: 'ac-wish', name: 'Wishlist', slug: 'wishlist', to: '/wishlist' },
          { id: 'ac-addr', name: 'Addresses', slug: 'addresses', to: '/account/addresses' },
          { id: 'ac-loyal', name: 'Loyalty & Rewards', slug: 'loyalty', to: '/account/loyalty' },
          { id: 'ac-pay', name: 'Payment Methods', slug: 'payment', to: '/account/payment-methods' },
          { id: 'ac-sec', name: 'Password & Security', slug: 'security', to: '/account/security' },
          { id: '__logout__', name: 'Sign Out', slug: 'logout', to: '/' },
        ],
      }
    : {
        id: '__account__',
        name: 'My Account',
        label: 'Account',
        subs: [
          { id: 'ac-login', name: 'Sign In', slug: 'login', to: '/login' },
          { id: 'ac-signup', name: 'Create Account', slug: 'signup', to: '/signup' },
          { id: 'ac-forgot', name: 'Forgot Password', slug: 'forgot', to: '/forgot-password' },
        ],
      };

  const staticSections: StaticSection[] = [shopBySection, accountSection];

  // Filter categories + subcategories by search query
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const isSearching = normalizedQuery.length > 0;

  const filteredCategories = useMemo(() => {
    if (!isSearching) return categories;
    return categories
      .map((cat) => {
        const catMatch = cat.name.toLowerCase().includes(normalizedQuery);
        if (catMatch) {
          // Category name matches → show it with all its subs
          return cat;
        }
        // Otherwise filter subs that match
        const matchedSubs = cat.subCategories.filter((s) =>
          s.name.toLowerCase().includes(normalizedQuery),
        );
        if (matchedSubs.length === 0) return null;
        return { ...cat, subCategories: matchedSubs };
      })
      .filter((c): c is MenuCategory => c !== null);
  }, [categories, isSearching, normalizedQuery]);

  // Auto-expand the first matching category while searching so users see the match
  const searchExpandedId = isSearching && filteredCategories.length > 0
    ? filteredCategories[0].id
    : null;

  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div
        className={`${styles.overlay} ${isOpen ? styles.isOpen : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={drawerRef}
        className={`${styles.drawer} ${isOpen ? styles.isOpen : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
      >
        <div className={styles.header}>
          <span className={styles.headerTitle}>Shop by Category</span>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={onClose}
            aria-label="Close menu"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="6" y1="6" x2="18" y2="18" />
              <line x1="18" y1="6" x2="6" y2="18" />
            </svg>
          </button>
        </div>

        <div className={styles.searchWrap}>
          <div className={styles.searchField}>
            <span className={styles.searchIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="7" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </span>
            <input
              ref={searchInputRef}
              type="search"
              className={styles.searchInput}
              placeholder="Search categories…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search categories and subcategories"
            />
            {searchQuery && (
              <button
                type="button"
                className={styles.searchClear}
                onClick={() => {
                  setSearchQuery('');
                  searchInputRef.current?.focus();
                }}
                aria-label="Clear search"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="6" y1="6" x2="18" y2="18" />
                  <line x1="18" y1="6" x2="6" y2="18" />
                </svg>
              </button>
            )}
          </div>
        </div>

        <div className={styles.list}>
          {isLoading && categories.length === 0 && (
            <div className={styles.skeletonWrap} aria-hidden="true">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className={styles.skeletonRow}>
                  <span className={styles.skeletonIcon} />
                  <span className={styles.skeletonBar} />
                </div>
              ))}
            </div>
          )}

          {!isLoading && error && (
            <div className={styles.errorState} role="alert">
              <span className={styles.errorIcon} aria-hidden="true">⚠</span>
              <p className={styles.errorText}>Couldn't load categories</p>
              <button type="button" className={styles.retryBtn} onClick={retry}>
                Try again
              </button>
            </div>
          )}

          {!error && filteredCategories.map((cat, idx) => {
            const isActive = (searchExpandedId === cat.id) || state.activeCategoryId === cat.id;
            const activeSubSlug =
              isActive && state.activeSubCategoryId
                ? cat.subCategories.find((s) => s.id === state.activeSubCategoryId)?.slug ||
                  null
                : null;
            return (
              <div
                key={cat.id}
                className={styles.categoryWrap}
                style={{
                  ['--row-index' as string]: idx,
                  transitionDelay: `${100 + idx * 20}ms`,
                }}
              >
                <CategoryRow
                  name={cat.name}
                  isActive={isActive}
                  hasChildren={cat.subCategories.length > 0}
                  onClick={() => handleCategoryClick(cat)}
                  index={idx}
                />
                {cat.subCategories.length > 0 && (
                  <SubCategoryTray
                    isExpanded={isActive}
                    categoryName={cat.name}
                    subCategories={cat.subCategories}
                    activeSubSlug={activeSubSlug}
                    onSelectAll={() => handleAllInCategory(cat)}
                    onSelectSub={(sub) => handleSubClick(cat, sub)}
                  />
                )}
              </div>
            );
          })}

          {!error && !isLoading && !isSearching && staticSections.map((section, sIdx) => {
            const isActive = state.activeCategoryId === section.id;
            const activeSubSlug =
              isActive && state.activeSubCategoryId
                ? section.subs.find((s) => s.id === state.activeSubCategoryId)?.slug || null
                : null;
            const idx = categories.length + sIdx;
            return (
              <div key={section.id} className={styles.staticSectionWrap}>
                <div className={styles.sectionLabel}>{section.label}</div>
                <div
                  className={styles.categoryWrap}
                  style={{
                    ['--row-index' as string]: idx,
                    transitionDelay: `${100 + idx * 20}ms`,
                  }}
                >
                  <CategoryRow
                    name={section.name}
                    isActive={isActive}
                    hasChildren={section.subs.length > 0}
                    onClick={() => dispatch({ type: 'TOGGLE_CATEGORY', id: section.id })}
                    index={idx}
                  />
                  <SubCategoryTray
                    isExpanded={isActive}
                    categoryName={section.name}
                    subCategories={section.subs}
                    activeSubSlug={activeSubSlug}
                    onSelectAll={() => {
                      dispatch({ type: 'SET_ACTIVE', categoryId: section.id, subCategoryId: null });
                      navigate(section.subs[0]?.to ?? '/');
                      closeWithDelay(300);
                    }}
                    onSelectSub={(sub) => handleStaticSubClick(section, sub as StaticSub)}
                  />
                </div>
              </div>
            );
          })}

          {!error && !isLoading && isSearching && filteredCategories.length === 0 && (
            <div className={styles.emptyResults}>
              No categories match "{searchQuery}".
            </div>
          )}
        </div>

        <div className={styles.footer}>
          <div className={styles.footerDivider} />
          <button
            type="button"
            className={styles.footerLink}
            onClick={() => {
              navigate('/products');
              closeWithDelay(0);
            }}
          >
            View all products →
          </button>
        </div>

      </div>
    </>,
    document.body,
  );
}
