import { NextResponse } from "next/server";
import { registerMember } from "@/backend/services/memberAuth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const fullName = body?.fullName?.trim();
  const phone = body?.phone?.trim();
  const email = body?.email?.trim();
  const dateOfBirth = body?.dateOfBirth?.trim();

  if (!fullName || !phone || !email) {
    return NextResponse.json(
      { status: "error", message: "Name, phone number, and email are required." },
      { status: 400 }
    );
  }

  // The <input type="date"> picker always sends YYYY-MM-DD, but this field
  // is reachable directly (not just through the form), and an invalid date
  // string reaching the pending_signups insert previously surfaced as a
  // raw Postgres type error instead of a clean 400.
  if (dateOfBirth) {
    const parsed = /^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth) ? new Date(dateOfBirth) : null;
    if (!parsed || Number.isNaN(parsed.getTime()) || parsed > new Date()) {
      return NextResponse.json(
        { status: "error", message: "Date of birth isn't a valid date." },
        { status: 400 }
      );
    }
  }

  try {
    const result = await registerMember({ fullName, phone, email, dateOfBirth });
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
