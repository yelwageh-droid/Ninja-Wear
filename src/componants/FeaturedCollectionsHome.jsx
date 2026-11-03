import { useEffect, useState } from "react";
import { m } from "framer-motion";
import { NavLink, useNavigate } from "react-router-dom";
import { getCollections, getCollectionSkins } from "../data/catalog.js";
import { useLanguage } from "../context/LanguageContext.jsx";

const CollectionCard = ({ collection, images, onClick }) => {
    const { t } = useLanguage();
  return (
        <m.button
      type="button"
      onClick={() => onClick(collection)}
            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.985 }}
            className="group block relative rounded-2xl bg-[#0e0e11] border border-white/5 hover:border-red-500/50 transition-all duration-500 overflow-hidden text-start"
    >
            <div className="aspect-4/3 bg-linear-to-b from-white/2 to-transparent relative overflow-hidden flex items-center justify-center">
                {images?.[collection.name] ? (
                    <img src={images[collection.name]} alt={`${collection.displayName || collection.name} skin`} className="h-full w-full object-cover transform group-hover:scale-105 transition-transform duration-700 ease-out" />
                ) : (
                    <span className="text-gray-500 text-sm">{images ? t('collections.imageUnavailable') : t('collections.imageLoading')}</span>
                )}
                
            </div>
            <div className="p-6 border-t border-white/5">
                <h3 className="text-lg font-bold text-white uppercase tracking-wide mb-1">{collection.displayName || collection.name}</h3>
                <p className="text-gray-500 text-sm">{collection.description || t('collections.defaultDescription')}</p>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-linear-to-r from-transparent via-gray-400 to-transparent scale-x-0 transition-transform duration-500 group-hover:scale-x-100" />
    </m.button>
  );
};

const FeaturesCollectionsSection = () => {
    const { language, t } = useLanguage();
    const [collections, setCollections] = useState([]);
    const [images, setImages] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const navigate = useNavigate();

    useEffect(() => {
        let cancelled = false;

        const loadFeaturedCollections = async () => {
            const { data, error: queryError } = await getCollections();

            if (queryError) {
                if (!cancelled) {
                    setError('collections.noFolders');
                    setLoading(false);
                }
                return;
            }

            const featuredCollections = data.slice(0, 3);

            if (!cancelled) setCollections(featuredCollections);

            const results = await Promise.all(featuredCollections.map(async (collection) => {
                // Change "skins" here if your Supabase Storage bucket has a different name.
                const { data, error } = await getCollectionSkins(collection.name);

                if (error) {
                    return [collection.name, null];
                }

                const firstImage = data?.[0];
                if (!firstImage) return [collection.name, null];
                return [collection.name, firstImage.image];
            }));

            if (!cancelled) {
                setImages(Object.fromEntries(results));
                setLoading(false);
            }
        };

        loadFeaturedCollections();
        return () => { cancelled = true; };
    }, []);

    return (
        <section id="collections" className="relative py-24 px-6 lg:px-16 bg-[#070709]">
        
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-px bg-linear-to-r from-transparent via-white/10 to-transparent"></div>

        <div className="max-w-7xl mx-auto relative z-10">
            
            <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
            <div className="space-y-3">
                <h2 className="text-3xl md:text-4xl font-bold text-white tracking-wide uppercase">
                {t('home.collectionsHeading')}
                </h2>
                <p className="text-gray-400 text-sm md:text-base max-w-xl">
                {collections.length
                    ? t('home.collectionsDescription', { names: collections.map((collection) => collection.displayName || collection.name).join(language === 'ar' ? '، ' : ', ') })
                    : t('home.collectionsDescriptionFallback')}
                </p>
            </div>
            
            <NavLink to="/collections" className="group flex items-center gap-2 text-sm font-medium text-gray-300 hover:text-white transition-colors border-b border-transparent hover:border-white pb-1">
                {t('home.viewAllCollections')}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 transform transition-transform ltr:group-hover:translate-x-1 rtl:group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
            </NavLink>
            </div>

            {loading ? (
                <p className="py-12 text-center text-gray-400">{t('collections.loadingCollections')}</p>
            ) : error ? (
                <p role="alert" className="py-12 text-center text-red-300">{t(error)}</p>
            ) : collections.length ? (
                <m.div
                    className="grid grid-cols-1 gap-8 md:grid-cols-3"
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, amount: 0.15 }}
                    variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                >
                    {collections.map((collection) => (
                        <CollectionCard
                            key={collection.name}
                            collection={collection}
                            images={images}
                            onClick={(selected) => navigate("/collections", { state: { collectionName: selected.name } })}
                        />
                    ))}
                </m.div>
            ) : (
                <p className="py-12 text-center text-gray-400">{t('collections.noFolders')}</p>
            )}
        </div>
        </section>
    )
} 

export default FeaturesCollectionsSection