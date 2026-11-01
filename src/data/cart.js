const cartStorageKey = 'ninja-skins-cart';

export function readCart() {
  try {
    const storedCart = JSON.parse(window.localStorage.getItem(cartStorageKey) || 'null');
    if (storedCart && Array.isArray(storedCart.items)) {
      return {
        items: storedCart.items,
        customer: storedCart.customer && typeof storedCart.customer === 'object' ? storedCart.customer : {},
      };
    }

    const legacyDraft = JSON.parse(
      window.localStorage.getItem('ninja-skins-cart-draft')
      || window.localStorage.getItem('ninja-skins-custom-draft')
      || 'null',
    );
    if (legacyDraft?.laptopId) {
      return {
        items: [{
          ...legacyDraft,
          id: createCartItemId(),
          skinDesign: legacyDraft.customArtwork?.name || legacyDraft.fileName || 'Selected design',
          coverageType: legacyDraft.coverageId || 'top',
          totalPrice: legacyDraft.estimatedTotal || 0,
        }],
        customer: {},
      };
    }

    return { items: [], customer: {} };
  } catch {
    return { items: [], customer: {} };
  }
}

export function writeCart(cart) {
  window.localStorage.setItem(cartStorageKey, JSON.stringify(cart));
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
