import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Authenticate with Supabase and enter the protected admin area / تسجيل الدخول عبر Supabase ثم فتح لوحة الإدارة المحمية
  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const { default: supabase } = await import('../../config/SupabaseClient.js');
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      navigate('/admin', { replace: true });
    } catch (authError) {
      setErrorMessage(authError.message || 'Unable to sign in. Check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050505] px-5 py-12 text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_75%_15%,rgba(239,68,68,0.12),transparent_38%),linear-gradient(135deg,transparent_58%,rgba(245,158,11,0.06))]" />
      <section className="relative w-full max-w-md border border-white/10 bg-[#0a0a0c] p-6 shadow-2xl shadow-black/40 sm:p-9">
        <Link to="/" className="mb-10 inline-flex items-center gap-3" aria-label="Ninja Skins storefront">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-red-400 font-black text-black">N</span>
          <span className="text-xs font-bold uppercase tracking-[0.16em]">Ninja Skins<br /><span className="text-red-300">Admin</span></span>
        </Link>

        <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-300">Secure workspace</p>
        <h1 className="text-3xl font-extrabold">Admin sign in</h1>
        <p className="mt-3 text-sm leading-6 text-gray-400">Use your administrator account to continue.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block text-sm font-medium text-gray-300">
            Email address
            <input
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="username"
              required
              className="mt-2 w-full rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-red-300"
              placeholder="admin@example.com"
            />
          </label>
          <label className="block text-sm font-medium text-gray-300">
            Password
            <input
              type="password"
              name="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
              className="mt-2 w-full rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-red-300"
              placeholder="Enter your password"
            />
          </label>
          {errorMessage && <p role="alert" className="border-s-2 border-red-400 px-3 py-2 text-sm leading-5 text-red-200">{errorMessage}</p>}
          <button type="submit" disabled={isSubmitting} className="w-full rounded-md bg-white px-5 py-3.5 font-bold text-black transition hover:bg-red-100 disabled:cursor-wait disabled:opacity-60">
            {isSubmitting ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}
