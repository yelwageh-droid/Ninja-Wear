import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { PERMISSIONS, roleLabel } from '../../data/permissions.js';

// Every tab declares the permission required to see it / كل تبويب يحدد الصلاحية المطلوبة لعرضه
// A tab without a permission is visible to any staff member (super_admin / admin).
const navigationItems = [
  { label: 'Dashboard', to: '/admin', icon: 'dashboard', end: true },
  { label: 'Orders', to: '/admin/orders', icon: 'orders', permission: PERMISSIONS.ordersView },
  { label: 'Customers', to: '/admin/customers', icon: 'customers', permission: PERMISSIONS.customersView },
  { label: 'Apparel Catalog', to: '/admin/apparel', icon: 'apparel', permission: PERMISSIONS.catalogManage },
  { label: 'Collections', to: '/admin/collections', icon: 'collections', permission: PERMISSIONS.collectionsManage },
  { label: 'Pricing', to: '/admin/pricing', icon: 'pricing', permission: PERMISSIONS.pricingManage },
  { label: 'Team', to: '/admin/team', icon: 'team', permission: PERMISSIONS.teamManage },
];

function AdminIcon({ name }) {
  const iconPaths = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    orders: <><path d="M8 4h11v17H5V4h3Z" /><path d="M9 4V2h6v2M9 10h6M9 14h6M9 18h3" /></>,
    customers: <><circle cx="9" cy="8" r="3" /><path d="M3 20a6 6 0 0 1 12 0" /><path d="M16 5.5a3 3 0 0 1 0 5.8M18 20a5.5 5.5 0 0 0-3-4.9" /></>,
    team: <><circle cx="12" cy="7" r="3" /><path d="M6 20a6 6 0 0 1 12 0" /><path d="M12 12v3M10.5 13.5h3" /></>,
    apparel: <><path d="M9 3 5 5 3 9l3 1.6V21h12v-10.4L21 9l-2-4-4-2-3 2-3-2Z" /><path d="M9 3c0 1.7 1.3 3 3 3s3-1.3 3-3" /></>,
    collections: <><path d="M3 7h7l2 2h9v10H3z" /><path d="M3 7V5h7l2 2" /></>,
    pricing: <><path d="M9 19v-6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2zm0 0V9a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v10zm8 0v-8a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2z" /><path d="M18 11v3a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1v-3zM12 18h6a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2z" /></>,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {iconPaths[name]}
    </svg>
  );
}

// Match the current path against a navigation item / مطابقة المسار الحالي مع عنصر تنقل
function matchesPath(item, pathname) {
  return item.end ? pathname === item.to : pathname.startsWith(item.to);
}

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, hasPermission, signOut } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');

  // Only expose the tabs the current permissions allow / عرض التبويبات المسموح بها حسب الصلاحيات
  const allowedItems = navigationItems.filter((item) => !item.permission || hasPermission(item.permission));
  const currentPage = allowedItems.find((item) => matchesPath(item, location.pathname));
  const canViewCurrentRoute = Boolean(currentPage);

  // Clear the Supabase session before returning to login / مسح جلسة Supabase قبل العودة لتسجيل الدخول
  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError('');
    const { error } = await signOut();
    if (error) {
      setLogoutError(error.message || 'Unable to sign out. Please try again.');
      setIsLoggingOut(false);
      return;
    }
    navigate('/admin/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0c] text-white">
      {/* Keep admin navigation available while its content scrolls / إبقاء تنقل الإدارة ثابتاً أثناء تمرير المحتوى */}
      <aside className="sticky top-0 flex h-screen w-16 shrink-0 flex-col border-e border-white/10 bg-[#050505] sm:w-60">
        <div className="flex h-16 items-center justify-center gap-3 border-b border-white/10 px-3 sm:justify-start sm:px-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-red-400 font-black text-black">N</span>
          <span className="hidden text-xs font-bold uppercase tracking-[0.16em] text-white sm:block">Ninja Wear<br /><span className="text-red-300">Admin</span></span>
        </div>
        <nav aria-label="Admin navigation" className="flex flex-col gap-1 px-2 py-5 sm:px-3">
          {allowedItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              title={item.label}
              className={({ isActive }) => `flex min-h-11 items-center justify-center gap-3 rounded-md px-2 text-sm font-medium transition-colors sm:justify-start sm:px-3 ${isActive ? 'bg-red-400/10 text-red-200' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <AdminIcon name={item.icon} />
              <span className="hidden sm:block">{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="mt-auto border-t border-white/10 p-3 text-center text-[10px] uppercase tracking-wider text-gray-600 sm:text-start">{roleLabel(role)}</div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/10 bg-[#0a0a0c]/95 px-4 backdrop-blur sm:px-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-300">Ninja Wear / Admin</p>
            <h1 className="text-sm font-semibold text-white sm:text-base">{currentPage?.label || 'Admin'}</h1>
          </div>
          <button type="button" onClick={handleLogout} disabled={isLoggingOut} className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-gray-200 transition hover:border-red-300/50 hover:text-white disabled:cursor-wait disabled:opacity-60 sm:text-sm">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17l5-5-5-5M15 12H3M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></svg>
            <span>{isLoggingOut ? 'Signing out...' : 'Logout'}</span>
          </button>
        </header>
        <main className="mx-auto w-full max-w-375 p-4 sm:p-8">
          {logoutError && <p role="alert" className="mb-5 border-s-2 border-red-400 px-3 py-2 text-sm text-red-200">{logoutError}</p>}
          {canViewCurrentRoute ? (
            <Outlet />
          ) : (
            // Block routes the current permissions cannot open / منع المسارات غير المتاحة للصلاحيات الحالية
            <section className="max-w-xl border border-white/10 bg-[#121214] p-8">
              <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-300">Restricted</p>
              <h2 className="text-2xl font-bold text-white">You do not have access to this section.</h2>
              <p className="mt-3 text-sm leading-6 text-gray-500">Your role ({roleLabel(role)}) does not include the permission required for this page. Ask a super admin to grant it.</p>
              <div className="mt-6 flex flex-wrap gap-3">
                {allowedItems.map((item) => (
                  <NavLink key={item.to} to={item.to} className="rounded-md border border-white/15 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40">
                    {item.label}
                  </NavLink>
                ))}
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
