import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createOrders, deleteOrderUploadImages, uploadOrderImages } from '../../data/catalog.js';
import { createOrderGroupId, readCart, writeCart } from '../../data/cart.js';
import { useLanguage } from '../../context/LanguageContext.jsx';

const emptyCustomer = { name: '', phone: '', email: '', address: '' };

function getLogoLabel(item, t) {
  const names = {
    'with-cut': t('custom.withCut'),
    'without-cut': t('custom.withoutCut'),
    'custom-logo': t('custom.customLogo'),
    'our-logo': t('custom.ourLogo'),
  };
  const location = item.logoChoice === 'custom-logo' || item.logoChoice === 'our-logo'
    ? item.logoLocation === 'other' ? item.otherLogoLocation : item.logoLocation
    : '';
  return location ? `${names[item.logoChoice]} · ${location}` : names[item.logoChoice] || item.logoChoice || '—';
}

export default function Cart() {
  const { language, t, formatCurrency, formatNumber } = useLanguage();
  const [cart, setCart] = useState(readCart);
  const [customer, setCustomer] = useState(() => ({ ...emptyCustomer, ...readCart().customer }));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const subtotal = cart.items.reduce((total, item) => total + Number(item.totalPrice || 0), 0);

  // Keep the cart and customer's checkout details available across reloads / حفظ السلة وبيانات العميل بين مرات فتح الصفحة
  const handleCustomerChange = (event) => {
    const nextCustomer = { ...customer, [event.target.name]: event.target.value };
    setCustomer(nextCustomer);
    try {
      const currentCart = readCart();
      const nextCart = { ...currentCart, customer: nextCustomer };
      writeCart(nextCart);
      setCart(nextCart);
    } catch {
      setError(t('cart.saveCustomerError'));
    }
  };

  const handleRemoveItem = (itemId) => {
    const nextCart = { ...cart, items: cart.items.filter((item) => item.id !== itemId) };
    setCart(nextCart);
    setError('');
    try {
      writeCart(nextCart);
    } catch {
      setError(t('cart.removeError'));
    }
  };

  // Submit every reviewed cart line as a row sharing one checkout group / إرسال كل عناصر السلة كصفوف مرتبطة بمعرّف طلب واحد
  const handleSubmitOrder = async (event) => {
    event.preventDefault();
    if (!cart.items.length) return;

    setIsSubmitting(true);
    setError('');
    setConfirmation(null);
    const groupId = createOrderGroupId();
    const createdAt = new Date().toISOString();
    const { data: imagePaths, error: uploadError } = await uploadOrderImages(groupId, cart.items);
    if (uploadError) {
      setError(language === 'ar' ? t('cart.submitError') : `${t('cart.submitError')} ${uploadError.message || ''}`);
      setIsSubmitting(false);
      return;
    }

    const orderRows = cart.items.map((item) => ({
      customer_name: customer.name.trim(),
      customer_email: customer.email.trim(),
      customer_phone: customer.phone.trim(),
      customer_address: customer.address.trim(),
      laptop_id: item.laptopId,
      collection_name: item.designMode === 'custom' ? 'Custom Design' : item.collectionName,
      skin_design: item.skinDesign || item.fileName || 'Custom design',
      coverage_type: item.coverageType || item.coverageId,
      logo_preference: item.logoChoice,
      total_price: Number(item.totalPrice),
      status: 'Pending',
      cart_group_id: groupId,
      created_at: createdAt,
      order_details: {
        laptop_brand: item.laptopBrand || item.customLaptopBrand || '',
        laptop_series: item.laptopSeries || item.customLaptopSeries || '',
        laptop_model: item.laptopModel || item.customLaptopModel || '',
        design_mode: item.designMode,
        design_file_name: item.fileName || '',
        custom_artwork_name: item.customArtwork?.name || '',
        design_image_path: imagePaths[item.id]?.design_image_path || null,
        coverage_id: item.coverageId,
        logo_location: item.logoLocation || '',
        other_logo_location: item.otherLogoLocation || '',
        custom_logo_name: item.customLogo?.name || '',
        logo_image_path: imagePaths[item.id]?.logo_image_path || null,
      },
    }));

    const { error: submitError } = await createOrders(orderRows);
    if (submitError) {
      const uploadedPaths = Object.values(imagePaths).flatMap((paths) => Object.values(paths));
      const { error: cleanupError } = await deleteOrderUploadImages(uploadedPaths);
      setError(language === 'ar'
        ? t('cart.submitError')
        : cleanupError
          ? `${t('cart.submitError')} ${submitError.message || submitError}. ${cleanupError.message || cleanupError}`
          : `${t('cart.submitError')} ${submitError.message || submitError}`);
      setIsSubmitting(false);
      return;
    }

    try {
      window.localStorage.removeItem('ninja-skins-cart');
      window.localStorage.removeItem('ninja-skins-cart-draft');
      window.localStorage.removeItem('ninja-skins-custom-draft');
      setCart({ items: [], customer: {} });
      setCustomer(emptyCustomer);
      setConfirmation({ count: orderRows.length, groupId });
    } catch {
      setError(t('cart.clearAfterSubmitError'));
    }
    setIsSubmitting(false);
  };

  if (confirmation) {
    return (
      <main className="min-h-[70vh] bg-[#070709] px-5 py-16 text-white sm:px-8">
        <section className="mx-auto max-w-2xl border-y border-emerald-300/20 py-12 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-300/10 text-emerald-200" aria-hidden="true">✓</span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-emerald-200">{t('cart.submitted')}</p>
          <h1 className="mt-2 text-3xl font-bold">{t('cart.thankYou')}</h1>
          <p className="mt-4 text-sm leading-6 text-gray-400">{t('cart.requestReference', { groupId: confirmation.groupId })}</p>
          <p className="mt-2 text-sm text-gray-400">{t('cart.itemCount', { count: formatNumber(confirmation.count) })}</p>
          <p className="mt-2 text-xs leading-5 text-gray-600">{t('cart.followUp')}</p>
          <Link to="/laptops" className="mt-8 inline-flex rounded-md bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-red-100">{t('cart.browseLaptops')}</Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070709] px-5 py-12 text-white sm:px-8 lg:px-14">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-300">{t('cart.eyebrow')}</p>
            <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">{t('cart.title')}</h1>
            <p className="mt-2 text-sm text-gray-500">{t('cart.itemCount', { count: formatNumber(cart.items.length) })}</p>
          </div>
          <Link to="/custom?new=1" className="inline-flex items-center gap-2 rounded-md border border-white/15 px-4 py-3 text-sm font-semibold text-gray-200 transition hover:border-white/40 hover:text-white">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            {t('cart.addAnother')}
          </Link>
        </header>

        {error && <p role="alert" className="mb-6 border-s-2 border-red-400 px-4 py-3 text-sm leading-5 text-red-200">{error}</p>}

        {!cart.items.length ? (
          <section className="grid min-h-72 place-items-center border-y border-white/10 py-12 text-center">
            <div><p className="text-lg font-semibold text-white">{t('cart.emptyTitle')}</p><p className="mt-2 text-sm text-gray-500">{t('cart.emptyDescription')}</p><Link to="/custom?new=1" className="mt-5 inline-flex rounded-md bg-white px-4 py-3 text-sm font-bold text-black transition hover:bg-red-100">{t('cart.startDesign')}</Link></div>
          </section>
        ) : (
          <div className="grid items-start gap-12 lg:grid-cols-[1.25fr_0.75fr]">
            <section aria-label="Cart items" className="divide-y divide-white/10 border-y border-white/10">
              {cart.items.map((item, index) => (
                <article key={item.id} className="grid gap-5 py-6 sm:grid-cols-[10rem_1fr]">
                  <div className="aspect-square overflow-hidden border border-white/10 bg-[#111116]">
                    {item.designImage ? <img src={item.designImage} alt={item.skinDesign || t('cart.designPreview')} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-xs text-gray-600">{t('cart.designPreview')}</div>}
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div><p className="text-xs font-bold uppercase tracking-wider text-red-300">{t('cart.item', { number: formatNumber(index + 1) })}</p><h2 className="mt-1 text-lg font-bold text-white">{item.skinDesign || item.fileName || t('custom.customDesign')}</h2><p className="mt-1 text-sm text-gray-500">{item.designMode === 'custom' ? t('custom.customDesign') : item.collectionDisplayName || item.collectionName}</p></div>
                      <p className="font-bold text-red-200">{formatCurrency(item.totalPrice)}</p>
                    </div>
                    <dl className="mt-5 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                      <div><dt className="text-xs text-gray-500">{t('cart.laptop')}</dt><dd className="mt-1 text-gray-200">{[item.laptopBrand, item.laptopSeries, item.laptopModel].filter(Boolean).join(' ') || '—'}</dd></div>
                      <div><dt className="text-xs text-gray-500">{t('cart.coverage')}</dt><dd className="mt-1 text-gray-200">{t(`custom.coverage${item.coverageId === 'top-palm' ? 'TopPalm' : item.coverageId === 'full' ? 'Full' : 'Top'}`)}</dd></div>
                      <div><dt className="text-xs text-gray-500">{t('cart.logo')}</dt><dd className="mt-1 text-gray-200">{getLogoLabel(item, t)}</dd></div>
                      {item.customLogo?.name && <div><dt className="text-xs text-gray-500">{t('cart.customLogoFile')}</dt><dd className="mt-1 truncate text-gray-200">{item.customLogo.name}</dd></div>}
                    </dl>
                    <div className="mt-auto flex flex-wrap gap-4 pt-5">
                      <Link to={`/custom?edit=${encodeURIComponent(item.id)}`} className="text-sm font-semibold text-gray-300 underline decoration-white/25 underline-offset-4 transition hover:text-white">{t('cart.editItem')}</Link>
                      <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-sm font-semibold text-red-300 underline decoration-red-300/30 underline-offset-4 transition hover:text-red-200">{t('cart.removeItem')}</button>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            <aside className="border-t border-white/10 pt-6 lg:sticky lg:top-24 lg:border-t-0 lg:pt-0">
              <div className="mb-5"><p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-300">{t('cart.customerDetails')}</p><h2 className="mt-2 text-xl font-bold">{t('cart.reachYou')}</h2></div>
              <form onSubmit={handleSubmitOrder} className="space-y-4">
                <label className="block text-sm font-medium text-gray-300">{t('cart.name')}<input name="name" autoComplete="name" value={customer.name} onChange={handleCustomerChange} required maxLength={120} className="mt-2 w-full rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-300" /></label>
                <label className="block text-sm font-medium text-gray-300">{t('cart.phone')}<input name="phone" type="tel" autoComplete="tel" value={customer.phone} onChange={handleCustomerChange} required maxLength={32} className="mt-2 w-full rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-300" placeholder="01xxxxxxxxx" /></label>
                <label className="block text-sm font-medium text-gray-300">{t('cart.email')}<input name="email" type="email" autoComplete="email" value={customer.email} onChange={handleCustomerChange} required maxLength={254} className="mt-2 w-full rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-300" /></label>
                <label className="block text-sm font-medium text-gray-300">{t('cart.address')}<textarea name="address" autoComplete="street-address" value={customer.address} onChange={handleCustomerChange} required maxLength={600} rows="3" className="mt-2 w-full resize-y rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-300" placeholder={t('cart.addressPlaceholder')} /></label>
                <div className="flex items-center justify-between border-t border-white/10 pt-4"><span className="text-sm text-gray-400">{t('cart.subtotal')}</span><strong className="text-lg text-white">{formatCurrency(subtotal)}</strong></div>
                <p className="text-xs leading-5 text-gray-600">{t('cart.submitNote')}</p>
                <button type="submit" disabled={isSubmitting || !cart.items.length} className="w-full rounded-md bg-white px-5 py-4 font-bold text-black transition hover:bg-red-100 disabled:cursor-wait disabled:opacity-50">{isSubmitting ? t('cart.submitting') : t('cart.submit')}</button>
              </form>
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
