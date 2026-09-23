import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { handleInboundWhatsAppMessage } from "@/backend/services/whatsappInbound";

// Meta calls this once — and again any time you re-save the webhook URL in
// WhatsApp Manager — to prove you own this endpoint before it'll deliver
// anything to it. Echo hub.challenge back only if hub.verify_token matches
// the value you set here (WHATSAPP_WEBHOOK_VERIFY_TOKEN, a secret you make
// up yourself and paste into WhatsApp Manager's webhook config alongside
// this URL), otherwise refuse.
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge ?? "", { status: 200 });
  }
  // TEMP DEBUG (remove once webhook verification is confirmed working):
  // lengths only, never the actual secret values, to diagnose a Vercel env
  // var mismatch without leaking WHATSAPP_WEBHOOK_VERIFY_TOKEN itself.
  const envVal = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN;
  return new NextResponse("Forbidden", {
    status: 403,
    headers: {
      "x-debug-env-set": envVal ? "yes" : "no",
      "x-debug-env-len": String(envVal?.length ?? 0),
      "x-debug-received-len": String(token?.length ?? 0),
      "x-debug-mode": String(mode),
    },
  });
}

// Confirms a POST actually came from Meta, not a random request forging a
// "from" number — this endpoint sends a real WhatsApp message to whatever
// "from" it's given, so without this check anyone could use it to fire
// messages at arbitrary numbers off your business account. No
// WHATSAPP_APP_SECRET configured means every POST is rejected, deliberately
// fail-closed rather than fail-open.
function isValidSignature(rawBody: string, signatureHeader: string | null): boolean {
  const appSecret = process.env.WHATSAPP_APP_SECRET;
  if (!appSecret || !signatureHeader) return false;

  const expected = `sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
  const a = Buffer.from(expected);
  const b = Buffer.from(signatureHeader);
  return a.length === b.length && timingSafeEqual(a, b);
}

// Meta POSTs every event this WABA is subscribed to here — inbound
// messages, delivery/read statuses, template status changes, and more. This
// app only acts on inbound text (see whatsappInbound.ts), everything else
// is silently ignored. Always acks 200 once the payload's been read
// (Meta retries an event that doesn't get a 2xx, repeatedly, forever).
export async function POST(request: Request) {
  const rawBody = await request.text();

  if (!isValidSignature(rawBody, request.headers.get("x-hub-signature-256"))) {
    return new NextResponse("Invalid signature", { status: 401 });
  }

  try {
    const payload = JSON.parse(rawBody);
    for (const entry of payload?.entry ?? []) {
      for (const change of entry?.changes ?? []) {
        const messages = change?.value?.messages as { from?: string }[] | undefined;
        for (const message of messages ?? []) {
          if (message.from) await handleInboundWhatsAppMessage(message.from);
        }
      }
    }
  } catch (err) {
    console.error("[whatsapp:webhook] failed to process payload:", err instanceof Error ? err.message : err);
  }

  return NextResponse.json({ status: "ok" });
}
