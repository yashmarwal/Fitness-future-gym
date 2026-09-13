import { NextResponse } from "next/server";
import { claimTrial } from "@/backend/services/trial";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const fullName = body?.fullName?.trim();
  const phone = body?.phone?.trim();
  const email = body?.email?.trim();
  const shift = body?.shift === "evening" ? "evening" : "morning";

  if (!fullName || !phone || !email) {
    return NextResponse.json(
      { status: "error", message: "Name, phone, and email are required." },
      { status: 400 }
    );
  }

  try {
    const result = await claimTrial({ fullName, phone, email, shift });
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
