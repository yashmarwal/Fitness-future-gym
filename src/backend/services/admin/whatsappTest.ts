import "server-only";
import { sendWhatsAppTemplate, type WhatsAppTemplate } from "@/backend/services/whatsapp";
import { normalizePhone, isPlausiblePhone } from "@/backend/lib/phone";

export type WhatsAppTemplateTestResult = { template: WhatsAppTemplate; status: "sent" | "failed"; error?: string };

// Realistic-but-obviously-fake sample data for every template this app
// sends, in the exact param count/order each real call site actually uses
// (memberAuth.ts, notifications.ts, membershipCardDelivery.ts, trial.ts,
// admin/feeAbuse.ts, admin/broadcast.ts, admin/feesAdmin.ts) — kept here so
// this stays in sync by hand whenever a template's variables change, rather
// than guessing. `memberId` is deliberately omitted (undefined) for every
// send: these are diagnostic messages, not tied to any real member or login
// session, so they shouldn't attribute to one in whatsapp_messages.
const SAMPLE_CALLS: { template: WhatsAppTemplate; bodyParams: string[] }[] = [
  { template: "otp", bodyParams: ["482913"] },
  { template: "fee_reminder", bodyParams: ["Test Member", "2026-10-15"] },
  { template: "fee_received", bodyParams: ["Test Member", "Rs. 1,500", "2026-11-15"] },
  { template: "birthday", bodyParams: ["Test Member"] },
  { template: "announcement", bodyParams: ["This is a test broadcast message — Fitness Future Gym template test."] },
  { template: "welcome_card", bodyParams: ["Test Member", "FF-9999"] },
  { template: "trial_pass", bodyParams: ["Test Member", "FF2-TRIAL-0000", "Morning (06:00 - 11:00)", "2026-10-01"] },
  { template: "trial_reminder", bodyParams: ["Test Member", "FF2-TRIAL-0000"] },
  { template: "account_blocked", bodyParams: ["Test Member"] },
  { template: "account_unblocked", bodyParams: ["Test Member"] },
];

// Fires every template this app knows how to send, one after another, at a
// single phone number — a fast way to confirm a template is actually
// Approved and correctly shaped (right variable count, right language)
// without triggering the real feature behind each one (recording a
// payment, blocking a member, waiting for a birthday, ...). Never throws:
// a template that isn't ready yet shows up as a "failed" row with Meta's
// real reason, same as it would in whatsapp_messages, rather than aborting
// the whole batch.
export async function testAllWhatsAppTemplates(rawPhone: string): Promise<{
  phone: string;
  results: WhatsAppTemplateTestResult[];
} | { error: string }> {
  const phone = normalizePhone(rawPhone);
  if (!isPlausiblePhone(phone)) return { error: `"${rawPhone}" doesn't look like a valid phone number.` };

  const results: WhatsAppTemplateTestResult[] = [];
  for (const call of SAMPLE_CALLS) {
    try {
      await sendWhatsAppTemplate({ phone, template: call.template, bodyParams: call.bodyParams });
      results.push({ template: call.template, status: "sent" });
    } catch (err) {
      results.push({ template: call.template, status: "failed", error: err instanceof Error ? err.message : String(err) });
    }
  }

  return { phone, results };
}
