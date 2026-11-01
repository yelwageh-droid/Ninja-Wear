let laptopsRequest;
let collectionsRequest;
let supabaseRequest;
const skinRequests = new Map();
const storageBucket = 'Skins';
const orderUploadsBucket = 'custom_design_uploads';
const imageExtensions = /\.(avif|gif|jpe?g|png|webp)$/i;
const clientNotInitializedError = 'Supabase client not initialized';

function catalogError(error) {
  return error?.message === clientNotInitializedError ? clientNotInitializedError : error;
}

function getSupabase() {
  if (!supabaseRequest) {
    if (!import.meta.env.SUPABASE_API_URL || !import.meta.env.SUPABASE_API_KEY) {
      return Promise.reject(new Error(clientNotInitializedError));
    }

    // Normalize client setup failures for each catalog caller / توحيد أخطاء تهيئة العميل لكل مستهلك للكتالوج
    supabaseRequest = import('../config/SupabaseClient.js')
      .then(({ default: supabase }) => {
        if (!supabase) throw new Error(clientNotInitializedError);
        return supabase;
      })
      .catch(() => {
        supabaseRequest = null;
        throw new Error(clientNotInitializedError);
      });
  }
  return supabaseRequest;
}

function normalizeLaptop(laptop) {
  return {
    ...laptop,
    is_custom_request: Boolean(laptop.is_custom_request),
    models: Array.isArray(laptop.models)
      ? laptop.models
      : laptop.models
        ? [laptop.models]
        : [],
  };
}

function invalidateCollectionCache() {
  collectionsRequest = null;
  skinRequests.clear();
}

function safeImageName(fileName, originalName = fileName) {
  const extension = originalName.match(/\.[^.]+$/)?.[0] || '';
  const requestedBase = fileName.trim().replace(/\.[^.]+$/, '');
  const safeBase = requestedBase.normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!safeBase || !extension) throw new Error('Use an image filename with a file extension.');
  return `${safeBase}${extension.toLowerCase()}`;
}

async function uploadCollectionFiles(supabase, folderName, files) {
  const storage = supabase.storage.from(storageBucket);
  const uploadedPaths = [];

  for (const file of files) {
    if (!imageExtensions.test(file.name) || (file.type && !file.type.startsWith('image/'))) {
      if (uploadedPaths.length) await storage.remove(uploadedPaths);
      return { data: [], error: new Error('Only supported image files can be added to a collection.') };
    }
    const fileName = safeImageName(file.name);
    const path = `${folderName}/${fileName}`;
    const { error } = await storage.upload(path, file, {
      upsert: false,
      contentType: file.type || undefined,
    });
    if (error) {
      if (uploadedPaths.length) await storage.remove(uploadedPaths);
      return { data: [], error };
    }
    uploadedPaths.push(path);
  }

  return { data: uploadedPaths, error: null };
}

export function getLaptops() {
  if (!laptopsRequest) {
    laptopsRequest = getSupabase()
      .then((supabase) => supabase.from('AVL_Laptops').select('*'))
      .then(({ data, error }) => {
        if (error) {
          laptopsRequest = null;
          return { data: [], error };
        }

        const laptops = (data || []).filter((laptop) => laptop.is_active).map(normalizeLaptop);

        return { data: laptops, error: null };
      })
      .catch((error) => {
        laptopsRequest = null;
        return { data: [], error: catalogError(error) };
      });
  }

  return laptopsRequest;
}

// Fetch every laptop row for authorized admin catalog management / جلب كل صفوف اللابتوبات لإدارة الكتالوج للمشرف
export async function getAdminLaptops() {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase.from('AVL_Laptops').select('*').order('brand');
    if (error) return { data: [], error };
    return { data: (data || []).map(normalizeLaptop), error: null };
  } catch (error) {
    return { data: [], error: catalogError(error) };
  }
}

// Insert a catalog row and invalidate the public catalog cache / إضافة صف للكتالوج وإبطال ذاكرة كاش المتجر
export async function addLaptop(laptop) {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase.from('AVL_Laptops').insert(laptop).select('*').single();
    if (error) return { data: null, error };
    laptopsRequest = null;
    return { data: normalizeLaptop(data), error: null };
  } catch (error) {
    return { data: null, error: catalogError(error) };
  }
}

// Update a catalog row and invalidate the public catalog cache / تعديل صف في الكتالوج وإبطال ذاكرة كاش المتجر
export async function updateLaptop(id, updates) {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase.from('AVL_Laptops')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();
    if (error) return { data: null, error };
    laptopsRequest = null;
    return { data: normalizeLaptop(data), error: null };
  } catch (error) {
    return { data: null, error: catalogError(error) };
  }
}

// Fetch persisted customer orders and sort newest records when timestamp or identity fields exist / جلب الطلبات المحفوظة وترتيب الأحدث عند توفر وقت أو معرّف
export async function getOrders() {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase.from('orders').select('*');
    if (error) return { data: [], error };

    const orders = (data || []).slice().sort((first, second) => {
      const firstDate = Date.parse(first.created_at || first.createdAt || '');
      const secondDate = Date.parse(second.created_at || second.createdAt || '');
      if (Number.isFinite(firstDate) && Number.isFinite(secondDate)) return secondDate - firstDate;
      const firstId = Number(first.id);
      const secondId = Number(second.id);
      return Number.isFinite(firstId) && Number.isFinite(secondId) ? secondId - firstId : 0;
    });

    return { data: orders, error: null };
  } catch (error) {
    return { data: [], error: catalogError(error) };
  }
}

// Persist an allowed order status in public.orders / حفظ حالة طلب مسموح بها في جدول الطلبات
export async function updateOrderStatus(id, status) {
  const allowedStatuses = ['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'];
  if (!allowedStatuses.includes(status)) {
    return { data: null, error: new Error('Unsupported order status.') };
  }

  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase.from('orders')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();
    if (error) return { data: null, error };
    return { data, error: null };
  } catch (error) {
    return { data: null, error: catalogError(error) };
  }
}

// Insert a complete customer's cart as one grouped database operation / إدخال سلة العميل كاملة كعملية قاعدة بيانات واحدة
export async function createOrders(orderRows) {
  if (!Array.isArray(orderRows) || !orderRows.length) {
    return { data: null, error: new Error('The cart has no items to submit.') };
  }

  try {
    const supabase = await getSupabase();
    const { error } = await supabase.from('orders').insert(orderRows);
    if (error) return { data: null, error };
    return { data: { count: orderRows.length }, error: null };
  } catch (error) {
    return { data: null, error: catalogError(error) };
  }
}

async function removeOrderUploadPaths(supabase, paths) {
  if (!paths.length) return null;
  const { error } = await supabase.storage.from(orderUploadsBucket).remove(paths);
  return error;
}

// Upload custom design and logo files to their dedicated private bucket folders / رفع التصميم والشعار إلى مجلداتهما في الباكت الخاصة
export async function uploadOrderImages(groupId, cartItems) {
  const uploadedPaths = [];
  try {
    const supabase = await getSupabase();
    const storage = supabase.storage.from(orderUploadsBucket);
    const pathsByItem = {};

    for (const item of cartItems) {
      pathsByItem[item.id] = {};
      const uploads = [
        { key: 'design_image_path', folder: 'designs', file: item.customArtwork },
        { key: 'logo_image_path', folder: 'logos', file: item.customLogo },
      ].filter((upload) => upload.file?.dataUrl);

      for (const upload of uploads) {
        const response = await fetch(upload.file.dataUrl);
        const blob = await response.blob();
        const fileName = safeImageName(upload.file.name || `${upload.folder}.png`);
        const path = `${upload.folder}/${groupId}-${item.id}-${fileName}`;
        const { error } = await storage.upload(path, blob, {
          upsert: false,
          contentType: blob.type || undefined,
        });
        if (error) {
          const cleanupError = await removeOrderUploadPaths(supabase, uploadedPaths);
          return { data: null, error: cleanupError ? new Error(`${error.message}; cleanup failed: ${cleanupError.message}`) : error };
        }
        uploadedPaths.push(path);
        pathsByItem[item.id][upload.key] = path;
      }
    }

    return { data: pathsByItem, error: null };
  } catch (error) {
    try {
      const supabase = await getSupabase();
      const cleanupError = await removeOrderUploadPaths(supabase, uploadedPaths);
      if (cleanupError) return { data: null, error: new Error(`${error.message}; cleanup failed: ${cleanupError.message}`) };
    } catch {
      // Preserve the original upload error if cleanup cannot initialize / الحفاظ على خطأ الرفع الأصلي عند تعذر تهيئة التنظيف
    }
    return { data: null, error: catalogError(error) };
  }
}

// Remove uploaded files when database insertion fails / حذف الملفات المرفوعة عند فشل إدخال الطلبات
export async function deleteOrderUploadImages(paths) {
  try {
    const supabase = await getSupabase();
    return { error: await removeOrderUploadPaths(supabase, paths) };
  } catch (error) {
    return { error: catalogError(error) };
  }
}

// Create short-lived signed URLs for admin-only order image previews / إنشاء روابط موقعة مؤقتة لمعاينة صور الطلبات في الإدارة
export async function getOrderImageUrls(paths) {
  try {
    const supabase = await getSupabase();
    const storage = supabase.storage.from(orderUploadsBucket);
    const uniquePaths = [...new Set(paths.filter(Boolean))];
    const results = await Promise.all(uniquePaths.map(async (path) => {
      const { data, error } = await storage.createSignedUrl(path, 60 * 10);
      return { path, url: data?.signedUrl || '', error };
    }));
    const failedResult = results.find((result) => result.error);
    if (failedResult) return { data: {}, error: failedResult.error };
    return { data: Object.fromEntries(results.map(({ path, url }) => [path, url])), error: null };
  } catch (error) {
    return { data: {}, error: catalogError(error) };
  }
}

export function getCollections() {
  if (!collectionsRequest) {
    collectionsRequest = getSupabase().then((supabase) => Promise.all([
      supabase.from('COLLECTIONS_INFO').select('*'),
      supabase.storage.from(storageBucket).list('', {
        limit: 100,
        sortBy: { column: 'name', order: 'asc' },
      }),
    ])).then(([{ data: infoRows, error: infoError }, { data: folders, error }]) => {
      if (error) {
        collectionsRequest = null;
        return { data: [], error };
      }

      const infoByName = (infoRows || []).reduce((result, row) => {
        const name = row.collection_name ?? row.folder_name ?? row.folderName ?? row.name ?? row.collection;
        if (name) result[name] = row;
        return result;
      }, {});

      const collections = (folders || [])
        .filter((folder) => folder.id === null)
        .map((folder) => ({
          id: folder.name,
          name: folder.name,
          displayName: infoByName[folder.name]?.display_name || folder.name,
          description: infoByName[folder.name]?.description || '',
          badge: infoByName[folder.name]?.badge || null,
        }));

      if (infoError) console.warn('Collection descriptions are unavailable:', infoError.message);
      return { data: collections, error: null };
    }).catch((error) => {
      collectionsRequest = null;
      return { data: [], error: catalogError(error) };
    });
  }

  return collectionsRequest;
}

// Save metadata without changing the storage-folder identifier / حفظ بيانات العرض دون تغيير معرّف مجلد التخزين
export async function saveCollectionInfo(folderName, values) {
  try {
    const supabase = await getSupabase();
    const { data: rows, error: lookupError } = await supabase
      .from('COLLECTIONS_INFO')
      .select('*');

    if (lookupError) return { data: null, error: lookupError };

    const existingRow = (rows || []).find((row) => (
      row.collection_name === folderName
      || row.folder_name === folderName
      || row.folderName === folderName
      || row.name === folderName
      || row.collection === folderName
    ));
    const keyColumn = existingRow
      ? ['collection_name', 'folder_name', 'folderName', 'name', 'collection'].find((column) => existingRow[column] === folderName)
      : 'collection_name';
    const metadata = {
      display_name: values.displayName.trim(),
      description: values.description.trim(),
      badge: values.badge.trim() || null,
    };

    let result;
    if (existingRow) {
      const updateQuery = supabase.from('COLLECTIONS_INFO').update(metadata);
      result = existingRow.id !== undefined
        ? await updateQuery.eq('id', existingRow.id).select('*').single()
        : await updateQuery.eq(keyColumn, folderName).select('*').single();
    } else {
      result = await supabase.from('COLLECTIONS_INFO')
        .insert({ collection_name: folderName, ...metadata })
        .select('*')
        .single();
    }

    if (result.error) return { data: null, error: result.error };
    invalidateCollectionCache();
    return { data: result.data, error: null };
  } catch (error) {
    return { data: null, error: catalogError(error) };
  }
}

// Create metadata and its storage folder together; roll back uploaded files if metadata fails / إنشاء البيانات ومجلد الصور معاً مع التراجع عن رفع الصور عند فشل الحفظ
export async function createCollection(folderName, values, files) {
  try {
    if (!/^[a-zA-Z0-9_-]+$/.test(folderName)) {
      throw new Error('Use only letters, numbers, hyphens, and underscores for the storage folder name.');
    }
    if (!files.length) throw new Error('Add at least one collection image to create its storage folder.');
    const supabase = await getSupabase();
    const storage = supabase.storage.from(storageBucket);
    const { data: folders, error: listError } = await storage.list('', {
      limit: 100,
      sortBy: { column: 'name', order: 'asc' },
    });
    if (listError) return { data: null, error: listError };
    if ((folders || []).some((folder) => folder.id === null && folder.name === folderName)) {
      return { data: null, error: new Error('A storage folder with this name already exists.') };
    }

    const { data: uploadedPaths, error: uploadError } = await uploadCollectionFiles(supabase, folderName, files);
    if (uploadError) return { data: null, error: uploadError };

    const { data, error } = await saveCollectionInfo(folderName, values);
    if (error) {
      await storage.remove(uploadedPaths);
      return { data: null, error };
    }

    invalidateCollectionCache();
    return { data, error: null };
  } catch (error) {
    return { data: null, error: catalogError(error) };
  }
}

// Add image files to an existing collection folder / إضافة صور إلى مجلد مجموعة موجود
export async function uploadCollectionImages(folderName, files) {
  try {
    const supabase = await getSupabase();
    const result = await uploadCollectionFiles(supabase, folderName, files);
    if (result.error) return result;
    invalidateCollectionCache();
    return result;
  } catch (error) {
    return { data: [], error: catalogError(error) };
  }
}

// Rename an image within its collection folder / إعادة تسمية صورة داخل مجلد مجموعتها
export async function renameCollectionImage(folderName, oldFileName, requestedFileName) {
  try {
    const supabase = await getSupabase();
    const newFileName = safeImageName(requestedFileName, oldFileName);
    if (newFileName === oldFileName) return { data: oldFileName, error: null };
    const { error } = await supabase.storage.from(storageBucket)
      .move(`${folderName}/${oldFileName}`, `${folderName}/${newFileName}`);
    if (error) return { data: null, error };
    invalidateCollectionCache();
    return { data: newFileName, error: null };
  } catch (error) {
    return { data: null, error: catalogError(error) };
  }
}

// Remove an image from its collection folder / حذف صورة من مجلد مجموعتها
export async function deleteCollectionImage(folderName, fileName) {
  try {
    const supabase = await getSupabase();
    const storage = supabase.storage.from(storageBucket);
    const { data: files, error: listError } = await storage.list(folderName, { limit: 100 });
    if (listError) return { data: null, error: listError };

    const imageFiles = (files || []).filter((file) => imageExtensions.test(file.name));
    const needsFolderMarker = imageFiles.length === 1 && imageFiles[0].name === fileName
      && !(files || []).some((file) => file.name === '.collection-folder');
    if (needsFolderMarker) {
      const { error: markerError } = await storage.upload(`${folderName}/.collection-folder`, new Blob(['']), {
        upsert: false,
        contentType: 'text/plain',
      });
      if (markerError) return { data: null, error: markerError };
    }

    const { data, error } = await storage.remove([`${folderName}/${fileName}`]);
    if (error && needsFolderMarker) await storage.remove([`${folderName}/.collection-folder`]);
    if (error) return { data: null, error };
    invalidateCollectionCache();
    return { data, error: null };
  } catch (error) {
    return { data: null, error: catalogError(error) };
  }
}

export function getCollectionSkins(collectionName) {
  if (!skinRequests.has(collectionName)) {
    const request = getSupabase().then(async (supabase) => {
      const { data, error } = await supabase.storage.from(storageBucket)
        .list(collectionName, { limit: 100, sortBy: { column: 'name', order: 'asc' } });

        if (error) {
          skinRequests.delete(collectionName);
          return { data: [], error };
        }

        return {
          data: (data || [])
            .filter((file) => imageExtensions.test(file.name))
            .map((file) => ({
              id: file.id || file.name,
              name: file.name.replace(imageExtensions, '').replace(/[-_]/g, ' '),
              fileName: file.name,
              image: supabase.storage.from(storageBucket)
                .getPublicUrl(`${collectionName}/${file.name}`).data.publicUrl,
            })),
          error: null,
        };
      }).catch((error) => {
        skinRequests.delete(collectionName);
        return { data: [], error: catalogError(error) };
      });

    skinRequests.set(collectionName, request);
  }

  return skinRequests.get(collectionName);
}