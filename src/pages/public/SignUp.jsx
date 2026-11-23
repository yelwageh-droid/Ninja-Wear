import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
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

export default function SignUp() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t } = useLanguage();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  const redirectTo = safeRedirect(searchParams.get('redirect')) || (readCart().items.length ? '/cart' : '/');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    // Basic client-side checks; Supabase still enforces its own password policy / تحقق مبدئي والتحقق النهائي عند Supabase
    if (password.length < 8) {
      setErrorMessage(t('auth.passwordTooShort'));
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage(t('auth.passwordMismatch'));
      return;
    }

    setIsSubmitting(true);
    const { error, needsConfirmation: pendingConfirmation } = await signUp({
      email: email.trim(),
      password,
      fullName: fullName.trim(),
      phone: '',
    });

    if (error) {
      setErrorMessage(t('auth.signUpError'));
      setIsSubmitting(false);
      return;
    }

    if (pendingConfirmation) {
      setNeedsConfirmation(true);
      setIsSubmitting(false);
      return;
    }

    navigate(redirectTo, { replace: true });
  };

  if (needsConfirmation) {
    return (
      <AuthShell eyebrow={t('auth.accountEyebrow')} title={t('auth.confirmTitle')} subtitle={t('auth.confirmSubtitle')}>
        <Link to="/login" className="inline-flex w-full justify-center rounded-md bg-white px-5 py-3.5 font-bold text-black transition hover:bg-red-100">
          {t('auth.signIn')}
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow={t('auth.accountEyebrow')}
      title={t('auth.signUpTitle')}
      subtitle={t('auth.signUpSubtitle')}
      error={errorMessage}
      footer={<>{t('auth.haveAccount')} <Link to={`/login?redirect=${encodeURIComponent(redirectTo)}`} className="font-semibold text-red-300 underline decoration-red-300/30 underline-offset-4 hover:text-red-200">{t('auth.signIn')}</Link></>}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <label className="block text-sm font-medium text-gray-300">
          {t('auth.fullName')}
          <input
            type="text"
            name="fullName"
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
            autoComplete="name"
            required
            maxLength={120}
            className={fieldClass}
            placeholder="Ahmed Mohamed"
          />
        </label>
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
            autoComplete="new-password"
            required
            minLength={8}
            className={fieldClass}
            placeholder="••••••••"
          />
          <span className="mt-1 block text-xs text-gray-600">{t('auth.passwordHint')}</span>
        </label>
        <label className="block text-sm font-medium text-gray-300">
          {t('auth.confirmPassword')}
          <input
            type="password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            required
            minLength={8}
            className={fieldClass}
            placeholder="••••••••"
          />
        </label>
        <button type="submit" disabled={isSubmitting} className="w-full rounded-md bg-white px-5 py-3.5 font-bold text-black transition hover:bg-red-100 disabled:cursor-wait disabled:opacity-60">
          {isSubmitting ? t('auth.signingUp') : t('auth.signUp')}
        </button>
      </form>
    </AuthShell>
  );
}
