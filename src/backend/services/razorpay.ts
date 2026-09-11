import "server-only";
import Razorpay from "razorpay";
import { createHmac } from "node:crypto";
import { getDb } from "@/backend/db/client";

function getClient() {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) {
    throw new Error("Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET — see .env.example.");
  }
  return new Razorpay({ key_id: keyId, key_secret: keySecret });
}

export async function createFeeOrder(memberId: string, amountRupees: number) {
  const client = getClient();
  const db = getDb();

  const order = await client.orders.create({
    amount: Math.round(amountRupees * 100), // paise
    currency: "INR",
    receipt: `member_${memberId}_${Date.now()}`,
  });

  const { data: payment, error } = await db
    .from("fee_payments")
    .insert({
      member_id: memberId,
      amount: amountRupees,
      method: "razorpay",
      razorpay_order_id: order.id,
      status: "created",
    })
    .select("id")
    .single();

  if (error) throw new Error(`Failed to record fee order: ${error.message}`);

  return { orderId: order.id, amount: order.amount, currency: order.currency, paymentRecordId: payment.id };
}

export function verifyWebhookSignature(rawBody: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) throw new Error("Missing RAZORPAY_WEBHOOK_SECRET — see .env.example.");

  const expected = createHmac("sha256", secret).update(rawBody).digest("hex");
  return expected === signature;
}

export async function markFeePaid(razorpayOrderId: string, razorpayPaymentId: string) {
  const db = getDb();

  const { data: payment, error: findError } = await db
    .from("fee_payments")
    .select("id, member_id, amount")
    .eq("razorpay_order_id", razorpayOrderId)
    .maybeSingle();

  if (findError) throw new Error(`Failed to look up fee order: ${findError.message}`);
  if (!payment) throw new Error(`No fee order found for Razorpay order ${razorpayOrderId}`);

  await db
    .from("fee_payments")
    .update({ status: "paid", razorpay_payment_id: razorpayPaymentId, paid_at: new Date().toISOString() })
    .eq("id", payment.id);

  const nextDueDate = new Date();
  nextDueDate.setMonth(nextDueDate.getMonth() + 1);
  await db
    .from("members")
    .update({ fee_due_date: nextDueDate.toISOString().slice(0, 10) })
    .eq("id", payment.member_id);
}
