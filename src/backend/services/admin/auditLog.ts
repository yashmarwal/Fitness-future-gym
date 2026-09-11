import "server-only";
import { getDb } from "@/backend/db/client";

export async function recordAuditLog(adminId: string, action: string, details?: Record<string, unknown>): Promise<void> {
  const db = getDb();
  await db.from("audit_log").insert({ admin_id: adminId, action, details: details ?? null });
}
