import "server-only";
import { sendWhatsAppTemplate } from "@/backend/services/whatsapp";
import { sendEmailTemplate } from "@/backend/services/email";
import { generateMembershipCardPdf } from "@/backend/services/membershipCardPdf";

// Shared by: trial-to-member conversion, and any admin action that changes
// a member's plan or records a payment — the card is re-delivered (fresh
// PDF) any time the info printed on it changes.
//
// Deliberately withheld until admin has assigned BOTH a plan and a fee
// amount — a member who just signed up (or was created without a plan yet)
// shouldn't receive a "membership card" for a membership that isn't
// actually set up yet. This is the single place that rule is enforced, so
// every caller can just call this unconditionally and trust it to no-op
// until the member is genuinely ready.
export async function deliverMembershipCard(member: {
  id: string;
  fullName: string;
  membershipNumber: string;
  phone: string | null;
  email: string | null;
  plan: string | null;
  feeAmount: number | null;
  joinedAt: string;
}): Promise<void> {
  if (!member.plan || member.feeAmount == null) return;

  if (member.phone) {
    await sendWhatsAppTemplate({
      phone: member.phone,
      template: "welcome_card",
      bodyParams: [member.fullName, member.membershipNumber],
      memberId: member.id,
    }).catch(() => {});
  }

  if (member.email) {
    const cardPdf = await generateMembershipCardPdf({
      fullName: member.fullName,
      membershipNumber: member.membershipNumber,
      plan: member.plan,
      joinedAt: member.joinedAt,
    }).catch(() => null);

    await sendEmailTemplate({
      to: member.email,
      template: "welcome_card",
      bodyParams: [member.fullName, member.membershipNumber],
      memberId: member.id,
      attachments: cardPdf
        ? [{ filename: "Fitness-Future-Gym-Membership-Card.pdf", content: Buffer.from(cardPdf).toString("base64") }]
        : undefined,
    }).catch(() => {});
  }
}
