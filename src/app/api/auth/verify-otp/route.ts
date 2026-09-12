import { NextResponse } from "next/server";
import { verifyMemberOtpAndLogin, verifySignupOtpAndLogin } from "@/backend/services/memberAuth";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const phone = body?.phone?.trim();
  const code = body?.code?.trim();
  const isSignup = body?.isSignup === true;

  if (!phone || !code) {
    return NextResponse.json({ status: "error", message: "Phone and code are required." }, { status: 400 });
  }

  try {
    const result = isSignup
      ? await verifySignupOtpAndLogin(phone, code)
      : await verifyMemberOtpAndLogin(phone, code);
    return NextResponse.json(result);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Something went wrong." }, { status: 500 });
  }
}
