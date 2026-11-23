import { m } from "framer-motion";
import { useLanguage } from "../context/LanguageContext.jsx";

const FeaturesSection = () => {
  const { t } = useLanguage();
  return (
<m.section id="features" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.48, ease: "easeOut" }} className="relative py-20 px-6 lg:px-16 overflow-hidden">
  
  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-125 h-125 bg-amber-500/5 rounded-full blur-[180px] pointer-events-none"></div>

  <div className="max-w-7xl mx-auto relative z-10">
    
    <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
      <span className="text-xs font-semibold tracking-wider text-red-400 bg-red-500/10 px-3 py-1.4 rounded-full border border-red-500/20 uppercase inline-block">
        ✦ {t('home.featureEyebrow')}
      </span>
      <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight uppercase">
        {t('home.featureTitle')}
      </h2>
      <p className="text-gray-400 text-sm md:text-base leading-relaxed">
        {t('home.featureDescription')}
      </p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
      
      <div className="group relative bg-white/2 hover:bg-white/4 active:scale-98 border border-white/10 hover:border-red-500/30 rounded-2xl p-6 transition-all duration-300 backdrop-blur-md overflow-hidden flex flex-col justify-between">
        <div className="absolute -top-10 -inset-e-10 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all duration-500"></div>
        <div className="space-y-4">
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 group-hover:scale-110 group-hover:border-red-400 transition-all duration-300">
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors uppercase">{t('home.feature1Title')}</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            {t('home.feature1Desc')}
          </p>
        </div>
      </div>

      <div className="group relative bg-white/2 hover:bg-white/4 active:scale-98 border border-white/10 hover:border-amber-500/30 rounded-2xl p-6 transition-all duration-300 backdrop-blur-md overflow-hidden flex flex-col justify-between">
        <div className="absolute -top-10 -inset-e-10 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-500"></div>
        <div className="space-y-4">
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-110 group-hover:border-amber-400 transition-all duration-300">
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors uppercase">{t('home.feature2Title')}</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            {t('home.feature2Desc')}
          </p>
        </div>
      </div>

      <div className="group relative bg-white/2 hover:bg-white/4 active:scale-98 border border-white/10 hover:border-red-500/30 rounded-2xl p-6 transition-all duration-300 backdrop-blur-md overflow-hidden flex flex-col justify-between">
        <div className="absolute -top-10 -inset-e-10 w-24 h-24 bg-red-500/10 rounded-full blur-2xl group-hover:bg-red-500/20 transition-all duration-500"></div>
        <div className="space-y-4">
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 group-hover:scale-110 group-hover:border-red-400 transition-all duration-300">
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white group-hover:text-red-400 transition-colors uppercase">{t('home.feature3Title')}</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            {t('home.feature3Desc')}
          </p>
        </div>
      </div>

      <div className="group relative bg-white/2 hover:bg-white/4 active:scale-98 border border-white/10 hover:border-amber-500/30 rounded-2xl p-6 transition-all duration-300 backdrop-blur-md overflow-hidden flex flex-col justify-between">
        <div className="absolute -top-10 -inset-e-10 w-24 h-24 bg-amber-500/10 rounded-full blur-2xl group-hover:bg-amber-500/20 transition-all duration-500"></div>
        <div className="space-y-4">
          <div className="w-12 h-12 flex items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 group-hover:scale-110 group-hover:border-amber-400 transition-all duration-300">
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <h3 className="text-xl font-bold text-white group-hover:text-amber-400 transition-colors uppercase">{t('home.feature4Title')}</h3>
          <p className="text-gray-400 text-sm leading-relaxed">
            {t('home.feature4Desc')}
          </p>
        </div>
      </div>


    </div>

  </div>
</m.section>
  )}

  export default FeaturesSection