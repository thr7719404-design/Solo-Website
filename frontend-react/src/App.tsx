import { Routes, Route } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import AppShell from '@/components/layout/AppShell';

/* Lazy-loaded pages */
const HomePage = lazy(() => import('@/pages/HomePage'));
const ProductListPage = lazy(() => import('@/pages/ProductListPage'));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'));
const CartPage = lazy(() => import('@/pages/CartPage'));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'));
const FavoritesPage = lazy(() => import('@/pages/FavoritesPage'));
const AccountPage = lazy(() => import('@/pages/AccountPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));

/* Auth pages */
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'));
const SignUpPage = lazy(() => import('@/pages/auth/SignUpPage'));
const ForgotPasswordPage = lazy(() => import('@/pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('@/pages/auth/ResetPasswordPage'));
const VerifyEmailPage = lazy(() => import('@/pages/auth/VerifyEmailPage'));

/* Admin pages */
const AdminLayout = lazy(() => import('@/pages/admin/AdminLayout'));
const AdminDashboardPage = lazy(() => import('@/pages/admin/AdminDashboardPage'));
const AdminProductsPage = lazy(() => import('@/pages/admin/AdminProductsPage'));
const AdminProductFormPage = lazy(() => import('@/pages/admin/AdminProductFormPage'));
const AdminCategoriesPage = lazy(() => import('@/pages/admin/AdminCategoriesPage'));
const AdminBrandsPage = lazy(() => import('@/pages/admin/AdminBrandsPage'));
const AdminOrdersPage = lazy(() => import('@/pages/admin/AdminOrdersPage'));
const AdminOrderDetailPage = lazy(() => import('@/pages/admin/AdminOrderDetailPage'));
const AdminBannersPage = lazy(() => import('@/pages/admin/AdminBannersPage'));
const AdminCustomersPage = lazy(() => import('@/pages/admin/AdminCustomersPage'));
const AdminCustomerDetailPage = lazy(() => import('@/pages/admin/AdminCustomerDetailPage'));
const AdminPromoCodesPage = lazy(() => import('@/pages/admin/AdminPromoCodesPage'));
const AdminLandingPagesPage = lazy(() => import('@/pages/admin/AdminPlaceholderPages').then(m => ({ default: m.default })));
const AdminLoyaltyPage = lazy(() => import('@/pages/admin/AdminLoyaltyPage'));
const AdminVatPage = lazy(() => import('@/pages/admin/AdminVatPage'));
const AdminReturnsPage = lazy(() => import('@/pages/admin/AdminReturnsPage'));

const Loading = () => <div className="loading-spinner" style={{ margin: '80px auto' }} />;

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        {/* ── Storefront ── */}
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />

          {/* Product browsing */}
          <Route path="products" element={<ProductListPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="product/:id" element={<ProductDetailPage />} />
          <Route path="category/:slug" element={<ProductListPage />} />
          <Route path="brand/:slug" element={<ProductListPage />} />
          <Route path="search" element={<ProductListPage />} />

          {/* Collections */}
          <Route path="new-arrivals" element={<ProductListPage />} />
          <Route path="best-sellers" element={<ProductListPage />} />
          <Route path="featured" element={<ProductListPage />} />
          <Route path="sale" element={<ProductListPage />} />

          {/* Cart & Checkout */}
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />

          {/* Favorites */}
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="wishlist" element={<FavoritesPage />} />

          {/* Account */}
          <Route path="account" element={<AccountPage />} />
          <Route path="account/*" element={<AccountPage />} />

          {/* Auth */}
          <Route path="login" element={<LoginPage />} />
          <Route path="signup" element={<SignUpPage />} />
          <Route path="register" element={<SignUpPage />} />
          <Route path="forgot-password" element={<ForgotPasswordPage />} />
          <Route path="reset-password" element={<ResetPasswordPage />} />
          <Route path="verify-email" element={<VerifyEmailPage />} />

          {/* 404 */}
          <Route path="*" element={<NotFoundPage />} />
        </Route>

        {/* ── Admin ── */}
        <Route path="admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboardPage />} />
          <Route path="products" element={<AdminProductsPage />} />
          <Route path="products/new" element={<AdminProductFormPage />} />
          <Route path="products/:id" element={<AdminProductFormPage />} />
          <Route path="categories" element={<AdminCategoriesPage />} />
          <Route path="brands" element={<AdminBrandsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="orders/:id" element={<AdminOrderDetailPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="customers/:id" element={<AdminCustomerDetailPage />} />
          <Route path="banners" element={<AdminBannersPage />} />
          <Route path="landing-pages" element={<AdminLandingPagesPage />} />
          <Route path="promo-codes" element={<AdminPromoCodesPage />} />
          <Route path="loyalty" element={<AdminLoyaltyPage />} />
          <Route path="vat" element={<AdminVatPage />} />
          <Route path="returns" element={<AdminReturnsPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
