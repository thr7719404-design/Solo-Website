import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function AppShell() {
  return (
    <>
      <Header />
      <main style={{ minHeight: 'calc(100vh - 200px)' }}>
        <Outlet />
      </main>
      <Footer />
    </>
  );
}
