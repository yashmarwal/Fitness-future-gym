import "server-only";
import { getDb } from "@/backend/db/client";

// Mirrors the WhatsApp service's scope exactly, minus OTP — login stays
// WhatsApp-only. Resend has no pre-approved-template system like WhatsApp,
// so content is composed directly here instead of referencing a template name.
export type EmailTemplate = "welcome_card" | "fee_reminder" | "birthday" | "announcement";

function isConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

function buildEmail(template: EmailTemplate, params: string[]): { subject: string; html: string } {
  switch (template) {
    case "welcome_card": {
      const [name, membershipNumber] = params;
      return {
        subject: "Welcome to Fitness Future Gym",
        html: `<p>Hi ${name},</p><p>Your account is active. Your membership number is <strong>${membershipNumber}</strong> — keep it handy for front-desk check-in.</p>`,
      };
    }
    case "fee_reminder": {
      const [name, dueDate] = params;
      return {
        subject: "Fitness Future Gym — Fee Due Reminder",
        html: `<p>Hi ${name},</p><p>This is a reminder that your membership fee is due on <strong>${dueDate}</strong>. You can pay via UPI from your member dashboard.</p>`,
      };
    }
    case "birthday": {
      const [name] = params;
      return {
        subject: "Happy Birthday from Fitness Future Gym!",
        html: `<p>Happy Birthday, ${name}! 🎉</p><p>Wishing you a strong year ahead — see you on the floor.</p>`,
      };
    }
    case "announcement": {
      const [message, subject] = params;
      return {
        subject: subject || "Fitness Future Gym — Update",
        html: `<p>${message}</p>`,
      };
    }
  }
}

async function sendViaResend(to: string, subject: string, html: string) {
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.RESEND_FROM_EMAIL ?? "Fitness Future Gym <onboarding@resend.dev>",
      to,
      subject,
      html,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Resend API error (${res.status}): ${body}`);
  }
}

export async function sendEmailTemplate(params: {
  to: string;
  template: EmailTemplate;
  bodyParams: string[];
  memberId?: string;
}): Promise<void> {
  const { to, template, bodyParams, memberId } = params;
  const { subject, html } = buildEmail(template, bodyParams);

  let status: "sent" | "failed" = "sent";
  let error: string | undefined;

  if (!isConfigured()) {
    console.log(`[email:dev-mode] to=${to} template=${template} subject="${subject}"`);
  } else {
    try {
      await sendViaResend(to, subject, html);
    } catch (err) {
      status = "failed";
      error = err instanceof Error ? err.message : String(err);
      console.error("[email] send failed:", error);
    }
  }

  const db = getDb();
  await db.from("email_messages").insert({
    member_id: memberId ?? null,
    email: to,
    template,
    status,
    error: error ?? null,
  });

  if (status === "failed") {
    throw new Error(error);
  }
}
