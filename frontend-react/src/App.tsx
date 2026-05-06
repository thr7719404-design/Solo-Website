import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { trackPageView } from '@/lib/analytics';
import AppShell from '@/components/layout/AppShell';

/* Lazy-loaded pages */
const HomePage = lazy(() => import('@/pages/HomePage'));
const ProductListPage = lazy(() => import('@/pages/ProductListPage'));
const ProductDetailPage = lazy(() => import('@/pages/ProductDetailPage'));
const CartPage = lazy(() => import('@/pages/CartPage'));
const CheckoutPage = lazy(() => import('@/pages/CheckoutPage'));
const PaymentCallbackPage = lazy(() => import('@/pages/PaymentCallbackPage'));
const FavoritesPage = lazy(() => import('@/pages/FavoritesPage'));
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'));
const LandingPage = lazy(() => import('@/pages/LandingPage'));

/* Account pages */
const AccountLayout = lazy(() => import('@/pages/account/AccountLayout'));
const ProfilePage = lazy(() => import('@/pages/account/ProfilePage'));
const AccountOrdersPage = lazy(() => import('@/pages/account/OrdersPage'));
const OrderDetailPage = lazy(() => import('@/pages/account/OrderDetailPage'));
const ReturnsPage = lazy(() => import('@/pages/account/ReturnsPage'));
const AddressesPage = lazy(() => import('@/pages/account/AddressesPage'));
const LoyaltyPage = lazy(() => import('@/pages/account/LoyaltyPage'));
const PaymentMethodsPage = lazy(() => import('@/pages/account/PaymentMethodsPage'));
const SecurityPage = lazy(() => import('@/pages/account/SecurityPage'));

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
/* AdminProductFormPage removed — products drawer handles create/edit inline */
const AdminCategoryManagementPage = lazy(() => import('@/pages/admin/AdminCategoryManagementPage'));
const AdminBrandsPage = lazy(() => import('@/pages/admin/AdminBrandsPage'));
const AdminOrdersPage = lazy(() => import('@/pages/admin/AdminOrdersPage'));
const AdminOrderDetailPage = lazy(() => import('@/pages/admin/AdminOrderDetailPage'));
const AdminBannersPage = lazy(() => import('@/pages/admin/AdminBannersPage'));
const AdminCustomersPage = lazy(() => import('@/pages/admin/AdminCustomersPage'));
const AdminCustomerDetailPage = lazy(() => import('@/pages/admin/AdminCustomerDetailPage'));
const AdminPromoCodesPage = lazy(() => import('@/pages/admin/AdminPromoCodesPage'));
const AdminLoyaltyPage = lazy(() => import('@/pages/admin/AdminLoyaltyPage'));
const AdminVatPage = lazy(() => import('@/pages/admin/AdminVatPage'));
const AdminShippingPage = lazy(() => import('@/pages/admin/AdminShippingPage'));
const AdminPaymentsPage = lazy(() => import('@/pages/admin/AdminPaymentsPage'));
const AdminReturnsPage = lazy(() => import('@/pages/admin/AdminReturnsPage'));
const AdminAnalyticsPage = lazy(() => import('@/pages/admin/AdminAnalyticsPage'));
const AdminAnnouncementsPage = lazy(() => import('@/pages/admin/AdminAnnouncementsPage'));
const AdminBulkOrdersPage = lazy(() => import('@/pages/admin/AdminBulkOrdersPage'));
const AdminProductGroupsPage = lazy(() => import('@/pages/admin/AdminProductGroupsPage'));
const AdminProductGroupDetailPage = lazy(() => import('@/pages/admin/AdminProductGroupDetailPage'));
const AdminNavigationPage = lazy(() => import('@/pages/admin/AdminNavigationPage'));
const AdminCollectionsPage = lazy(() => import('@/pages/admin/AdminCollectionsPage'));
const AdminCmsPagesPage = lazy(() => import('@/pages/admin/AdminCmsPagesPage'));
const BulkOrderPage = lazy(() => import('@/pages/BulkOrderPage'));
const BrandsPage = lazy(() => import('@/pages/BrandsPage'));
const CategoriesPage = lazy(() => import('@/pages/CategoriesPage'));
const ContactPage = lazy(() => import('@/pages/ContactPage'));
const FaqPage = lazy(() => import('@/pages/FaqPage'));
const PrivacyPolicyPage = lazy(() => import('@/pages/PrivacyPolicyPage'));
const TermsPage = lazy(() => import('@/pages/TermsPage'));

const Loading = () => <div className="loading-spinner" style={{ margin: '80px auto' }} />;

function PageTracker() {
  const location = useLocation();
  useEffect(() => {
    trackPageView(location.pathname + location.search);
  }, [location]);
  return null;
}

export default function App() {
  return (
    <Suspense fallback={<Loading />}>
      <PageTracker />
      <Routes>
        {/* ── Storefront ── */}
        <Route element={<AppShell />}>
          <Route index element={<HomePage />} />

          {/* Product browsing */}
          <Route path="products" element={<ProductListPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="product/:id" element={<ProductDetailPage />} />
          <Route path="category/:slug" element={<ProductListPage />} />
          <Route path="brand/:brandSlug" element={<ProductListPage />} />
          <Route path="search" element={<ProductListPage />} />

          {/* Brands & Categories directory pages */}
          <Route path="brands" element={<BrandsPage />} />
          <Route path="categories" element={<CategoriesPage />} />

          {/* Collections */}
          <Route path="new-arrivals" element={<ProductListPage />} />
          <Route path="best-sellers" element={<ProductListPage />} />
          <Route path="featured" element={<ProductListPage />} />
          <Route path="sale" element={<ProductListPage />} />

          {/* Cart & Checkout */}
          <Route path="cart" element={<CartPage />} />
          <Route path="checkout" element={<CheckoutPage />} />
          <Route path="payment-callback" element={<PaymentCallbackPage />} />

          {/* Favorites */}
          <Route path="favorites" element={<FavoritesPage />} />
          <Route path="wishlist" element={<FavoritesPage />} />

          {/* Bulk Orders */}
          <Route path="bulk-order" element={<BulkOrderPage />} />

          {/* Static contact page (overrides CMS catch-all) */}
          <Route path="pages/contact" element={<ContactPage />} />
          <Route path="pages/faq" element={<FaqPage />} />
          <Route path="pages/privacy" element={<PrivacyPolicyPage />} />
          <Route path="pages/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="pages/terms" element={<TermsPage />} />
          <Route path="pages/terms-and-conditions" element={<TermsPage />} />

          {/* CMS Landing Pages */}
          <Route path="pages/:slug" element={<LandingPage />} />

          {/* Account */}
          <Route path="account" element={<AccountLayout />}>
            <Route index element={<ProfilePage />} />
            <Route path="orders" element={<AccountOrdersPage />} />
            <Route path="orders/:id" element={<OrderDetailPage />} />
            <Route path="returns" element={<ReturnsPage />} />
            <Route path="addresses" element={<AddressesPage />} />
            <Route path="loyalty" element={<LoyaltyPage />} />
            <Route path="payment-methods" element={<PaymentMethodsPage />} />
            <Route path="security" element={<SecurityPage />} />
          </Route>

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
          <Route path="products/new" element={<Navigate to="/admin/products" replace />} />
          <Route path="products/:id" element={<Navigate to="/admin/products" replace />} />
          <Route path="product-groups" element={<AdminProductGroupsPage />} />
          <Route path="product-groups/:id" element={<AdminProductGroupDetailPage />} />
          <Route path="categories" element={<AdminCategoryManagementPage />} />
          <Route path="subcategories" element={<Navigate to="/admin/categories?tab=subcategories" replace />} />
          <Route path="brands" element={<AdminBrandsPage />} />
          <Route path="orders" element={<AdminOrdersPage />} />
          <Route path="orders/:id" element={<AdminOrderDetailPage />} />
          <Route path="customers" element={<AdminCustomersPage />} />
          <Route path="customers/:id" element={<AdminCustomerDetailPage />} />
          <Route path="banners" element={<AdminBannersPage />} />
          <Route path="promo-codes" element={<AdminPromoCodesPage />} />
          <Route path="loyalty" element={<AdminLoyaltyPage />} />
          <Route path="vat" element={<AdminVatPage />} />
          <Route path="shipping" element={<AdminShippingPage />} />
          <Route path="payments" element={<AdminPaymentsPage />} />
          <Route path="returns" element={<AdminReturnsPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="announcements" element={<AdminAnnouncementsPage />} />
          <Route path="bulk-orders" element={<AdminBulkOrdersPage />} />
          <Route path="navigation" element={<AdminNavigationPage />} />
          <Route path="collections" element={<AdminCollectionsPage />} />
          <Route path="pages" element={<AdminCmsPagesPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
}
