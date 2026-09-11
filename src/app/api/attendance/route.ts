import { NextResponse } from "next/server";
import { checkInMember } from "@/backend/services/attendance";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const membershipNumber = body?.membershipNumber?.trim();

  if (!membershipNumber) {
    return NextResponse.json(
      { status: "error", message: "Membership number is required." },
      { status: 400 }
    );
  }

  try {
    const result = await checkInMember(membershipNumber);
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { status: "error", message: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
