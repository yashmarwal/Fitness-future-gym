import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import QRCode from "qrcode";

const INK = rgb(0.07, 0.07, 0.07);
const ACCENT = rgb(1, 0.353, 0.122); // #ff5a1f
const WHITE = rgb(1, 1, 1);
const MUTED = rgb(0.6, 0.6, 0.6);

// Landscape wallet-card layout, scaled up ~2x a physical credit card for
// print/screen legibility rather than exact-to-scale printing.
const WIDTH = 500;
const HEIGHT = 300;

export async function generateMembershipCardPdf(member: {
  fullName: string;
  membershipNumber: string;
  plan: string | null;
  joinedAt: string;
}): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([WIDTH, HEIGHT]);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);

  page.drawRectangle({ x: 0, y: 0, width: WIDTH, height: HEIGHT, color: INK });
  page.drawRectangle({ x: 0, y: HEIGHT - 8, width: WIDTH, height: 8, color: ACCENT });

  // "FITNESS" (white) + "FUTURE" (orange) + " GYM" (white) as separate draws
  // since a single drawText call can't mix colors mid-string.
  const brandY = HEIGHT - 46;
  const brandSize = 20;
  let x = 32;
  const fitness = "FITNESS";
  const future = "FUTURE";
  const gym = " GYM";
  page.drawText(fitness, { x, y: brandY, size: brandSize, font: bold, color: WHITE });
  x += bold.widthOfTextAtSize(fitness, brandSize);
  page.drawText(future, { x, y: brandY, size: brandSize, font: bold, color: ACCENT });
  x += bold.widthOfTextAtSize(future, brandSize);
  page.drawText(gym, { x, y: brandY, size: brandSize, font: bold, color: WHITE });

  page.drawText("MEMBER", { x: 32, y: HEIGHT - 78, size: 9, font: regular, color: MUTED });
  page.drawText(member.fullName.toUpperCase(), {
    x: 32,
    y: HEIGHT - 100,
    size: 22,
    font: bold,
    color: WHITE,
    maxWidth: 300,
  });

  page.drawText("MEMBERSHIP NO.", { x: 32, y: HEIGHT - 150, size: 9, font: regular, color: MUTED });
  page.drawText(member.membershipNumber, {
    x: 32,
    y: HEIGHT - 172,
    size: 24,
    font: bold,
    color: ACCENT,
  });

  page.drawText("PLAN", { x: 32, y: HEIGHT - 210, size: 9, font: regular, color: MUTED });
  page.drawText((member.plan ?? "—").toUpperCase(), { x: 32, y: HEIGHT - 226, size: 12, font: bold, color: WHITE });

  page.drawText("JOINED", { x: 190, y: HEIGHT - 210, size: 9, font: regular, color: MUTED });
  page.drawText(member.joinedAt, { x: 190, y: HEIGHT - 226, size: 12, font: bold, color: WHITE });

  page.drawText("Show this card or state your membership number at the front desk for check-in.", {
    x: 32,
    y: 20,
    size: 8,
    font: regular,
    color: MUTED,
  });

  const qrPngDataUrl = await QRCode.toDataURL(member.membershipNumber, { width: 400, margin: 1 });
  const qrPngBytes = Buffer.from(qrPngDataUrl.split(",")[1], "base64");
  const qrImage = await doc.embedPng(qrPngBytes);
  const qrSize = 110;
  page.drawRectangle({
    x: WIDTH - qrSize - 30,
    y: HEIGHT / 2 - qrSize / 2,
    width: qrSize,
    height: qrSize,
    color: WHITE,
  });
  page.drawImage(qrImage, {
    x: WIDTH - qrSize - 30,
    y: HEIGHT / 2 - qrSize / 2,
    width: qrSize,
    height: qrSize,
  });

  return doc.save();
}
