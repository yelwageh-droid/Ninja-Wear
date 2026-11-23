import { useEffect, useState } from 'react';
import {
  addApparelProduct,
  getAdminApparelProducts,
  updateApparelProduct,
} from '../../services/apparelService.js';

const emptyForm = {
  category: '',
  fit_type: '',
  sizes: '',
  colors: '',
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

function ApparelFormModal({ garment, onClose, onSubmit, isSaving, error }) {
  const [form, setForm] = useState(() => garment ? {
    category: garment.category || '',
    fit_type: garment.fit_type || '',
    sizes: garment.sizes.join(', '),
    colors: garment.colors.join(', '),
    base_price: garment.base_price ?? '',
    image_url: garment.image_url || '',
    is_custom_request: garment.is_custom_request,
  } : emptyForm);

  const handleChange = (event) => {
    const { name, value, checked, type } = event.target;
    setForm((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const garmentData = {
      category: form.category.trim(),
      fit_type: form.fit_type.trim(),
      sizes: form.sizes.split(',').map((s) => s.trim()).filter(Boolean),
      colors: form.colors.split(',').map((s) => s.trim()).filter(Boolean),
      base_price: Number(form.base_price),
      image_url: form.image_url.trim() || null,
      is_custom_request: form.is_custom_request,
      is_active: garment?.is_active ?? true,
    };
    onSubmit(garmentData);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button type="button" aria-label="Close add garment form" onClick={onClose} className="absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm" />
      <section role="dialog" aria-modal="true" aria-labelledby="add-garment-title" className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-white/10 bg-[#0e0e11] shadow-2xl shadow-black/50">
        <header className="flex items-start justify-between gap-5 border-b border-white/10 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-300">Apparel Catalog</p>
            <h2 id="add-garment-title" className="mt-1 text-xl font-bold text-white">{garment ? 'Edit Garment' : 'Add New Garment'}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={isSaving} className="flex h-9 w-9 items-center justify-center border border-white/10 text-lg text-gray-400 transition hover:border-white/30 hover:text-white disabled:opacity-50" aria-label="Close">×</button>
        </header>
        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-300">Category
              <input name="category" value={form.category} onChange={handleChange} required className="mt-2 w-full rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-300" placeholder="T-Shirt" />
            </label>
            <label className="text-sm font-medium text-gray-300">Fit Type
              <input name="fit_type" value={form.fit_type} onChange={handleChange} required className="mt-2 w-full rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-300" placeholder="Oversized" />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-300">Sizes
              <input name="sizes" value={form.sizes} onChange={handleChange} className="mt-2 w-full rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-300" placeholder="S, M, L, XL" />
              <span className="mt-2 block text-xs text-gray-500">Comma separated sizes.</span>
            </label>
            <label className="text-sm font-medium text-gray-300">Colors
              <input name="colors" value={form.colors} onChange={handleChange} className="mt-2 w-full rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-300" placeholder="Black, White, Red" />
              <span className="mt-2 block text-xs text-gray-500">Comma separated colors.</span>
            </label>
          </div>
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
            <span><span className="block text-sm font-semibold text-gray-200">Custom / bulk request</span><span className="mt-1 block text-xs leading-5 text-gray-500">Show as custom order instead of standard catalog garment.</span></span>
          </label>
          {error && <p role="alert" className="border-s-2 border-red-400 px-3 py-2 text-sm leading-5 text-red-200">{error}</p>}
          <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-5">
            <button type="button" onClick={onClose} disabled={isSaving} className="rounded-md border border-white/15 px-4 py-3 text-sm font-semibold text-gray-300 transition hover:border-white/40 hover:text-white disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={isSaving} className="rounded-md bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-red-100 disabled:cursor-wait disabled:opacity-60">{isSaving ? 'Saving...' : garment ? 'Save Changes' : 'Add Garment'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function ApparelManager() {
  const [garments, setGarments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [notice, setNotice] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGarment, setEditingGarment] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingGarmentId, setPendingGarmentId] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const loadGarments = async () => {
      const { data, error } = await getAdminApparelProducts();
      if (cancelled) return;
      if (error) setLoadError(getErrorMessage(error));
      else setGarments(data);
      setIsLoading(false);
    };

    loadGarments();
    return () => { cancelled = true; };
  }, []);

  const handleVisibilityChange = async (garment) => {
    setPendingGarmentId(garment.id);
    setActionError('');
    setNotice('');
    const { data, error } = await updateApparelProduct(garment.id, { is_active: !garment.is_active });
    if (error) setActionError(getErrorMessage(error));
    else {
      setGarments((current) => current.map((item) => (item.id === data.id ? data : item)));
      setNotice(`${data.category} ${data.fit_type} is now ${data.is_active ? 'visible' : 'hidden'}.`);
    }
    setPendingGarmentId(null);
  };

  const handleSaveGarment = async (garmentData) => {
    setIsSaving(true);
    setActionError('');
    setNotice('');
    const { data, error } = editingGarment
      ? await updateApparelProduct(editingGarment.id, garmentData)
      : await addApparelProduct(garmentData);
    if (error) {
      setActionError(getErrorMessage(error));
    } else {
      setGarments((current) => editingGarment
        ? current.map((item) => (item.id === data.id ? data : item))
        : [data, ...current]);
      setIsModalOpen(false);
      setEditingGarment(null);
      setNotice(editingGarment
        ? `${data.category} ${data.fit_type} was updated.`
        : `${data.category} ${data.fit_type} was added to the catalog.`);
    }
    setIsSaving(false);
  };

  const activeCount = garments.filter((garment) => garment.is_active).length;

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-300">Apparel catalog</p>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Apparel Catalog</h2>
          <p className="mt-2 text-sm text-gray-500">Manage supported garments and bulk custom requests.</p>
        </div>
        <button type="button" onClick={() => { setActionError(''); setEditingGarment(null); setIsModalOpen(true); }} className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-3 text-sm font-bold text-black transition hover:bg-red-100">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
          Add New Garment
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-white/10 py-3 text-sm">
        <span className="text-gray-400">Total records <strong className="ms-2 text-white">{garments.length}</strong></span>
        <span className="text-gray-400">Visible <strong className="ms-2 text-emerald-200">{activeCount}</strong></span>
        <span className="text-gray-400">Hidden <strong className="ms-2 text-gray-300">{garments.length - activeCount}</strong></span>
      </div>

      {loadError && <p role="alert" className="border-s-2 border-red-400 px-4 py-3 text-sm text-red-200">Could not load garments: {loadError}</p>}
      {actionError && <p role="alert" className="border-s-2 border-red-400 px-4 py-3 text-sm text-red-200">{actionError}</p>}
      {notice && <p role="status" className="border-s-2 border-emerald-400 px-4 py-3 text-sm text-emerald-200">{notice}</p>}

      <section className="border border-white/10 bg-[#0e0e11]">
        {isLoading ? <p className="px-5 py-12 text-center text-sm text-gray-500">Loading garment catalog...</p> : loadError ? null : garments.length ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-240 text-left text-sm">
              <thead className="bg-white/2.5 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold">Garment</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Fit Type</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Sizes</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Colors</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Base price</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Type</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Visibility</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {garments.map((garment) => (
                  <tr key={garment.id} className="transition-colors hover:bg-white/2.5">
                    <td className="px-5 py-4">
                      <div className="flex min-w-52 items-center gap-3">
                        {garment.image_url ? <img src={garment.image_url} alt="" loading="lazy" className="h-11 w-11 rounded-md border border-white/10 bg-white/5 object-contain p-1" /> : <span className="flex h-11 w-11 items-center justify-center rounded-md border border-white/10 bg-white/5 text-xs font-bold text-gray-500">NW</span>}
                        <div className="min-w-0"><p className="font-semibold text-white">{garment.category}</p><p className="mt-1 truncate text-xs text-gray-500">{garment.fit_type}</p></div>
                      </div>
                    </td>
                    <td className="px-5 py-4">{garment.fit_type}</td>
                    <td className="px-5 py-4"><div className="flex max-w-80 flex-wrap gap-1.5">{garment.sizes.length ? garment.sizes.map((size, i) => <span key={`${size}-${i}`} className="rounded border border-white/10 bg-white/3 px-2 py-1 text-xs text-gray-400">{size}</span>) : <span className="text-xs text-gray-600">No sizes</span>}</div></td>
                    <td className="px-5 py-4"><div className="flex max-w-80 flex-wrap gap-1.5">{garment.colors.length ? garment.colors.map((color, i) => <span key={`${color}-${i}`} className="rounded border border-white/10 bg-white/3 px-2 py-1 text-xs text-gray-400">{color}</span>) : <span className="text-xs text-gray-600">No colors</span>}</div></td>
                    <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-gray-200">{formatPrice(garment.base_price)}</td>
                    <td className="whitespace-nowrap px-5 py-4"><span className={`rounded border px-2 py-1 text-xs font-semibold ${garment.is_custom_request ? 'border-amber-300/20 bg-amber-300/10 text-amber-200' : 'border-sky-300/20 bg-sky-300/10 text-sky-200'}`}>{garment.is_custom_request ? 'Custom request' : 'Standard'}</span></td>
                    <td className="whitespace-nowrap px-5 py-4">
                      <button type="button" role="switch" aria-checked={Boolean(garment.is_active)} aria-label={`${garment.is_active ? 'Hide' : 'Show'} ${garment.category} ${garment.fit_type}`} disabled={pendingGarmentId === garment.id} onClick={() => handleVisibilityChange(garment)} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:cursor-wait disabled:opacity-60 ${garment.is_active ? 'bg-emerald-400/80' : 'bg-white/15'}`}>
                        <span className={`h-4 w-4 rounded-full bg-white transition-transform ${garment.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                      <span className={`ms-2 text-xs ${garment.is_active ? 'text-emerald-200' : 'text-gray-500'}`}>{garment.is_active ? 'Visible' : 'Hidden'}</span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <button type="button" onClick={() => { setActionError(''); setEditingGarment(garment); setIsModalOpen(true); }} className="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-gray-300 transition hover:border-red-300/50 hover:text-white">Edit</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="px-5 py-12 text-center text-sm text-gray-500">No garment records found.</p>}
      </section>

      {isModalOpen && <ApparelFormModal garment={editingGarment} onClose={() => { setIsModalOpen(false); setEditingGarment(null); }} onSubmit={handleSaveGarment} isSaving={isSaving} error={actionError} />}
    </div>
  );
}
