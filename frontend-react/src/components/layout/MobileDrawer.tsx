import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth';
import { categoriesApi } from '@/api/categories';
import type { CategoryDto } from '@/types';

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export default function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const { isAuthenticated, user, logout } = useAuthStore();
  const [categories, setCategories] = useState<CategoryDto[]>([]);
  const [catExpanded, setCatExpanded] = useState(false);

  const initials = user
    ? `${(user.firstName?.[0] ?? '').toUpperCase()}${(user.lastName?.[0] ?? '').toUpperCase()}`
    : '';

  useEffect(() => {
    if (open && categories.length === 0) {
      categoriesApi.getCategories().then(setCategories).catch(() => {});
    }
  }, [open, categories.length]);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      )}

      {/* Panel */}
      <div
        className={`fixed inset-y-0 left-0 w-72 bg-gray-50 z-50 transform transition-transform duration-300 ${
          open ? 'translate-x-0' : '-translate-x-full'
        } flex flex-col`}
      >
        {/* Header */}
        <div className="h-48 bg-gradient-to-b from-[#1A1A1A] via-[#2D2D2D] to-[#1A1A1A] flex flex-col items-center justify-center px-6">
          <span className="text-2xl font-bold tracking-widest text-white mb-4">SOLO</span>
          <Link
            to={isAuthenticated ? '/account' : '/login'}
            onClick={onClose}
            className="flex items-center gap-3 w-full"
          >
            <div className="w-11 h-11 rounded-full bg-white/10 flex items-center justify-center text-white text-sm font-semibold">
              {isAuthenticated ? initials : '?'}
            </div>
            <div className="text-white">
              <p className="text-sm font-semibold">
                {isAuthenticated ? `${user?.firstName} ${user?.lastName}` : 'Sign In'}
              </p>
              <p className="text-xs text-white/70">
                {isAuthenticated ? user?.email : 'Tap to log in'}
              </p>
            </div>
          </Link>
        </div>

        {/* Nav items */}
        <nav className="flex-1 overflow-y-auto py-4">
          <p className="px-4 text-[10px] uppercase tracking-wider text-gray-400 mb-2">Main</p>
          <NavItem to="/" label="Home" onClick={onClose} />

          <p className="px-4 text-[10px] uppercase tracking-wider text-gray-400 mt-4 mb-2">Shop</p>
          <NavItem to="/products" label="All Products" onClick={onClose} />
          <NavItem to="/products?bestSellers=true" label="Best Sellers" onClick={onClose} />
          <NavItem to="/products?newArrivals=true" label="New Arrivals" onClick={onClose} />
          <NavItem to="/products?featured=true" label="Featured" onClick={onClose} />

          {/* Categories section */}
          <button
            onClick={() => setCatExpanded(!catExpanded)}
            className="w-full flex items-center justify-between px-6 py-3 text-sm font-medium text-[#1A1A1A] hover:bg-white hover:shadow-sm"
          >
            <span>Categories</span>
            <svg
              className={`w-4 h-4 text-gray-400 transition-transform ${catExpanded ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {catExpanded && categories.length > 0 && (
            <div className="bg-white/60">
              {categories.filter(c => c.isActive).map((cat) => (
                <Link
                  key={cat.id}
                  to={`/categories/${cat.slug || cat.id}`}
                  onClick={onClose}
                  className="block pl-10 pr-6 py-2.5 text-sm text-gray-600 hover:text-[#B8860B] hover:bg-white"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          )}

          <p className="px-4 text-[10px] uppercase tracking-wider text-gray-400 mt-4 mb-2">Account</p>
          <NavItem to="/account" label="My Account" onClick={onClose} />
          <NavItem to="/account/orders" label="My Orders" onClick={onClose} />
          <NavItem to="/account/addresses" label="My Addresses" onClick={onClose} />
          <NavItem to="/favorites" label="My Favorites" onClick={onClose} />
          <NavItem to="/about" label="About Us" onClick={onClose} />

          {isAuthenticated && (
            <button
              onClick={() => {
                logout();
                onClose();
              }}
              className="w-full text-left px-6 py-3 text-sm text-red-600 hover:bg-red-50"
            >
              Logout
            </button>
          )}
        </nav>
      </div>
    </>
  );
}

function NavItem({ to, label, onClick }: { to: string; label: string; onClick: () => void }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="block px-6 py-3 text-sm font-medium text-[#1A1A1A] hover:bg-white hover:shadow-sm"
    >
      {label}
    </Link>
  );
}
