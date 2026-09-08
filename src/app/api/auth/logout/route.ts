import { NextResponse } from "next/server";
import { clearMemberSession } from "@/server/auth/session";

export async function POST() {
  await clearMemberSession();
  return NextResponse.json({ status: "ok" });
}
