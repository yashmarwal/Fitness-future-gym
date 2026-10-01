import { NextResponse } from "next/server";
import { getMemberSession } from "@/backend/auth/session";
import { getRoom } from "@/backend/services/playground";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ status: "error", message: "Not signed in." }, { status: 401 });
  }

  const { id } = await params;

  try {
    const room = await getRoom(id, session.memberId);
    if (!room) {
      return NextResponse.json({ status: "error", message: "Room not found." }, { status: 404 });
    }
    return NextResponse.json({ status: "ok", room });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Something went wrong." }, { status: 500 });
  }
}
