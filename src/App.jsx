import { lazy, Suspense } from 'react';
import Nav from './componants/NavBar.jsx'
import { LayoutGroup, LazyMotion, MotionConfig, domMax, m } from 'framer-motion';
import { Route, Routes, useLocation, Link } from 'react-router-dom'
import './App.css'
import Footer from './componants/Footer.jsx';
import { LanguageProvider } from './context/LanguageContext.jsx';
import AdminLayout from './components/admin/AdminLayout.jsx';
import AdminProtectedRoute from './components/admin/AdminProtectedRoute.jsx';
import { useLanguage } from './context/LanguageContext.jsx';
const Home = lazy(() => import('./pages/public/Home.jsx'));
const Collections = lazy(() => import('./pages/public/Collections.jsx'));
const Laptops = lazy(() => import('./pages/public/Laptops.jsx'));
const Custom = lazy(() => import('./pages/public/Custom.jsx'));
const Cart = lazy(() => import('./pages/public/Cart.jsx'));
const ContactUs = lazy(() => import('./pages/public/ContactUs.jsx'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin.jsx'));
const Dashboard = lazy(() => import('./pages/admin/Dashboard.jsx'));
const OrdersManager = lazy(() => import('./pages/admin/OrdersManager.jsx'));
const LaptopsManager = lazy(() => import('./pages/admin/LaptopsManager.jsx'));
const CollectionsManager = lazy(() => import('./pages/admin/CollectionsManager.jsx'));

// Styled 404 page — uses t() safely inside the LanguageProvider tree / صفحة 404 بتستخدم t() داخل مزوّد اللغة
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
    <div className="min-h-screen bg-linear-to-t from-indigo-950 to-black">
      <MotionConfig reducedMotion="user">
        <LazyMotion features={domMax}>
          {/* Share language and document-direction state across the site / مشاركة حالة اللغة واتجاه المستند عبر الموقع */}
          <LanguageProvider>
            <LayoutGroup id="ninja-skins-layout">
              {!isAdminRoute && <Nav />}
              <m.div
                key={location.pathname}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.26, ease: 'easeOut' }}
              >
                <Suspense fallback={<main aria-live="polite" className="min-h-[65vh] bg-[#070709]" />}>
                  <Routes location={location}>
                    {/* Keep admin routes protected and outside the public shell / حماية مسارات الإدارة وفصلها عن واجهة المتجر */}
                    <Route path="/admin/login" element={<AdminLogin />} />
                    <Route path="/admin" element={<AdminProtectedRoute />}>
                      <Route element={<AdminLayout />}>
                        <Route index element={<Dashboard />} />
                        <Route path="orders" element={<OrdersManager />} />
                        <Route path="laptops" element={<LaptopsManager />} />
                        <Route path="collections" element={<CollectionsManager />} />
                      </Route>
                    </Route>
                    <Route path="/" element={<Home />} />
                    <Route path="/laptops" element={<Laptops />} />
                    <Route path="/collections" element={<Collections />} />
                    <Route path="/custom" element={<Custom />} />
                    <Route path="/cart" element={<Cart />} />
                    <Route path="/contact-us" element={<ContactUs />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </m.div>
              {!isAdminRoute && <Footer />}
            </LayoutGroup>
          </LanguageProvider>
        </LazyMotion>
      </MotionConfig>
    </div>
  )
}

export default App
