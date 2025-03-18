import QRCode from 'qrcode'

/**
 * Generates a QR code buffer from a given URL
 * @param url - The URL to encode in the QR code
 * @returns A Promise that resolves to a Buffer containing the QR code image
 */
export const generateQRCode = (url: string) => {
  return QRCode.toBuffer(url)
}
