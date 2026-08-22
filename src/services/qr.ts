import QRCode from "qrcode";

export async function generateQrCode(config: string) {
  return QRCode.toDataURL(config, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 400,
  });
}
