import { lazy, Suspense } from 'react';
import Nav from './componants/NavBar.jsx';
import { Navigate } from 'react-router-dom'
import { LayoutGroup, LazyMotion, MotionConfig, domMax, m } from 'framer-motion';
import { Route, Routes, useLocation, Link } from 'react-router-dom'
import Footer from './componants/Footer.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { ToastProvider } from './components/ui/ToastProvider.jsx';
import AdminLayout from './components/admin/AdminLayout.jsx';
import AdminProtectedRoute from './components/admin/AdminProtectedRoute.jsx';
import { useLanguage } from './context/LanguageContext.jsx';
const Home = lazy(() => import('./pages/public/Home.jsx'));
const Collections = lazy(() => import('./pages/public/Collections.jsx'));
const Apparel = lazy(() => import('./pages/public/Apparel.jsx'));
const Custom = lazy(() => import('./pages/public/Custom.jsx'));
const Cart = lazy(() => import('./pages/public/Cart.jsx'));
const Account = lazy(() => import('./pages/public/Account.jsx'));
const ContactUs = lazy(() => import('./pages/public/ContactUs.jsx'));
const SignIn = lazy(() => import('./pages/public/SignIn.jsx'));
const SignUp = lazy(() => import('./pages/public/SignUp.jsx'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin.jsx'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard.jsx'));
const OrdersManager = lazy(() => import('./pages/admin/OrdersManager.jsx'));
const CustomersManager = lazy(() => import('./pages/admin/CustomersManager.jsx'));
const ApparelManager = lazy(() => import('./pages/admin/ApparelManager.jsx'));
const CollectionsManager = lazy(() => import('./pages/admin/CollectionsManager.jsx'));
const PrintLogoPricing = lazy(() => import('./pages/admin/PrintLogoPricing.jsx'));
const TeamManager = lazy(() => import('./pages/admin/TeamManager.jsx'));

function SkipLink() {
  const { t } = useLanguage();
  return (
    <a
      href="#main-content"
      className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-100 focus:rounded focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:text-black"
    >
      {t('nav.skipToContent')}
    </a>
  );
}

// Styled 404 page
function NotFound() {
  const { t } = useLanguage();
  return (
    <main className="flex min-h-[75vh] flex-col items-center justify-center px-6 py-24 text-center">
      <p className="mb-4 text-8xl font-extrabold text-white/10 select-none">404</p>
      <h1 className="mb-3 text-3xl font-bold text-white">{t('notFound')}</h1>
      <p className="mb-10 max-w-xs text-sm leading-relaxed text-gray-500">
        {t('notFoundDescription')}
      </p>
      <div className="flex flex-wrap justify-center gap-4">
        <Link to="/" className="rounded-lg bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-gray-200">
          {t('nav.home')}
        </Link>
        <Link to="/collections" className="rounded-lg border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40">
          {t('nav.collections')}
        </Link>
      </div>
    </main>
  );
}

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname === '/admin' || location.pathname.startsWith('/admin/');

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <MotionConfig reducedMotion="user">
        <LazyMotion features={domMax}>
          <LanguageProvider>
            <AuthProvider>
              <ToastProvider>
                <LayoutGroup id="ninja-wear-layout">
                  {!isAdminRoute && <><SkipLink /><Nav /></>}
                  <m.div
                    id="main-content"
                    tabIndex={-1}
                    key={location.pathname}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.26, ease: 'easeOut' }}
                  >
                    <Suspense fallback={<main aria-live="polite" className="min-h-[65vh] bg-[#070709]" />}>
                      <Routes location={location}>
                        <Route path="/admin/login" element={<AdminLogin />} />
                        <Route path="/admin" element={<AdminProtectedRoute />}>
                          <Route element={<AdminLayout />}>
                            <Route index element={<Dashboard />} />
                            <Route path="orders" element={<OrdersManager />} />
                            <Route path="customers" element={<CustomersManager />} />
                            <Route path="apparel" element={<ApparelManager />} />
                            <Route path="collections" element={<CollectionsManager />} />
                            <Route path="pricing" element={<PrintLogoPricing />} />
                            <Route path="team" element={<TeamManager />} />
                          </Route>
                        </Route>
                        <Route path="/login" element={<SignIn />} />
                        <Route path="/signup" element={<SignUp />} />
                        <Route path="/" element={<Home />} />
                        <Route path="/apparel" element={<Apparel />} />
                        <Route path="/laptops" element={<Navigate to="/apparel" replace />} />
                        <Route path="/collections" element={<Collections />} />
                        <Route path="/custom" element={<Custom />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/account" element={<Account />} />
                        <Route path="/contact-us" element={<ContactUs />} />
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </m.div>
                  {!isAdminRoute && <Footer />}
                </LayoutGroup>
              </ToastProvider>
            </AuthProvider>
          </LanguageProvider>
        </LazyMotion>
      </MotionConfig>
    </div>
  )
}

export default App
