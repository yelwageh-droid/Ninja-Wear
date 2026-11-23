import { useEffect, useState } from 'react';
import {
  getAdminPrintOptions,
  savePrintOption,
  deletePrintOption,
  getAdminLogoOptions,
  saveLogoOption,
  deleteLogoOption,
} from '../../services/apparelService.js';

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

function initialForm(type, editing) {
  const form = editing
    ? { ...editing }
    : type === 'print'
      ? { name: '', description: '', additional_price: '', sort_order: '0', is_active: true }
      : { option_type: 'none', label: '', allowed_placements: '', additional_price: '', is_active: true };

  if (type === 'logo') {
    // logo_options has no name/description columns and allowed_placements is a text[] in Supabase.
    // جدول logo_options لا يحتوي عمودي name/description و_allowed_placements مصفوفة في Supabase
    const { name: _name, description: _description, ...logoForm } = form;
    logoForm.allowed_placements = Array.isArray(logoForm.allowed_placements)
      ? logoForm.allowed_placements.join(', ')
      : String(logoForm.allowed_placements || '');
    return logoForm;
  }
  return form;
}

function OptionModal({ type, onClose, onSubmit, isSaving, editing, error }) {
  const [form, setForm] = useState(() => initialForm(type, editing));

  const handleChange = (event) => {
    const { name, value, checked, type: inputType } = event.target;
    setForm((current) => ({ ...current, [name]: inputType === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    const data = type === 'print'
      ? { ...form, sort_order: Number(form.sort_order || 0) }
      : {
          ...form,
          allowed_placements: String(form.allowed_placements || '').split(',').map((p) => p.trim()).filter(Boolean),
          additional_price: Number(form.additional_price || 0),
        };
    onSubmit(data);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button type="button" aria-label="Close option form" onClick={onClose} className="absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm" />
      <section role="dialog" aria-modal="true" aria-labelledby="option-modal-title" className="relative z-10 max-h-[90vh] w-full max-w-xl overflow-y-auto border border-white/10 bg-[#0e0e11] shadow-2xl shadow-black/50">
        <header className="flex items-start justify-between gap-5 border-b border-white/10 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-300">{type === 'print' ? 'Print Placements' : 'Logo Options'}</p>
            <h2 id="option-modal-title" className="mt-1 text-xl font-bold text-white">{editing ? 'Edit Option' : 'Add Option'}</h2>
          </div>
          <button type="button" onClick={onClose} disabled={isSaving} className="flex h-9 w-9 items-center justify-center border border-white/10 text-lg text-gray-400 transition hover:border-white/30 hover:text-white disabled:opacity-50" aria-label="Close">×</button>
        </header>
        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
          {type === 'print' && (
            <>
              <label className="block text-sm font-medium text-gray-300">Name
                <input name="name" value={form.name || ''} onChange={handleChange} required className="mt-2 w-full rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-300" />
              </label>
              <label className="block text-sm font-medium text-gray-300">Description
                <textarea name="description" value={form.description || ''} onChange={handleChange} rows="3" className="mt-2 w-full resize-y rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-300" />
              </label>
            </>
          )}
          {type === 'print' && (
            <>
              <label className="block text-sm font-medium text-gray-300">Additional price (EGP)
                <input type="number" name="additional_price" value={form.additional_price || ''} onChange={handleChange} min="0" step="1" className="mt-2 w-full rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-300" />
              </label>
              <label className="block text-sm font-medium text-gray-300">Sort order
                <input type="number" name="sort_order" value={form.sort_order || '0'} onChange={handleChange} min="0" step="1" className="mt-2 w-full rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-300" />
              </label>
            </>
          )}
          {type === 'logo' && (
            <>
              <label className="block text-sm font-medium text-gray-300">Option type
                <select name="option_type" value={form.option_type || 'none'} onChange={handleChange} className="mt-2 w-full rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-300">
                  <option value="none">None</option>
                  <option value="brand_logo">Brand Logo</option>
                  <option value="custom_upload">Custom Upload</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-gray-300">Label
                <input name="label" value={form.label || ''} onChange={handleChange} className="mt-2 w-full rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-300" placeholder="e.g., Ninja Wear Logo" />
              </label>
              <label className="block text-sm font-medium text-gray-300">Allowed placements
                <input name="allowed_placements" value={form.allowed_placements || ''} onChange={handleChange} className="mt-2 w-full rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-300" placeholder="front-chest, full-front, oversized-back" />
                <span className="mt-2 block text-xs text-gray-500">Comma separated placement IDs.</span>
              </label>
              <label className="block text-sm font-medium text-gray-300">Additional price (EGP)
                <input type="number" name="additional_price" value={form.additional_price || ''} onChange={handleChange} min="0" step="1" className="mt-2 w-full rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-300" />
              </label>
            </>
          )}
          <label className="flex cursor-pointer items-start gap-3 border border-white/10 bg-[#111116] px-4 py-4">
            <input type="checkbox" name="is_active" checked={form.is_active ?? true} onChange={handleChange} className="mt-0.5 h-4 w-4 accent-red-400" />
            <span className="block text-sm font-semibold text-gray-200">Active</span>
          </label>
          {error && <p role="alert" className="border-s-2 border-red-400 px-3 py-2 text-sm leading-5 text-red-200">{error}</p>}
          <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-5">
            <button type="button" onClick={onClose} disabled={isSaving} className="rounded-md border border-white/15 px-4 py-3 text-sm font-semibold text-gray-300 transition hover:border-white/40 hover:text-white disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={isSaving} className="rounded-md bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-red-100 disabled:cursor-wait disabled:opacity-60">{isSaving ? 'Saving...' : editing ? 'Save Changes' : 'Add Option'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function PrintLogoPricing() {
  const [printOptions, setPrintOptions] = useState([]);
  const [logoOptions, setLogoOptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [printError, setPrintError] = useState('');
  const [logoError, setLogoError] = useState('');
  const [notice, setNotice] = useState('');

  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [isLogoModalOpen, setIsLogoModalOpen] = useState(false);
  const [editingPrint, setEditingPrint] = useState(null);
  const [editingLogo, setEditingLogo] = useState(null);
  const [isSavingPrint, setIsSavingPrint] = useState(false);
  const [isSavingLogo, setIsSavingLogo] = useState(false);
  const [printSaveError, setPrintSaveError] = useState('');
  const [logoSaveError, setLogoSaveError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadData = async () => {
      const [printResult, logoResult] = await Promise.all([getAdminPrintOptions(), getAdminLogoOptions()]);
      if (cancelled) return;
      if (printResult.error) setPrintError(getErrorMessage(printResult.error));
      else setPrintOptions(printResult.data);
      if (logoResult.error) setLogoError(getErrorMessage(logoResult.error));
      else setLogoOptions(logoResult.data);
      setIsLoading(false);
    };
    loadData();
    return () => { cancelled = true; };
  }, []);

  const handleSavePrint = async (data) => {
    setIsSavingPrint(true);
    setPrintSaveError('');
    const { error } = editingPrint ? await savePrintOption({ ...data, id: editingPrint.id }) : await savePrintOption(data);
    if (error) setPrintSaveError(getErrorMessage(error));
    else {
      setNotice(`${data.name} was saved.`);
      const refreshed = await getAdminPrintOptions();
      if (!refreshed.error) setPrintOptions(refreshed.data);
      setIsPrintModalOpen(false);
      setEditingPrint(null);
    }
    setIsSavingPrint(false);
  };

  const handleDeletePrint = async (id) => {
    const { error } = await deletePrintOption(id);
    if (error) setPrintError(getErrorMessage(error));
    else {
      setPrintOptions((current) => current.filter((item) => item.id !== id));
      setNotice('Print option deleted.');
    }
  };

  const handleSaveLogo = async (data) => {
    setIsSavingLogo(true);
    setLogoSaveError('');
    const { error } = editingLogo ? await saveLogoOption({ ...data, id: editingLogo.id }) : await saveLogoOption(data);
    if (error) setLogoSaveError(getErrorMessage(error));
    else {
      setNotice(`${data.label || data.option_type} was saved.`);
      const refreshed = await getAdminLogoOptions();
      if (!refreshed.error) setLogoOptions(refreshed.data);
      setIsLogoModalOpen(false);
      setEditingLogo(null);
    }
    setIsSavingLogo(false);
  };

  const handleDeleteLogo = async (id) => {
    const { error } = await deleteLogoOption(id);
    if (error) setLogoError(getErrorMessage(error));
    else {
      setLogoOptions((current) => current.filter((item) => item.id !== id));
      setNotice('Logo option deleted.');
    }
  };

  if (isLoading) {
    return <p className="py-12 text-center text-sm text-gray-500">Loading print & logo options...</p>;
  }

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-300">Print & Logo Pricing</p>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Print & Logo Pricing</h2>
          <p className="mt-2 text-sm text-gray-500">Manage print placements and logo branding options.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="border border-white/10 bg-[#0e0e11]">
          <div className="border-b border-white/10 p-5 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white">Print Placements</h3>
              <p className="mt-1 text-xs text-gray-500">Configure where designs can be printed.</p>
            </div>
            <button type="button" onClick={() => { setPrintSaveError(''); setEditingPrint(null); setIsPrintModalOpen(true); }} className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-3 text-sm font-bold text-black transition hover:bg-red-100">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              Add Placement
            </button>
          </div>
          {printError && <p role="alert" className="p-4 text-sm text-red-300">{printError}</p>}
          {notice && <p role="status" className="p-4 text-sm text-emerald-200">{notice}</p>}
          {printOptions.length ? (
            <div className="divide-y divide-white/6">
              {printOptions.map((option) => (
                <div key={option.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">{option.name}</p>
                    <p className="mt-1 text-xs text-gray-500">{option.description || '—'}</p>
                  </div>
                  <div className="flex items-end gap-2 text-sm">
                    <span className="text-gray-200">{formatPrice(option.additional_price)}</span>
                    <span className="text-xs text-gray-500">sort {option.sort_order}</span>
                  </div>
                  <div className="flex gap-2 sm:ml-0">
                    <button type="button" onClick={() => { setPrintSaveError(''); setEditingPrint(option); setIsPrintModalOpen(true); }} className="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-gray-300 transition hover:border-red-300/50 hover:text-white">Edit</button>
                    <button type="button" onClick={() => handleDeletePrint(option.id)} className="rounded-md border border-red-300/20 px-3 py-2 text-xs font-semibold text-red-200 transition hover:border-red-300/50">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="px-5 py-12 text-center text-sm text-gray-500">No print placements configured.</p>}
        </section>

        <section className="border border-white/10 bg-[#0e0e11]">
          <div className="border-b border-white/10 p-5 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white">Logo Options</h3>
              <p className="mt-1 text-xs text-gray-500">Configure logo branding choices.</p>
            </div>
            <button type="button" onClick={() => { setLogoSaveError(''); setEditingLogo(null); setIsLogoModalOpen(true); }} className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-3 text-sm font-bold text-black transition hover:bg-red-100">
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
              Add Logo Option
            </button>
          </div>
          {logoError && <p role="alert" className="p-4 text-sm text-red-300">{logoError}</p>}
          {logoOptions.length ? (
            <div className="divide-y divide-white/6">
              {logoOptions.map((option) => (
                <div key={option.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">{option.label || '—'}</p>
                    <p className="mt-1 text-xs text-gray-500">{option.option_type || '—'}</p>
                    <p className="mt-1 text-xs text-gray-500">{(option.allowed_placements || []).join(', ') || 'No placements configured'}</p>
                  </div>
                  <div className="flex items-end gap-2 text-sm">
                    <span className="text-gray-200">{formatPrice(option.additional_price)}</span>
                  </div>
                  <div className="flex gap-2 sm:ml-0">
                    <button type="button" onClick={() => { setLogoSaveError(''); setEditingLogo(option); setIsLogoModalOpen(true); }} className="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-gray-300 transition hover:border-red-300/50 hover:text-white">Edit</button>
                    <button type="button" onClick={() => handleDeleteLogo(option.id)} className="rounded-md border border-red-300/20 px-3 py-2 text-xs font-semibold text-red-200 transition hover:border-red-300/50">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="px-5 py-12 text-center text-sm text-gray-500">No logo options configured.</p>}
        </section>
      </div>

      {isPrintModalOpen && <OptionModal type="print" onClose={() => setIsPrintModalOpen(false)} onSubmit={handleSavePrint} isSaving={isSavingPrint} editing={editingPrint} error={printSaveError} />}
      {isLogoModalOpen && <OptionModal type="logo" onClose={() => setIsLogoModalOpen(false)} onSubmit={handleSaveLogo} isSaving={isSavingLogo} editing={editingLogo} error={logoSaveError} />}
    </div>
  );
}
