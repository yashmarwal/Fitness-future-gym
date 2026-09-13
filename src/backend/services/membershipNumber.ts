import "server-only";
import { getDb } from "@/backend/db/client";

// Shared by signup verification and trial-to-member conversion — both are
// places a brand-new members row gets created and needs a fresh FF-#### number.
export async function generateMembershipNumber(): Promise<string> {
  const db = getDb();
  const { data, error } = await db
    .from("members")
    .select("membership_number")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Failed to generate membership number: ${error.message}`);

  const match = data?.membership_number?.match(/(\d+)$/);
  const next = match ? Number(match[1]) + 1 : 1001;
  return `FF-${next}`;
}
