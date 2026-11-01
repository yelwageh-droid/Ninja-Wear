import { lazy, Suspense } from 'react';
import Nav from './componants/NavBar.jsx'
import { LayoutGroup, LazyMotion, MotionConfig, domMax, m } from 'framer-motion';
import { Route, Routes, useLocation } from 'react-router-dom'
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


function Page({ title }) {
  const { t } = useLanguage();
  return (
    <main className="mx-auto max-w-6xl px-6 py-12 text-white">
      <h1 className="text-3xl font-semibold">{title === 'Page not found' ? t('notFound') : title}</h1>
    </main>
  )
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
                    <Route path="*" element={<Page title="Page not found" />} />
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
