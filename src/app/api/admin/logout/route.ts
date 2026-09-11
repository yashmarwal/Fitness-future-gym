import { NextResponse } from "next/server";
import { clearAdminSession } from "@/backend/auth/session";

export async function POST() {
  await clearAdminSession();
  return NextResponse.json({ status: "ok" });
}
