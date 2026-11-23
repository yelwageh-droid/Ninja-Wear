import Hero from "../../componants/HeroHome.jsx";
import FeaturesSection from "../../componants/FeaturesHome.jsx";
import FeaturedCollectionsSection from "../../componants/FeaturedCollectionsHome.jsx";
import { Link } from "react-router-dom";
import { m } from "framer-motion";
import { useLanguage } from "../../context/LanguageContext.jsx";

const Home = () => {
  const { t } = useLanguage();
  return (
    <div>
      <Hero />
        <FeaturesSection />
        <FeaturedCollectionsSection />
          <m.section id="how-it-works" initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.12 }} transition={{ duration: 0.48, ease: "easeOut" }} className="relative py-24 px-6 lg:px-16 bg-[#0a0a0c] border-t border-white/5">
            
            <div className="max-w-7xl mx-auto">
              
              <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
                <h2 className="text-3xl md:text-4xl font-bold text-white tracking-wide uppercase">
                  {t('home.applicationTitle')}
                </h2>
                <p className="text-gray-400 text-sm md:text-base">
                  {t('home.applicationDescription')}
                </p>
              </div>

              <div className="relative">
                
                <div className="hidden md:block absolute top-1/2 inset-s-0 w-full h-px bg-linear-to-r from-transparent via-white/20 to-transparent -translate-y-1/2 z-0"></div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-8 relative z-10">
                  
                  <div className="relative flex flex-col items-center text-center group">
                    <div className="w-16 h-16 rounded-full bg-[#111116] border border-white/10 flex items-center justify-center mb-6 shadow-xl group-hover:border-white/30 transition-colors duration-300 relative z-10">
                      <span className="text-2xl font-bold text-white">01</span>
                      <div className="absolute inset-0 rounded-full bg-white/5 animate-ping opacity-20"></div>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 uppercase tracking-wider">{t('home.stepOneTitle')}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                      {t('home.stepOneDescription')}
                    </p>
                  </div>

                  <div className="relative flex flex-col items-center text-center group">
                    <div className="w-16 h-16 rounded-full bg-[#111116] border border-white/10 flex items-center justify-center mb-6 shadow-xl group-hover:border-red-500/50 transition-colors duration-300 relative z-10">
                      <span className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-red-400 to-red-200">02</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 uppercase tracking-wider">{t('home.stepTwoTitle')}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                      {t('home.stepTwoDescription')}
                    </p>
                  </div>

                  <div className="relative flex flex-col items-center text-center group">
                    <div className="w-16 h-16 rounded-full bg-[#111116] border border-white/10 flex items-center justify-center mb-6 shadow-xl group-hover:border-amber-500/50 transition-colors duration-300 relative z-10">
                      <span className="text-2xl font-bold text-transparent bg-clip-text bg-linear-to-r from-amber-400 to-amber-200">03</span>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-3 uppercase tracking-wider">{t('home.stepThreeTitle')}</h3>
                    <p className="text-gray-500 text-sm leading-relaxed max-w-xs mx-auto">
                      {t('home.stepThreeDescription')}
                    </p>
                  </div>

                </div>
              </div>

              <div className="mt-16 text-center">
                <Link to="/contact-us" className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300 text-white font-medium text-sm">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                  {t('home.askTeam')}
                </Link>
              </div>

            </div>
          </m.section>
    </div>
  );
};

export default Home;
