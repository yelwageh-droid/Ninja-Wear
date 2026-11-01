const phoneNumber = (import.meta.env.VITE_WHATSAPP_NUMBER || '').replace(/\D/g, '');

export function getWhatsAppUrl(message) {
  if (!phoneNumber) return null;
  return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
}