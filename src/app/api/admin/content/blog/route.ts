import { NextResponse } from "next/server";
import { getAdminSession } from "@/server/auth/session";
import { createBlogPost } from "@/server/services/admin/content";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.title || !body?.slug) {
    return NextResponse.json({ status: "error", message: "Title and slug are required." }, { status: 400 });
  }

  try {
    await createBlogPost(body);
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
