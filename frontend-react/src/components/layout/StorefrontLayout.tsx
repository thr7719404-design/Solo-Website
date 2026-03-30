import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';
import MobileDrawer from './MobileDrawer';

export default function StorefrontLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex flex-col min-h-screen">
      <Header onMenuOpen={() => setDrawerOpen(true)} />
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
