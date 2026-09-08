import { NextResponse } from "next/server";
import { getMemberSession } from "@/server/auth/session";
import { getDb } from "@/server/db/client";
import { createFeeOrder } from "@/server/services/razorpay";

export async function POST() {
  const session = await getMemberSession();
  if (!session) {
    return NextResponse.json({ status: "error", message: "Not signed in." }, { status: 401 });
  }

  const db = getDb();
  const { data: member, error } = await db
    .from("members")
    .select("fee_amount")
    .eq("id", session.memberId)
    .maybeSingle();

  if (error) {
    console.error(error);
    return NextResponse.json({ status: "error", message: "Something went wrong." }, { status: 500 });
  }

  if (!member?.fee_amount) {
    return NextResponse.json({ status: "error", message: "No fee amount on file. Contact the front desk." }, { status: 400 });
  }

  try {
    const order = await createFeeOrder(session.memberId, member.fee_amount);
    return NextResponse.json({ status: "ok", ...order, keyId: process.env.RAZORPAY_KEY_ID });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ status: "error", message: "Could not start payment." }, { status: 500 });
  }
}
