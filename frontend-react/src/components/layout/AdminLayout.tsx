import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';

const SECTIONS = [
  {
    label: 'MAIN',
    items: [{ label: 'Dashboard', path: '/admin', icon: 'grid' }],
  },
  {
    label: 'CATALOG',
    items: [
      { label: 'Products', path: '/admin/products', icon: 'box' },
      { label: 'Categories', path: '/admin/categories', icon: 'layers' },
      { label: 'Brands', path: '/admin/brands', icon: 'tag' },
    ],
  },
  {
    label: 'CONTENT',
    items: [
      { label: 'Banners', path: '/admin/banners', icon: 'image' },
      { label: 'Landing Pages', path: '/admin/pages', icon: 'layout' },
    ],
  },
  {
    label: 'SALES',
    items: [
      { label: 'Orders', path: '/admin/orders', icon: 'shopping-bag' },
      { label: 'Customers', path: '/admin/customers', icon: 'users' },
      { label: 'Promo Codes', path: '/admin/promo', icon: 'percent' },
    ],
  },
  {
    label: 'REPORTS',
    items: [{ label: 'Business Intel', path: '/admin/reports', icon: 'bar-chart' }],
  },
  {
    label: 'CONFIG',
    items: [
      { label: 'Stripe', path: '/admin/stripe', icon: 'credit-card' },
      { label: 'VAT', path: '/admin/vat', icon: 'file-text' },
    ],
  },
] as const;

function SidebarIcon({ name }: { name: string }) {
  const icons: Record<string, string> = {
    grid: 'M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z',
    box: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    layers: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z',
    tag: 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
    image: 'M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z',
    layout: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
    'shopping-bag': 'M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z',
    users: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
    percent: 'M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z',
    'bar-chart': 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    'credit-card': 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z',
    'file-text': 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    storefront: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
  };
  return (
    <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icons[name] ?? ''} />
    </svg>
  );
}

export default function AdminLayout() {
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarW = collapsed ? 'w-[72px]' : 'w-60';

  const sidebar = (
    <aside
      className={`bg-[#111827] text-white flex flex-col transition-all duration-200 ${
        mobileOpen ? 'fixed inset-y-0 left-0 z-50 w-60' : `hidden lg:flex ${sidebarW}`
      }`}
    >
      {/* Collapse toggle (desktop) */}
      <div className="hidden lg:flex items-center justify-end p-2">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded hover:bg-white/10 text-white/60"
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d={collapsed ? 'M9 5l7 7-7 7' : 'M15 19l-7-7 7-7'}
            />
          </svg>
        </button>
      </div>

      {/* Nav sections */}
      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {SECTIONS.map((section) => (
          <div key={section.label} className="mb-3">
            {!collapsed && (
              <p className="px-3 pt-3 pb-1 text-[10px] uppercase tracking-wider text-white/35">
                {section.label}
              </p>
            )}
            {section.items.map((item) => {
              const active = pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors my-0.5 ${
                    active
                      ? 'bg-indigo-500/20 text-white font-medium'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <SidebarIcon name={item.icon} />
                  {!collapsed && <span>{item.label}</span>}
                  {active && !collapsed && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer: View Store */}
      <div className="border-t border-white/10 p-2">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-white/60 hover:text-white hover:bg-white/5"
          title={collapsed ? 'View Store' : undefined}
        >
          <SidebarIcon name="storefront" />
          {!collapsed && <span>View Store</span>}
        </Link>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen bg-[#F8F9FC]">
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {sidebar}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 h-14 flex items-center px-4 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2 -ml-2 text-gray-600 hover:text-black mr-2"
            aria-label="Open menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>

          <span className="text-lg font-bold tracking-wider">Solo</span>
          <span className="ml-2 text-xs font-semibold bg-indigo-100 text-indigo-600 px-2 py-0.5 rounded">
            ADMIN
          </span>

          <div className="ml-auto flex items-center gap-3">
            <Link to="/" className="text-gray-400 hover:text-gray-600" title="View Store">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </Link>
            <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-white text-xs font-bold">
              A
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
