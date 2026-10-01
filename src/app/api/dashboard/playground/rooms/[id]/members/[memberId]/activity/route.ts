import { NextResponse } from "next/server";
import { getMemberSession } from "@/backend/auth/session";
import { getRoomMemberActivity } from "@/backend/services/playground";

export async function GET(request: Request, { params }: { params: Promise<{ id: string; memberId: string }> }) {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ status: "error", message: "Not signed in." }, { status: 401 });
  }

  const { id, memberId } = await params;

  try {
    const activity = await getRoomMemberActivity(id, memberId, session.memberId);
    if (activity === null) {
      return NextResponse.json({ status: "error", message: "Not found." }, { status: 404 });
    }
    return NextResponse.json({ status: "ok", activity });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Something went wrong." }, { status: 500 });
  }
}
