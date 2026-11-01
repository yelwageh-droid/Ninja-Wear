import { useEffect, useState } from 'react';
import { m } from 'framer-motion';
import { getAdminLaptops, getCollections, getOrders } from '../../data/catalog.js';
import { groupOrders } from '../../data/orders.js';

const statusStyles = {
  Pending: 'border-amber-300/20 bg-amber-300/10 text-amber-200',
  Processing: 'border-sky-300/20 bg-sky-300/10 text-sky-200',
  Shipped: 'border-orange-300/20 bg-orange-300/10 text-orange-200',
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

function StatusBadge({ status }) {
  const normalizedStatus = statusStyles[status] ? status : 'Pending';
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[normalizedStatus]}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status || 'Unknown'}
    </span>
  );
}

function MetricIcon({ name }) {
  const paths = {
    revenue: <><path d="M4 17 9 12l4 3 7-8" /><path d="M15 7h5v5" /></>,
    pending: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    laptops: <><rect x="4" y="4" width="16" height="12" rx="1.5" /><path d="M2 20h20l-2-4H4l-2 4Z" /></>,
    collections: <><path d="M3 7h7l2 2h9v10H3z" /><path d="M3 7V5h7l2 2" /></>,
  };

  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      {paths[name]}
    </svg>
  );
}

export default function Dashboard() {
  const [activeLaptopCount, setActiveLaptopCount] = useState(null);
  const [collectionCount, setCollectionCount] = useState(null);
  const [orders, setOrders] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let cancelled = false;

    // Load dashboard metrics from live catalog and orders sources / تحميل مؤشرات لوحة التحكم من بيانات الكتالوج والطلبات الفعلية
    const loadMetrics = async () => {
      const [laptopResult, collectionResult, orderResult] = await Promise.all([getAdminLaptops(), getCollections(), getOrders()]);
      if (cancelled) return;

      const errors = [laptopResult.error, collectionResult.error, orderResult.error].filter(Boolean);
      if (errors.length) setLoadError(errors.map((error) => error.message || error).join(' · '));
      if (!laptopResult.error) setActiveLaptopCount(laptopResult.data.filter((laptop) => laptop.is_active).length);
      if (!collectionResult.error) setCollectionCount(collectionResult.data.length);
      if (!orderResult.error) setOrders(orderResult.data);
      setIsLoading(false);
    };

    loadMetrics();
    return () => { cancelled = true; };
  }, []);

  const groupedOrders = groupOrders(orders || []);
  const catalogStats = [
    { label: 'Total Revenue', value: orders === null ? null : formatCurrency(orders.filter((order) => order.status === 'Completed').reduce((total, order) => total + Number(order.total_price || 0), 0)), detail: 'From completed orders', icon: 'revenue', color: 'text-emerald-300' },
    { label: 'Pending Orders', value: orders === null ? null : groupedOrders.filter((group) => group.orders.some((order) => order.status === 'Pending')).length, detail: 'Awaiting processing', icon: 'pending', color: 'text-amber-300' },
    { label: 'Active Laptops', value: activeLaptopCount, detail: 'Visible devices in AVL_Laptops', icon: 'laptops', color: 'text-red-300' },
    { label: 'Total Collections', value: collectionCount, detail: 'Folders in the Skins bucket', icon: 'collections', color: 'text-sky-300' },
  ];
  const recentOrders = groupedOrders.slice(0, 5);

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
      <section aria-label="Store statistics" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {catalogStats.map((stat, index) => (
          <m.article
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: index * 0.05 }}
            className="border border-white/10 bg-[#0e0e11] p-5"
          >
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-400">{stat.label}</p>
              <span className={stat.color}><MetricIcon name={stat.icon} /></span>
            </div>
            <p className="mt-5 text-2xl font-bold tracking-tight text-white">{isLoading ? '…' : stat.value ?? '—'}</p>
            <p className="mt-2 text-xs text-gray-500">{stat.detail}</p>
          </m.article>
        ))}
      </section>

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
              );}) : <tr><td colSpan="5" className="px-5 py-12 text-center text-sm text-gray-500">{isLoading ? 'Loading orders...' : orders === null ? 'Order metrics are unavailable.' : 'No orders found.'}</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
