import { useEffect, useState } from 'react';
import {
  createCollection,
  deleteCollectionImage,
  getCollections,
  getCollectionSkins,
  renameCollectionImage,
  saveCollectionInfo,
  uploadCollectionImages,
} from '../../data/catalog.js';

function getErrorMessage(error) {
  return typeof error === 'string' ? error : error?.message || 'Something went wrong. Please try again.';
}

const emptyCollectionForm = { folderName: '', displayName: '', description: '', badge: '' };

async function loadCollectionCards() {
  const { data, error } = await getCollections();
  if (error) return { data: [], error };

  const collectionCards = await Promise.all(data.map(async (collection) => {
    const { data: skins, error: skinError } = await getCollectionSkins(collection.name);
    return {
      ...collection,
      coverImage: skins[0]?.image || null,
      designCount: skins.length,
      skins,
      skinError,
    };
  }));
  return { data: collectionCards, error: null };
}

function CreateCollectionModal({ onClose, onSubmit, isSaving, error }) {
  const [form, setForm] = useState(emptyCollectionForm);
  const [files, setFiles] = useState([]);

  // Keep the new collection's metadata and initial images in one form / جمع بيانات المجموعة وصورها الأولية في نموذج واحد
  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSubmit(form, files);
  };

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button type="button" aria-label="Close new collection form" onClick={onClose} className="absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm" />
      <section role="dialog" aria-modal="true" aria-labelledby="new-collection-title" className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-y-auto border border-white/10 bg-[#0e0e11] shadow-2xl shadow-black/50">
        <header className="flex items-start justify-between gap-5 border-b border-white/10 px-5 py-4 sm:px-6">
          <div><p className="text-xs font-bold uppercase tracking-[0.16em] text-red-300">Skins storage</p><h2 id="new-collection-title" className="mt-1 text-xl font-bold text-white">Add Collection</h2></div>
          <button type="button" onClick={onClose} disabled={isSaving} className="flex h-9 w-9 items-center justify-center border border-white/10 text-lg text-gray-400 transition hover:border-white/30 hover:text-white disabled:opacity-50" aria-label="Close">×</button>
        </header>
        <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
          <label className="block text-sm font-medium text-gray-300">Storage folder name
            <input name="folderName" value={form.folderName} onChange={handleChange} required pattern="[A-Za-z0-9_-]+" maxLength={60} className="mt-2 w-full rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-300" placeholder="Studio-Ghibli" />
            <span className="mt-2 block text-xs text-gray-500">Letters, numbers, hyphens, and underscores only. This must match the Storage folder.</span>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-gray-300">Display name
              <input name="displayName" value={form.displayName} onChange={handleChange} required maxLength={80} className="mt-2 w-full rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-300" placeholder="Studio Ghibli" />
            </label>
            <label className="text-sm font-medium text-gray-300">Badge
              <input name="badge" value={form.badge} onChange={handleChange} maxLength={32} className="mt-2 w-full rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-300" placeholder="New, Limited..." />
            </label>
          </div>
          <label className="block text-sm font-medium text-gray-300">Description
            <textarea name="description" value={form.description} onChange={handleChange} required rows="3" maxLength={240} className="mt-2 w-full resize-y rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-300" placeholder="Describe this collection" />
          </label>
          <label className="block text-sm font-medium text-gray-300">Collection images
            <input type="file" accept="image/avif,image/gif,image/jpeg,image/png,image/webp" multiple required onChange={(event) => setFiles(Array.from(event.target.files || []))} className="mt-2 block w-full text-sm text-gray-400 file:mr-4 file:rounded-md file:border-0 file:bg-white file:px-4 file:py-2 file:font-bold file:text-black" />
            <span className="mt-2 block text-xs text-gray-500">The first uploaded image is used as the collection cover.</span>
          </label>
          {files.length > 0 && <p className="text-xs text-gray-400">{files.length} image{files.length === 1 ? '' : 's'} selected</p>}
          {error && <p role="alert" className="border-s-2 border-red-400 px-3 py-2 text-sm leading-5 text-red-200">{error}</p>}
          <div className="flex flex-wrap justify-end gap-3 border-t border-white/10 pt-5">
            <button type="button" onClick={onClose} disabled={isSaving} className="rounded-md border border-white/15 px-4 py-3 text-sm font-semibold text-gray-300 transition hover:border-white/40 hover:text-white disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={isSaving || !files.length} className="rounded-md bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-red-100 disabled:cursor-wait disabled:opacity-50">{isSaving ? 'Creating...' : 'Create Collection'}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default function CollectionsManager() {
  const [collections, setCollections] = useState([]);
  const [selectedFolder, setSelectedFolder] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [renamingFile, setRenamingFile] = useState('');
  const [renamingValue, setRenamingValue] = useState('');
  const [busyFile, setBusyFile] = useState('');
  const [loadError, setLoadError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let cancelled = false;

    const loadCollections = async () => {
      const { data, error } = await loadCollectionCards();
      if (cancelled) return;
      if (error) {
        setLoadError(getErrorMessage(error));
        setIsLoading(false);
        return;
      }

      if (!cancelled) {
        setCollections(data);
        setIsLoading(false);
      }
    };

    loadCollections();
    return () => { cancelled = true; };
  }, []);

  const refreshCollectionCards = async () => {
    const { data, error } = await loadCollectionCards();
    if (error) {
      setSaveError(getErrorMessage(error));
      return null;
    }
    setCollections(data);
    return data;
  };

  const handleSelectCollection = (collection) => {
    setSelectedFolder(collection.name);
    setDisplayName(collection.displayName || collection.name);
    setDescription(collection.description || '');
    setBadge(collection.badge || '');
    setSaveError('');
    setNotice('');
  };

  // Save display metadata while preserving the original storage-folder name / حفظ بيانات العرض مع الحفاظ على اسم مجلد التخزين الأصلي
  const handleSubmit = async (event) => {
    event.preventDefault();
    const selectedCollection = collections.find((collection) => collection.name === selectedFolder);
    if (!selectedCollection) return;

    setIsSaving(true);
    setSaveError('');
    setNotice('');
    const { error } = await saveCollectionInfo(selectedFolder, { displayName, description, badge });
    if (error) {
      setSaveError(getErrorMessage(error));
    } else {
      setCollections((current) => current.map((collection) => (
        collection.name === selectedFolder
          ? { ...collection, displayName: displayName.trim(), description: description.trim(), badge: badge.trim() || null }
          : collection
      )));
      setNotice(`${displayName.trim()} was saved.`);
    }
    setIsSaving(false);
  };

  // Create folder images and metadata together, then select the new collection / إنشاء الصور والبيانات معاً ثم تحديد المجموعة الجديدة
  const handleCreateCollection = async (form, files) => {
    setIsSaving(true);
    setSaveError('');
    const { error } = await createCollection(form.folderName.trim(), form, files);
    if (error) {
      setSaveError(getErrorMessage(error));
    } else {
      const refreshed = await refreshCollectionCards();
      setSelectedFolder(form.folderName.trim());
      setDisplayName(form.displayName.trim());
      setDescription(form.description.trim());
      setBadge(form.badge.trim());
      setIsCreateOpen(false);
      setNotice(`${form.displayName.trim()} was created with ${files.length} image${files.length === 1 ? '' : 's'}.`);
      if (refreshed) setLoadError('');
    }
    setIsSaving(false);
  };

  // Upload image files into the selected collection folder / رفع الصور داخل مجلد المجموعة المحددة
  const handleUploadImages = async (event) => {
    const input = event.currentTarget;
    const files = Array.from(input.files || []);
    input.value = '';
    if (!files.length || !selectedFolder) return;
    if (files.some((file) => !file.type.startsWith('image/'))) {
      setSaveError('Choose image files only.');
      return;
    }

    setIsUploading(true);
    setSaveError('');
    const { data, error } = await uploadCollectionImages(selectedFolder, files);
    if (error) setSaveError(getErrorMessage(error));
    else {
      await refreshCollectionCards();
      setNotice(`${data.length} image${data.length === 1 ? '' : 's'} added to ${selectedFolder}.`);
    }
    setIsUploading(false);
  };

  // Move an image to a new name in the same folder / نقل الصورة إلى اسم جديد داخل المجلد نفسه
  const handleRenameImage = async (event, fileName) => {
    event.preventDefault();
    setBusyFile(fileName);
    setSaveError('');
    const { data, error } = await renameCollectionImage(selectedFolder, fileName, renamingValue);
    if (error) setSaveError(getErrorMessage(error));
    else {
      await refreshCollectionCards();
      setRenamingFile('');
      setRenamingValue('');
      setNotice(`${fileName} was renamed to ${data}.`);
    }
    setBusyFile('');
  };

  // Delete an image only after an explicit browser confirmation / حذف الصورة بعد تأكيد صريح من المستخدم
  const handleDeleteImage = async (fileName) => {
    if (!window.confirm(`Delete ${fileName} from ${selectedFolder}?`)) return;
    setBusyFile(fileName);
    setSaveError('');
    const { error } = await deleteCollectionImage(selectedFolder, fileName);
    if (error) setSaveError(getErrorMessage(error));
    else {
      await refreshCollectionCards();
      setRenamingFile('');
      setNotice(`${fileName} was deleted.`);
    }
    setBusyFile('');
  };

  const selectedCollection = collections.find((collection) => collection.name === selectedFolder);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-300">Design library</p>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Collections & Skins</h2>
          <p className="mt-2 text-sm text-gray-500">Browse storage folders and manage their public collection information.</p>
        </div>
        <div className="flex items-center gap-3">
          {!isLoading && !loadError && <span className="border border-white/10 bg-white/3 px-3 py-2 text-xs text-gray-400">{collections.length} folders</span>}
          <button type="button" onClick={() => { setSaveError(''); setIsCreateOpen(true); }} className="inline-flex items-center gap-2 rounded-md bg-white px-4 py-3 text-sm font-bold text-black transition hover:bg-red-100">
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
            Add Collection
          </button>
        </div>
      </div>

      <p className="border-s-2 border-amber-300/60 bg-amber-300/5 px-4 py-3 text-sm leading-6 text-amber-100/80">Collection folders and cover previews come from the Skins storage bucket. Name, description, and badge are saved to COLLECTIONS_INFO.</p>
      {loadError && <p role="alert" className="border-s-2 border-red-400 px-4 py-3 text-sm text-red-200">Could not load collections: {loadError}</p>}
      {saveError && !isCreateOpen && <p role="alert" className="border-s-2 border-red-400 px-4 py-3 text-sm text-red-200">{saveError}</p>}
      {notice && <p role="status" className="border-s-2 border-emerald-400 px-4 py-3 text-sm text-emerald-200">{notice}</p>}

      {isLoading ? <p className="py-12 text-center text-sm text-gray-500">Loading storage folders...</p> : !loadError && collections.length ? (
        <section aria-label="Storage collections" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {collections.map((collection) => (
            <button
              key={collection.id}
              type="button"
              onClick={() => handleSelectCollection(collection)}
              aria-pressed={selectedFolder === collection.name}
              className={`group overflow-hidden border text-start transition-colors ${selectedFolder === collection.name ? 'border-red-300/60 bg-red-300/5' : 'border-white/10 bg-[#0e0e11] hover:border-white/25'}`}
            >
              <div className="relative aspect-16/8 overflow-hidden bg-[#111116]">
                {collection.coverImage ? <img src={collection.coverImage} alt={`${collection.displayName || collection.name} collection cover`} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" /> : <div className="flex h-full items-center justify-center text-xs text-gray-600">No preview image</div>}
                {collection.badge && <span className="absolute inset-s-3 top-3 border border-white/10 bg-black/75 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-red-200">{collection.badge}</span>}
              </div>
              <div className="flex items-start justify-between gap-4 p-4">
                <div className="min-w-0"><p className="truncate font-bold text-white">{collection.displayName || collection.name}</p><p className="mt-1 truncate text-xs text-gray-500">Folder: {collection.name}</p></div>
                <span className="shrink-0 text-xs text-gray-500">{collection.designCount} designs</span>
              </div>
            </button>
          ))}
        </section>
      ) : !loadError ? <p className="border-y border-white/10 py-12 text-center text-sm text-gray-500">No folders found in the Skins bucket.</p> : null}

      {selectedCollection && (
        <section className="border-t border-white/10 pt-7">
          <div className="mb-5">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-amber-300">Collection information</p>
            <h3 className="mt-2 text-xl font-bold text-white">Edit {selectedCollection.name}</h3>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-5 lg:grid-cols-[1fr_1.4fr_1fr_auto] lg:items-end">
            <label className="block text-sm font-medium text-gray-300">Display name
              <input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required maxLength={80} className="mt-2 w-full rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-300" placeholder="Collection name" />
            </label>
            <label className="block text-sm font-medium text-gray-300">Description
              <textarea value={description} onChange={(event) => setDescription(event.target.value)} required rows="2" maxLength={240} className="mt-2 w-full resize-y rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-300" placeholder="Describe this collection" />
            </label>
            <label className="block text-sm font-medium text-gray-300">Badge
              <input value={badge} onChange={(event) => setBadge(event.target.value)} maxLength={32} className="mt-2 w-full rounded-md border border-white/10 bg-[#111116] px-4 py-3 text-white outline-none focus:border-red-300" placeholder="New, Limited..." />
            </label>
            <button type="submit" disabled={isSaving || !displayName.trim() || !description.trim()} className="rounded-md bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-red-100 disabled:cursor-wait disabled:opacity-50">{isSaving ? 'Saving...' : 'Save info'}</button>
          </form>

          <div className="mt-8 border-t border-white/10 pt-6">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div><h4 className="font-bold text-white">Collection images</h4><p className="mt-1 text-xs text-gray-500">Files are stored in <span className="text-gray-300">Skins/{selectedFolder}/</span>.</p></div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-white/15 px-4 py-2.5 text-sm font-semibold text-gray-200 transition hover:border-white/40 hover:text-white has-disabled:cursor-wait has-disabled:opacity-50">
                <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V4m0 0L8 8m4-4 4 4M4 16v4h16v-4" /></svg>
                {isUploading ? 'Uploading...' : 'Add images'}
                <input type="file" accept="image/avif,image/gif,image/jpeg,image/png,image/webp" multiple disabled={isUploading} onChange={handleUploadImages} className="sr-only" />
              </label>
            </div>

            {selectedCollection.skinError ? <p role="alert" className="mt-4 text-sm text-red-200">Could not list images: {getErrorMessage(selectedCollection.skinError)}</p> : selectedCollection.skins.length ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {selectedCollection.skins.map((skin) => (
                  <article key={skin.id} className="overflow-hidden border border-white/10 bg-[#0e0e11]">
                    <div className="aspect-4/3 overflow-hidden bg-[#111116]"><img src={skin.image} alt={skin.name} loading="lazy" className="h-full w-full object-cover" /></div>
                    <div className="space-y-3 p-4">
                      {renamingFile === skin.fileName ? (
                        <form onSubmit={(event) => handleRenameImage(event, skin.fileName)} className="space-y-3">
                          <label className="block text-xs font-medium text-gray-400">New filename (extension is kept)
                            <input value={renamingValue} onChange={(event) => setRenamingValue(event.target.value)} required autoFocus className="mt-2 w-full rounded-md border border-white/10 bg-[#111116] px-3 py-2 text-sm text-white outline-none focus:border-red-300" />
                          </label>
                          <div className="flex justify-end gap-2">
                            <button type="button" onClick={() => setRenamingFile('')} className="rounded border border-white/10 px-3 py-2 text-xs font-semibold text-gray-400 hover:text-white">Cancel</button>
                            <button type="submit" disabled={busyFile === skin.fileName || !renamingValue.trim()} className="rounded bg-white px-3 py-2 text-xs font-bold text-black disabled:opacity-50">{busyFile === skin.fileName ? 'Renaming...' : 'Save name'}</button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <p className="truncate text-sm font-semibold text-gray-200" title={skin.fileName}>{skin.fileName}</p>
                          <div className="flex justify-between gap-2 border-t border-white/10 pt-3">
                            <button type="button" onClick={() => { setRenamingFile(skin.fileName); setRenamingValue(skin.fileName.replace(/\.[^.]+$/, '')); setSaveError(''); }} disabled={Boolean(busyFile)} className="rounded border border-white/10 px-3 py-2 text-xs font-semibold text-gray-300 transition hover:border-white/30 hover:text-white disabled:opacity-50">Rename</button>
                            <button type="button" onClick={() => handleDeleteImage(skin.fileName)} disabled={Boolean(busyFile)} className="rounded border border-red-300/20 px-3 py-2 text-xs font-semibold text-red-200 transition hover:border-red-300/50 disabled:opacity-50">{busyFile === skin.fileName ? 'Deleting...' : 'Delete'}</button>
                          </div>
                        </>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            ) : <p className="mt-5 border-y border-white/10 py-8 text-center text-sm text-gray-500">No images in this collection folder.</p>}
          </div>
        </section>
      )}

      {isCreateOpen && <CreateCollectionModal onClose={() => { setIsCreateOpen(false); setSaveError(''); }} onSubmit={handleCreateCollection} isSaving={isSaving} error={saveError} />}
    </div>
  );
}
