import "server-only";
import { PDFDocument, StandardFonts } from "pdf-lib";
import { PDF_INK, PDF_PANEL, PDF_ACCENT, PDF_WHITE, PDF_MUTED, PDF_DIVIDER } from "@/backend/lib/pdfBrand";
import { BUSINESS_ADDRESS, BUSINESS_PHONE_PRIMARY, BUSINESS_EMAIL } from "@/frontend/lib/siteConfig";

// Portrait, receipt-style — deliberately not the membership card's
// landscape wallet layout, this is a document meant to be read top-to-
// bottom and kept/printed, not carried like a card.
const WIDTH = 420;
const HEIGHT = 580;

const METHOD_LABELS: Record<string, string> = { upi: "UPI", cash: "Cash", manual: "Manual" };

export type InvoiceInput = {
  invoiceNumber: string;
  paidAtIso: string;
  memberName: string;
  membershipNumber: string;
  plan: string;
  durationMonths: number;
  amount: number;
  method: "upi" | "cash" | "manual";
  nextDueDate: string;
};

export async function generateInvoicePdf(input: InvoiceInput): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([WIDTH, HEIGHT]);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);

  page.drawRectangle({ x: 0, y: 0, width: WIDTH, height: HEIGHT, color: PDF_INK });
  page.drawRectangle({ x: 0, y: HEIGHT - 6, width: WIDTH, height: 6, color: PDF_ACCENT });

  // Brand header — same tri-color-text trick as the membership card (a
  // single drawText call can't mix colors mid-string).
  const marginX = 36;
  let y = HEIGHT - 46;
  const brandSize = 18;
  let x = marginX;
  const fitness = "FITNESS ";
  const future = "FUTURE";
  const gym = " GYM";
  page.drawText(fitness, { x, y, size: brandSize, font: bold, color: PDF_WHITE });
  x += bold.widthOfTextAtSize(fitness, brandSize);
  page.drawText(future, { x, y, size: brandSize, font: bold, color: PDF_ACCENT });
  x += bold.widthOfTextAtSize(future, brandSize);
  page.drawText(gym, { x, y, size: brandSize, font: bold, color: PDF_WHITE });
  page.drawText("RAW IRON CULTURE  •  EST. 2016", { x: marginX, y: y - 14, size: 7, font: regular, color: PDF_MUTED });

  // Title
  y -= 56;
  page.drawText("PAYMENT RECEIPT", { x: marginX, y, size: 22, font: bold, color: PDF_WHITE });
  y -= 6;
  page.drawRectangle({ x: marginX, y: y - 4, width: WIDTH - marginX * 2, height: 2, color: PDF_ACCENT });

  // Receipt # / Date row
  y -= 28;
  page.drawText("RECEIPT #", { x: marginX, y, size: 8, font: regular, color: PDF_MUTED });
  page.drawText(input.invoiceNumber, { x: marginX, y: y - 14, size: 12, font: bold, color: PDF_WHITE });
  const dateLabel = "DATE";
  const dateValue = new Date(input.paidAtIso).toLocaleDateString("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const dateLabelW = regular.widthOfTextAtSize(dateLabel, 8);
  const dateValueW = bold.widthOfTextAtSize(dateValue, 12);
  page.drawText(dateLabel, { x: WIDTH - marginX - dateLabelW, y, size: 8, font: regular, color: PDF_MUTED });
  page.drawText(dateValue, { x: WIDTH - marginX - dateValueW, y: y - 14, size: 12, font: bold, color: PDF_WHITE });

  // Billed to
  y -= 48;
  page.drawText("BILLED TO", { x: marginX, y, size: 8, font: regular, color: PDF_MUTED });
  y -= 20;
  page.drawText(input.memberName.toUpperCase(), { x: marginX, y, size: 17, font: bold, color: PDF_WHITE, maxWidth: WIDTH - marginX * 2 });
  y -= 16;
  page.drawText(`Membership No. ${input.membershipNumber}`, { x: marginX, y, size: 10, font: regular, color: PDF_ACCENT });

  // Details panel — same bordered-cell "stat panel" pattern as the
  // membership card's Plan/Joined block.
  y -= 34;
  const panelW = WIDTH - marginX * 2;
  const rowH = 30;
  const rows: [string, string][] = [
    ["Plan", input.plan],
    ["Duration", `${input.durationMonths} Month${input.durationMonths === 1 ? "" : "s"}`],
    ["Payment Method", METHOD_LABELS[input.method] ?? input.method],
    ["Next Due Date", input.nextDueDate],
  ];
  const panelH = rowH * rows.length;
  page.drawRectangle({ x: marginX, y: y - panelH, width: panelW, height: panelH, color: PDF_PANEL });
  page.drawRectangle({ x: marginX, y: y - panelH, width: 3, height: panelH, color: PDF_ACCENT });
  rows.forEach(([label, value], i) => {
    const rowY = y - i * rowH - rowH / 2 - 3;
    page.drawText(label.toUpperCase(), { x: marginX + 18, y: rowY, size: 9, font: regular, color: PDF_MUTED });
    const valueW = bold.widthOfTextAtSize(value, 11);
    page.drawText(value, { x: marginX + panelW - 18 - valueW, y: rowY, size: 11, font: bold, color: PDF_WHITE });
    if (i < rows.length - 1) {
      page.drawRectangle({ x: marginX, y: y - (i + 1) * rowH, width: panelW, height: 1, color: PDF_DIVIDER });
    }
  });
  y -= panelH + 24;

  // Amount paid — the one big number on the page, same treatment as the
  // membership card's membership-number line.
  page.drawText("AMOUNT PAID", { x: marginX, y, size: 9, font: regular, color: PDF_MUTED });
  y -= 34;
  page.drawText(`Rs. ${input.amount.toLocaleString("en-IN")}`, { x: marginX, y, size: 32, font: bold, color: PDF_ACCENT });

  // PAID stamp — a bordered badge, offset to the right of the amount.
  const stampText = "PAID";
  const stampSize = 13;
  const stampPadX = 14;
  const stampW = bold.widthOfTextAtSize(stampText, stampSize) + stampPadX * 2;
  const stampH = 30;
  const stampX = WIDTH - marginX - stampW;
  const stampY = y + 2;
  page.drawRectangle({
    x: stampX,
    y: stampY,
    width: stampW,
    height: stampH,
    borderColor: PDF_ACCENT,
    borderWidth: 1.5,
  });
  page.drawText(stampText, {
    x: stampX + stampPadX,
    y: stampY + stampH / 2 - 5,
    size: stampSize,
    font: bold,
    color: PDF_ACCENT,
  });

  // Footer — real gym contact details only.
  const footerY = 44;
  page.drawRectangle({ x: marginX, y: footerY + 20, width: WIDTH - marginX * 2, height: 1, color: PDF_DIVIDER });
  page.drawText("Thank you for training with us.", { x: marginX, y: footerY, size: 9, font: regular, color: PDF_MUTED });
  page.drawText(
    `${BUSINESS_ADDRESS.streetAddress}, ${BUSINESS_ADDRESS.addressLocality} ${BUSINESS_ADDRESS.postalCode}`,
    { x: marginX, y: footerY - 12, size: 7, font: regular, color: PDF_MUTED, maxWidth: WIDTH - marginX * 2 }
  );
  page.drawText(`${BUSINESS_PHONE_PRIMARY}  •  ${BUSINESS_EMAIL}`, {
    x: marginX,
    y: footerY - 24,
    size: 7,
    font: regular,
    color: PDF_MUTED,
  });

  return doc.save();
}
