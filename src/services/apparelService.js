// Supabase data services for Ninja Wear - Apparel Storefront
// Centralises every catalog, design, pricing, and order query for the storefront

import { getSupabase } from '../config/SupabaseClient.js';
import { sanitizePermissions } from '../data/permissions.js';

const storageBucket = 'designs';
const mockupsBucket = 'apparel-mockups';
const orderUploadsBucket = 'custom_design_uploads';
const imageExtensions = /\.(avif|gif|jpe?g|png|webp)$/i;
const clientNotInitializedError = 'Supabase client not initialized';

// Keep storage paths inside their folder and inside the signed-in user's prefix.
// الحفاظ على مسارات الرفع داخل المجلد المخصص للمستخدم المسجّل
function safePathPart(value, fallback) {
  const cleaned = String(value || '').replace(/[^a-zA-Z0-9._-]/g, '-').slice(-80);
  return cleaned || fallback;
}

// --- Products Service ---

export function getApparelProducts() {
  return getSupabase()
    .then((supabase) =>
      supabase
        .from('apparel_products')
        .select('*')
        .order('is_custom_request', { ascending: true })
        .order('base_price', { ascending: true })
    )
    .then(({ data, error }) => {
      if (error) return { data: [], error };
      return { data: data || [], error: null };
    })
    .catch((error) => ({ data: [], error: catalogError(error) }));
}

export async function getAdminApparelProducts() {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase.from('apparel_products').select('*').order('category');
    if (error) return { data: [], error };
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: catalogError(error) };
  }
}

export async function addApparelProduct(product) {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('apparel_products')
      .insert(product)
      .select('*')
      .single();
    if (error) return { data: null, error };
    return { data, error: null };
  } catch (error) {
    return { data: null, error: catalogError(error) };
  }
}

export async function updateApparelProduct(id, updates) {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('apparel_products')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single();
    if (error) return { data: null, error };
    return { data, error: null };
  } catch (error) {
    return { data: null, error: catalogError(error) };
  }
}

// --- Collections Service ---

let collectionsRequest = null;
const collectionRequests = new Map();

export function invalidateCollectionsCache() {
  collectionsRequest = null;
  collectionRequests.clear();
}

export function getDesignCollections() {
  if (!collectionsRequest) {
    collectionsRequest = getSupabase().then((supabase) =>
      Promise.all([
        supabase.from('design_collections').select('*'),
        supabase.storage.from(storageBucket).list('', {
          limit: 100,
          sortBy: { column: 'name', order: 'asc' },
        }),
      ])
    ).then(([{ data: infoRows, error: infoError }, { data: folders, error }]) => {
      if (error || infoError) {
        collectionsRequest = null;
        return { data: [], error: error || infoError };
      }

      const infoByName = (infoRows || []).reduce((result, row) => {
        result[row.collection_name] = row;
        return result;
      }, {});

      const collections = (folders || [])
        .filter((folder) => folder.id === null)
        .filter((folder) => infoByName[folder.name]?.is_active !== false)
        .map((folder) => {
          const info = infoByName[folder.name];
          return {
            id: folder.name,
            collection_name: folder.name,
            display_name: info?.display_name || folder.name,
            description: info?.description || '',
            badge: info?.badge || null,
            is_active: info?.is_active ?? true,
            created_at: info?.created_at || '',
          };
        });

      return { data: collections, error: null };
    }).catch((error) => {
      collectionsRequest = null;
      return { data: [], error: catalogError(error) };
    });
  }

  return collectionsRequest;
}

export function getCollectionDesigns(collectionName) {
  if (!collectionRequests.has(collectionName)) {
    const request = getSupabase().then(async (supabase) => {
      const { data, error } = await supabase.storage.from(storageBucket)
        .list(collectionName, { limit: 100, sortBy: { column: 'name', order: 'asc' } });

      if (error) {
        collectionRequests.delete(collectionName);
        return { data: [], error };
      }

      return {
        data: (data || [])
          .filter((file) => imageExtensions.test(file.name))
          .map((file) => ({
            id: file.id || file.name,
            name: file.name.replace(imageExtensions, '').replace(/[-_]/g, ' '),
            fileName: file.name,
            image: supabase.storage.from(storageBucket).getPublicUrl(`${collectionName}/${file.name}`).data.publicUrl,
            collectionName,
          })),
        error: null,
      };
    }).catch((error) => {
      collectionRequests.delete(collectionName);
      return { data: [], error: catalogError(error) };
    });

    collectionRequests.set(collectionName, request);
  }

  return collectionRequests.get(collectionName);
}

// --- Customization Options Service ---

export function getPrintOptions() {
  return getSupabase()
    .then((supabase) =>
      supabase.from('print_options').select('*').eq('is_active', true).order('sort_order', { ascending: true })
    )
    .then(({ data, error }) => {
      if (error) return { data: [], error };
      return { data: data || [], error: null };
    })
    .catch((error) => ({ data: [], error: catalogError(error) }));
}

export function getLogoOptions() {
  return getSupabase()
    .then((supabase) =>
      supabase.from('logo_options').select('*').eq('is_active', true).order('additional_price', { ascending: true })
    )
    .then(({ data, error }) => {
      if (error) return { data: [], error };
      return { data: data || [], error: null };
    })
    .catch((error) => ({ data: [], error: catalogError(error) }));
}

// --- Checkout Service ---

export async function uploadOrderImages(groupId, cartItems) {
  const uploadedPaths = [];
  try {
    const supabase = await getSupabase();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData?.user) {
      return { data: null, error: new Error('Sign in before uploading artwork.') };
    }
    const ownerPrefix = userData.user.id;
    const storage = supabase.storage.from(orderUploadsBucket);
    const pathsByItem = {};

    for (const item of cartItems) {
      pathsByItem[item.id] = {};
      const uploads = [
        { key: 'custom_design_path', folder: 'designs', file: item.customArtwork },
        { key: 'custom_logo_path', folder: 'logos', file: item.customLogo },
      ].filter((upload) => upload.file?.dataUrl);

      for (const upload of uploads) {
        const response = await fetch(upload.file.dataUrl);
        const blob = await response.blob();
        const fileName = safePathPart(upload.file.name, `${upload.folder}.png`);
        const path = `${upload.folder}/${ownerPrefix}/${safePathPart(groupId, 'group')}-${safePathPart(item.id, 'item')}-${fileName}`;
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
      // Preserve original upload error
    }
    return { data: null, error: catalogError(error) };
  }
}

// Shape one cart item for the `submit_customer_order` RPC / تجهيز عنصر السلة لاستدعاء الدالة
function toOrderRpcItem(item, imagePaths) {
  const uploadPaths = imagePaths?.[item.id] || {};
  const logoLabel = item.logoOption
    ? `${item.logoOption.label || item.logoOption.name || ''}${item.logoPlacement ? ` (${item.logoPlacement})` : ''}`
    : 'None';

  return {
    product_id: item.productId,
    category: item.category,
    fit_type: item.fit_type,
    size: item.size,
    color: item.color,
    quantity: Number(item.quantity || 1),
    design_name: item.designName || item.designFileName || 'Custom design',
    print_option: item.printOption?.name || '',
    print_option_id: item.printOption?.id || '',
    logo_option: logoLabel,
    logo_option_id: item.logoOption?.id || '',
    order_details: {
      product_id: item.productId,
      garment_category: item.category,
      garment_fit_type: item.fit_type,
      garment_size: item.size,
      garment_color: item.color,
      garment_quantity: item.quantity,
      design_mode: item.designMode,
      collection_name: item.collectionName || '',
      design_file_name: item.designFileName || '',
      design_image_url: item.designImageUrl || '',
      custom_artwork_name: item.customArtwork?.name || '',
      design_image_path: uploadPaths.custom_design_path || null,
      print_option_id: item.printOption?.id || '',
      print_placement: item.printOption?.name || '',
      logo_option_id: item.logoOption?.id || '',
      logo_placement: item.logoPlacement || '',
      custom_logo_name: item.customLogo?.name || '',
      logo_image_path: uploadPaths.custom_logo_path || null,
      print_notes: item.printNotes || '',
      bulk_details: item.bulkDetails || {},
    },
  };
}

// Checkout goes through a SECURITY DEFINER RPC that recomputes prices server-side,
// so `total_price` can never be spoofed from the browser.
// الطلب يمر عبر دالة على السيرفر تعيد حساب الأسعار، فلا يمكن التلاعب بالسعر
export async function submitCartOrder({ items, imagePaths = {}, customer = {}, cartGroupId = null }) {
  if (!Array.isArray(items) || !items.length) {
    return { data: null, error: new Error('The cart has no items to submit.') };
  }

  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase.rpc('submit_customer_order', {
      p_items: items.map((item) => toOrderRpcItem(item, imagePaths)),
      p_customer_name: (customer.name || '').trim(),
      p_customer_email: (customer.email || '').trim(),
      p_customer_phone: (customer.phone || '').trim(),
      p_customer_address: (customer.address || '').trim(),
      p_secondary_phone: (customer.secondaryPhone || '').trim() || null,
      p_cart_group_id: cartGroupId || null,
    });

    if (error) {
      // A missing function means the migration has not been applied yet / الدالة غير موجودة يعني الميجريشن لم يُشغّل
      if (error.code === 'PGRST202') {
        return { data: null, error: new Error('Order service is unavailable. Apply the latest Supabase migration.') };
      }
      return { data: null, error };
    }

    return { data: { groupId: data, count: items.length }, error: null };
  } catch (error) {
    return { data: null, error: catalogError(error) };
  }
}

async function removeOrderUploadPaths(supabase, paths) {
  if (!paths.length) return null;
  const { error } = await supabase.storage.from(orderUploadsBucket).remove(paths);
  return error;
}

export async function deleteOrderUploadImages(paths) {
  try {
    const supabase = await getSupabase();
    return { error: await removeOrderUploadPaths(supabase, paths) };
  } catch (error) {
    return { error: catalogError(error) };
  }
}

export async function getOrderImageUrls(paths) {
  try {
    const supabase = await getSupabase();
    const storage = supabase.storage.from(orderUploadsBucket);
    const uniquePaths = [...new Set(paths.filter(Boolean))];
    const results = await Promise.all(uniquePaths.map(async (path) => {
      const { data, error } = await storage.createSignedUrl(path, 60 * 10);
      return { path, url: data?.signedUrl || '', error };
    }));
    // One missing file must not hide every other thumbnail / ملف واحد مفقود لا يجب أن يخفي باقي المعاينات
    const urls = Object.fromEntries(results.filter((result) => !result.error && result.url).map(({ path, url }) => [path, url]));
    const failures = results.filter((result) => result.error).map(({ path, error }) => ({ path, error }));
    return { data: urls, error: null, failures };
  } catch (error) {
    return { data: {}, error: catalogError(error) };
  }
}

function catalogError(error) {
  return error?.message === clientNotInitializedError ? clientNotInitializedError : error;
}

// --- Admin Collections & Designs Manager ---

export async function saveCollectionInfo(collectionName, values) {
  try {
    const supabase = await getSupabase();
    const { data: rows, error: lookupError } = await supabase.from('design_collections').select('*');

    if (lookupError) return { data: null, error: lookupError };

    const existingRow = (rows || []).find((row) => row.collection_name === collectionName);
    const metadata = {
      display_name: values.displayName.trim(),
      description: values.description.trim(),
      badge: values.badge.trim() || null,
      is_active: true,
    };

    let result;
    if (existingRow) {
      result = await supabase.from('design_collections')
        .update(metadata)
        .eq('collection_name', collectionName)
        .select('*')
        .single();
    } else {
      result = await supabase.from('design_collections')
        .insert({ collection_name: collectionName, ...metadata })
        .select('*')
        .single();
    }

    if (result.error) return { data: null, error: result.error };
    invalidateCollectionsCache();
    return { data: result.data, error: null };
  } catch (error) {
    return { data: null, error: catalogError(error) };
  }
}

export async function createCollection(collectionName, values, files) {
  try {
    if (!/^[a-zA-Z0-9_-]+$/.test(collectionName)) {
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
    if ((folders || []).some((folder) => folder.id === null && folder.name === collectionName)) {
      return { data: null, error: new Error('A storage folder with this name already exists.') };
    }

    const uploadedPaths = [];
    for (const file of files) {
      if (!imageExtensions.test(file.name) || (file.type && !file.type.startsWith('image/'))) {
        if (uploadedPaths.length) await storage.remove(uploadedPaths);
        return { data: [], error: new Error('Only supported image files can be added to a collection.') };
      }
      const path = `${collectionName}/${file.name}`;
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

    const { data, error } = await saveCollectionInfo(collectionName, values);
    if (error) {
      await storage.remove(uploadedPaths);
      return { data: null, error };
    }

    invalidateCollectionsCache();
    return { data, error: null };
  } catch (error) {
    return { data: null, error: catalogError(error) };
  }
}

export async function uploadCollectionImages(collectionName, files) {
  try {
    const supabase = await getSupabase();
    const storage = supabase.storage.from(storageBucket);
    const uploadedPaths = [];

    for (const file of files) {
      if (!imageExtensions.test(file.name) || (file.type && !file.type.startsWith('image/'))) {
        if (uploadedPaths.length) await storage.remove(uploadedPaths);
        return { data: [], error: new Error('Only supported image files can be added to a collection.') };
      }
      const path = `${collectionName}/${file.name}`;
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

    invalidateCollectionsCache();
    return { data: uploadedPaths, error: null };
  } catch (error) {
    return { data: [], error: catalogError(error) };
  }
}

export async function renameCollectionImage(collectionName, oldFileName, requestedFileName) {
  try {
    const supabase = await getSupabase();
    const extension = imageExtensions.exec(oldFileName)?.[0] || '';
    // The admin form edits only the base name; keep the extension so the gallery still recognises the image.
    // نموذج الإدارة يعدّل الاسم فقط، لذا نحتفظ بالامتداد حتى تظهر الصورة في المعرض
    let baseName = requestedFileName.trim().replace(imageExtensions, '');
    baseName = baseName.replace(/[^a-zA-Z0-9._-]/g, '-');
    if (!baseName) return { data: null, error: new Error('Enter a valid image name.') };
    const newFileName = `${baseName}${extension}`;
    if (newFileName === oldFileName) return { data: oldFileName, error: null };
    const { error } = await supabase.storage.from(storageBucket)
      .move(`${collectionName}/${oldFileName}`, `${collectionName}/${newFileName}`);
    if (error) return { data: null, error };
    invalidateCollectionsCache();
    return { data: newFileName, error: null };
  } catch (error) {
    return { data: null, error: catalogError(error) };
  }
}

export async function deleteCollectionImage(collectionName, fileName) {
  try {
    const supabase = await getSupabase();
    const storage = supabase.storage.from(storageBucket);
    const { data: files, error: listError } = await storage.list(collectionName, { limit: 100 });
    if (listError) return { data: null, error: listError };

    const imageFiles = (files || []).filter((file) => imageExtensions.test(file.name));
    const needsFolderMarker = imageFiles.length === 1 && imageFiles[0].name === fileName;

    if (needsFolderMarker) {
      const { error: markerError } = await storage.upload(`${collectionName}/.collection-folder`, new Blob(['']), {
        upsert: false,
        contentType: 'text/plain',
      });
      if (markerError) return { data: null, error: markerError };
    }

    const { error } = await storage.remove([`${collectionName}/${fileName}`]);
    if (error && needsFolderMarker) await storage.remove([`${collectionName}/.collection-folder`]);
    if (error) return { data: null, error };
    invalidateCollectionsCache();
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: catalogError(error) };
  }
}

// --- Admin Print & Logo Options ---

export async function getAdminPrintOptions() {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase.from('print_options').select('*').order('sort_order', { ascending: true });
    if (error) return { data: [], error };
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: catalogError(error) };
  }
}

export async function savePrintOption(option) {
  try {
    const supabase = await getSupabase();
    const { data, error } = option.id
      ? await supabase.from('print_options').update(option).eq('id', option.id).select('*').single()
      : await supabase.from('print_options').insert(option).select('*').single();
    if (error) return { data: null, error };
    return { data, error: null };
  } catch (error) {
    return { data: null, error: catalogError(error) };
  }
}

export async function deletePrintOption(id) {
  try {
    const supabase = await getSupabase();
    const { error } = await supabase.from('print_options').delete().eq('id', id);
    if (error) return { error };
    return { error: null };
  } catch (error) {
    return { error: catalogError(error) };
  }
}

export async function getAdminLogoOptions() {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase.from('logo_options').select('*').order('additional_price', { ascending: true });
    if (error) return { data: [], error };
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: catalogError(error) };
  }
}

export async function saveLogoOption(option) {
  try {
    const supabase = await getSupabase();
    const { data, error } = option.id
      ? await supabase.from('logo_options').update(option).eq('id', option.id).select('*').single()
      : await supabase.from('logo_options').insert(option).select('*').single();
    if (error) return { data: null, error };
    return { data, error: null };
  } catch (error) {
    return { data: null, error: catalogError(error) };
  }
}

export async function deleteLogoOption(id) {
  try {
    const supabase = await getSupabase();
    const { error } = await supabase.from('logo_options').delete().eq('id', id);
    if (error) return { error };
    return { error: null };
  } catch (error) {
    return { error: catalogError(error) };
  }
}

export { storageBucket, mockupsBucket, orderUploadsBucket };

// --- Orders Service ---

export async function getOrders() {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (error) return { data: [], error };
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: catalogError(error) };
  }
}

// Staff-only status change, enforced by the orders_update_staff RLS policy (orders.edit)
// تعديل الحالة للفريق فقط، وتفرضه سياسة RLS الخاصة بـ orders.edit
export async function updateOrderStatus(orderId, status) {
  try {
    const supabase = await getSupabase();
    const { error } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (error) return { error };
    return { error: null };
  } catch (error) {
    return { error: catalogError(error) };
  }
}

// --- Customers Service (admin) ---
// One row per customer with aggregated order counts / عميل واحد مع إحصاءات طلباته
export async function getCustomerSummaries() {
  try {
    const supabase = await getSupabase();
    const [profilesResult, ordersResult, staffResult] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('orders').select('customer_id, status, created_at').not('customer_id', 'is', null),
      supabase.from('user_roles').select('user_id').in('role', ['super_admin', 'admin']),
    ]);
    if (profilesResult.error) return { data: [], error: profilesResult.error };
    if (ordersResult.error) return { data: [], error: ordersResult.error };
    if (staffResult.error) return { data: [], error: staffResult.error };

    const stats = new Map();
    (ordersResult.data || []).forEach((order) => {
      const entry = stats.get(order.customer_id) || { total: 0, pending: 0, completed: 0, cancelled: 0, lastOrderAt: null };
      entry.total += 1;
      if (order.status === 'Completed') entry.completed += 1;
      else if (order.status === 'Cancelled') entry.cancelled += 1;
      else entry.pending += 1;
      if (!entry.lastOrderAt || order.created_at > entry.lastOrderAt) entry.lastOrderAt = order.created_at;
      stats.set(order.customer_id, entry);
    });

    // Staff accounts are not customers; only keep them when they have real order history
    // حسابات الفريق ليست عملاء، ولا تظهر إلا لو عندها طلبات فعلية
    const staffIds = new Set((staffResult.data || []).map((row) => row.user_id));

    const data = (profilesResult.data || []).map((profile) => {
      const entry = stats.get(profile.id) || { total: 0, pending: 0, completed: 0, cancelled: 0, lastOrderAt: null };
      return {
        profile,
        email: profile.email || null,
        totalOrders: entry.total,
        pendingOrders: entry.pending,
        completedOrders: entry.completed,
        cancelledOrders: entry.cancelled,
        lastOrderAt: entry.lastOrderAt,
      };
    }).filter((customer) => customer.totalOrders > 0 || !staffIds.has(customer.profile.id));

    return { data, error: null };
  } catch (error) {
    return { data: [], error: catalogError(error) };
  }
}

export async function getCustomerOrders(customerId) {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false });
    if (error) return { data: [], error };
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error: catalogError(error) };
  }
}

// Freeze or ban a customer account (staff with customers.manage) / تجميد أو حظر حساب عميل
export async function updateAccountStatus(customerId, accountStatus) {
  try {
    const supabase = await getSupabase();
    const { data, error } = await supabase
      .from('profiles')
      .update({ account_status: accountStatus })
      .eq('id', customerId)
      .select('*')
      .single();
    if (error) return { data: null, error };
    return { data, error: null };
  } catch (error) {
    return { data: null, error: catalogError(error) };
  }
}

// --- Team Service (super_admin only) ---

export async function getTeamMembers() {
  try {
    const supabase = await getSupabase();
    const { data: roles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role, permissions')
      .in('role', ['super_admin', 'admin']);
    if (rolesError) return { data: [], error: rolesError };

    const ids = (roles || []).map((row) => row.user_id);
    if (!ids.length) return { data: [], error: null };

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, full_name, email, account_status')
      .in('id', ids);
    if (profilesError) return { data: [], error: profilesError };

    const byId = new Map((profiles || []).map((profile) => [profile.id, profile]));
    return {
      data: (roles || []).map((row) => ({
        user_id: row.user_id,
        role: row.role,
        permissions: Array.isArray(row.permissions) ? row.permissions : [],
        full_name: byId.get(row.user_id)?.full_name || '',
        email: byId.get(row.user_id)?.email || null,
        account_status: byId.get(row.user_id)?.account_status || 'active',
      })),
      error: null,
    };
  } catch (error) {
    return { data: [], error: catalogError(error) };
  }
}

// Grant/revoke granular permissions or change a staff role / تعديل صلاحيات أو دور عضو الفريق
export async function updateTeamMember(userId, { role, permissions }) {
  try {
    const supabase = await getSupabase();
    const updates = { updated_at: new Date().toISOString() };
    if (role) updates.role = role;
    if (permissions) updates.permissions = sanitizePermissions(permissions);

    const { data, error } = await supabase
      .from('user_roles')
      .update(updates)
      .eq('user_id', userId)
      .select('user_id, role, permissions')
      .single();
    if (error) return { data: null, error };
    return { data, error: null };
  } catch (error) {
    return { data: null, error: catalogError(error) };
  }
}

// Look up an account by email so it can be promoted to admin / البحث بالبريد لترقية الحساب إلى أدمن
export async function findProfileByEmail(email) {
  try {
    const supabase = await getSupabase();
    // Escape LIKE wildcards so the input can only match one literal email / تهريب رموز البحث حتى يطابق بريداً واحداً
    const pattern = email.trim().replace(/[\\%_]/g, (character) => `\\${character}`);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, account_status')
      .ilike('email', pattern)
      .maybeSingle();
    if (error) return { data: null, error };
    return { data, error: null };
  } catch (error) {
    return { data: null, error: catalogError(error) };
  }
}
