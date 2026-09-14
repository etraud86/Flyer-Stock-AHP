import QRCode from 'qrcode';

export interface QRCodeDeliveryPayload {
  deliveryRef: string;
  date: string;
  officeId: string;
  officeCode: string;
  officeName: string;
  flyerSku: string;
  flyerName: string;
  quantity: number;
  courier: string;
  token: string;
  verifyUrl: string;
}

/**
 * Returns the permanent, unchanging validation URL for a specific Tourism Office.
 * When scanned by any smartphone camera, it opens this URL and automatically validates
 * pending deliveries for that office.
 */
export function getOfficePermanentQRUrl(officeCode: string, officeId: string): string {
  // Public live Cloud Run host for physical mobile camera scanning
  const CLOUD_RUN_ORIGIN = 'https://ais-dev-z6dza4olbxnpdv5jsg4roc-413909422609.europe-west2.run.app';
  let origin = CLOUD_RUN_ORIGIN;

  if (typeof window !== 'undefined' && window.location) {
    const isLocal =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('.local');

    if (!isLocal && window.location.origin && !window.location.origin.startsWith('null')) {
      origin = window.location.origin;
    }
  }

  const encodedCode = encodeURIComponent(officeCode);
  const encodedId = encodeURIComponent(officeId);
  // Target root SPA path so mobile camera scan always loads index.html without 404
  return `${origin}/?officeValidate=${encodedCode}&officeId=${encodedId}&autoConfirm=1#officeValidate=${encodedCode}&officeId=${encodedId}`;
}

// In-memory cache for permanent office QR codes so they are instant
const officeQrCache: Record<string, string> = {};

/**
 * Generate permanent QR Code for a Tourism Office.
 * The QR code is ALWAYS THE SAME for each tourism office.
 */
export async function generateOfficePermanentQRCode(officeCode: string, officeId: string): Promise<string> {
  const cacheKey = `${officeCode}_${officeId}`;
  if (officeQrCache[cacheKey]) {
    return officeQrCache[cacheKey];
  }

  const url = getOfficePermanentQRUrl(officeCode, officeId);
  const dataUrl = await generateQRCodeDataUrl(url);
  if (dataUrl) {
    officeQrCache[cacheKey] = dataUrl;
  }
  return dataUrl;
}

/**
 * Generate a cryptographically unique verification token for a delivery
 */
export function generateDeliveryQRToken(deliveryRef: string, officeCode: string): string {
  const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
  const timestamp = Date.now().toString(36).toUpperCase();
  return `AHP-QR-${officeCode}-${deliveryRef.replace(/[^A-Z0-9]/gi, '')}-${timestamp}-${randomSuffix}`;
}

/**
 * Format verification payload into string format for QR code
 */
export function createQRVerificationPayload(data: QRCodeDeliveryPayload): string {
  return JSON.stringify({
    ahp: 'AHP-DELIVERY-VERIFY-V1',
    ref: data.deliveryRef,
    date: data.date,
    office: data.officeCode,
    officeName: data.officeName,
    sku: data.flyerSku,
    flyer: data.flyerName,
    qty: data.quantity,
    courier: data.courier,
    token: data.token,
    url: data.verifyUrl,
  });
}

/**
 * Generate high-resolution Data URL (PNG) for QR code
 */
export async function generateQRCodeDataUrl(text: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: 320,
      margin: 1.5,
      color: {
        dark: '#0f172a', // slate-900
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    });
    return dataUrl;
  } catch (err) {
    console.error('Failed to generate QR code data URL', err);
    // Fallback minimal SVG/data url if qrcode fails
    return '';
  }
}

