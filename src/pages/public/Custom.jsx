import { useEffect, useState } from 'react';
import { m } from 'framer-motion';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import {
  getApparelProducts,
  getDesignCollections,
  getCollectionDesigns,
  getPrintOptions,
  getLogoOptions,
} from '../../services/apparelService.js';
import { createCartItemId, readCart, writeCart } from '../../data/cart.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

const designLayoutId = (collectionName, fileName) => `design-art:${collectionName}:${fileName}`;

function readImageFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve({ name: file.name, dataUrl: reader.result });
    reader.onerror = () => reject(new Error('This image could not be read.'));
    reader.readAsDataURL(file);
  });
}

// Placements offered when `logo_options.allowed_placements` is empty / أماكن الشعار البديلة عند فراغ الحقل في قاعدة البيانات
const defaultLogoPlacements = ['Left Chest', 'Right Chest', 'Left Sleeve', 'Right Sleeve', 'Back Neck'];

// Offline-safe defaults, replaced by live `print_options` / `logo_options` rows once Supabase answers / بدائل محلية تُستبدل ببيانات Supabase عند تحميلها
const defaultPrintOptions = [
  { id: 'front-chest', name: 'Front Chest', description: '', price: 0 },
  { id: 'full-front', name: 'Full Front', description: '', price: 80 },
  { id: 'oversized-back', name: 'Oversized Back', description: '', price: 120 },
];

const defaultLogoOptions = [
  { id: 'none', optionType: 'none', name: 'None', label: 'None', placements: [], price: 0 },
  { id: 'brand_logo', optionType: 'brand_logo', name: 'Brand Logo', label: 'Brand Logo', placements: defaultLogoPlacements, price: 30 },
  { id: 'custom_upload', optionType: 'custom_upload', name: 'Custom Upload', label: 'Custom Upload', placements: defaultLogoPlacements, price: 50 },
];

function mapPrintOption(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    price: Number(row.additional_price || 0),
  };
}

function mapLogoOption(row) {
  const placements = Array.isArray(row.allowed_placements) ? row.allowed_placements.filter(Boolean) : [];
  return {
    // `option_type` keeps the semantic id (`none` / `brand_logo` / `custom_upload`) used across the cart
    id: row.option_type,
    optionType: row.option_type,
    name: row.label || row.option_type,
    label: row.label || row.option_type,
    placements: placements.length ? placements : row.option_type === 'none' ? [] : defaultLogoPlacements,
    price: Number(row.additional_price || 0),
  };
}

export default function Custom() {
  const { t, formatCurrency } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [savedCart] = useState(readCart);
  const editingCartItemId = searchParams.get('edit');
  const editingCartItem = savedCart.items.find((item) => item.id === editingCartItemId);
  const incomingGarment = location.state?.selectedGarment;

  const [garments, setGarments] = useState([]);
  const [collections, setCollections] = useState([]);
  const [printOptions, setPrintOptions] = useState(defaultPrintOptions);
  const [logoOptions, setLogoOptions] = useState(defaultLogoOptions);
  const [designs, setDesigns] = useState(() => incomingGarment && searchParams.get('collection') ? [incomingGarment] : []);
  const [selectedGarmentId, setSelectedGarmentId] = useState(() => searchParams.get('garment') || '');
  const [selectedCollection, setSelectedCollection] = useState(() => searchParams.get('collection') || editingCartItem?.collectionName || '');
  const [selectedDesign, setSelectedDesign] = useState(() => searchParams.get('design') || incomingGarment?.fileName || editingCartItem?.designFileName || '');
  const [selectedDesignMode, setSelectedDesignMode] = useState(() => editingCartItem?.designMode || 'our');
  const [selectedPrint, setSelectedPrint] = useState(() => editingCartItem?.printOption?.id || defaultPrintOptions[0].id);
  const [selectedLogo, setSelectedLogo] = useState(() => editingCartItem?.logoOption?.id || 'none');
  const [logoPlacement, setLogoPlacement] = useState(() => editingCartItem?.logoPlacement || '');
  const [customArtwork, setCustomArtwork] = useState(() => editingCartItem?.customArtwork || null);
  const [customLogo, setCustomLogo] = useState(() => editingCartItem?.customLogo || null);
  const [printNotes, setPrintNotes] = useState(() => editingCartItem?.printNotes || '');
  const [organization, setOrganization] = useState(() => editingCartItem?.bulkDetails?.organization || '');
  const [estimatedQuantity, setEstimatedQuantity] = useState(() => editingCartItem?.bulkDetails?.estimatedQuantity || '');
  const [breakdown, setBreakdown] = useState(() => editingCartItem?.bulkDetails?.breakdown || '');
  const [quantity, setQuantity] = useState(() => editingCartItem?.quantity || 1);
  const [selectedSize, setSelectedSize] = useState(() => editingCartItem?.size || '');
  const [selectedColor, setSelectedColor] = useState(() => editingCartItem?.color || '');
  const [loadingCatalog, setLoadingCatalog] = useState(true);
  const [loadedDesignsCollection, setLoadedDesignsCollection] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [artworkError, setArtworkError] = useState('');
  const [logoError, setLogoError] = useState('');

  useEffect(() => {
    let cancelled = false;

    Promise.all([getApparelProducts(), getDesignCollections(), getPrintOptions(), getLogoOptions()])
      .then(([garmentResult, collectionResult, printResult, logoResult]) => {
        if (cancelled) return;
        if (garmentResult.error || collectionResult.error || printResult.error || logoResult.error) {
          setError('custom.catalogError');
        }
        setGarments(garmentResult.data);
        setCollections(collectionResult.data);

        // Live pricing from print_options / logo_options, defaults stay when the tables are empty / أسعار حية من الجداول مع بقاء البدائل عند فراغها
        const livePrintOptions = printResult.data.map(mapPrintOption);
        if (livePrintOptions.length) {
          setPrintOptions(livePrintOptions);
          setSelectedPrint((current) => (livePrintOptions.some((option) => option.id === current) ? current : livePrintOptions[0].id));
        }

        const liveLogoOptions = logoResult.data.map(mapLogoOption);
        if (liveLogoOptions.length) {
          setLogoOptions(liveLogoOptions);
          setSelectedLogo((current) =>
            liveLogoOptions.some((option) => option.id === current)
              ? current
              : liveLogoOptions.find((option) => option.id === 'none')?.id || liveLogoOptions[0].id
          );
        }

        const urlParams = new URLSearchParams(window.location.search);
        const requestedGarmentId = urlParams.get('garment');
        const requestedCollection = urlParams.get('collection');

        if (requestedGarmentId && garmentResult.data.some((g) => String(g.id) === requestedGarmentId)) {
          setSelectedGarmentId(requestedGarmentId);
        }
        setSelectedCollection((current) =>
          requestedCollection && collectionResult.data.some((c) => c.collection_name === requestedCollection)
            ? requestedCollection
            : collectionResult.data.some((c) => c.collection_name === current)
              ? current
              : collectionResult.data[0]?.collection_name || ''
        );
        setLoadingCatalog(false);
      });

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedCollection) return undefined;

    let cancelled = false;
    getCollectionDesigns(selectedCollection).then(({ data, error: designError }) => {
      if (cancelled) return;
      if (designError) setError('custom.designsError');
      setDesigns(data);
      setSelectedDesign((current) =>
        data.some((design) => design.fileName === current)
          ? current
          : data[0]?.fileName || ''
      );
      setLoadedDesignsCollection(selectedCollection);
    });

    return () => { cancelled = true; };
  }, [selectedCollection]);

  const selectedGarment = garments.find((g) => String(g.id) === selectedGarmentId);
  const currentDesign = designs.find((d) => d.fileName === selectedDesign);
  const loadingDesigns = Boolean(selectedCollection) && loadedDesignsCollection !== selectedCollection;

  const garmentSizes = selectedGarment?.sizes || [];
  const garmentColors = selectedGarment?.colors || [];
  const isCustomRequest = Boolean(selectedGarment?.is_custom_request);

  const printOption = printOptions.find((p) => p.id === selectedPrint) || printOptions[0];
  const logoOption = logoOptions.find((l) => l.id === selectedLogo) || logoOptions[0];
  const logoPlacements = logoOption?.placements || [];
  const needsLogoPlacement = logoPlacements.length > 0;
  const activePlacement = needsLogoPlacement && !logoPlacements.includes(logoPlacement) ? logoPlacements[0] : logoPlacement;
  const isCustomLogoUpload = logoOption?.id === 'custom_upload';

  // When the customer picks "No designs" there is nothing to print, so the print placement is skipped and never charged / عند اختيار "بدون تصميم" يتم تخطي الطباعة وعدم تحميل سعرها
  const hasDesignPrint = selectedDesignMode !== 'none';
  const effectivePrintOption = hasDesignPrint ? printOption : { id: 'none', name: t('custom.none'), description: '', price: 0 };

  const unitPrice =
    Number(selectedGarment?.base_price || 0) +
    effectivePrintOption.price +
    logoOption.price;
  const totalPrice = unitPrice * Number(quantity || 1);

  const hasSelectedDesign =
    selectedDesignMode === 'none'
      ? true
      : selectedDesignMode === 'our'
        ? Boolean(currentDesign)
        : Boolean(customArtwork);

  const updateQuery = (updates) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) nextParams.set(key, value);
      else nextParams.delete(key);
    });
    setSearchParams(nextParams, { replace: true });
  };

  const handleGarmentChange = (event) => {
    const garmentId = event.target.value;
    setSelectedGarmentId(garmentId);
    updateQuery({ garment: garmentId });
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
    if (file.size > 15 * 1024 * 1024) {
      setFileError('custom.imageLimit');
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
    if (!selectedGarment || !hasSelectedDesign || !selectedSize || !selectedColor) return;
    if (isCustomLogoUpload && !customLogo) return;
    if (needsLogoPlacement && !activePlacement) return;
    if (isCustomRequest && (!organization.trim() || !estimatedQuantity.trim())) return;

    const parsedQuantity = Number(quantity);
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < 1 || parsedQuantity > 100) {
      setNotice('custom.invalidQuantity');
      return;
    }

    const cartItem = {
      id: editingCartItemId || createCartItemId(),
      productId: selectedGarment.id,
      category: selectedGarment.category,
      fit_type: selectedGarment.fit_type,
      color: selectedColor,
      size: selectedSize,
      quantity: parsedQuantity,
      base_price: Number(selectedGarment.base_price || 0),
      designMode: selectedDesignMode,
      collectionName: selectedCollection,
      collectionDisplayName: collections.find((c) => c.collection_name === selectedCollection)?.display_name || selectedCollection,
      designName:
        selectedDesignMode === 'our'
          ? currentDesign?.name
          : selectedDesignMode === 'custom'
            ? `Custom upload: ${customArtwork.name}`
            : t('custom.noDesignOption'),
      designFileName: selectedDesignMode === 'our' ? currentDesign?.fileName : '',
      // Catalog designs live in Storage; keep their public URL so cart thumbnails can render.
      // التصميمات الجاهزة موجودة في Storage، لذا نحتفظ برابطها لعرض مصغّر في السلة
      designImageUrl: selectedDesignMode === 'our' ? currentDesign?.image || '' : '',
      customArtwork: selectedDesignMode === 'custom' ? customArtwork : null,
      printOption: effectivePrintOption,
      logoOption: logoOption,
      logoPlacement: needsLogoPlacement ? activePlacement : '',
      customLogo: isCustomLogoUpload ? customLogo : null,
      printNotes: printNotes || '',
      bulkDetails: isCustomRequest ? { organization, estimatedQuantity: Number(estimatedQuantity || 0), breakdown } : undefined,
      unitPrice,
      totalPrice,
      isCustomRequest,
    };

    try {
      const cart = readCart();
      const itemExists = cart.items.some((item) => item.id === cartItem.id);
      const items = itemExists
        ? cart.items.map((item) => (item.id === cartItem.id ? cartItem : item))
        : [...cart.items, cartItem];
      writeCart({ ...cart, items });
      navigate('/cart');
    } catch {
      setNotice('custom.saveError');
    }
  };

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-5 py-12 text-white sm:px-8 lg:px-14">
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
                <h2 className="text-lg font-bold uppercase">{t('custom.stepGarment')}</h2>
              </div>
              <label className="sr-only" htmlFor="garment">{t('custom.garmentLabel')}</label>
              <select
                id="garment"
                value={selectedGarmentId}
                onChange={handleGarmentChange}
                disabled={loadingCatalog || !garments.length}
                className="w-full rounded-lg border border-white/10 bg-[#111116] px-4 py-4 text-white outline-none transition focus:border-red-400 disabled:opacity-60"
                required
              >
                <option value="">{loadingCatalog ? t('custom.loadingGarments') : t('custom.chooseGarment')}</option>
                {garments.map((garment) => (
                  <option key={garment.id} value={garment.id}>
                    {garment.is_custom_request ? t('custom.customRequest') : `${garment.category} · ${garment.fit_type}`}
                  </option>
                ))}
              </select>
              {selectedGarment && (
                <>
                  <p className="mt-2 text-sm text-gray-500">{t('custom.startingPrice', { price: formatCurrency(selectedGarment.base_price) })}</p>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-medium text-gray-300">
                      {t('custom.size')}
                      <select value={selectedSize} onChange={(e) => setSelectedSize(e.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-400" required>
                        <option value="">{t('custom.size')}</option>
                        {garmentSizes.map((size) => <option key={size} value={size}>{size}</option>)}
                      </select>
                    </label>
                    <label className="text-sm font-medium text-gray-300">
                      {t('custom.color')}
                      <select value={selectedColor} onChange={(e) => setSelectedColor(e.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-400" required>
                        <option value="">{t('custom.color')}</option>
                        {garmentColors.map((color) => <option key={color} value={color}>{color}</option>)}
                      </select>
                    </label>
                    <label className="text-sm font-medium text-gray-300">
                      {t('custom.quantity')}
                      <input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} min="1" max="100" className="mt-2 w-full rounded-lg border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-400" />
                    </label>
                  </div>
                  {isCustomRequest && (
                    <div className="mt-4 grid gap-4 sm:grid-cols-2">
                      <label className="text-sm font-medium text-gray-300">
                        {t('custom.organization')}
                        <input value={organization} onChange={(e) => setOrganization(e.target.value)} required className="mt-2 w-full rounded-lg border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-400" placeholder="e.g., Ninja Team" />
                      </label>
                      <label className="text-sm font-medium text-gray-300">
                        {t('custom.estimatedQuantity')}
                        <input type="number" value={estimatedQuantity} onChange={(e) => setEstimatedQuantity(e.target.value)} min="1" required className="mt-2 w-full rounded-lg border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-400" placeholder="e.g., 50" />
                      </label>
                      <label className="text-sm font-medium text-gray-300 sm:col-span-2">
                        {t('custom.breakdown')}
                        <textarea value={breakdown} onChange={(e) => setBreakdown(e.target.value)} rows="3" className="mt-2 w-full resize-y rounded-lg border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-400" placeholder={t('custom.breakdownPlaceholder')} />
                      </label>
                    </div>
                  )}
                </>
              )}
              {!loadingCatalog && !garments.length && <p className="mt-2 text-sm text-gray-400">{t('custom.noGarments')}</p>}
            </section>

            <section>
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-red-400/40 bg-red-400/10 text-sm font-bold text-red-300">2</span>
                <h2 className="text-lg font-bold uppercase">{t('custom.stepDesign')}</h2>
              </div>
              <div className="mb-5 grid grid-cols-3 rounded-lg border border-white/10 bg-[#111116] p-1">
                {[
                  { id: 'our', label: t('custom.ourDesigns') },
                  { id: 'custom', label: t('custom.customDesign') },
                  { id: 'none', label: t('custom.noDesignOption') },
                ].map((option) => (
                  <button key={option.id} type="button" onClick={() => setSelectedDesignMode(option.id)} aria-pressed={selectedDesignMode === option.id} className={`rounded-md px-3 py-3 text-sm font-bold transition ${selectedDesignMode === option.id ? 'bg-white text-black' : 'text-gray-400 hover:text-white'}`}>
                    {option.label}
                  </button>
                ))}
              </div>
              {selectedDesignMode === 'our' ? (
                <>
                  {loadingCatalog ? (
                    <p className="text-sm text-gray-500">{t('custom.loadingCollections')}</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {collections.map((collection) => (
                        <m.button
                          key={collection.collection_name}
                          type="button"
                          onClick={() => handleCollectionChange(collection.collection_name)}
                          aria-pressed={selectedCollection === collection.collection_name}
                          whileTap={{ scale: 0.96 }}
                          className={`rounded-md border px-4 py-2 text-sm font-semibold transition ${selectedCollection === collection.collection_name ? 'border-white bg-white text-black' : 'border-white/10 text-gray-400 hover:border-white/30 hover:text-white'}`}
                        >
                          {collection.display_name || collection.collection_name}
                        </m.button>
                      ))}
                    </div>
                  )}
                  <m.div
                    key={loadingDesigns ? `loading-${selectedCollection}` : selectedCollection}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                    className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3"
                  >
                    {loadingDesigns ? (
                      <p className="col-span-full text-sm text-gray-500">{t('custom.loadingDesigns')}</p>
                    ) : (
                      designs.map((design) => (
                        <m.button
                          key={design.id}
                          type="button"
                          onClick={() => handleDesignChange(design.fileName)}
                          aria-pressed={selectedDesign === design.fileName}
                          whileHover={{ y: -3 }}
                          whileTap={{ scale: 0.98 }}
                          className={`overflow-hidden rounded-lg border text-start transition ${selectedDesign === design.fileName ? 'border-red-400 ring-1 ring-red-400' : 'border-white/10 hover:border-white/30'}`}
                        >
                          <img src={design.image} alt={design.name} loading="lazy" className="aspect-square w-full object-cover" />
                          <span className="block truncate px-3 py-2 text-sm text-gray-200">{design.name}</span>
                        </m.button>
                      ))
                    )}
                    {!loadingDesigns && selectedCollection && !designs.length && <p className="col-span-full text-sm text-gray-500">{t('custom.noDesigns')}</p>}
                  </m.div>
                </>
              ) : selectedDesignMode === 'custom' ? (
                <div className="rounded-lg border border-dashed border-white/20 bg-[#111116] p-5">
                  <label className="block text-sm font-semibold text-gray-200" htmlFor="custom-artwork">{t('custom.uploadDesign')}</label>
                  <input id="custom-artwork" type="file" accept="image/*" onChange={(event) => handleImageUpload(event, setCustomArtwork, setArtworkError)} className="mt-3 block w-full text-sm text-gray-400 file:me-4 file:rounded-md file:border-0 file:bg-white file:px-4 file:py-2 file:font-bold file:text-black" />
                  {customArtwork && (
                    <div className="mt-4 flex items-center gap-4">
                      <img src={customArtwork.dataUrl} alt={customArtwork.name} className="h-20 w-20 rounded-md object-cover" />
                      <span className="min-w-0 flex-1 truncate text-sm text-gray-300">{customArtwork.name}</span>
                      <button type="button" onClick={() => setCustomArtwork(null)} className="text-sm text-red-300 hover:text-red-200">{t('custom.remove')}</button>
                    </div>
                  )}
                  <p className="mt-3 text-xs leading-5 text-gray-500">{t('custom.imageTip')}</p>
                  <p className="mt-1 text-xs leading-5 text-gray-500">{t('custom.imageKeptLocal')}</p>
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-white/20 bg-[#111116] p-5">
                  <p className="text-sm font-semibold text-gray-200">{t('custom.noDesignOption')}</p>
                  <p className="mt-2 text-xs leading-5 text-gray-500">{t('custom.noDesignHint')}</p>
                </div>
              )}
              {selectedDesignMode === 'custom' && artworkError && <p role="alert" className="mt-3 text-sm text-red-300">{t(artworkError)}</p>}
            </section>

            {hasDesignPrint && (
              <section>
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full border border-red-400/40 bg-red-400/10 text-sm font-bold text-red-300">3</span>
                  <h2 className="text-lg font-bold uppercase">{t('custom.stepPrint')}</h2>
                </div>
                <div className="space-y-2">
                  {printOptions.map((option) => (
                    <label key={option.id} className={`flex cursor-pointer items-start justify-between gap-4 rounded-lg border px-4 py-4 transition ${selectedPrint === option.id ? 'border-red-400/70 bg-red-400/5' : 'border-white/10 bg-[#111116] hover:border-white/25'}`}>
                      <span className="flex flex-col gap-1">
                        <span className="flex items-center gap-3">
                          <input type="radio" name="print" value={option.id} checked={selectedPrint === option.id} onChange={() => setSelectedPrint(option.id)} className="accent-red-400" />
                          <span className="font-medium">{option.name}</span>
                        </span>
                        {option.description && <span className="ps-7 text-xs leading-5 text-gray-500">{option.description}</span>}
                      </span>
                      <span className="shrink-0 text-sm font-bold text-red-300">{option.price > 0 ? `+${formatCurrency(option.price)}` : t('custom.included')}</span>
                    </label>
                  ))}
                </div>
              </section>
            )}

            <section>
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-red-400/40 bg-red-400/10 text-sm font-bold text-red-300">{hasDesignPrint ? 4 : 3}</span>
                <h2 className="text-lg font-bold uppercase">{t('custom.stepLogo')}</h2>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {logoOptions.map((option) => (
                  <label key={option.id} className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg border px-4 py-4 transition ${selectedLogo === option.id ? 'border-red-400/70 bg-red-400/5' : 'border-white/10 bg-[#111116] hover:border-white/25'}`}>
                    <span className="flex items-center gap-3">
                      <input type="radio" name="logo-choice" value={option.id} checked={selectedLogo === option.id} onChange={() => setSelectedLogo(option.id)} className="accent-red-400" />
                      <span className="font-medium">{option.name}</span>
                    </span>
                    {option.price > 0 && <span className="shrink-0 text-sm font-bold text-red-300">+{formatCurrency(option.price)}</span>}
                  </label>
                ))}
              </div>
              {isCustomLogoUpload && (
                <div className="mt-4 rounded-lg border border-white/10 bg-[#111116] p-4">
                  <label className="block text-sm font-semibold text-gray-200" htmlFor="custom-logo-file">{t('custom.uploadLogo')}</label>
                  <input id="custom-logo-file" type="file" accept="image/*" onChange={(event) => handleImageUpload(event, setCustomLogo, setLogoError)} className="mt-3 block w-full text-sm text-gray-400 file:me-4 file:rounded-md file:border-0 file:bg-white file:px-4 file:py-2 file:font-bold file:text-black" />
                  {customLogo && (
                    <div className="mt-4 flex items-center gap-4">
                      <img src={customLogo.dataUrl} alt={customLogo.name} className="h-16 w-16 rounded-md bg-white/5 object-contain p-2" />
                      <span className="min-w-0 flex-1 truncate text-sm text-gray-300">{customLogo.name}</span>
                      <button type="button" onClick={() => setCustomLogo(null)} className="text-sm text-red-300 hover:text-red-200">{t('custom.remove')}</button>
                    </div>
                  )}
                  <p className="mt-3 text-xs text-gray-500">{t('custom.imageKeptLocal')}</p>
                </div>
              )}
              {needsLogoPlacement && (
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm font-medium text-gray-300">
                    {t('custom.placement')}
                    <select value={activePlacement} onChange={(e) => setLogoPlacement(e.target.value)} className="mt-2 w-full rounded-lg border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-400">
                      {logoPlacements.map((placement) => <option key={placement} value={placement}>{placement}</option>)}
                    </select>
                  </label>
                </div>
              )}
              <label className="block text-sm font-medium text-gray-300 mt-4">
                {t('custom.printNotes')}
                <textarea value={printNotes} onChange={(e) => setPrintNotes(e.target.value)} rows="2" className="mt-2 w-full resize-y rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-400" placeholder={t('custom.printNotesPlaceholder')} />
                <p className="mt-1 text-xs text-gray-500">{t('custom.printNotesLabel')}</p>
              </label>
              {isCustomLogoUpload && logoError && <p role="alert" className="mt-3 text-sm text-red-300">{t(logoError)}</p>}
            </section>

            <button
              type="submit"
              disabled={
                !selectedGarment ||
                !hasSelectedDesign ||
                !selectedSize ||
                !selectedColor ||
                (isCustomRequest && (!organization.trim() || !estimatedQuantity.trim())) ||
                (isCustomLogoUpload && !customLogo) ||
                (needsLogoPlacement && !activePlacement)
              }
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
            <div className="grid grid-cols-2 gap-3 p-3">
              <figure className="space-y-2">
                <div className="aspect-square overflow-hidden rounded-lg border border-white/10 bg-[#111116]">
                  {selectedGarment?.image_url ? (
                    <img src={selectedGarment.image_url} alt={`${selectedGarment.category} ${selectedGarment.fit_type} preview`} className="h-full w-full object-contain" />
                  ) : (
                    <div className="flex h-full items-center justify-center px-2 text-center text-xs text-gray-600">{t('custom.noGarments')}</div>
                  )}
                </div>
                <figcaption className="text-center text-xs font-semibold uppercase tracking-wide text-gray-500">{t('custom.garment')}</figcaption>
              </figure>
              <figure className="space-y-2">
                <div className="aspect-square overflow-hidden rounded-lg border border-white/10 bg-[#111116]">
                  {selectedDesignMode === 'custom' && customArtwork ? (
                    <img src={customArtwork.dataUrl} alt="Your uploaded design preview" className="h-full w-full object-contain" />
                  ) : selectedDesignMode === 'our' && currentDesign ? (
                    <m.div layoutId={designLayoutId(selectedCollection, currentDesign.fileName)} className="h-full w-full overflow-hidden">
                      <img src={currentDesign.image} alt={`${currentDesign.name} design preview`} className="h-full w-full object-contain" />
                    </m.div>
                  ) : (
                    <div className="flex h-full items-center justify-center px-2 text-center text-xs text-gray-600">{selectedDesignMode === 'none' ? t('custom.noDesignOption') : t('custom.noDesignPreview')}</div>
                  )}
                </div>
                <figcaption className="text-center text-xs font-semibold uppercase tracking-wide text-gray-500">{t('custom.artwork')}</figcaption>
              </figure>
            </div>
            <div className="space-y-4 p-5">
              <div>
                <p className="text-lg font-bold">{selectedDesignMode === 'none' ? t('custom.noDesignOption') : selectedDesignMode === 'custom' ? customArtwork?.name || t('custom.uploadDesign') : currentDesign?.name || t('custom.noDesignPreview')}</p>
                <p className="text-sm text-gray-500">{selectedDesignMode === 'none' ? t('custom.noDesignHint') : selectedDesignMode === 'custom' ? t('custom.customDesign') : selectedCollection || t('custom.loadingCollections')}</p>
              </div>
              <div className="flex justify-between gap-4 border-t border-white/10 pt-4 text-sm">
                <span className="text-gray-400">{t('custom.garment')}</span>
                <span className="text-end">{selectedGarment ? `${selectedGarment.category} · ${selectedGarment.fit_type}` : t('custom.noGarments')}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-gray-400">{t('custom.colorSize')}</span>
                <span className="text-end">{selectedColor || t('custom.color')} · {selectedSize || t('custom.size')}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-gray-400">{t('custom.quantity')}</span>
                <span className="text-end">{quantity}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-gray-400">{t('custom.printPlacement')}</span>
                <span>{effectivePrintOption.name}</span>
              </div>
              <div className="flex justify-between gap-4 text-sm">
                <span className="text-gray-400">{t('custom.logoBranding')}</span>
                <span className="text-end">{logoOption.name}{needsLogoPlacement ? ` · ${activePlacement}` : ''}</span>
              </div>
              <div className="flex justify-between border-t border-white/10 pt-4 font-bold">
                <span>{t('custom.estimatedTotal')}</span>
                <span className="text-red-300">{formatCurrency(totalPrice)}</span>
              </div>
            </div>
            <p className="mt-4 text-xs leading-relaxed text-gray-600">{t('custom.finalPriceNote')}</p>
          </div>
        </aside>
      </div>
    </main>
  );
}
