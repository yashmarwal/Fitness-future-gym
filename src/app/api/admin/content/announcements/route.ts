import { NextResponse } from "next/server";
import { getAdminSession } from "@/backend/auth/session";
import { createAnnouncement } from "@/backend/services/admin/content";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.title || !body?.body) {
    return NextResponse.json({ status: "error", message: "Title and body are required." }, { status: 400 });
  }

  try {
    await createAnnouncement(body.title, body.body);
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
