import { m } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getApparelProducts } from '../../services/apparelService.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

export default function Apparel() {
  const { t, formatCurrency } = useLanguage();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadProducts = async () => {
      const { data, error: queryError } = await getApparelProducts();
      if (cancelled) return;
      if (queryError) {
        setError('apparel.loadError');
      } else {
        setProducts(data);
      }
      setLoading(false);
    };

    loadProducts();
    return () => { cancelled = true; };
  }, []);

  const standardProducts = products.filter((p) => !p.is_custom_request);
  const customRequestProducts = products.filter((p) => p.is_custom_request);

  return (
    <div className="min-h-screen bg-[#0A0A0A] py-24 px-6 lg:px-16 relative text-white">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-16 text-center md:text-start">
        <h1 className="text-3xl md:text-5xl font-extrabold uppercase tracking-wide mb-4">
          {t('apparel.title')}
        </h1>
        <p className="text-gray-400 max-w-2xl">
          {t('apparel.subtitle')}
        </p>
      </div>

      {loading ? (
        <p className="mx-auto max-w-7xl py-12 text-center text-gray-400">{t('apparel.loadingGarments')}</p>
      ) : error ? (
        <p role="alert" className="mx-auto max-w-7xl py-12 text-center text-red-300">{t(error)}</p>
      ) : (
        <m.div
          className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.07 } } }}
        >
          {/* Standard Products */}
          {standardProducts.map((product) => (
            <m.article
              key={product.id}
              variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
              whileHover={{ y: -4 }}
              className="group flex flex-col bg-[#111116] border border-white/5 hover:border-red-500/30 rounded-2xl overflow-hidden transition-all duration-300"
            >
              <div className="aspect-square bg-[#1A1A1E] p-8 flex items-center justify-center relative">
                <img
                  src={product.image_url || undefined}
                  alt={`${product.category} ${product.fit_type}`}
                  loading="lazy"
                  onError={(event) => { event.currentTarget.style.opacity = '0'; }}
                  className="h-full w-full object-contain rounded-xl transform group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-s-4 top-4">
                  <span className="px-2 py-1 bg-black/70 text-red-300 text-xs font-bold uppercase rounded tracking-wider border border-white/5">
                    {product.category}
                  </span>
                </div>
              </div>

              <div className="p-6 flex flex-col grow">
                <h3 className="text-xl font-bold text-white mb-2">{product.fit_type}</h3>

                <div className="flex flex-wrap gap-2 mb-4">
                  {(product.sizes || []).map((size) => (
                    <span key={size} className="text-xs text-gray-400 bg-black/50 px-2 py-1 rounded border border-white/10">
                      {size}
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2 mb-6">
                  {(product.colors || []).map((color) => (
                    <span key={color} className="text-xs text-gray-400 bg-black/50 px-2 py-1 rounded border border-white/10">
                      {color}
                    </span>
                  ))}
                </div>

                <div className="mt-auto flex items-center justify-between pt-4 border-t border-white/5">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">{t('apparel.startingAt')}</p>
                    <p className="text-red-400 font-bold">{formatCurrency(product.base_price)}</p>
                  </div>
                  <button
                    type="button"
                    aria-label={t('apparel.customize', { fit_type: product.fit_type })}
                    onClick={() => navigate(`/custom?garment=${encodeURIComponent(product.id)}`)}
                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white group-hover:bg-red-500 group-hover:text-black transition-colors"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            </m.article>
          ))}

          {/* Custom Request Products */}
          {customRequestProducts.map((product) => (
            <m.article
              key={product.id}
              variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
              whileHover={{ y: -4 }}
              className="group flex flex-col overflow-hidden rounded-2xl border border-red-400/25 bg-[#111116] transition-all duration-300 hover:border-red-400/60"
            >
              <div className="flex aspect-square flex-col justify-between bg-[radial-gradient(circle_at_top_right,rgba(248,113,113,0.16),transparent_55%),#0e0e11] p-7">
                <span className="w-fit rounded border border-red-300/25 bg-red-300/10 px-2 py-1 text-xs font-bold uppercase tracking-wider text-red-200">
                  {t('apparel.customFit')}
                </span>
                <div>
                  <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-gray-500">{t('apparel.notListed')}</p>
                  <h2 className="text-2xl font-extrabold text-white">{product.category}</h2>
                  <p className="mt-3 max-w-sm text-sm leading-6 text-gray-400">{product.fit_type}</p>
                </div>
              </div>
              <div className="mt-auto flex items-center justify-between gap-4 p-6">
                <div>
                  <p className="text-xs uppercase tracking-wider text-gray-500">{t('apparel.startingAt')}</p>
                  <p className="font-bold text-red-300">{formatCurrency(product.base_price)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => navigate(`/custom?garment=${encodeURIComponent(product.id)}`)}
                  className="rounded-md bg-white px-4 py-3 text-sm font-bold text-black transition hover:bg-red-200"
                >
                  {t('apparel.requestFit')}
                </button>
              </div>
            </m.article>
          ))}

          {!standardProducts.length && !customRequestProducts.length && (
            <p className="col-span-full py-12 text-center text-gray-400">
              No garments available right now.
            </p>
          )}
        </m.div>
      )}
    </div>
  );
}
