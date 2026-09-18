import "server-only";
import { sendEmailTemplate } from "@/backend/services/email";
import { generateInvoicePdf } from "@/backend/services/invoicePdf";

// Triggered every time a fee payment is actually recorded — both the main
// admin "Record Payment" flow (admin/feesAdmin.ts) and the trial-to-member
// conversion flow when admin fills in a payment at conversion time
// (admin/trials.ts). Email-only: WhatsApp's template system here only
// supports pre-approved text-body templates (see whatsapp.ts), not
// ad-hoc document attachments, so there's no reliable way to deliver a PDF
// over that channel without a separately-approved WhatsApp template this
// app doesn't have. Best-effort and silent on failure, same as
// deliverMembershipCard — a receipt delivery hiccup must never fail the
// payment record itself.
export async function deliverPaymentInvoice(input: {
  memberId: string;
  memberName: string;
  membershipNumber: string;
  email: string | null;
  paymentId: string;
  paidAtIso: string;
  plan: string;
  durationMonths: number;
  amount: number;
  method: "upi" | "cash" | "manual";
  nextDueDate: string;
}): Promise<void> {
  if (!input.email) return;

  // Derived from the real payment row's own date + id — never a made-up
  // sequence — so it's stable and traceable back to the actual record.
  const datePart = input.paidAtIso.slice(0, 10).replace(/-/g, "");
  const invoiceNumber = `FF-${datePart}-${input.paymentId.slice(0, 6).toUpperCase()}`;

  const pdf = await generateInvoicePdf({
    invoiceNumber,
    paidAtIso: input.paidAtIso,
    memberName: input.memberName,
    membershipNumber: input.membershipNumber,
    plan: input.plan,
    durationMonths: input.durationMonths,
    amount: input.amount,
    method: input.method,
    nextDueDate: input.nextDueDate,
  }).catch(() => null);

  await sendEmailTemplate({
    to: input.email,
    template: "payment_receipt",
    bodyParams: [input.memberName, input.amount.toLocaleString("en-IN"), input.nextDueDate],
    memberId: input.memberId,
    attachments: pdf ? [{ filename: `Fitness-Future-Gym-Receipt-${invoiceNumber}.pdf`, content: Buffer.from(pdf).toString("base64") }] : undefined,
  }).catch(() => {});
}
