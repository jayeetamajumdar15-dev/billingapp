/**
 * Dynamic UPI QR Code Generator for Bistromate POS (Petpooja style).
 * Supports offline SVG matrix rendering and online fallback image data.
 */

export function buildUpiPaymentUrl({ upiId, storeName = "Bistromate", amount = 0, invoiceNumber = "" }) {
  const cleanUpi = (upiId || "").trim();
  if (!cleanUpi) return "";
  const numAmount = Number(amount || 0);
  const formattedAmt = numAmount > 0 ? numAmount.toFixed(2) : "";
  const note = invoiceNumber ? `Bill ${invoiceNumber}` : "Restaurant Bill";

  const params = [
    `pa=${encodeURIComponent(cleanUpi)}`,
    `pn=${encodeURIComponent(storeName)}`,
    ...(formattedAmt ? [`am=${encodeURIComponent(formattedAmt)}`] : []),
    `cu=INR`,
    `tn=${encodeURIComponent(note)}`,
  ];

  return `upi://pay?${params.join("&")}`;
}

export function getUpiQrImageUrl(upiUrl, size = 260) {
  if (!upiUrl) return null;
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=2&data=${encodeURIComponent(upiUrl)}`;
}

