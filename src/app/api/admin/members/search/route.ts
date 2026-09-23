import { NextResponse } from "next/server";
import { getAdminSession } from "@/backend/auth/session";
import { searchMembers } from "@/backend/services/admin/members";

// Backs the admin nav's global quick-search (AdminNav.tsx) — a small,
// fast, on-demand query fired as the admin types, not a full member-list
// fetch. GET + query param rather than the app's usual POST-for-mutations
// convention since this is a pure read, cheap to call on every keystroke.
export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  const q = new URL(request.url).searchParams.get("q") ?? "";

  try {
    const results = await searchMembers(q);
    return NextResponse.json({ status: "ok", results });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Search failed." }, { status: 500 });
  }
}
