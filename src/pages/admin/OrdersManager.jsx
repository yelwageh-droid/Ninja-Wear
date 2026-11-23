import { useEffect, useState } from 'react';
import { getOrderImageUrls, getOrders, updateOrderStatus } from '../../services/apparelService.js';
import { ORDER_STATUSES, groupOrders } from '../../data/orders.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { PERMISSIONS } from '../../data/permissions.js';

const statusStyles = {
  Pending: 'border-amber-300/20 bg-amber-300/10 text-amber-200',
  Confirmed: 'border-sky-300/20 bg-sky-300/10 text-sky-200',
  Printing: 'border-orange-300/20 bg-orange-300/10 text-orange-200',
  Shipped: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200',
  Completed: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200',
  Cancelled: 'border-red-300/20 bg-red-300/10 text-red-200',
  Mixed: 'border-white/20 bg-white/5 text-gray-300',
};

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(Number(amount || 0));
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date);
}

function getOrderId(order) {
  return order.id ?? order.order_id;
}

function StatusBadge({ status }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[status] || statusStyles.Pending}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

function OrderDetailsModal({ group, onClose }) {
  const [imageUrls, setImageUrls] = useState({});
  const [imageError, setImageError] = useState('');

  useEffect(() => {
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
      // Signed URLs from the private custom_design_uploads bucket / روابط موقّعة من bucket المرفوعات الخاص
      const { data, error } = await getOrderImageUrls(paths);
      if (cancelled) return;
      if (error) setImageError(error.message || String(error));
      else setImageUrls(data);
    };

    loadImages();
    return () => { cancelled = true; };
  }, [group]);

  const primaryOrder = group.orders[0];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button type="button" aria-label="Close order details" onClick={onClose} className="absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm" />
      <section role="dialog" aria-modal="true" aria-labelledby="order-details-title" className="relative z-10 w-full max-w-xl border border-white/10 bg-[#0e0e11] shadow-2xl shadow-black/50">
        <header className="flex items-start justify-between gap-5 border-b border-white/10 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-300">Order details</p>
            <h2 id="order-details-title" className="mt-1 text-xl font-bold text-white">Order {String(group.id).slice(0, 12)}</h2>
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
              const details = order.order_details || {};
              const designImageUrl = imageUrls[details.design_image_path];
              const logoImageUrl = imageUrls[details.logo_image_path];
              return (
                <article key={getOrderId(order) ?? `${order.customer_email}-${itemIndex}`} className="border border-white/10 bg-[#111116] p-4">
                  <div className="mb-3 flex items-center justify-between gap-3"><h3 className="font-semibold text-white">Item {itemIndex + 1}</h3><span className="text-sm font-bold text-red-200">{formatCurrency(order.total_price)}</span></div>
                  <dl className="grid gap-3 text-sm sm:grid-cols-2">
                    <div><dt className="text-xs text-gray-500">Garment</dt><dd className="mt-1 text-gray-200">{details.garment_category || order.product_info || '—'}</dd></div>
                    <div><dt className="text-xs text-gray-500">Fit & Size</dt><dd className="mt-1 text-gray-200">{details.garment_fit_type || '—'} · {details.garment_size || '—'}</dd></div>
                    <div><dt className="text-xs text-gray-500">Color</dt><dd className="mt-1 text-gray-200">{details.garment_color || '—'}</dd></div>
                    <div><dt className="text-xs text-gray-500">Quantity</dt><dd className="mt-1 text-gray-200">{details.garment_quantity || '—'}</dd></div>
                    <div><dt className="text-xs text-gray-500">Collection</dt><dd className="mt-1 text-gray-200">{details.collection_name || '—'}</dd></div>
                    <div><dt className="text-xs text-gray-500">Design</dt><dd className="mt-1 text-gray-200">{details.design_file_name || order.design_name || '—'}</dd></div>
                    <div><dt className="text-xs text-gray-500">Print Placement</dt><dd className="mt-1 text-gray-200">{details.print_placement || '—'}</dd></div>
                    <div><dt className="text-xs text-gray-500">Logo</dt><dd className="mt-1 text-gray-200">{details.logo_placement || details.logo_option_id || '—'}</dd></div>
                    {details.print_notes && <div><dt className="text-xs text-gray-500">Print Notes</dt><dd className="mt-1 text-gray-200">{details.print_notes}</dd></div>}
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
  const { hasPermission } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [pendingOrderId, setPendingOrderId] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [actionError, setActionError] = useState('');
  const orderGroups = groupOrders(orders);
  const selectedGroup = orderGroups.find((group) => String(group.id) === selectedGroupId);
  // Admins without the orders.edit permission get a read-only view / الأدمن بدون صلاحية التعديل يرى الطلبات فقط
  const canEdit = hasPermission(PERMISSIONS.ordersEdit);

  useEffect(() => {
    let cancelled = false;
    const loadOrderData = async () => {
      const orderResult = await getOrders();
      if (cancelled) return;
      if (orderResult.error) setLoadError(orderResult.error.message || orderResult.error);
      else setOrders(orderResult.data);
      setIsLoading(false);
    };
    loadOrderData();
    return () => { cancelled = true; };
  }, []);

  const handleStatusChange = async (group, status) => {
    setPendingOrderId(String(group.id));
    setActionError('');

    // Persist every row through the RLS-protected update (orders.edit) / التحديث عبر RLS المحمي بصلاحية orders.edit
    const results = await Promise.all(group.orders.map(async (order) => {
      const orderId = getOrderId(order);
      if (orderId === undefined || orderId === null) return { orderId, error: new Error('An order row is missing its id.') };
      const { error } = await updateOrderStatus(orderId, status);
      return { orderId, error };
    }));

    const failedUpdates = results.filter((result) => result.error);
    if (failedUpdates.length) {
      setActionError(failedUpdates.map((result) => result.error.message || result.error).join(' · '));
      setPendingOrderId(null);
      return;
    }

    // Reflect the new status locally after a successful change / تحديث الحالة محلياً بعد نجاح التعديل
    setOrders((current) => current.map((order) => (
      group.orders.some((groupOrder) => getOrderId(groupOrder) === getOrderId(order))
        ? { ...order, status }
        : order
    )));
    setPendingOrderId(null);
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-300">Order operations</p>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Orders Management</h2>
          <p className="mt-2 text-sm text-gray-500">{canEdit ? 'Review customer selections and update order progress.' : 'Read-only view. Updating order status requires the orders.edit permission.'}</p>
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
                      {canEdit ? (
                        <>
                          <label className="sr-only" htmlFor={`status-${group.id}`}>Change status for order group {group.id}</label>
                          <select id={`status-${group.id}`} value={group.status} disabled={pendingOrderId === String(group.id) || !hasOrderIds} onChange={(event) => handleStatusChange(group, event.target.value)} className={`rounded-md border bg-[#111116] px-3 py-2 text-xs font-semibold outline-none focus:border-white/30 disabled:opacity-50 ${statusStyles[group.status] || statusStyles.Pending}`}>
                            {group.status === 'Mixed' && <option value="Mixed" disabled className="bg-[#111116] text-white">Mixed statuses</option>}
                            {ORDER_STATUSES.map((status) => <option key={status} value={status} className="bg-[#111116] text-white">{status}</option>)}
                          </select>
                        </>
                      ) : (
                        <StatusBadge status={group.status} />
                      )}
                    </td>
                    <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-gray-200">{formatCurrency(group.totalPrice)}</td>
                    <td className="whitespace-nowrap px-5 py-4 text-right">
                      <button type="button" onClick={() => setSelectedGroupId(String(group.id))} className="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-gray-300 transition hover:border-red-300/50 hover:text-white">View Details</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {selectedGroup && <OrderDetailsModal group={selectedGroup} onClose={() => setSelectedGroupId('')} />}
    </div>
  );
}
