import { NextResponse } from "next/server";
import { getMemberSession } from "@/backend/auth/session";
import { respondToInvite } from "@/backend/services/playground";

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ status: "error", message: "Not signed in." }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json().catch(() => null);
  if (typeof body?.accept !== "boolean") {
    return NextResponse.json({ status: "error", message: "accept must be a boolean." }, { status: 400 });
  }

  try {
    const result = await respondToInvite(session.memberId, id, body.accept);
    if (result.status === "not_found") {
      return NextResponse.json({ status: "error", message: "Invite not found." }, { status: 404 });
    }
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Something went wrong." }, { status: 500 });
  }
}
