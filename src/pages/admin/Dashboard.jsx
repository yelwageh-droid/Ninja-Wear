import { useEffect, useState } from 'react';
import { m } from 'framer-motion';
import { getAdminApparelProducts, getDesignCollections, getOrders } from '../../services/apparelService.js';
import { groupOrders } from '../../data/orders.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { PERMISSIONS } from '../../data/permissions.js';

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(Number(amount || 0));
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date);
}

function StatusBadge({ status }) {
  const statusStyles = {
    Pending: 'border-amber-300/20 bg-amber-300/10 text-amber-200',
    Confirmed: 'border-sky-300/20 bg-sky-300/10 text-sky-200',
    Printing: 'border-orange-300/20 bg-orange-300/10 text-orange-200',
    Shipped: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200',
    Completed: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200',
    Cancelled: 'border-red-300/20 bg-red-300/10 text-red-200',
    Mixed: 'border-white/20 bg-white/5 text-gray-300',
  };
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[status] || statusStyles.Pending}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status || 'Pending'}
    </span>
  );
}

export default function Dashboard() {
  const { hasPermission } = useAuth();
  // Each KPI only loads when the admin holds its permission / كل بطاقة تُحمّل فقط عند امتلاك صلاحيتها
  const canViewOrders = hasPermission(PERMISSIONS.ordersView);
  const canManageCatalog = hasPermission(PERMISSIONS.catalogManage);
  const canManageCollections = hasPermission(PERMISSIONS.collectionsManage);

  const [activeGarmentCount, setActiveGarmentCount] = useState(null);
  const [collectionCount, setCollectionCount] = useState(null);
  const [orders, setOrders] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadMetrics = async () => {
      const [garmentResult, collectionResult, orderResult] = await Promise.all([
        canManageCatalog ? getAdminApparelProducts() : Promise.resolve({ data: null, error: null }),
        canManageCollections ? getDesignCollections() : Promise.resolve({ data: null, error: null }),
        canViewOrders ? getOrders() : Promise.resolve({ data: null, error: null }),
      ]);
      if (cancelled) return;

      const errors = [garmentResult.error, collectionResult.error, orderResult.error].filter(Boolean);
      if (errors.length) setLoadError(errors.map((error) => error.message || error).join(' · '));
      if (garmentResult.data) setActiveGarmentCount(garmentResult.data.filter((garment) => garment.is_active).length);
      if (collectionResult.data) setCollectionCount(collectionResult.data.length);
      if (orderResult.data) setOrders(orderResult.data);
      setIsLoading(false);
    };
    loadMetrics();
    return () => { cancelled = true; };
  }, [canManageCatalog, canManageCollections, canViewOrders]);

  const groupedOrders = groupOrders(orders || []);

  const stats = [
    canViewOrders && { label: 'Total Revenue', value: orders === null ? null : formatCurrency(orders.filter((order) => order.status === 'Completed').reduce((total, order) => total + Number(order.total_price || 0), 0)), detail: 'From completed orders', icon: 'revenue', color: 'text-emerald-300' },
    canViewOrders && { label: 'Pending Orders', value: orders === null ? null : groupedOrders.filter((group) => group.status === 'Pending' || group.orders.some((order) => order.status === 'Pending')).length, detail: 'Awaiting processing', icon: 'pending', color: 'text-amber-300' },
    canManageCatalog && { label: 'Active Apparel', value: activeGarmentCount, detail: 'Visible garments in catalog', icon: 'apparel', color: 'text-red-300' },
    canManageCollections && { label: 'Design Collections', value: collectionCount, detail: 'Active design folders', icon: 'collections', color: 'text-sky-300' },
  ].filter(Boolean);

  const recentOrders = canViewOrders ? groupedOrders.slice(0, 5) : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-300">Store performance</p>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Dashboard Overview</h2>
        </div>
        <p className="border border-white/10 bg-white/3 px-3 py-2 text-xs text-gray-500">Live Supabase data</p>
      </div>

      {loadError && <p role="alert" className="border-s-2 border-red-400 px-4 py-3 text-sm text-red-200">Some dashboard metrics could not be loaded: {loadError}</p>}

      {stats.length > 0 && (
        <section aria-label="Store statistics" className={`grid gap-3 sm:grid-cols-2 ${stats.length > 2 ? 'xl:grid-cols-4' : ''}`}>
          {stats.map((stat, index) => (
            <m.article
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.05 }}
              className="border border-white/10 bg-[#0e0e11] p-5"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-gray-400">{stat.label}</p>
                <span className={stat.color}><svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                  {stat.icon === 'revenue' && <><path d="M12 2c1.31 0 2.47.22 3.55.59l1.12-.66a7 7 0 011.13.55c3.49 1.52 5.88 5.14 5.88 9.42 0 4.28-2.39 7.9-5.88 9.42a7 7 0 01-1.13-.55l-1.12-.66A13.9 13.9 0 0112 22c-4.71 0-8.55-3.84-8.55-8.55 0-4.28 2.39-7.9 5.88-9.42a7 7 0 011.13-.55l1.12-.66A13.8 13.8 0 0112 2z" /><path d="M12 14l9-5-9-5-9 5 9 5z" /></>}
                  {stat.icon === 'pending' && <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>}
                  {stat.icon === 'apparel' && <><path d="M9 3 5 5 3 9l3 1.6V21h12v-10.4L21 9l-2-4-4-2-3 2-3-2Z" /><path d="M9 3c0 1.7 1.3 3 3 3s3-1.3 3-3" /></>}
                  {stat.icon === 'collections' && <><path d="M3 7h7l2 2h9v10H3z" /><path d="M3 7V5h7l2 2" /></>}
                </svg></span>
              </div>
              <p className="mt-5 text-2xl font-bold tracking-tight text-white">{isLoading ? '…' : stat.value ?? '—'}</p>
              <p className="mt-2 text-xs text-gray-500">{stat.detail}</p>
            </m.article>
          ))}
        </section>
      )}

      {canViewOrders && (
        <section className="border border-white/10 bg-[#0e0e11]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4 sm:px-6">
            <div>
              <h3 className="font-bold text-white">Recent Orders</h3>
              <p className="mt-1 text-xs text-gray-500">The latest five orders</p>
            </div>
            <span className="text-xs font-medium text-gray-500">{orders === null ? '—' : `${groupedOrders.length} orders · ${orders.length} items`}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-180 text-left text-sm">
              <thead className="bg-white/2.5 text-xs uppercase tracking-wider text-gray-500">
                <tr>
                  <th scope="col" className="px-5 py-3 font-semibold sm:px-6">Order ID</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Customer</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Date</th>
                  <th scope="col" className="px-5 py-3 font-semibold">Status</th>
                  <th scope="col" className="px-5 py-3 text-right font-semibold sm:px-6">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/6">
                {recentOrders.length ? recentOrders.map((group) => {
                  const order = group.primaryOrder;
                  return (
                    <tr key={group.id} className="transition-colors hover:bg-white/2.5">
                      <td className="whitespace-nowrap px-5 py-4 font-semibold text-white sm:px-6">{order.id ?? order.order_id ?? String(group.id).slice(0, 8)}{group.itemCount > 1 ? ` · ${group.itemCount} items` : ''}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-gray-300">{order.customer_name || '—'}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-gray-500">{formatDate(order.created_at || order.createdAt)}</td>
                      <td className="whitespace-nowrap px-5 py-4"><StatusBadge status={group.status} /></td>
                      <td className="whitespace-nowrap px-5 py-4 text-right font-semibold text-gray-200 sm:px-6">{formatCurrency(group.totalPrice)}</td>
                    </tr>
                  );
                }) : <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-gray-500">{isLoading ? 'Loading orders...' : orders === null ? 'Order metrics are unavailable.' : 'No orders found.'}</td></tr>}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {!canViewOrders && !canManageCatalog && !canManageCollections && (
        <p className="border border-white/10 bg-[#0e0e11] px-5 py-12 text-center text-sm text-gray-500">
          Your account has no dashboard permissions yet. Ask a super admin to grant access.
        </p>
      )}
    </div>
  );
}
