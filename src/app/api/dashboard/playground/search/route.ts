import { NextResponse } from "next/server";
import { getMemberSession } from "@/backend/auth/session";
import { searchPlaygroundMembers } from "@/backend/services/playground";

export async function GET(request: Request) {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ status: "error", message: "Not signed in." }, { status: 401 });
  }

  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query) {
    return NextResponse.json({ status: "ok", results: [] });
  }

  try {
    const results = await searchPlaygroundMembers(query, session.memberId);
    return NextResponse.json({ status: "ok", results });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Something went wrong." }, { status: 500 });
  }
}
