import { useEffect, useState } from 'react';
import { addLaptop, getAdminLaptops, updateLaptop } from '../../data/catalog.js';

const emptyForm = {
  brand: '',
  series: '',
  models: '',
  base_price: '',
  image_url: '',
  is_custom_request: false,
};

function getErrorMessage(error) {
  return typeof error === 'string' ? error : error?.message || 'Something went wrong. Please try again.';
}

function formatPrice(price) {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(Number(price || 0));
}

function LaptopFormModal({ laptop, onClose, onSubmit, isSaving, error }) {
  const [form, setForm] = useState(() => laptop ? {
    brand: laptop.brand || '',
    series: laptop.series || '',
    models: laptop.models.join(', '),
    base_price: laptop.base_price ?? '',
    image_url: laptop.image_url || '',
    is_custom_request: laptop.is_custom_request,
  } : emptyForm);

  // Keep form state local until its validated catalog row is submitted / إبقاء حالة النموذج محلية حتى إرسال صف الكتالوج بعد التحقق
  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const laptopData = {
      brand: form.brand.trim(),
      series: form.series.trim(),
      models: form.models.split(',').map((model) => model.trim()).filter(Boolean),
      base_price: Number(form.base_price),
      image_url: form.image_url.trim() || null,
      is_custom_request: form.is_custom_request,
      is_active: laptop?.is_active ?? true,
    };
    onSubmit(laptopData);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button type="button" aria-label="Close add laptop form" onClick={onClose} className="absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm" />
      <section role="dialog" aria-modal="true" aria-labelledby="add-laptop-title" className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-white/10 bg-[#0e0e11] shadow-2xl shadow-black/50">
        <header className="flex items-start justify-between gap-5 border-b border-white/10 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-300">Catalog</p>
            <h2 id="add-laptop-title" className="mt-1 text-xl font-bold text-white">{laptop ? 'Edit Laptop' : 'Add New Laptop'}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={isSaving} className="flex h-9 w-9 items-center justify-center border border-white/10 text-lg text-gray-400 transition hover:border-white/30 hover:text-white disabled:opacity-50" aria-label="Close">×</button>
        </header>
        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-300">Brand
              <input name="brand" value={form.brand} onChange={handleChange} required className="mt-2 w-full rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-300" placeholder="Lenovo" />
            </label>
            <label className="text-sm font-medium text-gray-300">Series
              <input name="series" value={form.series} onChange={handleChange} required className="mt-2 w-full rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-300" placeholder="Legion 7" />
            </label>
          </div>
          <label className="block text-sm font-medium text-gray-300">Models
            <input name="models" value={form.models} onChange={handleChange} className="mt-2 w-full rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-300" placeholder="16IMH05, 16ACH" />
            <span className="mt-2 block text-xs text-gray-500">Separate multiple model names with commas.</span>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-300">Base price (EGP)
              <input type="number" name="base_price" value={form.base_price} onChange={handleChange} min="0" step="1" required className="mt-2 w-full rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-300" placeholder="500" />
            </label>
            <label className="text-sm font-medium text-gray-300">Image URL
              <input type="url" name="image_url" value={form.image_url} onChange={handleChange} className="mt-2 w-full rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-300" placeholder="https://..." />
            </label>
          </div>
          <label className="flex cursor-pointer items-start gap-3 border border-white/10 bg-[#111116] px-4 py-4">
            <input type="checkbox" name="is_custom_request" checked={form.is_custom_request} onChange={handleChange} className="mt-0.5 h-4 w-4 accent-red-400" />
            <span><span className="block text-sm font-semibold text-gray-200">Custom request item</span><span className="mt-1 block text-xs leading-5 text-gray-500">Show this as the custom-fit request option instead of a standard laptop.</span></span>
          </label>
          {error && <p role="alert" className="border-s-2 border-red-400 px-3 py-2 text-sm leading-5 text-red-200">{error}</p>}
          <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-5">
            <button type="button" onClick={onClose} disabled={isSaving} className="rounded-md border border-white/15 px-4 py-3 text-sm font-semibold text-gray-300 transition hover:border-white/40 hover:text-white disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={isSaving} className="rounded-md bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-red-100 disabled:cursor-wait disabled:opacity-60">{isSaving ? 'Saving...' : laptop ? 'Save Changes' : 'Add Laptop'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function LaptopsManager() {
  const [laptops, setLaptops] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLaptop, setEditingLaptop] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingLaptopId, setPendingLaptopId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadLaptops = async () => {
      const { data, error } = await getAdminLaptops();
      if (cancelled) return;
      if (error) setLoadError(getErrorMessage(error));
      else setLaptops(data);
      setIsLoading(false);
    };

    loadLaptops();
    return () => { cancelled = true; };
  }, []);

  // Persist visibility changes through the catalog API / حفظ تغييرات الظهور عبر واجهة الكتالوج
  const handleVisibilityChange = async (laptop) => {
    setPendingLaptopId(laptop.id);
    setActionError('');
    setNotice('');
    const { data, error } = await updateLaptop(laptop.id, { is_active: !laptop.is_active });
    if (error) setActionError(getErrorMessage(error));
    else {
      setLaptops((current) => current.map((item) => (item.id === data.id ? data : item)));
      setNotice(`${data.brand} ${data.series} is now ${data.is_active ? 'visible' : 'hidden'}.`);
    }
    setPendingLaptopId(null);
  };

  // Submit normalized model arrays and defaults to Supabase / إرسال مصفوفة الموديلات بعد تهيئتها مع القيم الافتراضية إلى Supabase
  const handleSaveLaptop = async (laptopData) => {
    setIsSaving(true);
    setActionError('');
    setNotice('');
    const { data, error } = editingLaptop
      ? await updateLaptop(editingLaptop.id, laptopData)
      : await addLaptop(laptopData);
    if (error) {
      setActionError(getErrorMessage(error));
    } else {
      setLaptops((current) => editingLaptop
        ? current.map((item) => (item.id === data.id ? data : item))
        : [data, ...current]);
      setIsModalOpen(false);
      setEditingLaptop(null);
      setNotice(editingLaptop
        ? `${data.brand} ${data.series} was updated.`
        : `${data.brand} ${data.series} was added to the catalog.`);
    }
    setIsSaving(false);
  };

  const activeCount = laptops.filter((laptop) => laptop.is_active).length;

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-300">Product catalog</p>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Laptops Catalog</h2>
          <p className="mt-2 text-sm text-gray-500">Manage supported devices and custom-fit requests.</p>
        </div>
        <button type="button" onClick={() => { setActionError(''); setEditingLaptop(null); setIsModalOpen(true); }} className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-3 text-sm font-bold text-black transition hover:bg-red-100">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          Add New Laptop
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-white/10 py-3 text-sm">
        <span className="text-gray-400">Total records <strong className="ms-2 text-white">{laptops.length}</strong></span>
        <span className="text-gray-400">Visible <strong className="ms-2 text-emerald-200">{activeCount}</strong></span>
        <span className="text-gray-400">Hidden <strong className="ms-2 text-gray-300">{laptops.length - activeCount}</strong></span>
      </div>

      {loadError && <p role="alert" className="border-s-2 border-red-400 px-4 py-3 text-sm text-red-200">Could not load laptops: {loadError}</p>}
      {actionError && <p role="alert" className="border-s-2 border-red-400 px-4 py-3 text-sm text-red-200">{actionError}</p>}
      {notice && <p role="status" className="border-s-2 border-emerald-400 px-4 py-3 text-sm text-emerald-200">{notice}</p>}

      <section className="border border-white/10 bg-[#0e0e11]">
        {isLoading ? <p className="px-5 py-12 text-center text-sm text-gray-500">Loading laptop catalog...</p> : loadError ? null : laptops.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-240 text-left text-sm">
              <thead className="bg-white/2.5 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Laptop</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Models</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Base price</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Type</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Visibility</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {laptops.map((laptop) => (
                  <tr key={laptop.id} className="transition-colors hover:bg-white/2.5">
                    <td className="px-5 py-4">
                      <div className="flex min-w-52 items-center gap-3">
                        {laptop.image_url ? <img src={laptop.image_url} alt="" loading="lazy" className="h-11 w-11 rounded-md border border-white/10 bg-white/5 object-contain p-1" /> : <span className="flex h-11 w-11 items-center justify-center rounded-md border border-white/10 bg-white/5 text-xs font-bold text-gray-500">NS</span>}
                        <div className="min-w-0"><p className="font-semibold text-white">{laptop.brand}</p><p className="mt-1 truncate text-xs text-gray-500">{laptop.series}</p></div>
                      </div>
                    </td>
                    <td className="px-5 py-4"><div className="flex max-w-80 flex-wrap gap-1.5">{laptop.models.length ? laptop.models.map((model, modelIndex) => <span key={`${model}-${modelIndex}`} className="rounded border border-white/10 bg-white/3 px-2 py-1 text-xs text-gray-400">{model}</span>) : <span className="text-xs text-gray-600">No model variants</span>}</div></td>
                    <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-gray-200">{formatPrice(laptop.base_price)}</td>
                    <td className="whitespace-nowrap px-5 py-4"><span className={`rounded border px-2 py-1 text-xs font-semibold ${laptop.is_custom_request ? 'border-amber-300/20 bg-amber-300/10 text-amber-200' : 'border-sky-300/20 bg-sky-300/10 text-sky-200'}`}>{laptop.is_custom_request ? 'Custom request' : 'Standard'}</span></td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <button type="button" role="switch" aria-checked={Boolean(laptop.is_active)} aria-label={`${laptop.is_active ? 'Hide' : 'Show'} ${laptop.brand} ${laptop.series}`} disabled={pendingLaptopId === laptop.id} onClick={() => handleVisibilityChange(laptop)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:cursor-wait disabled:opacity-60 ${laptop.is_active ? 'bg-emerald-400/80' : 'bg-white/15'}`}>
                        <span className={`h-4 w-4 rounded-full bg-white transition-transform ${laptop.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                      <span className={`ms-2 text-xs ${laptop.is_active ? 'text-emerald-200' : 'text-gray-500'}`}>{laptop.is_active ? 'Visible' : 'Hidden'}</span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <button type="button" onClick={() => { setActionError(''); setEditingLaptop(laptop); setIsModalOpen(true); }} className="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-gray-300 transition hover:border-red-300/50 hover:text-white">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="px-5 py-12 text-center text-sm text-gray-500">No laptop records found in AVL_Laptops.</p>}
      </section>

      {isModalOpen && <LaptopFormModal laptop={editingLaptop} onClose={() => { setIsModalOpen(false); setEditingLaptop(null); }} onSubmit={handleSaveLaptop} isSaving={isSaving} error={actionError} />}
    </div>
  );
}
