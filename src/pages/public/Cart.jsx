import { useState } from 'react';
import { Link } from 'react-router-dom';
import { uploadOrderImages, submitCartOrder, deleteOrderUploadImages } from '../../services/apparelService.js';
import { clearCart, createOrderGroupId, readCart, writeCart } from '../../data/cart.js';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';

// Egyptian mobile or generic international number / موبايل مصري أو رقم دولي عادي
const phonePattern = /^(?:\+20|0)?1[0125][0-9]{8}$|^\+?[0-9]{10,15}$/;

function isValidPhone(value) {
  return phonePattern.test(value.trim());
}

function getLogoLabel(item, t) {
  // Keys follow the `logo_options.option_type` enum from Supabase / المفاتيح مطابقة لقيم option_type في قاعدة البيانات
  const names = {
    none: t('custom.none'),
    brand_logo: t('custom.brandLogo'),
    custom_upload: t('custom.customUpload'),
  };
  const optionType = item.logoOption?.optionType || item.logoOption?.id;
  return names[optionType] || item.logoOption?.label || item.logoOption?.name || optionType || '—';
}

// Keyed by profile id so a late profile load resets the form without an effect
// المفتاح يعتمد على معرّف الحساب حتى يُعاد بناء النموذج عند وصول البيانات بدون useEffect
function CheckoutForm({ profile, displayName, email, items, subtotal, isFrozen, onOrdered }) {
  const { t } = useLanguage();
  const { updateProfile } = useAuth();
  const savedAddress = profile?.address?.trim() || '';
  const savedBackup = profile?.secondary_phone?.trim() || '';
  const hasSavedAddress = Boolean(savedAddress);

  const [address, setAddress] = useState(() => savedAddress || readCart().customer?.address || '');
  const [phone, setPhone] = useState(() => profile?.phone || '');
  const [secondaryPhone, setSecondaryPhone] = useState(savedBackup);
  const [shareBackup, setShareBackup] = useState(true);
  // A first-time buyer saves the address by default; a returning buyer opts in explicitly
  // العميل الجديد يحفظ العنوان تلقائياً، والعميل القديم يختار بنفسه
  const [saveAddress, setSaveAddress] = useState(() => !hasSavedAddress);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const addressChanged = hasSavedAddress && address.trim() !== savedAddress;
  const effectiveBackup = savedBackup && !shareBackup ? '' : secondaryPhone.trim();

  // Keep the draft address so it survives a sign-in redirect / حفظ مسودة العنوان لتبقى بعد تسجيل الدخول
  const handleAddressChange = (event) => {
    const nextAddress = event.target.value;
    setAddress(nextAddress);
    try {
      writeCart({ ...readCart(), customer: { address: nextAddress } });
    } catch {
      // A failed draft write must never block checkout / فشل حفظ المسودة لا يوقف الطلب
    }
  };

  const handleSubmitOrder = async (event) => {
    event.preventDefault();
    setError('');

    if (!address.trim()) {
      setError(t('cart.addressRequired'));
      return;
    }
    if (!phone.trim()) {
      setError(t('cart.phoneRequired'));
      return;
    }
    if (!isValidPhone(phone) || (effectiveBackup && !isValidPhone(effectiveBackup))) {
      setError(t('cart.phoneInvalid'));
      return;
    }

    setIsSubmitting(true);
    const groupId = createOrderGroupId();
    const { data: imagePaths, error: uploadError } = await uploadOrderImages(groupId, items);
    if (uploadError) {
      setError(`${t('cart.submitError')} ${uploadError.message || ''}`.trim());
      setIsSubmitting(false);
      return;
    }

    // The server recomputes every price from the live catalog / السيرفر يعيد حساب كل سعر من الكتالوج
    const { data, error: submitError } = await submitCartOrder({
      items,
      imagePaths,
      cartGroupId: groupId,
      customer: {
        name: displayName,
        email,
        // Keep the primary number here; the backup is stored separately in order_details.
        // الرقم الأساسي هنا فقط، والاحتياطي يُحفظ منفصلاً في تفاصيل الطلب
        phone: phone.trim(),
        secondaryPhone: effectiveBackup,
        address: address.trim(),
      },
    });

    if (submitError) {
      const uploadedPaths = Object.values(imagePaths || {}).flatMap((paths) => Object.values(paths));
      await deleteOrderUploadImages(uploadedPaths);
      setError(`${t('cart.submitError')} ${submitError.message || submitError}`.trim());
      setIsSubmitting(false);
      return;
    }

    // Persist the profile so /account reflects it immediately / تحديث الملف الشخصي ليظهر في صفحة الحساب فوراً
    const profileUpdates = {};
    if (saveAddress) {
      if (address.trim() !== savedAddress) profileUpdates.address = address.trim();
      if (secondaryPhone.trim() !== savedBackup) profileUpdates.secondary_phone = secondaryPhone.trim();
    }
    const hadNoPhone = !profile?.phone?.trim();
    if (hadNoPhone) profileUpdates.phone = phone.trim();
    const { error: profileError } = Object.keys(profileUpdates).length
      ? await updateProfile(profileUpdates)
      : { error: null };

    try {
      clearCart();
      onOrdered(
        { count: items.length, groupId: data?.groupId || groupId },
        profileError ? t('cart.profileSaveWarning') : '',
      );
    } catch {
      setError(t('cart.clearAfterSubmitError'));
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmitOrder} className="space-y-4">
      <div className="border border-white/10 bg-[#111116] px-4 py-3">
        <p className="text-xs text-gray-500">{t('cart.signedInAs')}</p>
        <p className="mt-1 truncate font-semibold text-white" title={displayName}>{displayName}</p>
      </div>

      {isFrozen && <p role="alert" className="border-s-2 border-amber-300 px-3 py-2 text-sm leading-5 text-amber-200">{t('cart.frozenNotice')}</p>}

      <label className="block text-sm font-medium text-gray-300">
        {t('cart.primaryPhone')}
        <input
          type="tel"
          name="phone"
          autoComplete="tel"
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          required
          className="mt-2 w-full rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-300"
          placeholder={t('cart.primaryPhonePlaceholder')}
        />
      </label>

      <label className="block text-sm font-medium text-gray-300">
        {t('cart.backupPhone')}
        <input
          type="tel"
          name="secondaryPhone"
          value={secondaryPhone}
          onChange={(event) => setSecondaryPhone(event.target.value)}
          className="mt-2 w-full rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-300"
          placeholder={t('cart.backupPhonePlaceholder')}
        />
        <span className="mt-2 block text-xs leading-5 text-gray-500">{t('cart.backupPhoneHint')}</span>
      </label>

      {savedBackup && secondaryPhone.trim() === savedBackup && (
        <label className="flex items-start gap-3 border border-white/10 bg-[#111116] px-4 py-3 text-sm text-gray-300">
          <input type="checkbox" checked={shareBackup} onChange={(event) => setShareBackup(event.target.checked)} className="mt-0.5 h-4 w-4 accent-red-400" />
          <span>{t('cart.shareBackup', { phone: savedBackup })}</span>
        </label>
      )}

      <label className="block text-sm font-medium text-gray-300">
        {t('cart.address')}
        <textarea
          name="address"
          autoComplete="street-address"
          value={address}
          onChange={handleAddressChange}
          required
          maxLength={600}
          rows="3"
          className="mt-2 w-full resize-y rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-300"
          placeholder={t('cart.addressPlaceholder')}
        />
      </label>

      {hasSavedAddress && !addressChanged && (
        <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-xs text-emerald-200">
          <span aria-hidden="true">✓</span>
          {t('cart.loadedSavedAddress')}
        </p>
      )}

      {hasSavedAddress && addressChanged && (
        <label className="flex items-start gap-3 border border-white/10 bg-[#111116] px-4 py-3 text-sm text-gray-300">
          <input type="checkbox" checked={saveAddress} onChange={(event) => setSaveAddress(event.target.checked)} className="mt-0.5 h-4 w-4 accent-red-400" />
          <span>{t('cart.updateSavedAddress')}</span>
        </label>
      )}

      {!hasSavedAddress && (
        <label className="flex items-start gap-3 border border-red-400/25 bg-red-400/5 px-4 py-3 text-sm text-gray-200">
          <input type="checkbox" checked={saveAddress} onChange={(event) => setSaveAddress(event.target.checked)} className="mt-0.5 h-4 w-4 accent-red-400" />
          <span className="font-medium">{t('cart.saveAddress')}</span>
        </label>
      )}

      {error && <p role="alert" className="border-s-2 border-red-400 px-3 py-2 text-sm leading-5 text-red-200">{error}</p>}

      <div className="flex items-center justify-between border-t border-white/10 pt-4">
        <span className="text-sm text-gray-400">{t('cart.subtotal')}</span>
        <strong className="text-lg text-white">{subtotal}</strong>
      </div>
      <p className="text-xs leading-5 text-gray-600">{t('cart.submitNote')}</p>
      <button
        type="submit"
        disabled={isSubmitting || isFrozen || !items.length}
        className="w-full rounded-md bg-white px-5 py-4 font-bold text-black transition hover:bg-red-100 disabled:cursor-wait disabled:opacity-50"
      >
        {isSubmitting ? t('cart.submitting') : t('cart.submit')}
      </button>
    </form>
  );
}

export default function Cart() {
  const { t, formatCurrency, formatNumber } = useLanguage();
  const { user, profile, accountStatus } = useAuth();
  const [cart, setCart] = useState(readCart);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const subtotal = cart.items.reduce((total, item) => total + Number(item.totalPrice || 0), 0);
  const isFrozen = accountStatus === 'frozen';
  const displayName = profile?.full_name?.trim() || user?.email?.split('@')[0] || '';

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

  if (confirmation) {
    return (
      <main className="min-h-[70vh] bg-[#0A0A0A] px-5 py-16 text-white sm:px-8">
        <section className="mx-auto max-w-2xl border-y border-red-400/20 py-12 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-red-400/30 bg-red-400/10 text-red-200" aria-hidden="true">
            ✓
          </span>
          <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-red-200">{t('cart.submitted')}</p>
          <h1 className="mt-2 text-3xl font-bold">{t('cart.thankYou')}</h1>
          <p className="mt-4 text-sm leading-6 text-gray-400">{t('cart.requestReference', { groupId: confirmation.groupId })}</p>
          <p className="mt-2 text-sm text-gray-400">{t('cart.submittedCount', { count: formatNumber(confirmation.count) })}</p>
          {confirmation.warning && <p role="status" className="mt-3 text-sm text-amber-200">{confirmation.warning}</p>}
          <p className="mt-2 text-xs leading-5 text-gray-600">{t('cart.followUp')}</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/account" className="inline-flex rounded-md bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-red-100">
              {t('account.tabOrders')}
            </Link>
            <Link to="/apparel" className="inline-flex rounded-md border border-white/15 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/40">
              {t('cart.browseApparel')}
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] px-5 py-12 text-white sm:px-8 lg:px-14">
      <div className="mx-auto max-w-7xl">
        <header className="mb-10 flex flex-wrap items-end justify-between gap-4 border-b border-white/10 pb-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-300">{t('cart.eyebrow')}</p>
            <h1 className="mt-2 text-3xl font-extrabold sm:text-4xl">{t('cart.title')}</h1>
            <p className="mt-2 text-sm text-gray-500">{t('cart.itemCount', { count: formatNumber(cart.items.length) })}</p>
          </div>
          <Link to="/custom?new=1" className="inline-flex items-center gap-2 rounded-md border border-white/15 px-4 py-3 text-sm font-semibold text-gray-200 transition hover:border-white/40 hover:text-white">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
            {t('cart.addAnother')}
          </Link>
        </header>

        {error && <p role="alert" className="mb-6 border-s-2 border-red-400 px-4 py-3 text-sm leading-5 text-red-200">{error}</p>}

        {!cart.items.length ? (
          <section className="grid min-h-72 place-items-center border-y border-white/10 py-12 text-center">
            <div>
              <p className="text-lg font-semibold text-white">{t('cart.emptyTitle')}</p>
              <p className="mt-2 text-sm text-gray-500">{t('cart.emptyDescription')}</p>
              <Link to="/custom?new=1" className="mt-5 inline-flex rounded-md bg-white px-4 py-3 text-sm font-bold text-black transition hover:bg-red-100">
                {t('cart.startDesign')}
              </Link>
            </div>
          </section>
        ) : (
          <div className="grid items-start gap-12 lg:grid-cols-[1.25fr_0.75fr]">
            <section aria-label={t('cart.itemsLabel')} className="divide-y divide-white/10 border-y border-white/10">
              {cart.items.map((item, index) => (
                <article key={item.id} className="grid gap-5 py-6 sm:grid-cols-[10rem_1fr]">
                  <div className="aspect-square overflow-hidden border border-white/10 bg-[#111116]">
                    {(item.customArtwork?.dataUrl || item.designImageUrl) ? (
                      <img
                        src={item.customArtwork?.dataUrl || item.designImageUrl}
                        alt={item.designName || item.fileName || t('cart.designPreview')}
                        className="h-full w-full object-cover"
                        onError={(event) => { event.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="grid h-full place-items-center text-xs text-gray-600">{t('cart.designPreview')}</div>
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-red-300">{t('cart.item', { number: formatNumber(index + 1) })}</p>
                        <h2 className="mt-1 text-lg font-bold text-white">{item.designName || item.fileName || t('custom.customDesign')}</h2>
                        <p className="mt-1 text-sm text-gray-500">{item.category} · {item.fit_type}</p>
                      </div>
                      <p className="font-bold text-red-200">{formatCurrency(item.totalPrice)}</p>
                    </div>
                    <dl className="mt-5 grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
                      <div>
                        <dt className="text-xs text-gray-500">{t('cart.garment')}</dt>
                        <dd className="mt-1 text-gray-200">{item.category} · {item.fit_type} · {item.size} · {item.color}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">{t('custom.printPlacement')}</dt>
                        <dd className="mt-1 text-gray-200">{item.printOption?.name || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">{t('custom.logoBranding')}</dt>
                        <dd className="mt-1 text-gray-200">{getLogoLabel(item, t)}</dd>
                      </div>
                      {item.customLogo?.name && (
                        <div>
                          <dt className="text-xs text-gray-500">{t('cart.customLogoFile')}</dt>
                          <dd className="mt-1 truncate text-gray-200">{item.customLogo.name}</dd>
                        </div>
                      )}
                    </dl>
                    <div className="mt-auto flex flex-wrap gap-4 pt-5">
                      <Link to={`/custom?edit=${encodeURIComponent(item.id)}`} className="text-sm font-semibold text-gray-300 underline decoration-white/25 underline-offset-4 transition hover:text-white">
                        {t('cart.editItem')}
                      </Link>
                      <button type="button" onClick={() => handleRemoveItem(item.id)} className="text-sm font-semibold text-red-300 underline decoration-red-300/30 underline-offset-4 transition hover:text-red-200">
                        {t('cart.removeItem')}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </section>

            <aside className="border-t border-white/10 pt-6 lg:sticky lg:top-24 lg:border-t-0 lg:pt-0">
              <div className="mb-5">
                <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-300">{t('cart.customerDetails')}</p>
                <h2 className="mt-2 text-xl font-bold">{t('cart.reachYou')}</h2>
              </div>

              {!user ? (
                // Guests send the order after a quick sign in; the cart is never lost / الضيف يسجّل الدخول ثم يكمل ولا تُفقد السلة
                <div className="border border-white/10 bg-[#111116] p-5">
                  <p className="text-sm leading-6 text-gray-400">{t('cart.guestPrompt')}</p>
                  <Link to={`/login?redirect=${encodeURIComponent('/cart')}`} className="mt-4 inline-flex w-full justify-center rounded-md bg-white px-4 py-3 text-sm font-bold text-black transition hover:bg-red-100">
                    {t('cart.signInToOrder')}
                  </Link>
                  <Link to={`/signup?redirect=${encodeURIComponent('/cart')}`} className="mt-2 inline-flex w-full justify-center rounded-md border border-white/15 px-4 py-3 text-sm font-semibold text-white transition hover:border-white/40">
                    {t('cart.createAccountToOrder')}
                  </Link>
                </div>
              ) : (
                <CheckoutForm
                  key={profile?.id || user.id}
                  profile={profile}
                  displayName={displayName}
                  email={profile?.email || user.email || ''}
                  items={cart.items}
                  subtotal={formatCurrency(subtotal)}
                  isFrozen={isFrozen}
                  onOrdered={(result, warning) => setConfirmation({ ...result, warning })}
                />
              )}
            </aside>
          </div>
        )}
      </div>
    </main>
  );
}
