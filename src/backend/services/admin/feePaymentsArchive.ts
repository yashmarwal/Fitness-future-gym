import "server-only";
import { getDb } from "@/backend/db/client";
import { buildCsv } from "@/backend/lib/csv";
import { sendEmailTemplate } from "@/backend/services/email";
import { OWNER_EMAILS } from "@/backend/services/admin/dailySummary";
import { getIstDateString } from "@/frontend/lib/date";

// India's financial year: 1 April – 31 March. Computes whichever FY most
// recently closed as of `now`, rather than assuming "the cron always fires
// on April 1" — a manual re-run later in the year still archives the
// correct (most recently completed) year, not a shifting "current" one.
function lastCompletedFinancialYear(now: Date): { startDate: string; endDate: string; label: string } {
  const istYear = Number(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric" }).format(now));
  const istMonth = Number(new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", month: "numeric" }).format(now));
  // On/after April (month 4): the FY that just closed started last calendar
  // year. Before April (Jan–Mar): the FY that just closed started the year
  // before that.
  const endYear = istMonth >= 4 ? istYear : istYear - 1;
  const startYear = endYear - 1;
  return {
    startDate: `${startYear}-04-01`,
    endDate: `${endYear}-03-31`,
    label: `FY ${startYear}–${String(endYear).slice(2)}`,
  };
}

type ArchiveRow = {
  date: string;
  memberName: string;
  membershipNumber: string;
  amount: number;
  method: string;
  status: string;
};

// Fires once a year (see vercel.json) — an immutable yearly snapshot of
// every fee payment for the gym's financial records/accounting, attached
// as a CSV. This function itself never deletes anything; the live table
// does have its own separate 18-month retention now (see
// feesAdmin.ts::deleteOldFeePayments), which is exactly why this archive
// exists — it's the permanent copy once a row ages out of the live table.
export async function sendFeePaymentsArchive(now: number = Date.now()): Promise<{ sent: number; failed: number; rows: number }> {
  const { startDate, endDate, label } = lastCompletedFinancialYear(new Date(now));
  const startIso = `${startDate}T00:00:00+05:30`;
  // Exclusive upper bound: midnight IST the day AFTER endDate, so a payment
  // made any time on March 31 itself is still included.
  const endBound = new Date(`${endDate}T00:00:00+05:30`);
  endBound.setUTCDate(endBound.getUTCDate() + 1);

  const db = getDb();
  // created_at (not paid_at) is the filter/sort column — paid_at can be
  // null for a pending_confirmation row, and this archive is meant to be a
  // complete record of everything that happened that year, not just
  // confirmed payments.
  const { data, error } = await db
    .from("fee_payments")
    .select("amount, method, status, paid_at, created_at, members(full_name, membership_number)")
    .gte("created_at", startIso)
    .lt("created_at", endBound.toISOString())
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Failed to load fee payments for archive: ${error.message}`);

  const rows: ArchiveRow[] = (data ?? []).map((row) => {
    const member = row.members as unknown as { full_name: string; membership_number: string } | null;
    return {
      date: getIstDateString(new Date(row.paid_at ?? row.created_at)),
      memberName: member?.full_name ?? "Unknown",
      membershipNumber: member?.membership_number ?? "—",
      amount: row.amount,
      method: row.method,
      status: row.status,
    };
  });

  const csv = buildCsv(rows, [
    { key: "date", label: "Date" },
    { key: "memberName", label: "Member" },
    { key: "membershipNumber", label: "Membership No." },
    { key: "amount", label: "Amount (INR)" },
    { key: "method", label: "Method" },
    { key: "status", label: "Status" },
  ]);
  const attachment = {
    filename: `fee-payments-${label.replace(/\s|–/g, "-")}.csv`,
    content: Buffer.from(csv, "utf-8").toString("base64"),
  };

  const totalAmount = rows.reduce((sum, r) => (r.status === "paid" ? sum + Number(r.amount) : sum), 0);

  // Separate emails per owner, same reasoning as daily/weekly summary — a
  // bad address for one owner can't suppress the other's copy.
  const results = await Promise.allSettled(
    OWNER_EMAILS.map((to) =>
      sendEmailTemplate({
        to,
        template: "fee_payments_archive",
        bodyParams: [label, String(rows.length), String(totalAmount)],
        attachments: [attachment],
      })
    )
  );
  const sent = results.filter((r) => r.status === "fulfilled").length;
  return { sent, failed: results.length - sent, rows: rows.length };
}
