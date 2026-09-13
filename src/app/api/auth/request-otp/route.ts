import { NextResponse } from "next/server";
import { requestMemberOtp } from "@/backend/services/memberAuth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  // "identifier" so the login form can accept either a phone number or an
  // email — kept as a separate field name from signup's `phone` so this
  // route's contract is explicit about accepting either.
  const identifier = (body?.identifier ?? body?.phone)?.trim();

  if (!identifier) {
    return NextResponse.json({ status: "error", message: "Phone number or email is required." }, { status: 400 });
  }

  try {
    const result = await requestMemberOtp(identifier);
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Something went wrong." }, { status: 500 });
  }
}
