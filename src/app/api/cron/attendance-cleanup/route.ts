import { NextResponse } from "next/server";
import { deleteOldAttendance } from "@/backend/services/attendance";
import { verifyCronRequest } from "@/backend/lib/cronAuth";

export async function GET(request: Request) {
  const unauthorized = verifyCronRequest(request);
  if (unauthorized) return unauthorized;

  try {
    const result = await deleteOldAttendance();
    return NextResponse.json({ status: "ok", ...result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
