import { NextResponse } from "next/server";
import { getMemberSession } from "@/backend/auth/session";
import { searchFoods } from "@/backend/services/nutritionLookup";

export async function GET(request: Request) {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ status: "error", message: "Not signed in." }, { status: 401 });
  }

  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query || query.length < 2) {
    return NextResponse.json({ status: "ok", results: [] });
  }

  try {
    const results = await searchFoods(query);
    return NextResponse.json({ status: "ok", results });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Lookup failed.", results: [] });
  }
}
