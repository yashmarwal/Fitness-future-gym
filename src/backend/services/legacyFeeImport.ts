import "server-only";
import { getDb } from "@/backend/db/client";
import { isMissingColumnError } from "@/backend/db/errors";

// The old gym software's due dates don't follow this app's "due date = when
// admin recorded payment" convention, so a straight cutover would show every
// migrated member as unpaid the moment they sign up. This bridges that gap:
// scripts/import-legacy-fees.mjs loads their old (start_date, due_date) pairs
// keyed by phone into legacy_fee_imports; the moment someone with a matching
// phone actually creates an account here, applyLegacyFeeImport silently
// carries their real plan/due date over, then deletes the row — the account
// behaves exactly as if admin had entered it manually. Deliberately best-
// effort everywhere: nothing in here may ever fail a signup.

// Labels a duration the same way admin's manual "Record Payment" flow would
// (see PAYMENT_DURATION_MONTHS_OPTIONS in feesAdmin.ts) when the old
// system's gap between start and due date lands close to one of those
// tiers, falling back to an exact "N Month Plan" label otherwise — old data
// won't always land on a clean tier.
function derivePlanLabel(startDate: string, dueDate: string): string {
  const start = new Date(startDate);
  const due = new Date(dueDate);
  const days = Math.max(0, (due.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const months = days / 30.44;

  const TIERS: { months: number; label: string; toleranceDays: number }[] = [
    { months: 1, label: "Monthly", toleranceDays: 7 },
    { months: 3, label: "Quarterly", toleranceDays: 15 },
    { months: 6, label: "Half-Yearly", toleranceDays: 15 },
    { months: 12, label: "Annual", toleranceDays: 20 },
  ];
  for (const tier of TIERS) {
    if (Math.abs(days - tier.months * 30.44) <= tier.toleranceDays) return tier.label;
  }
  const rounded = Math.max(1, Math.round(months));
  return `${rounded} Month Plan`;
}

// Called right after a brand-new member row is created (verifySignupOtpAndLogin) —
// never on an existing member, so there's no risk of clobbering a plan/due
// date admin already set by hand.
export async function applyLegacyFeeImport(memberId: string, phone: string): Promise<void> {
  try {
    const db = getDb();

    // fee_amount is a newer column (see schema.sql) that may not have its
    // migration run yet — cascade to the base select rather than let a
    // missing-column error on this one extra field silently break the
    // plan/due-date match that already worked before fee_amount existed.
    const full = await db
      .from("legacy_fee_imports")
      .select("id, start_date, fee_due_date, fee_amount")
      .eq("phone", phone)
      .maybeSingle();
    let legacyRow: { id: string; start_date: string; fee_due_date: string; fee_amount?: number | null } | null;
    if (!full.error) {
      legacyRow = full.data;
    } else if (isMissingColumnError(full.error)) {
      const base = await db
        .from("legacy_fee_imports")
        .select("id, start_date, fee_due_date")
        .eq("phone", phone)
        .maybeSingle();
      if (base.error || !base.data) return;
      legacyRow = base.data;
    } else {
      return;
    }
    if (!legacyRow) return;

    const plan = derivePlanLabel(legacyRow.start_date, legacyRow.fee_due_date);
    // joined_at otherwise defaults to today (the signup date) — for someone
    // migrating over from the old gym software, that's wrong: they actually
    // joined back on the old system's start_date, and only the due date
    // (already carried over above) is what genuinely resets on migration.
    const patch: Record<string, unknown> = {
      plan,
      fee_due_date: legacyRow.fee_due_date,
      joined_at: legacyRow.start_date,
    };
    if (legacyRow.fee_amount != null) patch.fee_amount = legacyRow.fee_amount;

    const { error: updateError } = await db.from("members").update(patch).eq("id", memberId);
    if (updateError) return;

    await db.from("legacy_fee_imports").delete().eq("id", legacyRow.id);

    // Best-effort, non-atomic increment — matches the read-modify-write
    // pattern already used elsewhere in this app (e.g. streak counters);
    // fine at this app's scale and an occasional missed +1 only skews the
    // admin status card by a member or two, never the actual member data.
    const { data: batch } = await db
      .from("legacy_fee_import_batches")
      .select("id, matched_count")
      .order("imported_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (batch) {
      await db
        .from("legacy_fee_import_batches")
        .update({ matched_count: batch.matched_count + 1 })
        .eq("id", batch.id);
    }
  } catch {
    // Never let a legacy-import hiccup fail a signup.
  }
}

const LEGACY_IMPORT_RETENTION_MONTHS = 6;

// Wired into the existing logs-cleanup cron (no new cron entry needed) —
// anyone from the old system who hasn't signed up on the new app within 6
// months of the import is past the migration window; their leftover row is
// just deleted, same as every other dated-retention table in this app.
// Swallows a missing-table error (pre-migration) rather than throwing — this
// runs inside a Promise.all alongside unrelated cleanups in logs-cleanup,
// and one of them not being ready yet must never stop the rest from running.
export async function deleteExpiredLegacyFeeImports(): Promise<{ deleted: number }> {
  try {
    const db = getDb();
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - LEGACY_IMPORT_RETENTION_MONTHS);

    const { data, error } = await db
      .from("legacy_fee_imports")
      .delete()
      .lt("imported_at", cutoff.toISOString())
      .select("id");

    if (error) return { deleted: 0 };
    return { deleted: data?.length ?? 0 };
  } catch {
    return { deleted: 0 };
  }
}

export type LegacyImportStatus = {
  totalRows: number;
  matchedCount: number;
  pendingCount: number;
  importedAt: string;
  cleanupAt: string;
} | null;

// Powers the small admin status card — null means either no import has ever
// been run, OR (before the migration in schema.sql has landed) these tables
// don't exist yet. Both cases render identically: no card. Deliberately
// swallows every error rather than the usual isMissingColumnError check —
// this whole feature is two brand-new TABLES, not a column on an existing
// one, and this is the one place in the app that reads them on every admin
// page load, so it must never 500 the Fees page while waiting on a
// migration.
export async function getLegacyImportStatus(): Promise<LegacyImportStatus> {
  try {
    const db = getDb();
    const { data: batch, error: batchError } = await db
      .from("legacy_fee_import_batches")
      .select("total_rows, matched_count, imported_at")
      .order("imported_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (batchError || !batch) return null;

    const { count, error: countError } = await db
      .from("legacy_fee_imports")
      .select("id", { count: "exact", head: true });
    if (countError) return null;

    const cleanupAt = new Date(batch.imported_at);
    cleanupAt.setMonth(cleanupAt.getMonth() + LEGACY_IMPORT_RETENTION_MONTHS);

    return {
      totalRows: batch.total_rows,
      matchedCount: batch.matched_count,
      pendingCount: count ?? 0,
      importedAt: batch.imported_at,
      cleanupAt: cleanupAt.toISOString(),
    };
  } catch {
    return null;
  }
}
