import { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';

const navigationItems = [
  { label: 'Dashboard', to: '/admin', icon: 'dashboard', end: true },
  { label: 'Orders', to: '/admin/orders', icon: 'orders' },
  { label: 'Laptops Catalog', to: '/admin/laptops', icon: 'laptops' },
  { label: 'Collections', to: '/admin/collections', icon: 'collections' },
];

function AdminIcon({ name }) {
  const iconPaths = {
    dashboard: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
    orders: <><path d="M8 4h11v17H5V4h3Z" /><path d="M9 4V2h6v2M9 10h6M9 14h6M9 18h3" /></>,
    laptops: <><rect x="4" y="4" width="16" height="12" rx="1.5" /><path d="M2 20h20l-2-4H4l-2 4Z" /></>,
    collections: <><path d="M3 7h7l2 2h9v10H3z" /><path d="M3 7V5h7l2 2" /></>,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {iconPaths[name]}
    </svg>
  );
}

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  const currentPage = navigationItems.find(({ to, end }) => (
    end ? location.pathname === to : location.pathname.startsWith(to)
  ));

  // Clear the Supabase session before returning to login / مسح جلسة Supabase قبل العودة لتسجيل الدخول
  const handleLogout = async () => {
    setIsLoggingOut(true);
    setLogoutError('');
    try {
      const { default: supabase } = await import('../../config/SupabaseClient.js');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      navigate('/admin/login', { replace: true });
    } catch (error) {
      setLogoutError(error.message || 'Unable to sign out. Please try again.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#0a0a0c] text-white">
      {/* Keep admin navigation available while its content scrolls / إبقاء تنقل الإدارة ثابتاً أثناء تمرير المحتوى */}
      <aside className="sticky top-0 flex h-screen w-16 shrink-0 flex-col border-e border-white/10 bg-[#050505] sm:w-60">
        <div className="flex h-16 items-center justify-center gap-3 border-b border-white/10 px-3 sm:justify-start sm:px-5">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-red-400 font-black text-black">N</span>
          <span className="hidden text-xs font-bold uppercase tracking-[0.16em] text-white sm:block">Ninja Skins<br /><span className="text-red-300">Admin</span></span>
        </div>
        <nav aria-label="Admin navigation" className="flex flex-col gap-1 px-2 py-5 sm:px-3">
          {navigationItems.map((item) => (
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
        <div className="mt-auto border-t border-white/10 p-3 text-center text-[10px] uppercase tracking-wider text-gray-600 sm:text-start">Admin workspace</div>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/10 bg-[#0a0a0c]/95 px-4 backdrop-blur sm:px-8">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-300">Ninja Skins / Admin</p>
            <h1 className="text-sm font-semibold text-white sm:text-base">{currentPage?.label || 'Admin'}</h1>
          </div>
          <button type="button" onClick={handleLogout} disabled={isLoggingOut} className="inline-flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-gray-200 transition hover:border-red-300/50 hover:text-white disabled:cursor-wait disabled:opacity-60 sm:text-sm">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M10 17l5-5-5-5M15 12H3M12 3h7a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-7" /></svg>
            <span>{isLoggingOut ? 'Signing out...' : 'Logout'}</span>
          </button>
        </header>
        <main className="mx-auto w-full max-w-375 p-4 sm:p-8">
          {logoutError && <p role="alert" className="mb-5 border-s-2 border-red-400 px-3 py-2 text-sm text-red-200">{logoutError}</p>}
          <Outlet />
        </main>
      </div>
    </div>
  );
}
