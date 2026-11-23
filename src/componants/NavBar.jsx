import { Link, NavLink, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { useAuth } from '../context/AuthContext.jsx'
import { cartChangeEvent, readCart } from '../data/cart.js'

const links = [
  ['nav.home', '/'],
  ['nav.apparel', '/apparel'],
  ['nav.collections', '/collections'],
  ['nav.custom', '/custom'],
  ['nav.cart', '/cart'],
  ['nav.contact', '/contact-us'],
]

function Nav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { language, toggleLanguage, t } = useLanguage()
  const { user, profile, isStaff, signOut } = useAuth()
  const location = useLocation()
  const [cartCount, setCartCount] = useState(() => readCart().items.length)
  const [isSigningOut, setIsSigningOut] = useState(false)

  // Keep the badge in sync in this tab and in other tabs / تحديث عداد السلة في نفس التاب وفي التابات الأخرى
  useEffect(() => {
    const syncCart = () => setCartCount(readCart().items.length)
    syncCart()
    window.addEventListener(cartChangeEvent, syncCart)
    window.addEventListener('storage', syncCart)
    return () => {
      window.removeEventListener(cartChangeEvent, syncCart)
      window.removeEventListener('storage', syncCart)
    }
  }, [location.pathname])

  // Escape closes the mobile menu / زر Escape يغلق قائمة الموبايل
  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsMenuOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMenuOpen])

  const closeMenu = () => setIsMenuOpen(false)
  const displayName = profile?.full_name?.trim() || user?.email?.split('@')[0] || ''

  // Clear the shared Supabase session from anywhere on the storefront / مسح الجلسة من أي صفحة في الموقع
  const handleSignOut = async () => {
    setIsSigningOut(true)
    await signOut()
    setIsSigningOut(false)
    closeMenu()
  }

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#050505ec] text-slate-300 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6 xl:gap-6">
        <NavLink
          className="flex items-center text-lg font-bold tracking-wide"
          to="/"
          end
          onClick={closeMenu}
        >
          <img src="/ninja-wear-logo.png" alt="" className="h-12 w-auto" />
          <span>NINJA WEAR</span>
        </NavLink>

        <div className="hidden items-center gap-6 text-sm font-medium lg:flex xl:gap-8">
          {links.map(([labelKey, path]) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                isActive
                  ? 'text-red-400 underline decoration-2 underline-offset-8'
                  : 'transition-colors hover:text-white'
              }
            >
              {t(labelKey)}
            </NavLink>
          ))}
        </div>

        <div className="hidden items-center gap-3 text-sm font-medium lg:flex xl:gap-4">
          {/* Collections CTA is for guests only; signed-in users already have the nav link / زر التصميمات للزوار فقط لأن المسجّل عنده رابط التنقل */}
          {!user && (
            <Link
              to="/collections"
              className="rounded-lg bg-white px-5 py-3 font-bold text-black transition hover:bg-gray-200"
            >
              {t('nav.seeCollections')}
            </Link>
          )}
          {/* Cart icon with live badge / أيقونة السلة مع عداد حي */}
          <Link to="/cart" aria-label={t('nav.cart')} className="relative flex items-center justify-center rounded-md border border-white/15 p-2 text-white transition hover:border-white/40">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.4 7h12.8M7 13L5.4 5M17 13l1.4 7M9 21a1 1 0 100-2 1 1 0 000 2zm8 0a1 1 0 100-2 1 1 0 000 2z" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-1.5 -end-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </Link>
          <button type="button" onClick={toggleLanguage} className="rounded-md border border-white/15 px-3 py-2 font-semibold text-white transition hover:border-white/40" aria-label={t(language === 'en' ? 'nav.switchToArabic' : 'nav.switchToEnglish')}>
            {language === 'en' ? 'AR' : 'EN'}
          </button>
          {/* Account controls / التحكم في الحساب */}
          {user ? (
            <div className="flex items-center gap-3 xl:gap-4">
              <Link to="/account" className="flex items-center gap-1.5 rounded-md border border-white/15 px-3 py-2 font-semibold text-white transition hover:border-white/40">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 12a4 4 0 100-8 4 4 0 000 8zm0 2c-3.5 0-6 1.8-6 4v2h12v-2c0-2.2-2.5-4-6-4z" />
                </svg>
                {t('nav.account')}
              </Link>
              {isStaff && (
                <Link to="/admin" className="rounded-md border border-white/15 px-3 py-2 font-semibold text-white transition hover:border-white/40">
                  {t('nav.admin')}
                </Link>
              )}
              <span className="max-w-32 truncate text-sm font-semibold text-white" title={displayName}>{displayName}</span>
              <button type="button" onClick={handleSignOut} disabled={isSigningOut} className="rounded-md border border-white/15 px-3 py-2 font-semibold text-gray-200 transition hover:border-red-300/50 hover:text-white disabled:cursor-wait disabled:opacity-60">
                {isSigningOut ? t('nav.signingOut') : t('nav.signOut')}
              </button>
            </div>
          ) : (
            <Link to="/login" className="rounded-md border border-white/15 px-4 py-2 font-semibold text-white transition hover:border-white/40">
              {t('nav.signIn')}
            </Link>
          )}
        </div>

        <div className="flex items-center gap-2 lg:hidden">
          <button type="button" onClick={toggleLanguage} className="rounded border border-white/20 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10" aria-label={t(language === 'en' ? 'nav.switchToArabic' : 'nav.switchToEnglish')}>
            {language === 'en' ? 'AR' : 'EN'}
          </button>
          <button
            type="button"
            className="rounded border border-white/20 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            aria-expanded={isMenuOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsMenuOpen((open) => !open)}
          >
            {t(isMenuOpen ? 'nav.closeMenu' : 'nav.openMenu')}
          </button>
        </div>
      </div>

      <div
        id="mobile-navigation"
        hidden={!isMenuOpen}
        className="border-t border-white/10 px-4 pb-4 pt-2 lg:hidden sm:px-6"
      >
          <div className="mx-auto flex max-w-7xl flex-col gap-1 text-sm font-medium">
            {links.map(([labelKey, path]) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/'}
                onClick={closeMenu}
                className={({ isActive }) =>
                  `rounded px-3 py-3 transition-colors hover:bg-white/5 hover:text-white ${
                    isActive ? 'text-red-400' : ''
                  }`
                }
              >
                {t(labelKey)}
              </NavLink>
            ))}
            {/* Account controls for small screens / التحكم في الحساب للشاشات الصغيرة */}
            {user ? (
              <div className="mt-2 flex flex-col gap-1 border-t border-white/10 pt-3">
                <NavLink
                  to="/account"
                  onClick={closeMenu}
                  className={({ isActive }) => `rounded px-3 py-3 font-semibold text-white transition-colors hover:bg-white/5 ${isActive ? 'text-red-400' : ''}`}
                >
                  {t('nav.account')}
                </NavLink>
                {isStaff && (
                  <NavLink
                    to="/admin"
                    onClick={closeMenu}
                    className={({ isActive }) => `rounded px-3 py-3 font-semibold text-white transition-colors hover:bg-white/5 ${isActive ? 'text-red-400' : ''}`}
                  >
                    {t('nav.admin')}
                  </NavLink>
                )}
                <div className="flex items-center justify-between gap-3 px-3 pt-2">
                  <span className="truncate font-semibold text-white">{displayName}</span>
                  <button type="button" onClick={handleSignOut} disabled={isSigningOut} className="rounded border border-white/20 px-3 py-2 text-sm font-semibold text-gray-200 transition hover:bg-white/10 disabled:cursor-wait disabled:opacity-60">
                    {isSigningOut ? t('nav.signingOut') : t('nav.signOut')}
                  </button>
                </div>
              </div>
            ) : (
              <NavLink
                to="/login"
                onClick={closeMenu}
                className="mt-2 rounded border-t border-white/10 px-3 py-3 font-semibold text-white transition-colors hover:bg-white/5"
              >
                {t('nav.signIn')}
              </NavLink>
            )}
          </div>
      </div>
    </nav>
  )
}



export default Nav