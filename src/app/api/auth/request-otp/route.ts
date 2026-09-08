import { NextResponse } from "next/server";
import { requestMemberOtp } from "@/server/services/memberAuth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const phone = body?.phone?.trim();

  if (!phone) {
    return NextResponse.json({ status: "error", message: "Phone number is required." }, { status: 400 });
  }

  try {
    const result = await requestMemberOtp(phone);
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Something went wrong." }, { status: 500 });
  }
}
