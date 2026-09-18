import { NextResponse } from "next/server";
import { sendDailySummaryEmail } from "@/backend/services/admin/dailySummary";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ status: "error", message: "Unauthorized." }, { status: 401 });
  }

  try {
    const result = await sendDailySummaryEmail();
    return NextResponse.json({ status: "ok", ...result });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error" }, { status: 500 });
  }
}
