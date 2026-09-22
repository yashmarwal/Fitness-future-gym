import "server-only";
import { getDb } from "@/backend/db/client";
import type { DailySummary } from "@/backend/services/admin/dailySummary";
import type { WeeklySummary } from "@/backend/services/admin/weeklySummary";

// Mirrors the WhatsApp service's scope, plus OTP — a member with an email on
// file gets the login/signup code by email too, alongside WhatsApp (not
// instead of it). Resend has no pre-approved-template system like WhatsApp,
// so content is composed directly here instead of referencing a template name.
// trial_pass/trial_reminder are for the marketing site's free-trial leads,
// who aren't members yet. account_blocked is the fee-abuse tool
// (admin/feeAbuse.ts) telling a member why their access is on hold.
// daily_summary is the owners' 11pm digest (admin/dailySummary.ts) and
// weekly_summary their Sunday-night report (admin/weeklySummary.ts) — neither
// is member-facing at all.
export type EmailTemplate =
  | "otp"
  | "welcome_card"
  | "fee_reminder"
  | "birthday"
  | "announcement"
  | "trial_pass"
  | "trial_reminder"
  | "account_blocked"
  | "account_unblocked"
  | "daily_summary"
  | "weekly_summary"
  | "payment_receipt";

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

// Matches the actual site's palette (src/app/globals.css's @theme block) —
// dark, near-black surfaces with one orange accent, hard uppercase type,
// sharp edges (no border-radius anywhere on the real site). Web fonts
// (Bebas Neue/Oswald) aren't used here since most email clients (Outlook
// especially) strip @font-face — bold-weight Arial/Helvetica in all-caps
// with tight letter-spacing approximates the same condensed, heavy feel.
const BRAND = {
  bgOutside: "#0f0e0c", // surface-container-lowest
  card: "#1d1b19", // surface-container-low
  panel: "#211f1d", // surface-container
  ink: "#e7e2dd", // on-surface
  muted: "#ab897f", // outline
  accent: "#ff5a1f", // primary-container
  accentInk: "#000000", // on-primary-container
  border: "#363432", // surface-variant
};

// Table-based layout with everything inlined — Outlook/older clients strip
// <style> blocks and flexbox/grid, so this is the one layout approach that
// renders consistently everywhere. box-shadow doesn't render reliably in
// email clients either, so the site's "shadow-hard" offset-black-shadow
// look is approximated with a solid border instead — same hard-edged,
// high-contrast read, without relying on unsupported CSS.
function wrapEmail(opts: { preheader: string; bodyHtml: string }): string {
  const { preheader, bodyHtml } = opts;
  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Fitness Future Gym</title>
  </head>
  <body style="margin:0;padding:0;background-color:${BRAND.bgOutside};font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BRAND.bgOutside};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="width:480px;max-width:100%;background-color:${BRAND.card};border:1px solid ${BRAND.border};">
            <tr>
              <td style="background-color:${BRAND.accent};height:4px;line-height:4px;font-size:0;">&nbsp;</td>
            </tr>
            <tr>
              <td style="padding:20px 28px;border-bottom:1px solid ${BRAND.border};">
                <span style="font-family:Arial,Helvetica,sans-serif;font-size:20px;font-weight:900;letter-spacing:1px;text-transform:uppercase;color:${BRAND.ink};">
                  Fitness Future <span style="color:${BRAND.accent};">Gym</span>
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
                  FITNESS FUTURE GYM &middot; NANGLOI, DELHI<br />
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
  return `<h1 style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:24px;line-height:30px;font-weight:900;text-transform:uppercase;letter-spacing:0.5px;color:${BRAND.ink};">${escapeHtml(text)}</h1>`;
}

function paragraph(html: string): string {
  return `<p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:24px;color:${BRAND.ink};">${html}</p>`;
}

function button(label: string, href: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 4px;">
    <tr>
      <td style="background-color:${BRAND.accent};">
        <a href="${href}" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:900;text-transform:uppercase;letter-spacing:1px;color:${BRAND.accentInk};text-decoration:none;">${escapeHtml(label)}</a>
      </td>
    </tr>
  </table>`;
}

// A bordered callout block — matches the "stat card" pattern used all over
// the real site (e.g. the footer's Operational Hours box): a solid accent
// rule on the left edge, an uppercase muted label, and a big bold value.
function calloutBlock(label: string, value: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:8px 0 20px;width:100%;">
    <tr>
      <td style="background-color:${BRAND.panel};border-left:4px solid ${BRAND.accent};padding:18px 24px;">
        <span style="display:block;font-family:Arial,Helvetica,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1.5px;color:${BRAND.muted};">${escapeHtml(label)}</span>
        <span style="display:block;margin-top:6px;font-family:Arial,Helvetica,sans-serif;font-size:28px;font-weight:900;letter-spacing:3px;color:${BRAND.accent};">${escapeHtml(value)}</span>
      </td>
    </tr>
  </table>`;
}

// A sub-heading for grouping stat/list sections within the daily summary —
// smaller and muted compared to heading(), which is reserved for the one
// big page title.
function sectionLabel(text: string): string {
  return `<p style="margin:24px 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:12px;font-weight:900;text-transform:uppercase;letter-spacing:1.5px;color:${BRAND.accent};">${escapeHtml(text)}</p>`;
}

// A bordered box of stacked "label ..... value" rows — the daily summary's
// primary building block. `alert` tints a row's value red instead of the
// usual accent orange, for anything that genuinely needs attention (fee
// overdue, blocked members) rather than just informational counts.
function statSection(rows: { label: string; value: string; alert?: boolean }[]): string {
  const body = rows
    .map((r, i) => {
      const border = i < rows.length - 1 ? `border-bottom:1px solid ${BRAND.border};` : "";
      return `<tr>
        <td style="padding:12px 18px;${border}font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${BRAND.ink};">${escapeHtml(r.label)}</td>
        <td align="right" style="padding:12px 18px;${border}font-family:Arial,Helvetica,sans-serif;font-size:17px;font-weight:900;color:${r.alert ? "#ff6b5b" : BRAND.accent};white-space:nowrap;">${escapeHtml(r.value)}</td>
      </tr>`;
    })
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 4px;background-color:${BRAND.panel};border:1px solid ${BRAND.border};">${body}</table>`;
}

// A bordered box of stacked single-line entries — for named "here's what
// happened today" lists (payments, new members, new trials) where a
// label/value stat row doesn't fit. Returns "" for an empty list so
// callers can skip the section label entirely when there's nothing to show.
function listSection(items: string[]): string {
  if (items.length === 0) return "";
  const body = items
    .map((item, i) => {
      const border = i < items.length - 1 ? `border-bottom:1px solid ${BRAND.border};` : "";
      return `<tr><td style="padding:10px 18px;${border}font-family:Arial,Helvetica,sans-serif;font-size:13px;color:${BRAND.ink};">${item}</td></tr>`;
    })
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 4px;background-color:${BRAND.panel};border:1px solid ${BRAND.border};">${body}</table>`;
}

function inr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

// AI-written commentary in the owner emails: an accent rule on the left like
// calloutBlock, body text rather than a big number, and a small note saying
// where the words came from.
function narrativeBlock(text: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 4px;width:100%;">
    <tr>
      <td style="background-color:${BRAND.panel};border-left:4px solid ${BRAND.accent};padding:16px 20px;">
        <span style="display:block;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:22px;color:${BRAND.ink};">${escapeHtml(text)}</span>
        <span style="display:block;margin-top:10px;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:${BRAND.muted};">Written by AI from the figures in this email.</span>
      </td>
    </tr>
  </table>`;
}

// A bordered box of "label ▇▇▇▇ value" rows — a bar chart made of table cells,
// since images and CSS charts don't survive email clients.
function barSection(rows: { label: string; value: number }[]): string {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const body = rows
    .map((r, i) => {
      const border = i < rows.length - 1 ? `border-bottom:1px solid ${BRAND.border};` : "";
      const pct = r.value > 0 ? Math.max(3, Math.round((r.value / max) * 100)) : 0;
      const bar =
        pct > 0
          ? `<td width="${pct}%" style="background-color:${BRAND.accent};height:12px;font-size:0;line-height:12px;">&nbsp;</td><td style="font-size:0;line-height:12px;">&nbsp;</td>`
          : `<td style="height:12px;font-size:0;line-height:12px;">&nbsp;</td>`;
      return `<tr>
        <td style="padding:9px 0 9px 18px;${border}width:44px;font-family:Arial,Helvetica,sans-serif;font-size:12px;color:${BRAND.muted};">${escapeHtml(r.label)}</td>
        <td style="padding:9px 12px;${border}"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${bar}</tr></table></td>
        <td align="right" style="padding:9px 18px 9px 0;${border}width:36px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:900;color:${BRAND.ink};">${r.value}</td>
      </tr>`;
    })
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 4px;background-color:${BRAND.panel};border:1px solid ${BRAND.border};">${body}</table>`;
}

function buildAttentionRows(a: DailySummary["alerts"]) {
  return [
    { label: "Fee Overdue", value: String(a.feeOverdue), alert: a.feeOverdue > 0 },
    { label: "Due Within 3 Days", value: String(a.dueWithin3Days) },
    { label: "No Check-In 3+ Days", value: String(a.noCheckIn3Days) },
    { label: "Inactive 4+ Months", value: String(a.inactive4Months) },
    { label: "Trial Not Converted", value: String(a.trialNotConverted) },
    { label: "Birthdays This Week", value: String(a.birthdaysThisWeek) },
    { label: "Using Gym, Unpaid", value: String(a.usingGymUnpaid), alert: a.usingGymUnpaid > 0 },
    { label: "Currently Blocked", value: String(a.currentlyBlocked), alert: a.currentlyBlocked > 0 },
  ];
}

function buildDailySummaryEmail(summary: DailySummary): { subject: string; html: string } {
  const attentionRows = buildAttentionRows(summary.alerts);

  const paymentItems = summary.paymentsToday.map(
    (p) =>
      `${escapeHtml(p.memberName)} <span style="color:${BRAND.muted};">— ${escapeHtml(p.method.toUpperCase())}</span> <span style="float:right;color:${BRAND.accent};font-weight:700;">${inr(p.amount)}</span>`
  );
  const newMemberItems = summary.newMembersToday.map(
    (m) => `${escapeHtml(m.fullName)} <span style="color:${BRAND.muted};">(${escapeHtml(m.membershipNumber)})</span>`
  );
  const newTrialItems = summary.newTrialsToday.map(
    (t) => `${escapeHtml(t.fullName)} <span style="color:${BRAND.muted};">— ${escapeHtml(t.shift)} shift</span>`
  );

  return {
    subject: `Fitness Future Gym — Daily Summary, ${summary.dateLabel}`,
    html: wrapEmail({
      preheader: `${summary.checkInsToday} check-ins, ${inr(summary.revenueToday)} collected today`,
      bodyHtml:
        heading("Daily Summary") +
        paragraph(`<span style="color:${BRAND.muted};">${escapeHtml(summary.dateLabel)}</span>`) +
        (summary.narrative ? sectionLabel("Today In Short") + narrativeBlock(summary.narrative) : "") +
        sectionLabel("Today") +
        statSection([
          { label: "Check-Ins", value: String(summary.checkInsToday) },
          ...(summary.checkInsUsual != null ? [{ label: "Usual For This Weekday", value: String(summary.checkInsUsual) }] : []),
          { label: "Revenue Collected", value: inr(summary.revenueToday) },
          { label: "New Members", value: String(summary.newMembersToday.length) },
          { label: "New Trial Signups", value: String(summary.newTrialsToday.length) },
          { label: "Trials Converted", value: String(summary.trialsConvertedToday) },
        ]) +
        (paymentItems.length > 0 ? sectionLabel("Payments Collected Today") + listSection(paymentItems) : "") +
        (newMemberItems.length > 0 ? sectionLabel("New Members Today") + listSection(newMemberItems) : "") +
        (newTrialItems.length > 0 ? sectionLabel("New Trial Signups Today") + listSection(newTrialItems) : "") +
        sectionLabel("Current Status") +
        statSection([
          { label: "Active Members", value: String(summary.activeMembersCount) },
          { label: "Overdue Fees", value: String(summary.overdueFeesCount), alert: summary.overdueFeesCount > 0 },
          { label: "Revenue This Month", value: inr(summary.revenueThisMonth) },
        ]) +
        sectionLabel("Needs Attention") +
        statSection(attentionRows) +
        paragraph(
          `<span style="color:${BRAND.muted};">Full detail on any of these is in Admin → Alerts and Admin → Fees.</span>`
        ),
    }),
  };
}

function signedPercent(pct: number | null): string {
  return pct == null ? "—" : `${pct > 0 ? "+" : ""}${pct}%`;
}

function buildWeeklySummaryEmail(w: WeeklySummary): { subject: string; html: string } {
  const atRiskItems = w.atRisk.map(
    (m) =>
      `${escapeHtml(m.name)} <span style="color:${BRAND.muted};">(${escapeHtml(m.membershipNumber)})</span> <span style="float:right;color:${BRAND.accent};font-weight:700;">${m.visitsThisWeek} this week &middot; ${m.visitsLastWeek} last</span>`
  );
  const overdueItems = w.overdueExamples.map((e) => escapeHtml(e));

  return {
    subject: `Fitness Future Gym — Weekly Report, ${w.rangeLabel}`,
    html: wrapEmail({
      preheader: `${w.checkIns.thisWeek} check-ins, ${inr(w.revenue.thisWeek)} collected this week`,
      bodyHtml:
        heading("Weekly Report") +
        paragraph(`<span style="color:${BRAND.muted};">${escapeHtml(w.rangeLabel)}</span>`) +
        (w.narrative
          ? sectionLabel("The Week In Short") +
            narrativeBlock(w.narrative.summary) +
            (w.narrative.actions.length > 0
              ? sectionLabel("Suggested Actions") + listSection(w.narrative.actions.map((a) => escapeHtml(a)))
              : "")
          : "") +
        sectionLabel("Highlights") +
        listSection(w.highlights.map((h) => escapeHtml(h))) +
        sectionLabel("This Week vs Last Week") +
        statSection([
          { label: "Check-Ins", value: String(w.checkIns.thisWeek) },
          { label: "Change In Check-Ins", value: signedPercent(w.checkIns.pctChange), alert: (w.checkIns.pctChange ?? 0) < 0 },
          { label: "Revenue Collected", value: inr(w.revenue.thisWeek) },
          { label: "Change In Revenue", value: signedPercent(w.revenue.pctChange), alert: (w.revenue.pctChange ?? 0) < 0 },
          { label: "New Members", value: String(w.members.joinedThisWeek) },
          { label: "Trial Signups / Converted", value: `${w.members.trialSignups} / ${w.members.trialsConverted}` },
        ]) +
        sectionLabel("Check-Ins By Day") +
        barSection(w.checkIns.perDay.map((d) => ({ label: d.label, value: d.count }))) +
        (atRiskItems.length > 0 ? sectionLabel("Regulars Who Dropped Off") + listSection(atRiskItems) : "") +
        sectionLabel("Money") +
        statSection([
          { label: "Revenue This Month", value: inr(w.revenue.monthToDate) },
          { label: "Overdue Fees", value: String(w.revenue.overdueCount), alert: w.revenue.overdueCount > 0 },
          { label: "Total Overdue Amount", value: inr(w.revenue.overdueAmount), alert: w.revenue.overdueAmount > 0 },
        ]) +
        (overdueItems.length > 0 ? sectionLabel("Longest-Overdue Members") + listSection(overdueItems) : "") +
        sectionLabel("Needs Attention") +
        statSection(buildAttentionRows(w.alerts)) +
        paragraph(`<span style="color:${BRAND.muted};">Full detail is in Admin → Alerts, Fees and Attendance.</span>`),
    }),
  };
}

function buildEmail(template: EmailTemplate, params: string[]): { subject: string; html: string } {
  switch (template) {
    case "otp": {
      const [code] = params;
      return {
        subject: "Your Fitness Future Gym login code",
        html: wrapEmail({
          preheader: `Your login code is ${code}`,
          bodyHtml:
            heading("Your login code") +
            paragraph("Enter this code to finish signing in:") +
            calloutBlock("Login Code", code) +
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
            calloutBlock("Membership Number", membershipNumber) +
            paragraph("Your digital membership card is attached to this email as a PDF — keep it handy for front-desk check-in. See you on the floor!"),
        }),
      };
    }
    case "payment_receipt": {
      const [name, amount, nextDueDate] = params;
      return {
        subject: "Fitness Future Gym — Payment Receipt",
        html: wrapEmail({
          preheader: `Payment received — ₹${amount}`,
          bodyHtml:
            heading(`Thanks, ${name}`) +
            paragraph("This confirms your payment has been recorded.") +
            calloutBlock("Amount Paid", `₹${amount}`) +
            paragraph(
              `Your membership is active through <strong>${escapeHtml(nextDueDate)}</strong>. Your PDF receipt is attached to this email — keep it for your records.`
            ),
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
    case "account_unblocked": {
      const [name] = params;
      return {
        subject: "Fitness Future Gym — Access Restored",
        html: wrapEmail({
          preheader: "Your check-in and dashboard access have been restored.",
          bodyHtml:
            heading("Access Restored") +
            paragraph(`Hi ${escapeHtml(name)}, your membership is back in good standing — check-in and dashboard access are restored.`) +
            paragraph("See you on the floor!"),
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
      return {
        subject: "Your Fitness Future Gym trial pass",
        html: wrapEmail({
          preheader: `Your trial pass code is ${trialCode}`,
          bodyHtml:
            heading(`Your Trial Is Booked, ${name}`) +
            paragraph(`You're set for a 2-day free trial — <strong>${escapeHtml(shiftLabel)} shift</strong>, valid through <strong>${escapeHtml(endsAt)}</strong>.`) +
            calloutBlock("Trial Pass Code", trialCode) +
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
    // The only template whose "params" isn't a few positional strings —
    // the daily summary's payload is a full structured object, so it
    // travels as a single JSON-encoded string instead of stretching the
    // bodyParams:string[] convention to fit something it wasn't designed
    // for. Keeps sendEmailTemplate's send/log/error-handling contract
    // (and the email_messages audit trail) shared with every other
    // template rather than duplicating it for just this one.
    case "daily_summary": {
      const [json] = params;
      return buildDailySummaryEmail(JSON.parse(json) as DailySummary);
    }
    case "weekly_summary": {
      const [json] = params;
      return buildWeeklySummaryEmail(JSON.parse(json) as WeeklySummary);
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
