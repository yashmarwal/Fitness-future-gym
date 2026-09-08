import "server-only";
import bcrypt from "bcryptjs";
import { getDb } from "@/server/db/client";
import { createAdminSession } from "@/server/auth/session";

export type AdminLoginResult = { status: "success" } | { status: "invalid" };

export async function loginAdmin(username: string, password: string): Promise<AdminLoginResult> {
  const db = getDb();
  const { data: admin, error } = await db
    .from("admin_users")
    .select("id, username, password_hash")
    .eq("username", username)
    .maybeSingle();

  if (error) throw new Error(`Failed to look up admin: ${error.message}`);
  if (!admin) return { status: "invalid" };

  const matches = await bcrypt.compare(password, admin.password_hash);
  if (!matches) return { status: "invalid" };

  await createAdminSession(admin.id, admin.username);
  return { status: "success" };
}
