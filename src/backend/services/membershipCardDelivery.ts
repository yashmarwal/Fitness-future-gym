import "server-only";
import { sendWhatsAppTemplate } from "@/backend/services/whatsapp";
import { sendEmailTemplate } from "@/backend/services/email";
import { generateMembershipCardPdf } from "@/backend/services/membershipCardPdf";

// Shared by: signup's first verification, trial-to-member conversion, and
// any admin action that changes a member's plan or records a payment — the
// card is re-delivered (fresh PDF) any time the info printed on it changes.
export async function deliverMembershipCard(member: {
  id: string;
  fullName: string;
  membershipNumber: string;
  phone: string | null;
  email: string | null;
  plan: string | null;
  joinedAt: string;
}): Promise<void> {
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
