import { NextResponse } from "next/server";
import { getAdminSession } from "@/backend/auth/session";
import { testAllWhatsAppTemplates } from "@/backend/services/admin/whatsappTest";

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) return NextResponse.json({ status: "error" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body?.phone) {
    return NextResponse.json({ status: "error", message: "Phone number is required." }, { status: 400 });
  }

  const outcome = await testAllWhatsAppTemplates(body.phone);
  if ("error" in outcome) {
    return NextResponse.json({ status: "error", message: outcome.error }, { status: 400 });
  }

  return NextResponse.json({ status: "ok", phone: outcome.phone, results: outcome.results });
}
