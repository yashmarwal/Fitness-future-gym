import { NextResponse } from "next/server";
import { getAdminSession } from "@/server/auth/session";
import { createFaq } from "@/server/services/admin/content";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.question || !body?.answer) {
    return NextResponse.json({ status: "error", message: "Question and answer are required." }, { status: 400 });
  }

  try {
    await createFaq(body.question, body.answer);
    return NextResponse.json({ status: "ok" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
