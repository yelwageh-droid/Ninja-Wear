import { m } from "framer-motion";
import { Link } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext.jsx";
import backLaptop from "../assets/Godzilla-removebg-preview.png";
import frontLaptop from "../assets/laptop-removebg-preview.png";

const sparks = [
  { left: "12%", delay: "0s", duration: "5s" },
  { left: "27%", delay: "2.4s", duration: "6s" },
  { left: "41%", delay: "1.2s", duration: "4.5s" },
  { left: "58%", delay: "3.1s", duration: "5.5s" },
  { left: "73%", delay: "0.8s", duration: "6.5s" },
  { left: "88%", delay: "2s", duration: "4.8s" },
];

const Hero = () => {
  const { t } = useLanguage();
  return (
  <section className="relative isolate flex min-h-[calc(100svh-72px)] items-center overflow-hidden bg-[#050505] px-6 py-12 md:px-10 lg:px-16">
    <div className="hero-ambient pointer-events-none absolute inset-0" />

    <div className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-10">
      <m.div
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
        className="order-1 flex flex-col space-y-6 text-center lg:text-start"
      >
        <m.div variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }} className="inline-flex items-center justify-center gap-2 lg:justify-start">
          <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-red-400">
            {t('home.heroKicker')}
          </span>
        </m.div>

        <m.h1 variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }} className="text-3xl font-extrabold leading-tight tracking-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
          <span className="bg-linear-to-r from-red-400 via-red-500 to-amber-400 bg-clip-text text-transparent drop-shadow-sm">
            {t('home.heroTitle')}
          </span>
          <br className="hidden md:block" /> {t('home.heroTitleLineTwo')}
        </m.h1>

        <m.p variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }} className="mx-auto max-w-lg text-base leading-relaxed text-gray-400 md:text-lg lg:mx-0">
          {t('home.heroDescription')}
        </m.p>

        {/* Use standard links for hero calls to action / استخدام روابط عادية لأزرار الدعوة للإجراء في الواجهة */}
        <m.div variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }} className="flex w-full min-w-0 flex-col items-center justify-center gap-4 pt-4 sm:flex-row lg:justify-start">
          <Link to="/collections" className="group relative w-full max-w-full min-w-0 overflow-hidden rounded-xl bg-linear-to-r from-red-500 to-amber-500 px-8 py-4 text-center font-bold text-white shadow-lg shadow-red-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-amber-500/30 sm:w-auto">
            <span className="absolute inset-0 h-full w-full bg-linear-to-r from-amber-500 to-red-500 opacity-0 transition-opacity duration-500 ease-out group-hover:opacity-100" />
            <span className="relative flex items-center justify-center gap-2">
              {t('home.browseDesigns')}
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transform transition-transform ltr:group-hover:translate-x-1 rtl:group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </span>
          </Link>

          <Link to="/custom" className="w-full max-w-full min-w-0 rounded-xl border border-white/10 bg-white/5 px-8 py-4 text-center font-medium text-white transition-all duration-200 hover:border-white/20 hover:bg-white/10 sm:w-auto">
            {t('home.buildSkin')}
          </Link>
        </m.div>
      </m.div>

      <m.div
        initial={{ opacity: 0, scale: 0.97, x: 18 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        transition={{ duration: 0.65, delay: 0.2, ease: 'easeOut' }}
        className="relative order-2 mx-auto flex aspect-[1.08/1] w-full max-w-162.5 items-center justify-center lg:max-w-none"
      >
        <div className="hero-floor-grid pointer-events-none absolute inset-x-[-8%] bottom-0 h-[48%]" />
        <div className="pointer-events-none absolute inset-[8%] rounded-full bg-amber-500/25 blur-[100px]" />

        <div className="pointer-events-none absolute inset-0">
          {sparks.map((spark) => (
            <div
              key={spark.left}
              className="fire-spark absolute bottom-[8%] h-3 w-1 rounded-full bg-amber-300/80 blur-[1px]"
              style={{
                insetInlineStart: spark.left,
                animationDelay: spark.delay,
                animationDuration: spark.duration,
              }}
            />
          ))}
        </div>

        <div className="relative z-10 h-full w-full">
          <img
            src={frontLaptop}
            alt={t('home.heroFrontAlt')}
            className="floating-laptop-back absolute inset-e-[2%] top-[2%] z-10 h-auto w-[62%] object-contain drop-shadow-[0_24px_34px_rgba(239,68,68,0.2)]"
          />
          <img
            src={backLaptop}
            alt={t('home.heroBackAlt')}
            className="floating-laptop-front absolute bottom-[1%] inset-s-0 z-20 h-auto w-[76%] object-contain drop-shadow-[0_28px_38px_rgba(245,158,11,0.3)]"
          />
        </div>
      </m.div>
    </div>
  </section>
  );
};

export default Hero;