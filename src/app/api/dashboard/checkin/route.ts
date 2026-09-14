import { NextResponse } from "next/server";
import { getMemberSession } from "@/backend/auth/session";
import { checkInMemberById } from "@/backend/services/attendance";

export async function POST() {
  const session = await getMemberSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  try {
    const result = await checkInMemberById(session.memberId);
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Something went wrong." }, { status: 500 });
  }
}
