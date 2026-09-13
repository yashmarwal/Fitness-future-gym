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

  try {
    const result = await registerMember({ fullName, phone, email, dateOfBirth });
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Something went wrong. Please try again." }, { status: 500 });
  }
}
