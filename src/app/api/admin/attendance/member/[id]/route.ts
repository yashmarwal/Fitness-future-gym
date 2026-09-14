import { NextResponse } from "next/server";
import { getAdminSession } from "@/backend/auth/session";
import { getMemberAttendanceTimestamps } from "@/backend/services/admin/attendanceAdmin";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  const { id } = await params;

  try {
    const timestamps = await getMemberAttendanceTimestamps(id);
    return NextResponse.json({ status: "ok", timestamps });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Could not load attendance." }, { status: 500 });
  }
}
