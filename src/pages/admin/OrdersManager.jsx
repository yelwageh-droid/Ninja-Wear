import { useEffect, useState } from 'react';
import { getAdminLaptops, getCollections, getOrderImageUrls, getOrders, updateOrderStatus } from '../../data/catalog.js';
import { groupOrders } from '../../data/orders.js';

const orderStatuses = ['Pending', 'Processing', 'Shipped', 'Completed', 'Cancelled'];

const statusStyles = {
  Pending: 'border-amber-300/20 bg-amber-300/10 text-amber-200',
  Processing: 'border-sky-300/20 bg-sky-300/10 text-sky-200',
  Shipped: 'border-orange-300/20 bg-orange-300/10 text-orange-200',
  Completed: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200',
  Cancelled: 'border-red-300/20 bg-red-300/10 text-red-200',
  Mixed: 'border-white/20 bg-white/5 text-gray-300',
};

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-EG', {
    style: 'currency',
    currency: 'EGP',
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date);
}

function getOrderId(order) {
  return order.id ?? order.order_id;
}

function getLaptopLabel(order, laptops) {
  const laptop = laptops.find((item) => String(item.id) === String(order.laptop_id));
  if (!laptop) return order.laptop_id ? `Laptop #${order.laptop_id}` : '—';
  return `${laptop.brand} ${laptop.series}${laptop.models.length ? ` · ${laptop.models.join(', ')}` : ''}`;
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[status] || statusStyles.Pending}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function OrderDetailsModal({ group, laptops, collections, onClose }) {
  const [imageUrls, setImageUrls] = useState({});
  const [imageError, setImageError] = useState('');

  useEffect(() => {
    // Allow keyboard users to dismiss order details / إتاحة إغلاق نافذة التفاصيل بلوحة المفاتيح
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    const paths = group.orders.flatMap((order) => [
      order.order_details?.design_image_path,
      order.order_details?.logo_image_path,
    ].filter(Boolean));
    if (!paths.length) return undefined;

    const loadImages = async () => {
      const { data, error } = await getOrderImageUrls(paths);
      if (cancelled) return;
      if (error) setImageError(error.message || String(error));
      else setImageUrls(data);
    };

    loadImages();
    return () => { cancelled = true; };
  }, [group]);

  const primaryOrder = group.orders[0];
  const displayId = group.cartGroupId || getOrderId(primaryOrder) || 'Order';

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button type="button" aria-label="Close order details" onClick={onClose} className="absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm" />
      <section role="dialog" aria-modal="true" aria-labelledby="order-details-title" className="relative z-10 w-full max-w-xl border border-white/10 bg-[#0e0e11] shadow-2xl shadow-black/50">
        <header className="flex items-start justify-between gap-5 border-b border-white/10 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-300">Order details</p>
            <h2 id="order-details-title" className="mt-1 text-xl font-bold text-white">Order {String(displayId).slice(0, 12)}</h2>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center border border-white/10 text-lg text-gray-400 transition hover:border-white/30 hover:text-white" aria-label="Close">×</button>
        </header>
        <div className="space-y-5 p-5 sm:p-6">
          <div className="grid gap-3 border-b border-white/10 pb-5 sm:grid-cols-2">
            <div><p className="text-xs uppercase tracking-wider text-gray-500">Customer</p><p className="mt-1 font-semibold text-white">{primaryOrder.customer_name || '—'}</p></div>
            <div><p className="text-xs uppercase tracking-wider text-gray-500">Email</p><p className="mt-1 break-all text-gray-300">{primaryOrder.customer_email || '—'}</p></div>
            <div><p className="text-xs uppercase tracking-wider text-gray-500">Phone</p><p className="mt-1 text-gray-300">{primaryOrder.customer_phone || '—'}</p></div>
            <div><p className="text-xs uppercase tracking-wider text-gray-500">Address</p><p className="mt-1 text-gray-300">{primaryOrder.customer_address || '—'}</p></div>
            <div><p className="text-xs uppercase tracking-wider text-gray-500">Order date</p><p className="mt-1 text-gray-300">{formatDate(primaryOrder.created_at || primaryOrder.createdAt)}</p></div>
            <div><p className="text-xs uppercase tracking-wider text-gray-500">Order total</p><p className="mt-1 font-bold text-red-200">{formatCurrency(group.totalPrice)}</p></div>
          </div>
          <div className="max-h-[45vh] space-y-3 overflow-y-auto">
            {group.orders.map((order, itemIndex) => {
              const laptopLabel = [order.order_details?.laptop_brand, order.order_details?.laptop_series, order.order_details?.laptop_model].filter(Boolean).join(' ')
                || getLaptopLabel(order, laptops);
              const collection = collections.find((item) => item.name === order.collection_name);
              const designImageUrl = imageUrls[order.order_details?.design_image_path];
              const logoImageUrl = imageUrls[order.order_details?.logo_image_path];
              return (
                <article key={getOrderId(order) ?? `${order.customer_email}-${itemIndex}`} className="border border-white/10 bg-[#111116] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-semibold text-white">Item {itemIndex + 1}</h3><span className="text-sm font-bold text-red-200">{formatCurrency(order.total_price)}</span></div>
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div><dt className="text-xs text-gray-500">Laptop model</dt><dd className="mt-1 text-gray-200">{laptopLabel}</dd></div>
                    <div><dt className="text-xs text-gray-500">Collection</dt><dd className="mt-1 text-gray-200">{collection?.displayName || order.collection_name || '—'}</dd></div>
                    <div><dt className="text-xs text-gray-500">Skin design</dt><dd className="mt-1 text-gray-200">{order.skin_design || '—'}</dd></div>
                    <div><dt className="text-xs text-gray-500">Coverage type</dt><dd className="mt-1 text-gray-200">{order.coverage_type || '—'}</dd></div>
                    <div><dt className="text-xs text-gray-500">Logo preference</dt><dd className="mt-1 text-gray-200">{order.logo_preference || '—'}{order.order_details?.logo_location ? ` · ${order.order_details.logo_location}` : ''}</dd></div>
                  </dl>
                  {(designImageUrl || logoImageUrl) && <div className="mt-4 grid gap-3 border-t border-white/10 pt-4 sm:grid-cols-2">
                    {designImageUrl && <figure><img src={designImageUrl} alt={`Uploaded design for item ${itemIndex + 1}`} className="aspect-4/3 w-full border border-white/10 bg-[#0a0a0c] object-contain" /><figcaption className="mt-2 text-xs text-gray-500">Customer design</figcaption></figure>}
                    {logoImageUrl && <figure><img src={logoImageUrl} alt={`Uploaded logo for item ${itemIndex + 1}`} className="aspect-4/3 w-full border border-white/10 bg-[#0a0a0c] object-contain" /><figcaption className="mt-2 text-xs text-gray-500">Customer logo</figcaption></figure>}
                  </div>}
                </article>
              );
            })}
          </div>
          {imageError && <p role="alert" className="border-s-2 border-amber-300/50 px-3 py-2 text-xs text-amber-100">Images could not be loaded: {imageError}</p>}
          <div className="flex items-center justify-between border-t border-white/10 pt-4">
            <span className="text-sm text-gray-500">Current status</span>
            <StatusBadge status={group.status} />
          </div>
        </div>
      </section>
    </div>
  );
}

export default function OrdersManager() {
  const [orders, setOrders] = useState([]);
  const [laptops, setLaptops] = useState([]);
  const [collections, setCollections] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [actionError, setActionError] = useState('');
  const orderGroups = groupOrders(orders);
  const selectedGroup = orderGroups.find((group) => String(group.id) === selectedGroupId);

  useEffect(() => {
    let cancelled = false;
    const loadOrderData = async () => {
      const [orderResult, laptopResult, collectionResult] = await Promise.all([getOrders(), getAdminLaptops(), getCollections()]);
      if (cancelled) return;
      if (orderResult.error) setLoadError(orderResult.error.message || orderResult.error);
      else setOrders(orderResult.data);
      if (laptopResult.error) setActionError(laptopResult.error.message || laptopResult.error);
      else setLaptops(laptopResult.data);
      if (collectionResult.error) setActionError(collectionResult.error.message || collectionResult.error);
      else setCollections(collectionResult.data);
      setIsLoading(false);
    };
    loadOrderData();
    return () => { cancelled = true; };
  }, []);

  // Persist status changes to Supabase / حفظ تغييرات الحالة في Supabase
  const handleStatusChange = async (group, status) => {
    setPendingOrderId(String(group.id));
    setActionError('');
    const results = await Promise.all(group.orders.map(async (order) => {
      const orderId = getOrderId(order);
      if (orderId === undefined || orderId === null) return { orderId, error: new Error('An order row is missing its id.') };
      return { orderId, ...await updateOrderStatus(orderId, status) };
    }));
    const failedUpdates = results.filter((result) => result.error);
    if (failedUpdates.length) {
      setActionError(failedUpdates.map((result) => result.error.message || result.error).join(' · '));
    }
    setOrders((current) => current.map((order) => {
      const updated = results.find((result) => !result.error && String(result.orderId) === String(getOrderId(order)));
      return updated ? updated.data : order;
    }));
    setPendingOrderId(null);
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-300">Order operations</p>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Orders Management</h2>
          <p className="mt-2 text-sm text-gray-500">Review customer selections and update order progress in Supabase.</p>
        </div>
        <span className="border border-white/10 bg-white/3 px-3 py-2 text-xs text-gray-400">{isLoading ? 'Loading...' : `${orderGroups.length} orders · ${orders.length} items`}</span>
      </div>

      {loadError && <p role="alert" className="border-s-2 border-red-400 px-4 py-3 text-sm text-red-200">Could not load orders: {loadError}</p>}
      {actionError && <p role="alert" className="border-s-2 border-red-400 px-4 py-3 text-sm text-red-200">{actionError}</p>}

      <section className="border border-white/10 bg-[#0e0e11]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-225 text-left text-sm">
            <thead className="bg-white/2.5 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Order ID</th>
                <th scope="col" className="px-5 py-3 font-semibold">Customer</th>
                <th scope="col" className="px-5 py-3 font-semibold">Date</th>
                <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Total</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6">
              {isLoading && <tr><td colSpan="6" className="px-5 py-12 text-center text-sm text-gray-500">Loading orders...</td></tr>}
              {!isLoading && !orderGroups.length && <tr><td colSpan="6" className="px-5 py-12 text-center text-sm text-gray-500">{loadError ? 'Orders could not be loaded.' : 'No orders found.'}</td></tr>}
              {orderGroups.map((group) => {
                const order = group.primaryOrder;
                const hasOrderIds = group.orders.every((item) => getOrderId(item) !== undefined && getOrderId(item) !== null);
                return (
                <tr key={group.id} className="transition-colors hover:bg-white/2.5">
                  <td className="whitespace-nowrap px-5 py-4 font-semibold text-white"><span>{getOrderId(order) ?? String(group.id).slice(0, 8)}</span>{group.itemCount > 1 && <span className="ms-2 rounded border border-white/10 px-1.5 py-1 text-[10px] font-medium text-gray-400">{group.itemCount} items</span>}</td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <p className="font-medium text-gray-200">{order.customer_name || '—'}</p>
                    <p className="mt-1 text-xs text-gray-500">{order.customer_email || '—'}</p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-gray-500">{formatDate(order.created_at || order.createdAt)}</td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <label className="sr-only" htmlFor={`status-${group.id}`}>Change status for order group {group.id}</label>
                    <select id={`status-${group.id}`} value={group.status} disabled={pendingOrderId === String(group.id) || !hasOrderIds} onChange={(event) => handleStatusChange(group, event.target.value)} className={`rounded-md border bg-[#111116] px-3 py-2 text-xs font-semibold outline-none focus:border-white/30 disabled:opacity-50 ${statusStyles[group.status] || statusStyles.Pending}`}>
                      {group.status === 'Mixed' && <option value="Mixed" disabled className="bg-[#111116] text-white">Mixed statuses</option>}
                      {orderStatuses.map((status) => <option key={status} value={status} className="bg-[#111116] text-white">{status}</option>)}
                    </select>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-gray-200">{formatCurrency(group.totalPrice)}</td>
                  <td className="whitespace-nowrap px-5 py-4 text-right">
                    <button type="button" onClick={() => setSelectedGroupId(String(group.id))} className="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-gray-300 transition hover:border-red-300/50 hover:text-white">View Details</button>
                  </td>
                </tr>
              );})}
            </tbody>
          </table>
        </div>
      </section>

      {selectedGroup && <OrderDetailsModal group={selectedGroup} laptops={laptops} collections={collections} onClose={() => setSelectedGroupId('')} />}
    </div>
  );
}
