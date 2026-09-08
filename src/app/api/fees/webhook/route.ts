import { NextResponse } from "next/server";
import { verifyWebhookSignature, markFeePaid } from "@/server/services/razorpay";

export async function POST(request: Request) {
  const rawBody = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature || !verifyWebhookSignature(rawBody, signature)) {
    return NextResponse.json({ status: "error", message: "Invalid signature." }, { status: 400 });
  }

  const event = JSON.parse(rawBody);

  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;
    try {
      await markFeePaid(payment.order_id, payment.id);
    } catch (err) {
      console.error(err);
      return NextResponse.json({ status: "error" }, { status: 500 });
    }
  }

  return NextResponse.json({ status: "ok" });
}
