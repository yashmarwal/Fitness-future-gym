import "server-only";
import { getDb } from "@/backend/db/client";

// Deliberately narrow: WhatsApp only fires for signup, fee reminders,
// account_blocked (fee-abuse tool, admin/feeAbuse.ts), and admin-sent
// offers/gym updates (the "announcement" broadcast) — not for every
// profile edit or payment, which was over-broad in an earlier pass.
// trial_pass/trial_reminder are the one exception, for leads who aren't
// members yet (the marketing site's 2-day free trial claim).
export type WhatsAppTemplate =
  | "otp"
  | "fee_reminder"
  | "birthday"
  | "announcement"
  | "welcome_card"
  | "trial_pass"
  | "trial_reminder"
  | "account_blocked"
  | "account_unblocked";

const TEMPLATE_NAME_ENV: Record<WhatsAppTemplate, string> = {
  otp: "WHATSAPP_TEMPLATE_OTP",
  fee_reminder: "WHATSAPP_TEMPLATE_FEE_REMINDER",
  birthday: "WHATSAPP_TEMPLATE_BIRTHDAY",
  announcement: "WHATSAPP_TEMPLATE_ANNOUNCEMENT",
  welcome_card: "WHATSAPP_TEMPLATE_WELCOME_CARD",
  trial_pass: "WHATSAPP_TEMPLATE_TRIAL_PASS",
  trial_reminder: "WHATSAPP_TEMPLATE_TRIAL_REMINDER",
  account_blocked: "WHATSAPP_TEMPLATE_ACCOUNT_BLOCKED",
  account_unblocked: "WHATSAPP_TEMPLATE_ACCOUNT_UNBLOCKED",
};

const TEMPLATE_NAME_DEFAULT: Record<WhatsAppTemplate, string> = {
  otp: "ff_login_otp",
  fee_reminder: "ff_fee_reminder",
  birthday: "ff_birthday",
  announcement: "ff_announcement",
  welcome_card: "ff_welcome_card",
  trial_pass: "ff_trial_pass",
  trial_reminder: "ff_trial_reminder",
  account_blocked: "ff_account_blocked",
  account_unblocked: "ff_account_unblocked",
};

function isConfigured() {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

// Meta rejects template variables containing newlines, tabs or runs of 4+
// spaces (error 132018), and caps their length. Admin broadcasts are free text,
// so flatten them here instead of letting a multi-line offer fail every send.
function cleanParam(text: string): string {
  return text.replace(/\s*[\r\n\t]+\s*/g, " ").replace(/ {4,}/g, "   ").trim().slice(0, 1024);
}

async function sendViaCloudApi(phone: string, templateName: string, bodyParams: string[], isAuthTemplate: boolean) {
  const url = `https://graph.facebook.com/v21.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "template",
      template: {
        name: templateName,
        language: { code: process.env.WHATSAPP_TEMPLATE_LANG || "en_US" },
        components: [
          {
            type: "body",
            parameters: bodyParams.map((text) => ({ type: "text", text: cleanParam(text) })),
          },
          // Authentication (OTP) templates carry a "Copy code" button, and Meta
          // requires the code to be passed to it as well as to the body.
          ...(isAuthTemplate
            ? [{ type: "button", sub_type: "url", index: "0", parameters: [{ type: "text", text: cleanParam(bodyParams[0]) }] }]
            : []),
        ],
      },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`WhatsApp Cloud API error (${res.status}): ${body}`);
  }
}

export async function sendWhatsAppTemplate(params: {
  phone: string;
  template: WhatsAppTemplate;
  bodyParams: string[];
  memberId?: string;
}): Promise<void> {
  const { phone, template, bodyParams, memberId } = params;
  // `??` only falls back on null/undefined, not on an empty string — an env
  // var that exists in Vercel with a blank value (the key added, nothing
  // typed into the value field) would silently send an empty template name
  // to Meta, which fails every single send with "The parameter template.name
  // is required" and no obvious cause. `|| ` (falsy) catches that case too.
  const templateName = process.env[TEMPLATE_NAME_ENV[template]] || TEMPLATE_NAME_DEFAULT[template];

  let status: "sent" | "failed" = "sent";
  let error: string | undefined;

  if (!isConfigured()) {
    console.log(
      `[whatsapp:dev-mode] to=${phone} template=${templateName} params=${JSON.stringify(bodyParams)}`
    );
  } else {
    try {
      await sendViaCloudApi(phone, templateName, bodyParams, template === "otp");
    } catch (err) {
      status = "failed";
      error = err instanceof Error ? err.message : String(err);
      console.error("[whatsapp] send failed:", error);
    }
  }

  const db = getDb();
  const { error: logError } = await db.from("whatsapp_messages").insert({
    member_id: memberId ?? null,
    phone,
    template,
    status,
    error: error ?? null,
  });
  // Never let a logging failure hide the real send result — but do surface
  // it, since a silently-failing insert here (a migration not run, a schema
  // mismatch) means the whatsapp_messages table stops reflecting reality
  // with nothing pointing at why.
  if (logError) console.error("[whatsapp] failed to log message:", logError.message);

  if (status === "failed") {
    throw new Error(error);
  }
}
