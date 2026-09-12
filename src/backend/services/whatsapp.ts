import "server-only";
import { getDb } from "@/backend/db/client";

export type WhatsAppTemplate =
  | "otp"
  | "fee_reminder"
  | "birthday"
  | "announcement"
  | "welcome_card"
  | "payment_confirmation"
  | "profile_update";

const TEMPLATE_NAME_ENV: Record<WhatsAppTemplate, string> = {
  otp: "WHATSAPP_TEMPLATE_OTP",
  fee_reminder: "WHATSAPP_TEMPLATE_FEE_REMINDER",
  birthday: "WHATSAPP_TEMPLATE_BIRTHDAY",
  announcement: "WHATSAPP_TEMPLATE_ANNOUNCEMENT",
  welcome_card: "WHATSAPP_TEMPLATE_WELCOME_CARD",
  payment_confirmation: "WHATSAPP_TEMPLATE_PAYMENT_CONFIRMATION",
  profile_update: "WHATSAPP_TEMPLATE_PROFILE_UPDATE",
};

const TEMPLATE_NAME_DEFAULT: Record<WhatsAppTemplate, string> = {
  otp: "ff_login_otp",
  fee_reminder: "ff_fee_reminder",
  birthday: "ff_birthday",
  announcement: "ff_announcement",
  welcome_card: "ff_welcome_card",
  payment_confirmation: "ff_payment_confirmation",
  profile_update: "ff_profile_update",
};

function isConfigured() {
  return Boolean(process.env.WHATSAPP_ACCESS_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
}

async function sendViaCloudApi(phone: string, templateName: string, bodyParams: string[]) {
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
        language: { code: "en_US" },
        components: [
          {
            type: "body",
            parameters: bodyParams.map((text) => ({ type: "text", text })),
          },
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
  const templateName = process.env[TEMPLATE_NAME_ENV[template]] ?? TEMPLATE_NAME_DEFAULT[template];

  let status: "sent" | "failed" = "sent";
  let error: string | undefined;

  if (!isConfigured()) {
    console.log(
      `[whatsapp:dev-mode] to=${phone} template=${templateName} params=${JSON.stringify(bodyParams)}`
    );
  } else {
    try {
      await sendViaCloudApi(phone, templateName, bodyParams);
    } catch (err) {
      status = "failed";
      error = err instanceof Error ? err.message : String(err);
      console.error("[whatsapp] send failed:", error);
    }
  }

  const db = getDb();
  await db.from("whatsapp_messages").insert({
    member_id: memberId ?? null,
    phone,
    template,
    status,
    error: error ?? null,
  });

  if (status === "failed") {
    throw new Error(error);
  }
}
