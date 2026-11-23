import { Link } from 'react-router-dom';

// Shared frame for the customer sign in / sign up pages / إطار موحّد لصفحات الدخول والتسجيل
export default function AuthShell({ eyebrow, title, subtitle, error, children, footer }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#050505] px-5 py-12 text-white">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_75%_15%,rgba(239,68,68,0.12),transparent_38%),linear-gradient(135deg,transparent_58%,rgba(245,158,11,0.06))]" />
      <section className="relative w-full max-w-md border border-white/10 bg-[#0a0a0c] p-6 shadow-2xl shadow-black/40 sm:p-9">
        <Link to="/" className="mb-8 inline-flex items-center gap-3" aria-label="Ninja Wear storefront">
          <span className="flex h-10 w-10 items-center justify-center rounded-md bg-red-400 font-black text-black">N</span>
          <span className="text-xs font-bold uppercase tracking-[0.16em]">Ninja Wear</span>
        </Link>

        {eyebrow && <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-300">{eyebrow}</p>}
        <h1 className="text-3xl font-extrabold">{title}</h1>
        {subtitle && <p className="mt-3 text-sm leading-6 text-gray-400">{subtitle}</p>}

        <div className="mt-8">
          {error && <p role="alert" className="mb-5 border-s-2 border-red-400 px-3 py-2 text-sm leading-5 text-red-200">{error}</p>}
          {children}
        </div>

        {footer && <div className="mt-6 border-t border-white/10 pt-5 text-sm text-gray-400">{footer}</div>}
      </section>
    </main>
  );
}
