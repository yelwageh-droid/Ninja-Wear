import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getSupabase } from '../config/SupabaseClient.js';

const AuthContext = createContext(null);

// Only these roles may open the admin area / هذه الأدوار فقط تفتح لوحة الإدارة
const staffRoles = new Set(['super_admin', 'admin']);
const emptyAccount = { role: null, permissions: [], profile: null };

// Load role, permissions, and profile for one user / تحميل الدور والصلاحيات والملف الشخصي
async function fetchAccount(supabase, user) {
  const [roleResult, profileResult] = await Promise.all([
    supabase.from('user_roles').select('role, permissions').eq('user_id', user.id).maybeSingle(),
    supabase.from('profiles').select('id, full_name, phone, secondary_phone, address, account_status').eq('id', user.id).maybeSingle(),
  ]);

  if (roleResult.error) throw roleResult.error;
  if (profileResult.error) throw profileResult.error;

  return {
    role: roleResult.data?.role || 'user',
    permissions: Array.isArray(roleResult.data?.permissions) ? roleResult.data.permissions : [],
    profile: profileResult.data || null,
  };
}

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [account, setAccount] = useState(emptyAccount);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const mountedRef = useRef(true);

  // Resolve role/profile and evict suspended accounts / تحديد الدور وإخراج الحسابات المحظورة
  const resolveAccount = useCallback(async (supabase, nextSession) => {
    if (!nextSession?.user) {
      if (mountedRef.current) setAccount(emptyAccount);
      return;
    }

    try {
      const resolved = await fetchAccount(supabase, nextSession.user);
      if (!mountedRef.current) return;

      // Defense in depth: a banned account is signed out immediately / الحظر يمنع الدخول بالكامل
      if (resolved.profile?.account_status === 'banned') {
        await supabase.auth.signOut();
        if (!mountedRef.current) return;
        setSession(null);
        setAccount(emptyAccount);
        setError('This account has been suspended.');
        return;
      }

      setAccount(resolved);
      setError('');
    } catch (accountError) {
      if (mountedRef.current) {
        setAccount(emptyAccount);
        setError(accountError.message || 'Unable to verify your account.');
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    let subscription;

    const initialize = async () => {
      try {
        const supabase = await getSupabase();
        if (!mountedRef.current) return;

        const { data: subscriptionData } = supabase.auth.onAuthStateChange((event, nextSession) => {
          // Defer Supabase queries out of the auth callback to avoid holding its lock / تأجيل الاستعلامات خارج قفل المصادقة
          setTimeout(() => {
            if (!mountedRef.current) return;
            setSession(nextSession);

            if (event === 'SIGNED_OUT' || !nextSession?.user) {
              setAccount(emptyAccount);
              setError('');
              setIsLoading(false);
              return;
            }

            resolveAccount(supabase, nextSession).finally(() => {
              if (mountedRef.current) setIsLoading(false);
            });
          }, 0);
        });
        subscription = subscriptionData.subscription;

        // Restore the persisted session on first load / استعادة الجلسة المحفوظة عند أول تحميل
        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!mountedRef.current) return;

        setSession(data.session);
        if (data.session?.user) await resolveAccount(supabase, data.session);
      } catch (loadError) {
        if (mountedRef.current) {
          setAccount(emptyAccount);
          setError(loadError.message || 'Unable to verify your account.');
        }
      } finally {
        if (mountedRef.current) setIsLoading(false);
      }
    };

    initialize();
    return () => {
      mountedRef.current = false;
      subscription?.unsubscribe();
    };
  }, [resolveAccount]);

  const role = account.role;
  const permissions = account.permissions;
  const isSuperAdmin = role === 'super_admin';
  const isStaff = staffRoles.has(role);

  // super_admin implicitly holds every permission / السوبر أدمن يملك كل الصلاحيات
  const hasPermission = useCallback(
    (permission) => isSuperAdmin || permissions.includes(permission),
    [isSuperAdmin, permissions],
  );

  const signIn = useCallback(async ({ email, password }) => {
    try {
      const supabase = await getSupabase();
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) return { error: signInError, code: 'invalid_credentials', role: null };

      // Resolve the role here so callers can branch without racing the auth listener / تحديد الدور مباشرة لتجنّب أي سباق
      const resolved = await fetchAccount(supabase, data.user);
      if (resolved.profile?.account_status === 'banned') {
        await supabase.auth.signOut();
        return { error: new Error('This account has been suspended.'), code: 'banned', role: null };
      }

      if (mountedRef.current) {
        setAccount(resolved);
        // Set the session synchronously so route guards never bounce through /admin/login.
        // تعيين الجلسة فوراً حتى لا يحدث ارتداد بين صفحات الإدارة
        setSession(data.session);
        setIsLoading(false);
      }
      return { error: null, code: null, role: resolved.role };
    } catch (signInFailure) {
      return { error: signInFailure, code: 'unknown', role: null };
    }
  }, []);

  const signUp = useCallback(async ({ email, password, fullName, phone }) => {
    try {
      const supabase = await getSupabase();
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, phone } },
      });
      if (signUpError) return { error: signUpError, needsConfirmation: false };
      // A missing session means email confirmation is still required / غياب الجلسة يعني لزوم تأكيد البريد
      return { error: null, needsConfirmation: !data.session };
    } catch (signUpFailure) {
      return { error: signUpFailure, needsConfirmation: false };
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      const supabase = await getSupabase();
      const { error: signOutError } = await supabase.auth.signOut();
      return { error: signOutError };
    } catch (signOutFailure) {
      return { error: signOutFailure };
    }
  }, []);

  const refresh = useCallback(async () => {
    try {
      const supabase = await getSupabase();
      const { data } = await supabase.auth.getSession();
      setSession(data.session);
      await resolveAccount(supabase, data.session);
    } catch (refreshError) {
      if (mountedRef.current) setError(refreshError.message || 'Unable to refresh your account.');
    }
  }, [resolveAccount]);

  const updateProfile = useCallback(async (updates) => {
    try {
      const supabase = await getSupabase();
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) return { error: userError };
      if (!userData?.user) return { error: new Error('Not signed in') };

      const { data, error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userData.user.id)
        .select('id, full_name, phone, secondary_phone, address, account_status')
        .single();
      if (updateError) return { error: updateError };

      if (mountedRef.current) setAccount((current) => ({ ...current, profile: data }));
      return { error: null };
    } catch (updateFailure) {
      return { error: updateFailure };
    }
  }, []);

  const value = useMemo(() => ({
    session,
    user: session?.user || null,
    profile: account.profile,
    accountStatus: account.profile?.account_status || 'active',
    role,
    permissions,
    isSuperAdmin,
    isStaff,
    hasPermission,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    refresh,
    updateProfile,
  }), [
    session,
    account.profile,
    role,
    permissions,
    isSuperAdmin,
    isStaff,
    hasPermission,
    isLoading,
    error,
    signIn,
    signUp,
    signOut,
    refresh,
    updateProfile,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Keep the consumer hook beside the provider for a single auth API / إبقاء hook الاستهلاك بجوار المزود لتوحيد واجهة المصادقة
// oxlint-disable-next-line react/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
