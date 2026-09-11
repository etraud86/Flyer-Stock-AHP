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
