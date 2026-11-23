import { Link, Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

function AdminGuard() {
  const { session, isStaff, isLoading, error } = useAuth();

  if (isLoading) {
    return <main role="status" className="flex min-h-screen items-center justify-center bg-[#0a0a0c] text-sm text-gray-400">Checking admin session...</main>;
  }

  // Surface account failures instead of silently looping back to login / إظهار أخطاء الحساب بدلاً من الرجوع لتسجيل الدخول بصمت
  if (error) {
    return (
      <main role="alert" className="flex min-h-screen flex-col items-center justify-center gap-5 bg-[#0a0a0c] px-6 text-center text-white">
        <p className="border-s-2 border-red-400 px-4 py-3 text-sm text-red-200">{error}</p>
        <Link to="/admin/login" className="rounded-md bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-gray-200">
          Back to sign in
        </Link>
      </main>
    );
  }

  // Only staff roles (super_admin / admin) may enter; customers are bounced to the admin login / الأدوار الإدارية فقط
  return session && isStaff ? <Outlet /> : <Navigate to="/admin/login" replace />;
}

export default function AdminProtectedRoute() {
  return <AdminGuard />;
}
