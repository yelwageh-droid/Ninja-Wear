import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export default function AdminProtectedRoute() {
  const [session, setSession] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let authSubscription;

    // Load the persisted session and follow sign-in/sign-out changes / تحميل الجلسة المحفوظة ومتابعة تغييرات تسجيل الدخول والخروج
    const loadSession = async () => {
      try {
        const { default: supabase } = await import('../../config/SupabaseClient.js');
        if (!isMounted) return;

        const { data: subscriptionData } = supabase.auth.onAuthStateChange((_event, nextSession) => {
          if (isMounted) {
            setSession(nextSession);
            setIsLoading(false);
          }
        });
        authSubscription = subscriptionData.subscription;

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (isMounted) {
          setSession(data.session);
          setIsLoading(false);
        }
      } catch {
        if (isMounted) {
          setSession(null);
          setIsLoading(false);
        }
      }
    };

    loadSession();
    return () => {
      isMounted = false;
      authSubscription?.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return <main role="status" className="flex min-h-screen items-center justify-center bg-[#0a0a0c] text-sm text-gray-400">Checking admin session...</main>;
  }

  return session ? <Outlet /> : <Navigate to="/admin/login" replace />;
}
