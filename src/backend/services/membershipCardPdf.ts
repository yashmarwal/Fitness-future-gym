import "server-only";
import { PDFDocument, StandardFonts } from "pdf-lib";
import QRCode from "qrcode";
import { PDF_INK as INK, PDF_PANEL as PANEL, PDF_ACCENT as ACCENT, PDF_WHITE as WHITE, PDF_MUTED as MUTED, PDF_DIVIDER as DIVIDER } from "@/backend/lib/pdfBrand";

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

  // Full card border + top accent stripe — the same "sharp-edged, one
  // accent rule" language as the coach cards' top border on the real site.
  page.drawRectangle({ x: 0, y: 0, width: WIDTH, height: HEIGHT, color: INK, borderColor: DIVIDER, borderWidth: 1 });
  page.drawRectangle({ x: 0, y: HEIGHT - 6, width: WIDTH, height: 6, color: ACCENT });

  // "FITNESS" (white) + "FUTURE" (orange) + " GYM" (white) as separate draws
  // since a single drawText call can't mix colors mid-string.
  const brandY = HEIGHT - 44;
  const brandSize = 20;
  let x = 32;
  const fitness = "FITNESS ";
  const future = "FUTURE";
  const gym = " GYM";
  page.drawText(fitness, { x, y: brandY, size: brandSize, font: bold, color: WHITE });
  x += bold.widthOfTextAtSize(fitness, brandSize);
  page.drawText(future, { x, y: brandY, size: brandSize, font: bold, color: ACCENT });
  x += bold.widthOfTextAtSize(future, brandSize);
  page.drawText(gym, { x, y: brandY, size: brandSize, font: bold, color: WHITE });
  page.drawText("RAW IRON CULTURE  •  EST. 2016", {
    x: 32,
    y: brandY - 15,
    size: 7.5,
    font: regular,
    color: MUTED,
  });

  page.drawText("MEMBER", { x: 32, y: HEIGHT - 90, size: 9, font: regular, color: MUTED });
  page.drawText(member.fullName.toUpperCase(), {
    x: 32,
    y: HEIGHT - 112,
    size: 22,
    font: bold,
    color: WHITE,
    maxWidth: 300,
  });

  page.drawText("MEMBERSHIP NO.", { x: 32, y: HEIGHT - 152, size: 9, font: regular, color: MUTED });
  page.drawText(member.membershipNumber, {
    x: 32,
    y: HEIGHT - 176,
    size: 26,
    font: bold,
    color: ACCENT,
  });

  // A bordered "stat panel" for Plan/Joined — mirrors the real site's stat
  // grid pattern (e.g. the coach cards' Best Squat/Best Deadlift/Specialty
  // row: a filled panel, an accent rule on the leading edge, a divider
  // between cells) instead of two loose, uncontained lines of text.
  const panelX = 32;
  const panelY = 36;
  const panelW = 260;
  const panelH = 52;
  page.drawRectangle({ x: panelX, y: panelY, width: panelW, height: panelH, color: PANEL });
  page.drawRectangle({ x: panelX, y: panelY, width: 3, height: panelH, color: ACCENT });
  page.drawRectangle({ x: panelX + panelW / 2, y: panelY, width: 1, height: panelH, color: DIVIDER });

  const cellPad = 18;
  page.drawText("PLAN", { x: panelX + cellPad, y: panelY + panelH - 18, size: 8, font: regular, color: MUTED });
  page.drawText((member.plan ?? "—").toUpperCase(), {
    x: panelX + cellPad,
    y: panelY + 14,
    size: 13,
    font: bold,
    color: WHITE,
    maxWidth: panelW / 2 - cellPad - 8,
  });

  const col2X = panelX + panelW / 2 + cellPad;
  page.drawText("JOINED", { x: col2X, y: panelY + panelH - 18, size: 8, font: regular, color: MUTED });
  page.drawText(member.joinedAt, { x: col2X, y: panelY + 14, size: 13, font: bold, color: WHITE });

  page.drawText("Show this card or state your membership number at the front desk for check-in.", {
    x: 32,
    y: 16,
    size: 7,
    font: regular,
    color: MUTED,
  });

  // QR block: a hard, offset accent rectangle behind the white QR panel —
  // the same brutalist "shadow-hard: 4px 4px 0 #000" language used all
  // over the site's cards, just in the accent color so it actually reads
  // against this card's dark background instead of disappearing into it.
  const qrPngDataUrl = await QRCode.toDataURL(member.membershipNumber, { width: 400, margin: 1 });
  const qrPngBytes = Buffer.from(qrPngDataUrl.split(",")[1], "base64");
  const qrImage = await doc.embedPng(qrPngBytes);
  const qrSize = 110;
  const qrX = WIDTH - qrSize - 34;
  const qrY = HEIGHT / 2 - qrSize / 2 - 6;
  page.drawRectangle({ x: qrX + 6, y: qrY - 6, width: qrSize, height: qrSize, color: ACCENT });
  page.drawRectangle({ x: qrX, y: qrY, width: qrSize, height: qrSize, color: WHITE });
  page.drawImage(qrImage, { x: qrX, y: qrY, width: qrSize, height: qrSize });

  return doc.save();
}
