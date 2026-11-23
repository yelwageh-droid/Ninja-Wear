import { useEffect, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import {
  getApparelProducts,
  getCustomerOrders,
  getLogoOptions,
  getOrderImageUrls,
  getPrintOptions,
} from '../../services/apparelService.js';
import { getSupabase } from '../../config/SupabaseClient.js';
import { ORDER_STATUS_SEQUENCE, groupOrders } from '../../data/orders.js';
import { createCartItemId, readCart, writeCart } from '../../data/cart.js';
import { getWhatsAppUrl } from '../../data/whatsapp.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { useToast } from '../../components/ui/ToastProvider.jsx';
import Skeleton from '../../components/ui/Skeleton.jsx';

// Egyptian mobile or generic international number / موبايل مصري أو رقم دولي عادي
const phonePattern = /^(?:\+20|0)?1[0125][0-9]{8}$|^\+?[0-9]{10,15}$/;

const fieldClass = 'mt-2 w-full rounded-md border border-border-subtle bg-surface px-4 py-3 text-white outline-none transition placeholder:text-gray-600 focus:border-brand disabled:opacity-60';

const statusStyles = {
  Pending: 'border-amber-300/20 bg-amber-300/10 text-amber-200',
  Confirmed: 'border-sky-300/20 bg-sky-300/10 text-sky-200',
  Printing: 'border-orange-300/20 bg-orange-300/10 text-orange-200',
  Shipped: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200',
  Completed: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200',
  Cancelled: 'border-red-300/20 bg-red-300/10 text-red-200',
  Mixed: 'border-white/20 bg-white/5 text-gray-300',
};

function isValidPhone(value) {
  return phonePattern.test(value.trim());
}

function shortRef(value) {
  return String(value || '').slice(0, 8).toUpperCase();
}

// Short status label reused from the admin dictionary / تسمية مختصرة للحالة من قاموس الإدارة
function statusLabel(t, status) {
  return t(`orders.${String(status || 'Pending').toLowerCase()}`);
}

function StatusPill({ status }) {
  const { t } = useLanguage();
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[status] || statusStyles.Pending}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {statusLabel(t, status)}
    </span>
  );
}

// Account status badge (Active / Frozen) / شارة حالة الحساب
function AccountStatusPill({ isFrozen }) {
  const { t } = useLanguage();
  const className = isFrozen ? statusStyles.Cancelled : statusStyles.Completed;
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${className}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {isFrozen ? t('account.statusFrozen') : t('account.statusActive')}
    </span>
  );
}

// Horizontal on desktop, stacked on mobile / أفقي على الديسكتوب وعمودي على الموبايل
function ProgressTracker({ status }) {
  const { t } = useLanguage();
  const activeIndex = ORDER_STATUS_SEQUENCE.indexOf(status);

  return (
    <ol className="flex flex-col sm:flex-row sm:items-start">
      {ORDER_STATUS_SEQUENCE.map((step, index) => {
        const isDone = activeIndex !== -1 && activeIndex >= index;
        const isCurrent = activeIndex === index;
        const isLast = index === ORDER_STATUS_SEQUENCE.length - 1;
        return (
          <li key={step} className="flex gap-4 sm:flex-1 sm:flex-col sm:gap-3">
            <div className="flex flex-col items-center sm:w-full sm:flex-row">
              <span
                aria-hidden="true"
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border text-xs font-bold ${isDone ? 'border-brand bg-brand text-black' : 'border-border-subtle bg-surface text-gray-500'}`}
              >
                {isDone ? '✓' : index + 1}
              </span>
              {!isLast && <span className={`w-0.5 flex-1 sm:h-0.5 sm:w-full ${activeIndex > index ? 'bg-brand' : 'bg-white/10'}`} />}
            </div>
            <div className="pb-6 sm:pb-0 sm:pe-4">
              <p className={`text-sm font-semibold ${isCurrent ? 'text-white' : isDone ? 'text-gray-200' : 'text-gray-500'}`}>{t(`account.step${step}`)}</p>
              <p className="mt-0.5 text-xs leading-5 text-gray-500">{t(`account.step${step}Hint`)}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function ItemRow({ order, imageUrls, formatCurrency, formatNumber }) {
  const { t } = useLanguage();
  const details = order.order_details || {};
  const thumbnail = (details.design_image_path && imageUrls[details.design_image_path]) || details.design_image_url || '';
  const garment = [details.garment_category, details.garment_fit_type, details.garment_color, details.garment_size].filter(Boolean).join(' · ');
  const logo = [order.logo_option, details.logo_placement].filter(Boolean).join(' · ');

  return (
    <article className="grid gap-4 border-t border-border-subtle pt-5 first:border-t-0 first:pt-0 sm:grid-cols-[5rem_1fr]">
      <div className="aspect-square overflow-hidden rounded-xl border border-border-subtle bg-surface-elevated">
        {thumbnail ? (
          <img src={thumbnail} alt={order.design_name || ''} className="h-full w-full object-cover" />
        ) : (
          <div className="grid h-full place-items-center px-2 text-center text-[0.65rem] text-gray-600">{order.design_name || t('custom.noDesignOption')}</div>
        )}
      </div>
      <div className="min-w-0">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h4 className="truncate font-semibold text-white">{order.design_name || t('custom.customDesign')}</h4>
            <p className="mt-1 text-sm text-gray-400">{garment || order.product_info || '—'}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusPill status={order.status} />
            <span className="font-semibold text-brand">{formatCurrency(order.total_price)}</span>
          </div>
        </div>
        <dl className="mt-4 grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between gap-3">
            <dt className="text-gray-500">{t('custom.printPlacement')}</dt>
            <dd className="text-end text-gray-200">{details.print_placement || order.print_option || '—'}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-gray-500">{t('custom.logoBranding')}</dt>
            <dd className="text-end text-gray-200">{logo || '—'}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-gray-500">{t('account.quantity')}</dt>
            <dd className="text-end text-gray-200">{formatNumber(details.garment_quantity || 1)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-gray-500">{t('account.subtotal')}</dt>
            <dd className="text-end text-gray-200">{formatCurrency(order.total_price)}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

function OrderGroupCard({ group, imageUrls, onOrderAgain, onWhatsApp, isRebuilding }) {
  const { t, formatCurrency, formatNumber, language } = useLanguage();
  const primaryOrder = group.primaryOrder;
  const details = primaryOrder.order_details || {};
  const dateLabel = group.latestTimestamp
    ? new Intl.DateTimeFormat(language === 'ar' ? 'ar-EG' : 'en', { dateStyle: 'medium' }).format(new Date(group.latestTimestamp))
    : '—';
  const deliveryPhone = [primaryOrder.customer_phone, details.secondary_phone].filter(Boolean).join(' · ');

  return (
    <section className="rounded-2xl border border-border-subtle bg-surface p-5 sm:p-6">
      <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border-subtle pb-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-brand">{t('account.orderRef', { ref: shortRef(group.id) })}</p>
          <p className="mt-1.5 text-sm text-gray-500">{t('account.orderDate', { date: dateLabel })}</p>
          <p className="mt-1 text-xs text-gray-600">{t('account.itemsCount', { count: formatNumber(group.itemCount) })}</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <StatusPill status={group.status} />
          <div className="text-end">
            <p className="text-xs text-gray-500">{t('account.orderTotal')}</p>
            <p className="text-lg font-bold text-white">{formatCurrency(group.totalPrice)}</p>
          </div>
        </div>
      </header>

      <div className="py-5">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-gray-400">{t('account.trackerTitle')}</p>
        {group.status === 'Cancelled' ? (
          <p role="status" className="rounded-xl border border-red-400/25 bg-red-400/5 px-4 py-3 text-sm leading-6 text-red-200">{t('account.cancelledNotice')}</p>
        ) : group.status === 'Mixed' ? (
          <div className="space-y-3">
            <p className="text-sm leading-6 text-gray-400">{t('account.mixedNotice')}</p>
            <div className="flex flex-wrap gap-2">
              {group.orders.map((order) => (
                <StatusPill key={order.id} status={order.status} />
              ))}
            </div>
          </div>
        ) : (
          <ProgressTracker status={group.status} />
        )}
      </div>

      <div className="border-t border-border-subtle pt-5">
        <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em] text-gray-400">{t('account.itemsTitle')}</p>
        <div className="space-y-5">
          {group.orders.map((order) => (
            <ItemRow key={order.id} order={order} imageUrls={imageUrls} formatCurrency={formatCurrency} formatNumber={formatNumber} />
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-4 rounded-xl border border-border-subtle bg-surface-elevated p-4 sm:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500">{t('account.deliveryTitle')} · {t('account.deliveryPhone')}</p>
          <p className="mt-1 text-sm text-gray-200" dir="ltr">{deliveryPhone || '—'}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wider text-gray-500">{t('account.deliveryTitle')} · {t('account.deliveryAddress')}</p>
          <p className="mt-1 whitespace-pre-line text-sm leading-6 text-gray-200">{primaryOrder.customer_address || '—'}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => onOrderAgain(group)}
          disabled={isRebuilding}
          className="inline-flex items-center gap-2 rounded-md bg-brand px-4 py-3 text-sm font-bold text-black transition hover:bg-brand-hover disabled:cursor-wait disabled:opacity-60"
        >
          {t('account.orderAgain')}
        </button>
        <button
          type="button"
          onClick={() => onWhatsApp(group)}
          className="inline-flex items-center gap-2 rounded-md border border-border-subtle px-4 py-3 text-sm font-semibold text-gray-200 transition hover:border-white/40 hover:text-white"
        >
          {t('account.whatsappInquiry')}
        </button>
      </div>
    </section>
  );
}

// Keyed by profile id so a late profile load resets the form without an effect
// المفتاح يعتمد على معرّف الحساب حتى يُعاد بناء النموذج عند وصول البيانات بدون useEffect
function ProfileForm({ profile, email }) {
  const { t } = useLanguage();
  const { updateProfile } = useAuth();
  const toast = useToast();
  const [fullName, setFullName] = useState(() => profile?.full_name || '');
  const [phone, setPhone] = useState(() => profile?.phone || '');
  const [secondaryPhone, setSecondaryPhone] = useState(() => profile?.secondary_phone || '');
  const [address, setAddress] = useState(() => profile?.address || '');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError(t('account.profileSaveError'));
      return;
    }
    if (!isValidPhone(phone)) {
      setError(t('cart.phoneInvalid'));
      return;
    }
    if (secondaryPhone.trim() && !isValidPhone(secondaryPhone)) {
      setError(t('cart.phoneInvalid'));
      return;
    }

    setIsSaving(true);
    const { error: saveError } = await updateProfile({
      full_name: fullName.trim(),
      phone: phone.trim(),
      secondary_phone: secondaryPhone.trim(),
      address: address.trim(),
    });
    setIsSaving(false);

    if (saveError) {
      setError(t('account.profileSaveError'));
      toast.error(t('account.profileSaveError'));
      return;
    }
    toast.success(t('account.profileUpdated'));
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-5">
      <label className="block text-sm font-medium text-gray-300">
        {t('account.fullName')}
        <input type="text" name="full_name" value={fullName} onChange={(event) => setFullName(event.target.value)} required maxLength={120} className={fieldClass} />
      </label>

      <label className="block text-sm font-medium text-gray-300">
        {t('account.emailLabel')}
        <input type="email" value={email} disabled readOnly className={fieldClass} />
        <span className="mt-2 inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-200">
          <span aria-hidden="true">✓</span>
          {t('account.emailVerified')}
        </span>
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block text-sm font-medium text-gray-300">
          {t('account.primaryPhone')}
          <input type="tel" name="phone" dir="ltr" value={phone} onChange={(event) => setPhone(event.target.value)} required className={fieldClass} placeholder={t('cart.primaryPhonePlaceholder')} />
        </label>
        <label className="block text-sm font-medium text-gray-300">
          {t('account.secondaryPhone')}
          <input type="tel" name="secondary_phone" dir="ltr" value={secondaryPhone} onChange={(event) => setSecondaryPhone(event.target.value)} className={fieldClass} placeholder={t('cart.primaryPhonePlaceholder')} />
          <span className="mt-2 block text-xs leading-5 text-gray-500">{t('account.secondaryPhoneHint')}</span>
        </label>
      </div>

      <label className="block text-sm font-medium text-gray-300">
        {t('account.addressTitle')}
        <textarea name="address" value={address} onChange={(event) => setAddress(event.target.value)} rows="3" maxLength={600} className={`${fieldClass} resize-y`} placeholder={t('account.addressPlaceholder')} />
      </label>

      {error && <p role="alert" className="border-s-2 border-red-400 px-3 py-2 text-sm leading-5 text-red-200">{error}</p>}

      <div>
        <button type="submit" disabled={isSaving} className="inline-flex rounded-md bg-brand px-5 py-3 text-sm font-bold text-black transition hover:bg-brand-hover disabled:cursor-wait disabled:opacity-60">
          {isSaving ? t('account.savingProfile') : t('account.saveProfile')}
        </button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const { t } = useLanguage();
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (password.length < 8) {
      setError(t('auth.passwordTooShort'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch'));
      return;
    }

    setIsSaving(true);
    try {
      const supabase = await getSupabase();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(t('account.passwordError'));
        toast.error(t('account.passwordError'));
        return;
      }
      setPassword('');
      setConfirmPassword('');
      toast.success(t('account.passwordUpdated'));
    } catch {
      setError(t('account.passwordError'));
      toast.error(t('account.passwordError'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="grid max-w-lg gap-5">
      <div>
        <h3 className="text-lg font-bold text-white">{t('account.securityTitle')}</h3>
        <p className="mt-1 text-sm text-gray-500">{t('account.securitySubtitle')}</p>
      </div>

      <label className="block text-sm font-medium text-gray-300">
        {t('account.newPassword')}
        <input
          type={showPassword ? 'text' : 'password'}
          name="new-password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          className={fieldClass}
          placeholder="••••••••"
        />
      </label>

      <label className="block text-sm font-medium text-gray-300">
        {t('account.confirmNewPassword')}
        <input
          type={showPassword ? 'text' : 'password'}
          name="confirm-password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
          className={fieldClass}
          placeholder="••••••••"
        />
      </label>

      <label className="flex items-center gap-3 text-sm text-gray-400">
        <input type="checkbox" checked={showPassword} onChange={(event) => setShowPassword(event.target.checked)} className="h-4 w-4 accent-brand" />
        {showPassword ? t('account.hidePassword') : t('account.showPassword')}
      </label>

      {error && <p role="alert" className="border-s-2 border-red-400 px-3 py-2 text-sm leading-5 text-red-200">{error}</p>}

      <div>
        <button type="submit" disabled={isSaving} className="inline-flex rounded-md bg-brand px-5 py-3 text-sm font-bold text-black transition hover:bg-brand-hover disabled:cursor-wait disabled:opacity-60">
          {isSaving ? t('account.updatingPassword') : t('account.updatePassword')}
        </button>
      </div>
    </form>
  );
}

// Rebuild cart items from an order group using the live catalog where possible
// إعادة بناء عناصر السلة من مجموعة الطلبات باستخدام الكتالوج الحالي
async function buildCartItemsFromGroup(group) {
  const [productsResult, printResult, logoResult] = await Promise.all([
    getApparelProducts(),
    getPrintOptions(),
    getLogoOptions(),
  ]);
  const products = productsResult.data || [];
  const printOptions = printResult.data || [];
  const logoOptions = logoResult.data || [];

  return group.orders.flatMap((order) => {
    const details = order.order_details || {};
    const product = products.find((row) => row.id === details.product_id)
      || products.find((row) => row.category === details.garment_category && row.fit_type === details.garment_fit_type);
    if (!product) return [];

    const rawPrint = printOptions.find((row) => row.id === details.print_option_id);
    const printOption = rawPrint
      ? { id: rawPrint.id, name: rawPrint.name, description: rawPrint.description, price: Number(rawPrint.additional_price || 0) }
      : { id: 'none', name: order.print_option || '', description: '', price: 0 };

    const rawLogo = logoOptions.find((row) => row.option_type === (details.logo_option_id || 'none'));
    const logoOption = {
      id: rawLogo?.option_type || details.logo_option_id || 'none',
      optionType: rawLogo?.option_type || details.logo_option_id || 'none',
      name: rawLogo?.label || order.logo_option || '',
      label: rawLogo?.label || order.logo_option || '',
      placements: Array.isArray(rawLogo?.allowed_placements) ? rawLogo.allowed_placements.filter(Boolean) : [],
      price: Number(rawLogo?.additional_price || 0),
    };

    const quantity = Number(details.garment_quantity || 1);
    const unitPrice = Number(product.base_price || 0) + printOption.price + logoOption.price;

    return [{
      id: createCartItemId(),
      productId: product.id,
      category: product.category,
      fit_type: product.fit_type,
      color: details.garment_color || '',
      size: details.garment_size || '',
      quantity,
      base_price: Number(product.base_price || 0),
      designMode: details.design_mode || 'our',
      collectionName: details.collection_name || '',
      collectionDisplayName: details.collection_name || '',
      designName: order.design_name || '',
      designFileName: details.design_file_name || '',
      designImageUrl: details.design_image_url || '',
      customArtwork: null,
      printOption,
      logoOption,
      logoPlacement: details.logo_placement || '',
      customLogo: null,
      printNotes: details.print_notes || '',
      bulkDetails: details.bulk_details || undefined,
      unitPrice,
      totalPrice: unitPrice * quantity,
      isCustomRequest: Boolean(product.is_custom_request),
    }];
  });
}

export default function Account() {
  const { t } = useLanguage();
  const { user, profile, accountStatus, isLoading } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('orders');
  const [orders, setOrders] = useState(null);
  const [imageUrls, setImageUrls] = useState({});
  const [loadError, setLoadError] = useState('');
  const [rebuildingId, setRebuildingId] = useState(null);

  const userId = user?.id;

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;

    const loadOrders = async () => {
      const { data, error } = await getCustomerOrders(userId);
      if (cancelled) return;
      if (error) {
        setLoadError(error.message || String(error));
        setOrders([]);
        return;
      }

      const rows = data || [];
      setOrders(rows);

      const paths = rows.flatMap((order) => [
        order.order_details?.design_image_path,
        order.order_details?.logo_image_path,
      ].filter(Boolean));
      if (!paths.length) return;

      const { data: urls } = await getOrderImageUrls(paths);
      if (!cancelled && urls) setImageUrls(urls);
    };

    loadOrders();
    return () => { cancelled = true; };
  }, [userId]);

  const groups = useMemo(() => groupOrders(orders || []), [orders]);
  const isFrozen = accountStatus === 'frozen';

  const handleOrderAgain = async (group) => {
    setRebuildingId(group.id);
    try {
      const items = await buildCartItemsFromGroup(group);
      if (!items.length) {
        toast.error(t('account.orderAgainError'));
        return;
      }
      const cart = readCart();
      writeCart({ ...cart, items: [...cart.items, ...items] });
      toast.success(t('account.orderAgainAdded'));
      navigate('/cart');
    } catch {
      toast.error(t('account.orderAgainError'));
    } finally {
      setRebuildingId(null);
    }
  };

  const handleWhatsApp = (group) => {
    const url = getWhatsAppUrl(t('account.whatsappOrderMessage', { ref: shortRef(group.id) }));
    if (!url) {
      toast.error(t('contact.whatsappError'));
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  if (isLoading) {
    return (
      <main className="min-h-[70vh] bg-obsidian px-5 py-12 sm:px-8 lg:px-14">
        <div className="mx-auto max-w-5xl space-y-6">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full max-w-md" />
          <Skeleton className="h-64 w-full" />
        </div>
      </main>
    );
  }

  if (!user) {
    return <Navigate to={`/login?redirect=${encodeURIComponent('/account')}`} replace />;
  }

  const displayName = profile?.full_name?.trim() || user.email?.split('@')[0] || '';
  const initial = (displayName.trim()[0] || '?').toUpperCase();
  const email = user.email || '';

  const tabs = [
    { id: 'orders', label: t('account.tabOrders') },
    { id: 'profile', label: t('account.tabProfile') },
    { id: 'security', label: t('account.tabSecurity') },
  ];

  return (
    <main className="min-h-screen bg-obsidian px-5 py-12 text-white sm:px-8 lg:px-14">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-wrap items-center gap-5 rounded-2xl border border-border-subtle bg-surface p-6">
          <span aria-hidden="true" className="grid h-16 w-16 shrink-0 place-items-center rounded-full border border-brand/40 bg-brand/10 text-2xl font-bold text-brand">
            {initial}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand">{t('account.eyebrow')}</p>
            <h1 className="mt-1.5 truncate text-2xl font-extrabold sm:text-3xl">{displayName}</h1>
            <p className="mt-1 truncate text-sm text-gray-500">{email}</p>
          </div>
          <AccountStatusPill isFrozen={isFrozen} />
        </header>

        {isFrozen && (
          <p role="alert" className="mt-5 rounded-xl border border-amber-300/25 bg-amber-300/5 px-4 py-3 text-sm leading-6 text-amber-200">{t('account.frozenBanner')}</p>
        )}

        <div className="mt-8 flex flex-wrap gap-2 border-b border-border-subtle">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-current={activeTab === tab.id}
              className={`-mb-px rounded-t-lg border-b-2 px-4 py-3 text-sm font-semibold transition ${activeTab === tab.id ? 'border-brand text-white' : 'border-transparent text-gray-500 hover:text-gray-300'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {activeTab === 'orders' && (
            <div className="space-y-6">
              {loadError && <p role="alert" className="border-s-2 border-red-400 px-3 py-2 text-sm leading-5 text-red-200">{t('account.loadError')}</p>}

              {orders === null && !loadError && (
                <div className="space-y-6">
                  <Skeleton className="h-72 w-full" />
                  <Skeleton className="h-72 w-full" />
                </div>
              )}

              {orders !== null && !groups.length && (
                <section className="grid place-items-center rounded-2xl border border-border-subtle bg-surface py-16 text-center">
                  <div>
                    <p className="text-lg font-semibold text-white">{t('account.ordersEmpty')}</p>
                    <p className="mt-2 text-sm text-gray-500">{t('account.ordersEmptyHint')}</p>
                    <Link to="/custom?new=1" className="mt-5 inline-flex rounded-md bg-brand px-4 py-3 text-sm font-bold text-black transition hover:bg-brand-hover">
                      {t('account.startDesign')}
                    </Link>
                  </div>
                </section>
              )}

              {groups.map((group) => (
                <OrderGroupCard
                  key={group.id}
                  group={group}
                  imageUrls={imageUrls}
                  onOrderAgain={handleOrderAgain}
                  onWhatsApp={handleWhatsApp}
                  isRebuilding={rebuildingId === group.id}
                />
              ))}
            </div>
          )}

          {activeTab === 'profile' && (
            <section className="rounded-2xl border border-border-subtle bg-surface p-6 sm:p-8">
              <h2 className="text-xl font-bold text-white">{t('account.profileTitle')}</h2>
              <div className="mt-6">
                <ProfileForm key={`${profile?.id || user.id}-${profile?.updated_at || ''}`} profile={profile} email={email} />
              </div>
            </section>
          )}

          {activeTab === 'security' && (
            <section className="rounded-2xl border border-border-subtle bg-surface p-6 sm:p-8">
              <PasswordForm />
            </section>
          )}
        </div>

        <p className="mt-10 text-center text-xs text-gray-600">{t('account.subtitle')}</p>
      </div>
    </main>
  );
}
