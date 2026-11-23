import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDesignCollections } from '../services/apparelService.js';
import { useLanguage } from '../context/LanguageContext.jsx';

const currentYear = new Date().getFullYear();

export default function Footer() {
  const { t } = useLanguage();
  const [collections, setCollections] = useState([]);

  useEffect(() => {
    let cancelled = false;
    const loadCollections = async () => {
      try {
        const { data, error } = await getDesignCollections();
        if (error) throw error;
        if (!cancelled) setCollections(data.slice(0, 5));
      } catch {
        if (!cancelled) setCollections([]);
      }
    };

    loadCollections();
    return () => { cancelled = true; };
  }, []);

  return (
    <footer className="border-t border-white/10 bg-[#040405] px-6 py-14 text-white lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.8fr_1fr_0.9fr]">
          <div>
            <Link to="/" className="mb-5 inline-flex items-center gap-3" aria-label={t('nav.home')}>
              <img src="/ninja-wear-logo.png" alt="" className="h-9 w-auto" />
              <span className="font-bold uppercase tracking-[0.16em]">Ninja Wear</span>
            </Link>
            <p className="max-w-xs text-sm leading-6 text-gray-500">{t('footer.description')}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/collections" className="rounded-md bg-white px-4 py-2.5 text-sm font-bold text-black transition hover:bg-gray-200">{t('nav.seeCollections')}</Link>
              <Link to="/custom" className="rounded-md border border-white/15 px-4 py-2.5 text-sm font-semibold text-white transition hover:border-white/40">{t('home.buildPiece')}</Link>
            </div>
          </div>

          <div>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-gray-400">{t('footer.explore')}</h2>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><Link to="/apparel" className="transition hover:text-white">{t('nav.apparel')}</Link></li>
              <li><Link to="/collections" className="transition hover:text-white">{t('nav.collections')}</Link></li>
              <li><Link to="/custom" className="transition hover:text-white">{t('nav.custom')}</Link></li>
              <li><Link to="/cart" className="transition hover:text-white">{t('nav.cart')}</Link></li>
              <li><Link to="/contact-us" className="transition hover:text-white">{t('nav.contact')}</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-gray-400">{t('nav.collections')}</h2>
            {collections.length ? (
              <ul className="space-y-3 text-sm text-gray-500">
                {collections.map((collection) => (
                  <li key={collection.collection_name}>
                    <Link to="/collections" state={{ collectionName: collection.collection_name }} className="transition hover:text-red-300">{collection.display_name || collection.collection_name}</Link>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-gray-600">{t('footer.browseDesigns')}</p>}
          </div>

          <div className="border-t border-white/10 pt-6 sm:col-span-2 lg:border-s lg:border-t-0 lg:ps-8 lg:pt-0">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.16em] text-red-300">{t('home.heroKicker')}</p>
            <h2 className="mb-3 text-xl font-bold">{t('footer.helpTitle')}</h2>
            <p className="mb-5 text-sm leading-6 text-gray-500">{t('footer.helpDescription')}</p>
            <Link to="/contact-us" className="text-sm font-bold text-white underline decoration-white/30 underline-offset-4 transition hover:decoration-red-300">{t('footer.talkToTeam')}</Link>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs text-gray-600 sm:flex-row sm:items-center sm:justify-between">
          <p>© {currentYear} Ninja Wear</p>
          <p>{t('footer.tagline')}</p>
        </div>
      </div>
    </footer>
  );
}
