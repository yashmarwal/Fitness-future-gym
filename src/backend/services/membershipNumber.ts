import "server-only";
import { getDb } from "@/backend/db/client";

// Shared by signup verification and trial-to-member conversion — both are
// places a brand-new members row gets created and needs a fresh FF-#### number.
//
// Scans every existing number and takes the max suffix, rather than just
// the most-recently-created row: an admin can hand-set a member's number to
// something irregular (via Admin -> Members), and if that happens to be the
// latest-created row, reading only it and falling back to 1001 on a
// non-numeric-suffix match could hand out a number that collides with one
// already assigned earlier.
export async function generateMembershipNumber(): Promise<string> {
  const db = getDb();
  const { data, error } = await db.from("members").select("membership_number");

  if (error) throw new Error(`Failed to generate membership number: ${error.message}`);

  let max = 1000;
  for (const row of data ?? []) {
    const match = row.membership_number?.match(/(\d+)$/);
    if (match) {
      const n = Number(match[1]);
      if (n > max) max = n;
    }
  }

  return `FF-${max + 1}`;
}

function isUniqueViolation(error: { code?: string } | null | undefined, columnHint: string): boolean {
  return error?.code === "23505" && (error as { message?: string }).message?.includes(columnHint) === true;
}

const MEMBERSHIP_NUMBER_INSERT_ATTEMPTS = 5;

// Membership numbers are generated client-side (read-max-then-increment,
// not a DB sequence), so two signups completing at nearly the same moment
// can both compute the same "next" number — the DB's unique constraint on
// membership_number then rejects the second insert outright. Rather than
// letting that surface as a hard failure to whoever loses the race, this
// retries the whole generate+insert cycle a few times so a genuinely
// concurrent signup just gets the next number after that, transparently.
export async function insertMemberWithFreshNumber<T>(
  buildRow: (membershipNumber: string) => Record<string, unknown>,
  selectColumns: string
): Promise<T> {
  const db = getDb();

  for (let attempt = 0; attempt < MEMBERSHIP_NUMBER_INSERT_ATTEMPTS; attempt++) {
    const membershipNumber = await generateMembershipNumber();
    const { data, error } = await db
      .from("members")
      .insert(buildRow(membershipNumber))
      .select(selectColumns)
      .single();

    if (!error) return data as T;
    if (isUniqueViolation(error, "membership_number")) continue;
    throw new Error(`Failed to create member: ${error.message}`);
  }

  throw new Error("Failed to create member: could not allocate a unique membership number after several attempts.");
}
