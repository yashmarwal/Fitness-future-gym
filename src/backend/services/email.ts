import "server-only";
import { getDb } from "@/backend/db/client";

// Mirrors the WhatsApp service's scope, plus OTP — a member with an email on
// file gets the login/signup code by email too, alongside WhatsApp (not
// instead of it). Resend has no pre-approved-template system like WhatsApp,
// so content is composed directly here instead of referencing a template name.
// trial_pass/trial_reminder are for the marketing site's free-trial leads,
// who aren't members yet. account_blocked is the fee-abuse tool
// (admin/feeAbuse.ts) telling a member why their access is on hold.
export type EmailTemplate =
  | "otp"
  | "welcome_card"
  | "fee_reminder"
  | "birthday"
  | "announcement"
  | "trial_pass"
  | "trial_reminder"
  | "account_blocked";

function isConfigured() {
  return Boolean(process.env.RESEND_API_KEY);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const BRAND = {
  bg: "#f2f2f0",
  card: "#ffffff",
  ink: "#121212",
  muted: "#6b6b6b",
  accent: "#ff5a1f",
  accentInk: "#ffffff",
  border: "#e6e6e3",
};

// Table-based layout with everything inlined — Outlook/older clients strip
// <style> blocks and flexbox/grid, so this is the one layout approach that
// renders consistently everywhere.
function wrapEmail(opts: { preheader: string; bodyHtml: string }): string {
  const { preheader, bodyHtml } = opts;
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Fitness Future Gym</title>
  </head>
  <body style="margin:0;padding:0;background-color:${BRAND.bg};font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bg};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:480px;max-width:100%;background-color:${BRAND.card};border:1px solid ${BRAND.border};">
            <tr>
              <td style="background-color:${BRAND.ink};padding:20px 28px;">
                <span style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:900;letter-spacing:1px;text-transform:uppercase;color:${BRAND.accentInk};">
                  FitnessFuture <span style="color:${BRAND.accent};">Gym</span>
                </span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px 28px;">
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 28px;border-top:1px solid ${BRAND.border};">
                <p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:18px;color:${BRAND.muted};">
                  Fitness Future Gym · Nangloi, Delhi<br />
                  You're receiving this because you have an account with us.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function heading(text: string): string {
  return `<h1 style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:22px;line-height:28px;font-weight:900;text-transform:uppercase;letter-spacing:0.5px;color:${BRAND.ink};">${escapeHtml(text)}</h1>`;
}

function paragraph(html: string): string {
  return `<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:${BRAND.ink};">${html}</p>`;
}

function button(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">
    <tr>
      <td style="background-color:${BRAND.accent};">
        <a href="${href}" style="display:inline-block;padding:12px 24px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:0.5px;color:${BRAND.accentInk};text-decoration:none;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;
}

function buildEmail(template: EmailTemplate, params: string[]): { subject: string; html: string } {
  switch (template) {
    case "otp": {
      const [code] = params;
      const codeBlock = `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;">
        <tr>
          <td style="background-color:${BRAND.bg};border:1px solid ${BRAND.border};padding:16px 24px;">
            <span style="font-family:Arial,Helvetica,sans-serif;font-size:32px;font-weight:900;letter-spacing:8px;color:${BRAND.ink};">${escapeHtml(code)}</span>
          </td>
        </tr>
      </table>`;
      return {
        subject: "Your Fitness Future Gym login code",
        html: wrapEmail({
          preheader: `Your login code is ${code}`,
          bodyHtml:
            heading("Your login code") +
            paragraph("Enter this code to finish signing in:") +
            codeBlock +
            paragraph(`<span style="color:${BRAND.muted};">This code expires shortly. Do not share it with anyone — Fitness Future Gym staff will never ask for it.</span>`),
        }),
      };
    }
    case "welcome_card": {
      const [name, membershipNumber] = params;
      return {
        subject: "Welcome to Fitness Future Gym",
        html: wrapEmail({
          preheader: `You're in — membership number ${membershipNumber}`,
          bodyHtml:
            heading(`Welcome, ${name}`) +
            paragraph("Your account is active and your membership card is ready.") +
            `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;width:100%;">
              <tr>
                <td style="background-color:${BRAND.bg};border:1px solid ${BRAND.border};padding:20px 24px;">
                  <span style="display:block;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${BRAND.muted};">Membership Number</span>
                  <span style="display:block;margin-top:4px;font-family:Arial,Helvetica,sans-serif;font-size:26px;font-weight:900;letter-spacing:2px;color:${BRAND.accent};">${escapeHtml(membershipNumber)}</span>
                </td>
              </tr>
            </table>` +
            paragraph("Your digital membership card is attached to this email as a PDF — keep it handy for front-desk check-in. See you on the floor!"),
        }),
      };
    }
    case "fee_reminder": {
      const [name, dueDate] = params;
      return {
        subject: "Fitness Future Gym — Fee Due Reminder",
        html: wrapEmail({
          preheader: `Your membership fee is due on ${dueDate}`,
          bodyHtml:
            heading("Fee due reminder") +
            paragraph(`Hi ${escapeHtml(name)}, this is a reminder that your membership fee is due on <strong>${escapeHtml(dueDate)}</strong>.`) +
            paragraph("Please pay at the front desk — cash or UPI, whichever's easiest."),
        }),
      };
    }
    case "account_blocked": {
      const [name] = params;
      return {
        subject: "Fitness Future Gym — Membership On Hold",
        html: wrapEmail({
          preheader: "Your check-in and dashboard access is on hold until your fee is paid.",
          bodyHtml:
            heading("Membership On Hold") +
            paragraph(`Hi ${escapeHtml(name)}, your membership fee has been overdue for a while, so check-in and dashboard access are on hold for now.`) +
            paragraph("Please pay at the front desk — cash or UPI, whichever's easiest. Everything reopens the moment it's recorded."),
        }),
      };
    }
    case "birthday": {
      const [name] = params;
      return {
        subject: "Happy Birthday from Fitness Future Gym!",
        html: wrapEmail({
          preheader: `Happy Birthday, ${name}!`,
          bodyHtml:
            heading(`Happy Birthday, ${name}! 🎉`) +
            paragraph("Wishing you a strong year ahead, in and out of the gym. See you on the floor!"),
        }),
      };
    }
    case "announcement": {
      const [message, subject] = params;
      return {
        subject: subject || "Fitness Future Gym — Update",
        html: wrapEmail({
          preheader: message,
          bodyHtml: heading(subject || "Gym Update") + paragraph(escapeHtml(message).replace(/\n/g, "<br />")),
        }),
      };
    }
    case "trial_pass": {
      const [name, trialCode, shiftLabel, endsAt] = params;
      const codeBlock = `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;width:100%;">
        <tr>
          <td style="background-color:${BRAND.bg};border:1px solid ${BRAND.border};padding:20px 24px;">
            <span style="display:block;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:${BRAND.muted};">Trial Pass Code</span>
            <span style="display:block;margin-top:4px;font-family:Arial,Helvetica,sans-serif;font-size:24px;font-weight:900;letter-spacing:2px;color:${BRAND.accent};">${escapeHtml(trialCode)}</span>
          </td>
        </tr>
      </table>`;
      return {
        subject: "Your Fitness Future Gym trial pass",
        html: wrapEmail({
          preheader: `Your trial pass code is ${trialCode}`,
          bodyHtml:
            heading(`Your Trial Is Booked, ${name}`) +
            paragraph(`You're set for a 2-day free trial — <strong>${escapeHtml(shiftLabel)} shift</strong>, valid through <strong>${escapeHtml(endsAt)}</strong>.`) +
            codeBlock +
            paragraph("Show this code (or your registered phone number) at the front desk to start. See you on the floor!"),
        }),
      };
    }
    case "trial_reminder": {
      const [name, trialCode] = params;
      return {
        subject: "Fitness Future Gym — Ready to make it official?",
        html: wrapEmail({
          preheader: "Your trial's wrapped up — let's get you set up with a full membership.",
          bodyHtml:
            heading(`How Was It, ${name}?`) +
            paragraph(`Your trial pass (<strong>${escapeHtml(trialCode)}</strong>) has run its course. If you liked what you felt on the floor, let's get you set up with a full membership — no pressure, just message us.`) +
            button("Message Us On WhatsApp", "https://wa.me/918700978341?text=Hi%2C%20I%20did%20the%202-day%20trial%20and%20want%20to%20join%20as%20a%20full%20member."),
        }),
      };
    }
  }
}

type EmailAttachment = { filename: string; content: string /* base64, no data: prefix */ };

async function sendViaResend(to: string, subject: string, html: string, attachments?: EmailAttachment[]) {
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
      ...(attachments?.length ? { attachments } : {}),
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
  attachments?: EmailAttachment[];
}): Promise<void> {
  const { to, template, bodyParams, memberId, attachments } = params;
  const { subject, html } = buildEmail(template, bodyParams);

  let status: "sent" | "failed" = "sent";
  let error: string | undefined;

  if (!isConfigured()) {
    console.log(`[email:dev-mode] to=${to} template=${template} subject="${subject}"`);
  } else {
    try {
      await sendViaResend(to, subject, html, attachments);
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
