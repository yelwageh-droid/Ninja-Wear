const cartStorageKey = 'ninja_wear_cart_v1';

export function readCart() {
  try {
    const storedCart = JSON.parse(window.localStorage.getItem(cartStorageKey) || 'null');
    if (storedCart && Array.isArray(storedCart.items)) {
      return {
        items: storedCart.items,
        customer: storedCart.customer && typeof storedCart.customer === 'object' ? storedCart.customer : {},
      };
    }

    return { items: [], customer: {} };
  } catch {
    return { items: [], customer: {} };
  }
}

export const cartChangeEvent = 'ninja-wear-cart-change';

function notifyCartChange() {
  // Storage events do not fire in the tab that made the change, so notify local listeners too.
  // أحداث التخزين لا تُطلق في نفس التاب الذي قام بالتعديل، لذا نُخطر المستمعين المحليين أيضاً.
  window.dispatchEvent(new Event(cartChangeEvent));
}

export function writeCart(cart) {
  window.localStorage.setItem(cartStorageKey, JSON.stringify(cart));
  notifyCartChange();
}

export function clearCart() {
  window.localStorage.removeItem(cartStorageKey);
  notifyCartChange();
}

export function createCartItemId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `cart-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function createOrderGroupId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  const randomHex = () => Math.floor(Math.random() * 16).toString(16);
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const randomValue = Math.floor(Math.random() * 16);
    return (character === 'x' ? randomValue : (randomValue & 0x3) | 0x8).toString(16) || randomHex();
  });
}
