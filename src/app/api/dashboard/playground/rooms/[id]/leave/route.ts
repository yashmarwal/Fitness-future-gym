import { NextResponse } from "next/server";
import { getMemberSession } from "@/backend/auth/session";
import { leaveRoom } from "@/backend/services/playground";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ status: "error", message: "Not signed in." }, { status: 401 });
  }

  const { id } = await params;

  try {
    await leaveRoom(id, session.memberId);
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Something went wrong." }, { status: 500 });
  }
}
