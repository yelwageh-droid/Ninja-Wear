const dayInMilliseconds = 24 * 60 * 60 * 1000;

function orderIdentifier(order) {
  return order.id ?? order.order_id;
}

function customerKey(order) {
  const identity = [order.customer_name, order.customer_email, order.customer_phone]
    .map((value) => String(value || '').trim().toLowerCase());
  return identity.every(Boolean) ? identity.join('|') : '';
}

function orderTimestamp(order) {
  const timestamp = Date.parse(order.created_at || order.createdAt || '');
  return Number.isFinite(timestamp) ? timestamp : null;
}

// Group one checkout's rows and safely merge legacy rows from the same customer within 24 hours / تجميع عناصر الشراء الواحد ودمج الصفوف القديمة المتطابقة خلال 24 ساعة
export function groupOrders(orders) {
  const groups = [];

  for (const order of orders) {
    const timestamp = orderTimestamp(order);
    const groupKey = order.cart_group_id
      ? `cart:${order.cart_group_id}`
      : customerKey(order);
    const matchingGroup = [...groups].reverse().find((group) => {
      if (order.cart_group_id || group.cartGroupId) {
        return Boolean(order.cart_group_id && group.cartGroupId === order.cart_group_id);
      }
      if (!groupKey || group.key !== groupKey || timestamp === null || group.latestTimestamp === null) return false;
      return Math.abs(group.latestTimestamp - timestamp) <= dayInMilliseconds;
    });

    if (matchingGroup) {
      matchingGroup.orders.push(order);
      if (timestamp !== null && (matchingGroup.latestTimestamp === null || timestamp > matchingGroup.latestTimestamp)) {
        matchingGroup.latestTimestamp = timestamp;
      }
    } else {
      groups.push({
        id: order.cart_group_id || String(orderIdentifier(order) ?? `group-${groups.length}`),
        cartGroupId: order.cart_group_id || null,
        key: order.cart_group_id ? groupKey : customerKey(order),
        latestTimestamp: timestamp,
        orders: [order],
      });
    }
  }

  return groups.map((group) => {
    const statuses = [...new Set(group.orders.map((order) => order.status).filter(Boolean))];
    return {
      ...group,
      primaryOrder: group.orders[0],
      itemCount: group.orders.length,
      totalPrice: group.orders.reduce((total, order) => total + Number(order.total_price || 0), 0),
      status: statuses.length === 1 ? statuses[0] : statuses.length ? 'Mixed' : 'Unknown',
    };
  });
}
