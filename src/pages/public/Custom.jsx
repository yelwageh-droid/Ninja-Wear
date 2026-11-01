import { useEffect, useState } from 'react';
import { m } from 'framer-motion';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { getCollectionSkins, getCollections, getLaptops } from '../../data/catalog.js';
import { createCartItemId, readCart, writeCart } from '../../data/cart.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

const designLayoutId = (collectionName, fileName) => `skin-art:${collectionName}:${fileName}`;

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, dataUrl: reader.result });
    reader.onerror = () => reject(new Error('This image could not be read.'));
    reader.readAsDataURL(file);
  });
}

// TODO: Fetch from Supabase 'AVL_Coverage' later / سيتم جلب البيانات من جدول AVL_Coverage لاحقاً
const coverageOptions = [
  { id: 'top', name: 'Top cover', translationKey: 'custom.coverageTop', price: 350 },
  { id: 'top-palm', name: 'Top + palm rest', translationKey: 'custom.coverageTopPalm', price: 450 },
  { id: 'full', name: 'Full body', translationKey: 'custom.coverageFull', price: 600 },
];

export default function Custom() {
  const { t, formatCurrency } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [savedCart] = useState(readCart);
  const editingCartItemId = searchParams.get('edit');
  const editingCartItem = savedCart.items.find((item) => item.id === editingCartItemId);
  const savedDraft = searchParams.get('new') === '1' ? {} : editingCartItem || {};
  const incomingSkin = location.state?.selectedSkin;
  const [laptops, setLaptops] = useState([]);
  const [collections, setCollections] = useState([]);
  const [skins, setSkins] = useState(() => incomingSkin && searchParams.get('collection') ? [incomingSkin] : []);
  const [selectedLaptopId, setSelectedLaptopId] = useState(() => searchParams.get('laptop') || '');
  const [selectedCollection, setSelectedCollection] = useState(() => searchParams.get('collection') || savedDraft.collectionName || '');
  const [selectedDesign, setSelectedDesign] = useState(() => searchParams.get('design') || incomingSkin?.fileName || savedDraft.fileName || '');
  const [selectedCoverage, setSelectedCoverage] = useState(() => coverageOptions.find((option) => option.id === savedDraft.coverageId) || coverageOptions[0]);
  const [designMode, setDesignMode] = useState(() => savedDraft.designMode || 'our');
  const [customLaptopBrand, setCustomLaptopBrand] = useState(() => savedDraft.customLaptopBrand || '');
  const [customLaptopSeries, setCustomLaptopSeries] = useState(() => savedDraft.customLaptopSeries || '');
  const [customLaptopModel, setCustomLaptopModel] = useState(() => savedDraft.customLaptopModel || '');
  const [customArtwork, setCustomArtwork] = useState(() => savedDraft.customArtwork || null);
  // Persist the logo choice as an enum, independent of design-preview rendering / حفظ اختيار الشعار كقيمة مستقلة عن معاينة التصميم
  const [logoChoice, setLogoChoice] = useState(() => savedDraft.logoChoice || (savedDraft.logoCutout ? 'with-cut' : 'without-cut'));
  const [logoLocation, setLogoLocation] = useState(() => savedDraft.logoLocation || 'center');
  const [otherLogoLocation, setOtherLogoLocation] = useState(() => savedDraft.otherLogoLocation || '');
  const [customLogo, setCustomLogo] = useState(() => savedDraft.customLogo || null);
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadedSkinsCollection, setLoadedSkinsCollection] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [artworkError, setArtworkError] = useState('');
  const [logoError, setLogoError] = useState('');

  useEffect(() => {
    let cancelled = false;

    Promise.all([getLaptops(), getCollections()]).then(([laptopResult, collectionResult]) => {
      if (cancelled) return;
      if (laptopResult.error || collectionResult.error) {
        setError('custom.catalogError');
      }
      setLaptops(laptopResult.data);
      setCollections(collectionResult.data);
      const urlParams = new URLSearchParams(window.location.search);
      const requestedLaptopId = urlParams.get('laptop');
      const requestedCollection = urlParams.get('collection');
      if (requestedLaptopId && laptopResult.data.some((laptop) => String(laptop.id) === requestedLaptopId)) {
        setSelectedLaptopId(requestedLaptopId);
      }
      setSelectedCollection((current) => (
        requestedCollection && collectionResult.data.some((collection) => collection.name === requestedCollection)
          ? requestedCollection
          : collectionResult.data.some((collection) => collection.name === current)
          ? current
          : collectionResult.data[0]?.name || ''
      ));
      setLoadingCatalog(false);
    });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedCollection) return undefined;

    let cancelled = false;
    getCollectionSkins(selectedCollection).then(({ data, error: skinError }) => {
      if (cancelled) return;
      if (skinError) setError('custom.designsError');
      setSkins(data);
      setSelectedDesign((current) => (
        data.some((skin) => skin.fileName === current)
          ? current
          : data[0]?.fileName || ''
      ));
      setLoadedSkinsCollection(selectedCollection);
    });

    return () => { cancelled = true; };
  }, [selectedCollection]);

  const selectedLaptop = laptops.find((laptop) => String(laptop.id) === selectedLaptopId);
  const currentDesign = skins.find((skin) => skin.fileName === selectedDesign);
  const loadingSkins = Boolean(selectedCollection) && loadedSkinsCollection !== selectedCollection;
  const totalPrice = Number(selectedLaptop?.base_price || 0) + selectedCoverage.price;
  const isCustomLaptop = Boolean(selectedLaptop?.is_custom_request);
  const hasSelectedDesign = designMode === 'our' ? Boolean(currentDesign) : Boolean(customArtwork);
  const needsLogoPlacement = logoChoice === 'custom-logo' || logoChoice === 'our-logo';

  const updateQuery = (updates) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) nextParams.set(key, value);
      else nextParams.delete(key);
    });
    setSearchParams(nextParams, { replace: true });
  };

  const handleLaptopChange = (event) => {
    const laptopId = event.target.value;
    setSelectedLaptopId(laptopId);
    updateQuery({ laptop: laptopId });
  };

  const handleCollectionChange = (collectionName) => {
    setSelectedCollection(collectionName);
    setSelectedDesign('');
    updateQuery({ collection: collectionName, design: '' });
  };

  const handleDesignChange = (fileName) => {
    setSelectedDesign(fileName);
    updateQuery({ design: fileName });
  };

  const handleImageUpload = async (event, setImage, setFileError) => {
    const input = event.currentTarget;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setFileError('custom.chooseImage');
      return;
    }
    if (file.size > 1024 * 1024) {
      setFileError('custom.imageTooLarge');
      return;
    }

    try {
      setImage(await readImageFile(file));
      setFileError('');
    } catch {
      setFileError('custom.readImageError');
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!selectedLaptop || !hasSelectedDesign || (isCustomLaptop && (!customLaptopBrand.trim() || !customLaptopSeries.trim() || !customLaptopModel.trim()))) return;
    if (logoChoice === 'custom-logo' && !customLogo) return;
    if (needsLogoPlacement && logoLocation === 'other' && !otherLogoLocation.trim()) return;

    const cartItem = {
        id: editingCartItemId || createCartItemId(),
        laptopId: selectedLaptop.id,
        laptopBrand: isCustomLaptop ? customLaptopBrand.trim() : selectedLaptop.brand,
        laptopSeries: isCustomLaptop ? customLaptopSeries.trim() : selectedLaptop.series,
        laptopModel: isCustomLaptop ? customLaptopModel.trim() : selectedLaptop.models.join(', '),
        customLaptopBrand,
        customLaptopSeries,
        customLaptopModel,
        designMode,
        collectionName: selectedCollection,
        collectionDisplayName: collections.find((collection) => collection.name === selectedCollection)?.displayName || selectedCollection,
        fileName: designMode === 'our' ? currentDesign?.fileName : '',
        skinDesign: designMode === 'our' ? currentDesign?.name || currentDesign?.fileName : `Custom upload: ${customArtwork.name}`,
        designImage: designMode === 'our' ? currentDesign?.image || '' : customArtwork.dataUrl,
        customArtwork: designMode === 'custom' ? customArtwork : null,
        coverageId: selectedCoverage.id,
        coverageType: selectedCoverage.name,
        logoChoice,
        logoLocation: needsLogoPlacement ? logoLocation : '',
        otherLogoLocation: needsLogoPlacement && logoLocation === 'other' ? otherLogoLocation : '',
        customLogo: logoChoice === 'custom-logo' ? customLogo : null,
        totalPrice,
      };

    try {
      const cart = readCart();
      const itemExists = cart.items.some((item) => item.id === cartItem.id);
      const items = itemExists
        ? cart.items.map((item) => item.id === cartItem.id ? cartItem : item)
        : [...cart.items, cartItem];
      writeCart({ ...cart, items });
      navigate('/cart');
    } catch {
      setNotice('custom.saveError');
    }
  };

  return (
    <main className="min-h-screen bg-[#070709] px-5 py-12 text-white sm:px-8 lg:px-14">
      <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[1.25fr_0.75fr]">
        <section>
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-red-400">{t('custom.eyebrow')}</p>
          <h1 className="mb-4 text-3xl font-extrabold uppercase md:text-5xl">{t('custom.title')}</h1>
          <p className="mb-10 max-w-2xl text-gray-400">{t('custom.description')}</p>

          {error && <p role="alert" className="mb-6 border-s-2 border-red-400 ps-3 text-sm text-red-200">{t(error)}</p>}

          <form onSubmit={handleSubmit} className="space-y-10">
            <section>
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-red-400/40 bg-red-400/10 text-sm font-bold text-red-300">1</span>
                <h2 className="text-lg font-bold uppercase">{t('custom.stepDevice')}</h2>
              </div>
              <label className="sr-only" htmlFor="laptop">{t('custom.deviceLabel')}</label>
              <select
                id="laptop"
                value={selectedLaptopId}
                onChange={handleLaptopChange}
                disabled={loadingCatalog || !laptops.length}
                className="w-full rounded-lg border border-white/10 bg-[#111116] px-4 py-4 text-white outline-none transition focus:border-red-400 disabled:opacity-60"
                required
              >
                <option value="">{loadingCatalog ? t('custom.loadingDevices') : t('custom.chooseDevice')}</option>
                {laptops.map((laptop) => (
                  <option key={laptop.id} value={laptop.id}>{laptop.is_custom_request ? t('custom.customRequest') : `${laptop.brand} ${laptop.series}${laptop.models.length ? ` · ${laptop.models.join(', ')}` : ''}`}</option>
                ))}
              </select>
              {selectedLaptop && <p className="mt-2 text-sm text-gray-500">{t('custom.startingPrice', { price: formatCurrency(selectedLaptop.base_price) })}</p>}
              {!loadingCatalog && !laptops.length && <p className="mt-2 text-sm text-gray-400">{t('custom.noDevices')}</p>}
              {isCustomLaptop && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium text-gray-300">
                    {t('custom.brand')}
                    <input value={customLaptopBrand} onChange={(event) => setCustomLaptopBrand(event.target.value)} required className="mt-2 w-full rounded-lg border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-400" placeholder={t('custom.brandPlaceholder')} />
                  </label>
                  <label className="text-sm font-medium text-gray-300">
                    {t('custom.series')}
                    <input value={customLaptopSeries} onChange={(event) => setCustomLaptopSeries(event.target.value)} required className="mt-2 w-full rounded-lg border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-400" placeholder={t('custom.seriesPlaceholder')} />
                  </label>
                  <label className="text-sm font-medium text-gray-300">
                    {t('custom.model')}
                    <input value={customLaptopModel} onChange={(event) => setCustomLaptopModel(event.target.value)} required className="mt-2 w-full rounded-lg border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-400" placeholder={t('custom.modelPlaceholder')} />
                  </label>
                </div>
              )}
            </section>

            <section>
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-red-400/40 bg-red-400/10 text-sm font-bold text-red-300">2</span>
                <h2 className="text-lg font-bold uppercase">{t('custom.stepDesign')}</h2>
              </div>
              <div className="mb-5 grid grid-cols-2 rounded-lg border border-white/10 bg-[#111116] p-1">
                {[
                  { id: 'our', label: t('custom.ourDesigns') },
                  { id: 'custom', label: t('custom.customDesign') },
                ].map((option) => (
                  <button key={option.id} type="button" onClick={() => setDesignMode(option.id)} aria-pressed={designMode === option.id} className={`rounded-md px-3 py-3 text-sm font-bold transition ${designMode === option.id ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
                    {option.label}
                  </button>
                ))}
              </div>
              {designMode === 'our' ? <>
              {loadingCatalog ? <p className="text-sm text-gray-500">{t('custom.loadingCollections')}</p> : (
                <div className="flex flex-wrap gap-2">
                  {collections.map((collection) => (
                    <m.button
                      key={collection.id}
                      type="button"
                      onClick={() => handleCollectionChange(collection.name)}
                      aria-pressed={selectedCollection === collection.name}
                      whileTap={{ scale: 0.96 }}
                      className={`rounded-md border px-4 py-2 text-sm font-semibold transition ${selectedCollection === collection.name ? 'border-white bg-white text-black' : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-white'}`}
                    >
                      {collection.displayName || collection.name}
                    </m.button>
                  ))}
                </div>
              )}
              <m.div
                key={loadingSkins ? `loading-${selectedCollection}` : selectedCollection}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3"
              >
                  {loadingSkins ? <p className="col-span-full text-sm text-gray-500">{t('custom.loadingDesigns')}</p> : skins.map((skin) => (
                    <m.button
                      key={skin.id}
                      type="button"
                      onClick={() => handleDesignChange(skin.fileName)}
                      aria-pressed={selectedDesign === skin.fileName}
                      whileHover={{ y: -3 }}
                      whileTap={{ scale: 0.98 }}
                      className={`overflow-hidden rounded-lg border text-start transition ${selectedDesign === skin.fileName ? 'border-red-400 ring-1 ring-red-400' : 'border-white/10 hover:border-white/30'}`}
                    >
                      <img src={skin.image} alt={skin.name} loading="lazy" className="aspect-square w-full object-cover" />
                      <span className="block truncate px-3 py-2 text-sm text-gray-200">{skin.name}</span>
                    </m.button>
                  ))}
                  {!loadingSkins && selectedCollection && !skins.length && <p className="col-span-full text-sm text-gray-500">{t('custom.noDesigns')}</p>}
              </m.div>
              </> : (
                <div className="rounded-lg border border-dashed border-white/20 bg-[#111116] p-5">
                  <label className="block text-sm font-semibold text-gray-200" htmlFor="custom-artwork">{t('custom.uploadDesign')}</label>
                  <input id="custom-artwork" type="file" accept="image/*" onChange={(event) => handleImageUpload(event, setCustomArtwork, setArtworkError)} className="mt-3 block w-full text-sm text-gray-400 file:me-4 file:rounded-md file:border-0 file:bg-white file:px-4 file:py-2 file:font-bold file:text-black" />
                  {customArtwork && <div className="mt-4 flex items-center gap-4"><img src={customArtwork.dataUrl} alt={customArtwork.name} className="h-20 w-20 rounded-md object-cover" /><span className="min-w-0 flex-1 truncate text-sm text-gray-300">{customArtwork.name}</span><button type="button" onClick={() => setCustomArtwork(null)} className="text-sm text-red-300 hover:text-red-200">{t('custom.remove')}</button></div>}
                  <p className="mt-3 text-xs leading-5 text-gray-500">{t('custom.imageKeptLocal')}</p>
                </div>
              )}
              {designMode === 'custom' && artworkError && <p role="alert" className="mt-3 text-sm text-red-300">{t(artworkError)}</p>}
            </section>

            <section>
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-red-400/40 bg-red-400/10 text-sm font-bold text-red-300">3</span>
                <h2 className="text-lg font-bold uppercase">{t('custom.stepCoverage')}</h2>
              </div>
              <div className="space-y-2">
                {coverageOptions.map((option) => (
                  <label key={option.id} className={`flex cursor-pointer items-center justify-between rounded-lg border px-4 py-4 transition ${selectedCoverage.id === option.id ? 'border-red-400/70 bg-red-400/5' : 'border-white/10 bg-[#111116] hover:border-white/25'}`}>
                    <span className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="coverage"
                        value={option.id}
                        checked={selectedCoverage.id === option.id}
                        onChange={() => setSelectedCoverage(option)}
                        className="accent-red-400"
                      />
                      <span className="font-medium">{t(option.translationKey)}</span>
                    </span>
                    <span className="text-sm font-bold text-red-300">+{formatCurrency(option.price)}</span>
                  </label>
                ))}
              </div>
            </section>

            <section>
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-red-400/40 bg-red-400/10 text-sm font-bold text-red-300">4</span>
                <h2 className="text-lg font-bold uppercase">{t('custom.stepLogo')}</h2>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {[
                  { id: 'with-cut', label: t('custom.withCut') },
                  { id: 'without-cut', label: t('custom.withoutCut') },
                  { id: 'custom-logo', label: t('custom.customLogo') },
                  { id: 'our-logo', label: t('custom.ourLogo') },
                ].map((option) => (
                  <label key={option.id} className={`flex cursor-pointer items-center gap-3 rounded-lg border px-4 py-4 transition ${logoChoice === option.id ? 'border-red-400/70 bg-red-400/5' : 'border-white/10 bg-[#111116] hover:border-white/25'}`}>
                    <input type="radio" name="logo-choice" value={option.id} checked={logoChoice === option.id} onChange={() => setLogoChoice(option.id)} className="accent-red-400" />
                    <span className="font-medium">{option.label}</span>
                  </label>
                ))}
              </div>
              {logoChoice === 'custom-logo' && (
                <div className="mt-4 rounded-lg border border-white/10 bg-[#111116] p-4">
                  <label className="block text-sm font-semibold text-gray-200" htmlFor="custom-logo-file">{t('custom.uploadLogo')}</label>
                  <input id="custom-logo-file" type="file" accept="image/*" onChange={(event) => handleImageUpload(event, setCustomLogo, setLogoError)} className="mt-3 block w-full text-sm text-gray-400 file:me-4 file:rounded-md file:border-0 file:bg-white file:px-4 file:py-2 file:font-bold file:text-black" />
                  {customLogo && <div className="mt-4 flex items-center gap-4"><img src={customLogo.dataUrl} alt={customLogo.name} className="h-16 w-16 rounded-md bg-white/5 object-contain p-2" /><span className="min-w-0 flex-1 truncate text-sm text-gray-300">{customLogo.name}</span><button type="button" onClick={() => setCustomLogo(null)} className="text-sm text-red-300 hover:text-red-200">{t('custom.remove')}</button></div>}
                  <p className="mt-3 text-xs text-gray-500">{t('custom.imageKeptLocal')}</p>
                </div>
              )}
              {needsLogoPlacement && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium text-gray-300">
                    {t('custom.logoPosition')}
                    <select value={logoLocation} onChange={(event) => setLogoLocation(event.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-400">
                      <option value="center">{t('custom.center')}</option>
                      <option value="left">{t('custom.left')}</option>
                      <option value="right">{t('custom.right')}</option>
                      <option value="other">{t('custom.other')}</option>
                    </select>
                  </label>
                  {logoLocation === 'other' && <label className="text-sm font-medium text-gray-300">{t('custom.describePosition')}<input value={otherLogoLocation} onChange={(event) => setOtherLogoLocation(event.target.value)} required className="mt-2 w-full rounded-lg border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-400" placeholder={t('custom.positionPlaceholder')} /></label>}
                </div>
              )}
              {logoChoice === 'custom-logo' && logoError && <p role="alert" className="mt-3 text-sm text-red-300">{t(logoError)}</p>}
            </section>

            <button
              type="submit"
              disabled={!selectedLaptop || !hasSelectedDesign || (isCustomLaptop && (!customLaptopBrand.trim() || !customLaptopSeries.trim() || !customLaptopModel.trim())) || (logoChoice === 'custom-logo' && !customLogo) || (needsLogoPlacement && logoLocation === 'other' && !otherLogoLocation.trim())}
              className="w-full rounded-lg bg-white px-5 py-4 font-bold uppercase text-black transition hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {t(editingCartItemId ? 'custom.updateCartItem' : 'custom.addToCart')}
            </button>
            {notice && <p role="status" className="text-sm text-amber-200">{t(notice)}</p>}
            <p className="text-xs leading-5 text-gray-500">{t('custom.cartHint')}</p>
            <Link to="/contact-us" className="inline-flex text-sm font-semibold text-gray-300 underline decoration-white/25 underline-offset-4 transition hover:text-white hover:decoration-white">{t('custom.contactFit')}</Link>
          </form>
        </section>

        <aside className="h-fit border-t border-white/10 pt-8 lg:sticky lg:top-28 lg:border-t-0 lg:pt-0">
          <p className="mb-5 text-xs font-bold uppercase tracking-[0.18em] text-gray-500">{t('custom.selectionTitle')}</p>
          <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0e0e11]">
            {designMode === 'custom' && customArtwork ? (
              <div className="aspect-4/3 overflow-hidden"><img src={customArtwork.dataUrl} alt="Your uploaded design preview" className="h-full w-full object-contain" /></div>
            ) : designMode === 'our' && currentDesign ? (
              <m.div layoutId={designLayoutId(selectedCollection, currentDesign.fileName)} className="aspect-4/3 overflow-hidden">
                <img src={currentDesign.image} alt={`${currentDesign.name} design preview`} className="h-full w-full object-cover" />
              </m.div>
            ) : (
              <div className="flex aspect-4/3 items-center justify-center bg-[#111116] text-sm text-gray-600">{t('custom.noDesignPreview')}</div>
            )}
            <div className="space-y-4 p-5">
              <div>
                <p className="text-lg font-bold">{designMode === 'custom' ? customArtwork?.name || t('custom.uploadDesign') : currentDesign?.name || t('custom.noDesignPreview')}</p>
                <p className="text-sm text-gray-500">{designMode === 'custom' ? t('custom.customDesign') : selectedCollection || t('custom.loadingCollections')}</p>
              </div>
              <div className="flex justify-between gap-4 border-t border-white/10 pt-4 text-sm">
                <span className="text-gray-400">{t('custom.device')}</span>
                <span className="text-end">{selectedLaptop ? (isCustomLaptop ? t('custom.customRequest') : `${selectedLaptop.brand} ${selectedLaptop.series}`) : t('custom.notSelected')}</span>
              </div>
              {isCustomLaptop && <>
                <div className="flex justify-between gap-4 text-sm"><span className="text-gray-400">{t('custom.brand')}</span><span className="text-end">{customLaptopBrand || t('custom.notEntered')}</span></div>
                <div className="flex justify-between gap-4 text-sm"><span className="text-gray-400">{t('custom.series')}</span><span className="text-end">{customLaptopSeries || t('custom.notEntered')}</span></div>
                <div className="flex justify-between gap-4 text-sm"><span className="text-gray-400">{t('custom.model')}</span><span className="text-end">{customLaptopModel || t('custom.notEntered')}</span></div>
              </>}
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-gray-400">{t('custom.coverage')}</span>
                <span>{t(selectedCoverage.translationKey)}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-gray-400">{t('custom.logo')}</span>
                <span className="text-end">{t(`custom.${logoChoice === 'with-cut' ? 'withCut' : logoChoice === 'without-cut' ? 'withoutCut' : logoChoice === 'custom-logo' ? 'customLogo' : 'ourLogo'}`)}{needsLogoPlacement ? ` · ${logoLocation === 'other' ? otherLogoLocation : t(`custom.${logoLocation}`)}` : ''}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-4 font-bold">
                <span>{t('custom.estimatedTotal')}</span>
                <span className="text-red-300">{formatCurrency(totalPrice)}</span>
              </div>
            </div>
          </div>
          <p className="mt-4 text-xs leading-relaxed text-gray-600">{t('custom.finalPriceNote')}</p>
        </aside>
      </div>
    </main>
  );
}
