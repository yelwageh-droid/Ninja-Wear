import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, m } from 'framer-motion';
import { useLanguage } from '../../context/LanguageContext.jsx';

const ToastContext = createContext(null);
const toastDuration = 4200;

// Variant -> icon + accent classes / شكل كل نوع من التنبيهات
const variantStyles = {
  success: { icon: '✓', className: 'border-emerald-400/30 bg-emerald-400/10 text-emerald-200' },
  error: { icon: '!', className: 'border-red-400/40 bg-red-400/10 text-red-200' },
  info: { icon: 'i', className: 'border-white/15 bg-white/5 text-gray-200' },
};

let toastSeed = 0;

export function ToastProvider({ children }) {
  const { t } = useLanguage();
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (variant, message) => {
      if (!message) return;
      toastSeed += 1;
      const id = toastSeed;
      setToasts((current) => [...current, { id, variant, message }]);
      timersRef.current.set(id, setTimeout(() => dismiss(id), toastDuration));
    },
    [dismiss],
  );

  // Clear any pending timers when the provider unmounts / تنظيف المؤقتات عند الإزالة
  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timer) => clearTimeout(timer));
      timers.clear();
    };
  }, []);

  const toast = useMemo(
    () => ({
      success: (message) => push('success', message),
      error: (message) => push('error', message),
      info: (message) => push('info', message),
    }),
    [push],
  );

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-6 end-6 z-[100] flex w-[min(22rem,calc(100vw-3rem))] flex-col gap-3"
      >
        <AnimatePresence initial={false}>
          {toasts.map((item) => {
            const style = variantStyles[item.variant] || variantStyles.info;
            return (
              <m.div
                key={item.id}
                role={item.variant === 'error' ? 'alert' : 'status'}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 shadow-lg shadow-black/40 backdrop-blur ${style.className}`}
              >
                <span
                  aria-hidden="true"
                  className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[0.7rem] font-bold"
                >
                  {style.icon}
                </span>
                <p className="flex-1 text-sm leading-5">{item.message}</p>
                <button
                  type="button"
                  onClick={() => dismiss(item.id)}
                  className="text-xs text-current/70 transition hover:text-current"
                  aria-label={t('ui.dismiss')}
                >
                  ✕
                </button>
              </m.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// Keep the hook beside its provider for a single toast API / إبقاء الـ hook بجوار المزود
// oxlint-disable-next-line react/only-export-components
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context.toast;
}
