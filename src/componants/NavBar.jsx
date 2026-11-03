import { Link, NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'
import { readCart } from '../data/cart.js'

const links = [
  ['nav.home', '/'],
  ['nav.laptops', '/laptops'],
  ['nav.collections', '/collections'],
  ['nav.custom', '/custom'],
  ['nav.cart', '/cart'],
  ['nav.contact', '/contact-us'],
]

function Nav() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { language, toggleLanguage, t } = useLanguage()
  const [cartCount, setCartCount] = useState(() => readCart().items.length)

  // Re-read cart count whenever storage changes (e.g., item added on another page) / تحديث عداد السلة عند تغيير التخزين من أي صفحة
  useEffect(() => {
    const syncCart = () => setCartCount(readCart().items.length)
    window.addEventListener('storage', syncCart)
    return () => window.removeEventListener('storage', syncCart)
  }, [])

  const closeMenu = () => setIsMenuOpen(false)

  return (
    <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#050505ec] text-slate-300 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <NavLink
          className="flex items-center text-lg font-bold tracking-wide"
          to="/"
          onClick={closeMenu}
        >
          <img src="/white one.png" alt="" className="h-12 w-auto" />
          <span>NINJA SKINS</span>
        </NavLink>

        <div className="hidden items-center gap-6 text-sm font-medium lg:flex">
          {links.map(([labelKey, path]) => (
            <NavLink
              key={path}
              to={path}
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

        <div className="hidden items-center gap-3 text-sm font-medium lg:flex">
          {/* Use Link for CTAs; reserve NavLink for active navigation / نستخدم Link لأزرار الإجراء ونبقي NavLink للتنقل النشط */}
          <Link
            to="/collections"
            className="rounded-lg bg-white px-5 py-3 font-bold text-black transition hover:bg-gray-200"
          >
            {t('nav.seeCollections')}
          </Link>
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

      {isMenuOpen && (
        <div
          id="mobile-navigation"
          className="border-t border-white/10 px-4 pb-4 pt-2 lg:hidden sm:px-6"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1 text-sm font-medium">
            {links.map(([labelKey, path]) => (
              <NavLink
                key={path}
                to={path}
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
          </div>
        </div>
      )}
    </nav>
  )
}



export default Nav