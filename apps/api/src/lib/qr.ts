import QRCode from 'qrcode';

export const generateQRCode = (url: string) => {
    return QRCode.toBuffer(url);
}