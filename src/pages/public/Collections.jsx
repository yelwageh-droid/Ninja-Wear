import { useEffect, useMemo, useState } from 'react';
import { m } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { getDesignCollections, getCollectionDesigns } from '../../services/apparelService.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

const designLayoutId = (collectionName, fileName) => `design-art:${collectionName}:${fileName}`;

const CollectionCard = ({ collection, info, onClick }) => {
  const { t } = useLanguage();
  return (
    <m.button
      type="button"
      onClick={() => onClick(collection)}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.985 }}
      className="group cursor-pointer rounded-2xl bg-[#111116] border border-white/5 hover:border-red-500/30 transition-all duration-300 overflow-hidden flex flex-col text-start"
    >
      <div className="relative aspect-4/3 w-full overflow-hidden bg-white/5">
        {collection.coverImage && (
          <img src={collection.coverImage} alt={collection.display_name || collection.collection_name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        )}
        {info.badge && <span className="absolute inset-s-4 top-4 rounded bg-black/70 px-3 py-1 text-xs font-bold uppercase text-red-300">{info.badge}</span>}
      </div>
      <div className="p-6 grow flex flex-col justify-between">
        <div>
          <h3 className="text-xl font-bold text-white uppercase tracking-wide mb-2 group-hover:text-red-400 transition-colors">{collection.display_name || collection.collection_name}</h3>
          <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">{info.description || t('collections.defaultDescription')}</p>
        </div>
        <div className="mt-6 flex items-center text-sm font-semibold text-gray-400 group-hover:text-white transition-colors">
          {t('collections.explore')}
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ms-2 transform transition-transform ltr:group-hover:translate-x-1 rtl:group-hover:-translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </m.button>
  );
};

const DesignCard = ({ design, onSelect }) => {
  const { t } = useLanguage();
  return (
    <m.button
      type="button"
      onClick={() => onSelect(design)}
      aria-label={`${t('collections.viewDesign')}: ${design.name}`}
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.985 }}
      className="group cursor-pointer rounded-xl bg-[#0a0a0c] border border-white/5 hover:border-white/20 transition-all duration-300 overflow-hidden text-start"
    >
      <m.div layoutId={designLayoutId(design.collectionName, design.fileName)} className="aspect-square overflow-hidden bg-white/5">
        <img src={design.image} alt={design.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
      </m.div>
      <div className="p-5 flex justify-between items-center bg-[#111116] border-t border-white/5">
        <h4 className="text-base font-bold text-white tracking-wide">{design.name}</h4>
        <span className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white group-hover:bg-white group-hover:text-black transition-colors" aria-hidden="true">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
          </svg>
        </span>
      </div>
    </m.button>
  );
};

export default function CollectionsPage() {
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  // A local override wins only for the current history entry; navigation with new
  // state (for example from the footer) automatically falls back to that state.
  // التعديل المحلي يسري للزيارة الحالية فقط، وأي تنقل بحالة جديدة يستخدم حالتها
  const [selectionOverride, setSelectionOverride] = useState({ key: null, name: null });
  const activeCollectionName = selectionOverride.key === location.key
    ? selectionOverride.name
    : location.state?.collectionName || null;
  const activeCollection = useMemo(
    () => (activeCollectionName ? { collection_name: activeCollectionName } : null),
    [activeCollectionName],
  );
  const selectCollection = (collection) => setSelectionOverride({ key: location.key, name: collection.collection_name });
  const clearCollection = () => setSelectionOverride({ key: location.key, name: null });

  const [collections, setCollections] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [collectionInfo, setCollectionInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadCollectionInfo = async () => {
      const { data, error: infoError } = await getDesignCollections();

      if (infoError) {
        console.error('Could not load collection info:', infoError.message);
        return;
      }

      const infoByName = (data || []).reduce((result, collection) => {
        result[collection.collection_name] = {
          display_name: collection.display_name || collection.collection_name,
          description: collection.description || '',
          badge: collection.badge,
        };
        return result;
      }, {});

      if (!cancelled) setCollectionInfo(infoByName);
    };

    loadCollectionInfo();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadContent = async () => {
      setLoading(true);
      setError('');

      if (!activeCollection) {
        const { data: folders, error: listError } = await getDesignCollections();

        if (listError) {
          if (!cancelled) setError('collections.loadError');
          if (!cancelled) setLoading(false);
          return;
        }

        const collectionEntries = await Promise.all((folders || []).map(async (collection) => {
          const { data: files } = await getCollectionDesigns(collection.collection_name);
          return {
            ...collection,
            collection_name: collection.collection_name,
            display_name: collection.display_name || collection.collection_name,
            coverImage: files[0]?.image || null,
          };
        }));

        if (!cancelled) setCollections(collectionEntries);
      } else {
        const { data: files, error: listError } = await getCollectionDesigns(activeCollection.collection_name);

        if (listError) {
          if (!cancelled) setError('collections.loadError');
        } else {
          const collectionDesigns = files.map((file) => ({
            ...file,
            name: file.name,
            collectionName: activeCollection.collection_name,
          }));
          if (!cancelled) setDesigns(collectionDesigns);
        }
      }

      if (!cancelled) setLoading(false);
    };

    loadContent();
    return () => { cancelled = true; };
  }, [activeCollection]);

  const handleDesignSelect = (design) => {
    navigate(`/custom?collection=${encodeURIComponent(activeCollection.collection_name)}&design=${encodeURIComponent(design.fileName)}`, {
      state: { selectedDesign: design },
    });
  };

  const activeCollectionInfo = activeCollection
    ? collectionInfo[activeCollection.collection_name] || { description: '' }
    : { description: '' };

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-6 py-12 text-white lg:px-16">
      <div className="mx-auto max-w-7xl">
        <div className="mb-12 border-b border-white/10 pb-6">
          <nav className="mb-4 flex text-sm font-medium uppercase tracking-wider text-gray-500">
            <button type="button" className={`hover:text-white transition-colors ${!activeCollection ? 'text-white' : ''}`} onClick={clearCollection}>
              {t('nav.collections')}
            </button>
            {activeCollection && <><span className="mx-2">/</span><span className="text-red-400">{collectionInfo[activeCollection.collection_name]?.display_name || activeCollection.collection_name}</span></>}
          </nav>
          <h1 className="text-3xl font-extrabold uppercase tracking-tight md:text-5xl">
            {!activeCollection ? t('collections.allTitle') : <>{collectionInfo[activeCollection.collection_name]?.display_name || activeCollection.collection_name} <span className="text-gray-500">· {t('collections.series')}</span></>}
          </h1>
          {activeCollection && (
            <p className="mt-4 max-w-2xl text-gray-400">
              {activeCollectionInfo.description || t('collections.defaultDescription')}
              <br />
              <span className="mt-2 inline-block text-xs uppercase text-red-500">{t('collections.selectForGarment')}</span>
            </p>
          )}
        </div>

        {activeCollection && (
          <button type="button" onClick={clearCollection} className="mb-8 flex items-center text-sm font-bold uppercase text-gray-400 transition-colors hover:text-white">
              <svg xmlns="http://www.w3.org/2000/svg" className="me-2 h-4 w-4 rtl:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            {t('collections.back')}
          </button>
        )}

        <m.div
          key={activeCollection ? `collection-${activeCollection.collection_name}` : 'collections'}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
        >
        {loading ? (
          <p className="py-12 text-center text-gray-400">{t(activeCollection ? 'collections.loadingDesigns' : 'collections.loadingCollections')}</p>
        ) : error ? (
          <p role="alert" className="py-12 text-center text-red-300">{t(error)}</p>
        ) : activeCollection ? (
          designs.length ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {designs.map((design) => <DesignCard key={design.id} design={design} onSelect={handleDesignSelect} />)}
            </div>
          ) : <p className="py-12 text-center text-gray-400">{t('collections.noDesigns')}</p>
        ) : collections.length ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {collections.map((collection) => (
              <CollectionCard
                key={collection.collection_name}
                collection={collection}
                info={collectionInfo[collection.collection_name] || { description: '' }}
                onClick={selectCollection}
              />
            ))}
          </div>
        ) : <p className="py-12 text-center text-gray-400">{t('collections.noFolders')}</p>}
        </m.div>
      </div>
    </main>
  );
}
