import { useEffect, useMemo, useState } from 'react';
import { getCustomerOrders, getCustomerSummaries, updateAccountStatus } from '../../services/apparelService.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { PERMISSIONS } from '../../data/permissions.js';

const accountStatuses = ['active', 'frozen', 'banned'];

const accountStatusStyles = {
  active: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200',
  frozen: 'border-amber-300/20 bg-amber-300/10 text-amber-200',
  banned: 'border-red-300/20 bg-red-300/10 text-red-200',
};

const orderStatusStyles = {
  Pending: 'border-amber-300/20 bg-amber-300/10 text-amber-200',
  Confirmed: 'border-sky-300/20 bg-sky-300/10 text-sky-200',
  Printing: 'border-orange-300/20 bg-orange-300/10 text-orange-200',
  Shipped: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200',
  Completed: 'border-emerald-300/20 bg-emerald-300/10 text-emerald-200',
  Cancelled: 'border-red-300/20 bg-red-300/10 text-red-200',
};

function formatCurrency(amount) {
  return new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', maximumFractionDigits: 0 }).format(Number(amount || 0));
}

function formatDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(date);
}

function StatusPill({ status, styles }) {
  return (
    <span className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold capitalize ${styles[status] || 'border-white/15 bg-white/5 text-gray-300'}`}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {status}
    </span>
  );
}

// Side panel with one customer's full order history / لوحة تعرض كل طلبات العميل
function CustomerOrdersModal({ customer, onClose }) {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    let cancelled = false;
    const loadOrders = async () => {
      const result = await getCustomerOrders(customer.profile.id);
      if (cancelled) return;
      if (result.error) setLoadError(result.error.message || result.error);
      else setOrders(result.data);
      setIsLoading(false);
    };
    loadOrders();
    return () => { cancelled = true; };
  }, [customer.profile.id]);

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <button type="button" aria-label="Close customer orders" onClick={onClose} className="absolute inset-0 cursor-default bg-black/75 backdrop-blur-sm" />
      <section role="dialog" aria-modal="true" aria-label="Customer orders" className="relative z-10 flex max-h-[85vh] w-full max-w-2xl flex-col border border-white/10 bg-[#0e0e11] shadow-2xl shadow-black/50">
        <header className="flex items-start justify-between gap-5 border-b border-white/10 px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-red-300">Order history</p>
            <h2 className="mt-1 text-lg font-bold text-white">{customer.profile.full_name || 'Unnamed customer'}</h2>
            <p className="mt-1 text-xs text-gray-500">{customer.email || '—'}</p>
          </div>
          <button type="button" onClick={onClose} className="flex h-9 w-9 items-center justify-center border border-white/10 text-lg text-gray-400 transition hover:border-white/30 hover:text-white" aria-label="Close">×</button>
        </header>

        <div className="grid grid-cols-2 gap-3 border-b border-white/10 px-5 py-4 text-sm sm:grid-cols-4 sm:px-6">
          <div><p className="text-xs text-gray-500">Total</p><p className="mt-1 font-bold text-white">{customer.totalOrders}</p></div>
          <div><p className="text-xs text-gray-500">In progress</p><p className="mt-1 font-bold text-amber-200">{customer.pendingOrders}</p></div>
          <div><p className="text-xs text-gray-500">Completed</p><p className="mt-1 font-bold text-emerald-200">{customer.completedOrders}</p></div>
          <div><p className="text-xs text-gray-500">Cancelled</p><p className="mt-1 font-bold text-red-200">{customer.cancelledOrders}</p></div>
        </div>

        <div className="min-h-24 flex-1 overflow-y-auto px-5 py-4 sm:px-6">
          {isLoading && <p className="py-8 text-center text-sm text-gray-500">Loading orders...</p>}
          {loadError && <p role="alert" className="border-s-2 border-red-400 px-3 py-2 text-sm text-red-200">{loadError}</p>}
          {!isLoading && !loadError && !orders.length && <p className="py-8 text-center text-sm text-gray-500">This customer has not placed any orders yet.</p>}
          <ul className="space-y-3">
            {orders.map((order) => (
              <li key={order.id} className="border border-white/10 bg-[#111116] p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-white">{order.design_name || order.product_info || 'Order item'}</p>
                    <p className="mt-1 text-xs text-gray-500">{formatDate(order.created_at)} · {order.order_details?.garment_quantity || 1} pcs</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <StatusPill status={order.status || 'Pending'} styles={orderStatusStyles} />
                    <span className="text-sm font-bold text-red-200">{formatCurrency(order.total_price)}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  );
}

export default function CustomersManager() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PERMISSIONS.customersManage);
  const [customers, setCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [actionError, setActionError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [pendingId, setPendingId] = useState('');

  useEffect(() => {
    let cancelled = false;
    const loadCustomers = async () => {
      const result = await getCustomerSummaries();
      if (cancelled) return;
      if (result.error) setLoadError(result.error.message || result.error);
      else setCustomers(result.data);
      setIsLoading(false);
    };
    loadCustomers();
    return () => { cancelled = true; };
  }, []);

  const filteredCustomers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return customers;
    return customers.filter((customer) => [customer.profile.full_name, customer.email].some((value) => (value || '').toLowerCase().includes(query)));
  }, [customers, search]);

  const selectedCustomer = customers.find((customer) => customer.profile.id === selectedCustomerId);

  const handleStatusChange = async (customerId, status) => {
    setPendingId(customerId);
    setActionError('');
    const { error } = await updateAccountStatus(customerId, status);
    if (error) {
      setActionError(error.message || String(error));
      setPendingId('');
      return;
    }
    setCustomers((current) => current.map((customer) => (
      customer.profile.id === customerId ? { ...customer, profile: { ...customer.profile, account_status: status } } : customer
    )));
    setPendingId('');
  };

  return (
    <div className="space-y-7">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-red-300">Customer operations</p>
          <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">Customers</h2>
          <p className="mt-2 text-sm text-gray-500">{canManage ? 'Review accounts, their order history, and freeze or ban when required.' : 'Read-only view. Managing account status requires the customers.manage permission.'}</p>
        </div>
        <label className="text-sm text-gray-400">
          <span className="sr-only">Search customers</span>
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search name or email" className="w-64 rounded-md border border-white/10 bg-[#111116] px-3 py-2 text-sm text-white outline-none focus:border-red-300" />
        </label>
      </div>

      {loadError && <p role="alert" className="border-s-2 border-red-400 px-4 py-3 text-sm text-red-200">Could not load customers: {loadError}</p>}
      {actionError && <p role="alert" className="border-s-2 border-red-400 px-4 py-3 text-sm text-red-200">{actionError}</p>}

      <section className="border border-white/10 bg-[#0e0e11]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-200 text-left text-sm">
            <thead className="bg-white/2.5 text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">Customer</th>
                <th scope="col" className="px-5 py-3 font-semibold">Account</th>
                <th scope="col" className="px-5 py-3 font-semibold">Orders</th>
                <th scope="col" className="px-5 py-3 font-semibold">Last order</th>
                <th scope="col" className="px-5 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/6">
              {isLoading && <tr><td colSpan="5" className="px-5 py-12 text-center text-sm text-gray-500">Loading customers...</td></tr>}
              {!isLoading && !filteredCustomers.length && <tr><td colSpan="5" className="px-5 py-12 text-center text-sm text-gray-500">{customers.length ? 'No customers match your search.' : 'No customers have signed up yet.'}</td></tr>}
              {filteredCustomers.map((customer) => (
                <tr key={customer.profile.id} className="transition-colors hover:bg-white/2.5">
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-200">{customer.profile.full_name || '—'}</p>
                    <p className="mt-1 text-xs text-gray-500">{customer.email || '—'}</p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4"><StatusPill status={customer.profile.account_status || 'active'} styles={accountStatusStyles} /></td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <p className="text-gray-200">{customer.totalOrders} total</p>
                    <p className="mt-1 text-xs text-gray-500">{customer.pendingOrders} in progress · {customer.completedOrders} done · {customer.cancelledOrders} cancelled</p>
                  </td>
                  <td className="whitespace-nowrap px-5 py-4 text-gray-500">{formatDate(customer.lastOrderAt)}</td>
                  <td className="whitespace-nowrap px-5 py-4">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button type="button" onClick={() => setSelectedCustomerId(customer.profile.id)} className="rounded-md border border-white/10 px-3 py-2 text-xs font-semibold text-gray-300 transition hover:border-red-300/50 hover:text-white">View orders</button>
                      {canManage && (
                        <>
                          <label className="sr-only" htmlFor={`account-${customer.profile.id}`}>Change account status</label>
                          <select
                            id={`account-${customer.profile.id}`}
                            value={customer.profile.account_status || 'active'}
                            disabled={pendingId === customer.profile.id}
                            onChange={(event) => handleStatusChange(customer.profile.id, event.target.value)}
                            className={`rounded-md border bg-[#111116] px-3 py-2 text-xs font-semibold outline-none focus:border-white/30 disabled:opacity-50 ${accountStatusStyles[customer.profile.account_status || 'active']}`}
                          >
                            {accountStatuses.map((status) => <option key={status} value={status} className="bg-[#111116] text-white">{status}</option>)}
                          </select>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {selectedCustomer && <CustomerOrdersModal customer={selectedCustomer} onClose={() => setSelectedCustomerId('')} />}
    </div>
  );
}
