import { Link, NavLink } from 'react-router-dom'
import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext.jsx'

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