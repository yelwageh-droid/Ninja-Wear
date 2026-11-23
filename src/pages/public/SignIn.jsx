import { useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import AuthShell from '../../components/auth/AuthShell.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { readCart } from '../../data/cart.js';

const fieldClass = 'mt-2 w-full rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-red-300';

// Only allow in-app redirects so a crafted link cannot forward elsewhere / منع إعادة التوجيه لموقع خارجي
function safeRedirect(target) {
  if (typeof target === 'string' && target.startsWith('/') && !target.startsWith('//')) return target;
  return null;
}

export default function SignIn() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Return the customer to where they came from, otherwise back to a full cart / إرجاع العميل لمصدره أو للسلة
  const redirectTo = safeRedirect(searchParams.get('redirect'))
    || safeRedirect(location.state?.from)
    || (readCart().items.length ? '/cart' : '/');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage('');

    const { error, code } = await signIn({ email: email.trim(), password });
    if (error) {
      setErrorMessage(code === 'banned' ? t('auth.banned') : t('auth.invalidCredentials'));
      setIsSubmitting(false);
      return;
    }

    navigate(redirectTo, { replace: true });
  };

  return (
    <AuthShell
      eyebrow={t('auth.accountEyebrow')}
      title={t('auth.signInTitle')}
      subtitle={t('auth.signInSubtitle')}
      error={errorMessage}
      footer={<>{t('auth.noAccount')} <Link to={`/signup?redirect=${encodeURIComponent(redirectTo)}`} className="font-semibold text-red-300 underline decoration-red-300/30 underline-offset-4 hover:text-red-200">{t('auth.createAccount')}</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block text-sm font-medium text-gray-300">
          {t('auth.email')}
          <input
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            required
            maxLength={254}
            className={fieldClass}
            placeholder="you@example.com"
          />
        </label>
        <label className="block text-sm font-medium text-gray-300">
          {t('auth.password')}
          <input
            type="password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
            className={fieldClass}
            placeholder="••••••••"
          />
        </label>
        <button type="submit" disabled={isSubmitting} className="w-full rounded-md bg-white px-5 py-3.5 font-bold text-black transition hover:bg-red-100 disabled:cursor-wait disabled:opacity-60">
          {isSubmitting ? t('auth.signingIn') : t('auth.signIn')}
        </button>
      </form>
    </AuthShell>
  );
}
