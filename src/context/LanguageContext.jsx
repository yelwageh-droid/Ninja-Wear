import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { translations } from '../data/translations.js';

const LanguageContext = createContext(null);
const languageStorageKey = 'ninja-skins-language';

function readLanguage() {
  try {
    return window.localStorage.getItem(languageStorageKey) === 'ar' ? 'ar' : 'en';
  } catch {
    return 'en';
  }
}

function getTranslation(language, key) {
  return key.split('.').reduce((value, part) => value?.[part], translations[language])
    ?? key.split('.').reduce((value, part) => value?.[part], translations.en)
    ?? key;
}

export function LanguageProvider({ children }) {
  const location = useLocation();
  const isAdminRoute = location.pathname === '/admin' || location.pathname.startsWith('/admin/');
  const [language, setLanguage] = useState(readLanguage);
  const toggleLanguage = () => setLanguage((current) => (current === 'en' ? 'ar' : 'en'));
  const t = (key, values = {}) => Object.entries(values).reduce(
    (message, [name, value]) => message.replaceAll(`{${name}}`, String(value)),
    String(getTranslation(language, key)),
  );
  const formatCurrency = (amount) => new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(Number(amount || 0));
  const formatNumber = (amount) => new Intl.NumberFormat(language === 'ar' ? 'ar-EG' : 'en-EG').format(Number(amount || 0));

  // Keep the document language and direction in sync with the toggle / مزامنة لغة المستند واتجاهه مع زر التبديل
  useEffect(() => {
    const activeLanguage = isAdminRoute ? 'en' : language;
    document.documentElement.dir = activeLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = activeLanguage;
    try {
      window.localStorage.setItem(languageStorageKey, language);
    } catch {
      // The language toggle still works for the current page if storage is unavailable / يظل التبديل فعالاً للصفحة الحالية إذا تعذر التخزين
    }
  }, [isAdminRoute, language]);

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t, formatCurrency, formatNumber }}>
      {children}
    </LanguageContext.Provider>
  );
}

// Keep this consumer hook beside the provider for a single language API / إبقاء hook الاستهلاك بجوار المزود لتوحيد واجهة اللغة
// oxlint-disable-next-line react/only-export-components
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within a LanguageProvider');
  return context;
}
