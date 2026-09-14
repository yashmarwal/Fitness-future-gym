import { NextResponse } from "next/server";
import { getMemberSession } from "@/backend/auth/session";
import { getAttendanceStatus } from "@/backend/services/attendance";

export async function GET() {
  const session = await getMemberSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  try {
    const result = await getAttendanceStatus(session.memberId);
    return NextResponse.json({ status: "ok", ...result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Something went wrong." }, { status: 500 });
  }
}
