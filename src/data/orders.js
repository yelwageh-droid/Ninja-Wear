// Shared order-group helpers used by the storefront account page and the admin board.
// دوال مساعدة لحالة مجموعة الطلبات تُستخدم في صفحة الحساب ولوحة الإدارة.

export const ORDER_STATUS_SEQUENCE = ['Pending', 'Confirmed', 'Printing', 'Shipped', 'Completed'];

export const ORDER_STATUSES = [...ORDER_STATUS_SEQUENCE, 'Cancelled'];

// One status for a whole cart group, or 'Mixed' when its rows disagree
// حالة واحدة لكل مجموعة، أو 'Mixed' لو الحالات مختلفة
export function computeOrderGroupStatus(orders = []) {
  const statuses = [...new Set(orders.map((order) => order.status).filter(Boolean))];
  if (!statuses.length) return 'Pending';
  if (statuses.length === 1) return statuses[0];
  return 'Mixed';
}

export function orderGroupTimestamp(order) {
  const value = order?.created_at || order?.createdAt;
  return new Date(value || 0).getTime() || 0;
}

// Group raw order rows into cart groups, newest first / تجميع صفوف الطلبات في مجموعات مرتبة
export function groupOrders(orders = []) {
  const groups = new Map();

  orders.forEach((order) => {
    const key = order.cart_group_id || order.id;
    if (!groups.has(key)) {
      groups.set(key, { id: key, cartGroupId: order.cart_group_id || null, orders: [], latestTimestamp: 0, totalPrice: 0 });
    }
    const group = groups.get(key);
    group.orders.push(order);
    group.latestTimestamp = Math.max(group.latestTimestamp, orderGroupTimestamp(order));
    group.totalPrice += Number(order.total_price || 0);
  });

  return Array.from(groups.values())
    .sort((a, b) => b.latestTimestamp - a.latestTimestamp)
    .map((group) => {
      const sorted = [...group.orders].sort((a, b) => orderGroupTimestamp(a) - orderGroupTimestamp(b));
      return {
        ...group,
        orders: sorted,
        itemCount: sorted.length,
        status: computeOrderGroupStatus(sorted),
        primaryOrder: sorted[0],
      };
    });
}
