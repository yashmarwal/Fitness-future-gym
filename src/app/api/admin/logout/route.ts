import { NextResponse } from "next/server";
import { clearAdminSession } from "@/server/auth/session";

export async function POST() {
  await clearAdminSession();
  return NextResponse.json({ status: "ok" });
}
