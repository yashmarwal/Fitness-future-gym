"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open: () => void };
  }
}

export default function PayFeeButton({ memberName, phone }: { memberName: string; phone: string | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handlePay() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch("/api/fees/create-order", { method: "POST" });
      const data = await res.json();

      if (data.status !== "ok") {
        setMessage(data.message ?? "Could not start payment.");
        return;
      }

      const razorpay = new window.Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.orderId,
        name: "Fitness Future Gym 2.0",
        description: "Membership fee",
        prefill: { name: memberName, contact: phone ?? undefined },
        theme: { color: "#FF5A1F" },
        handler: () => {
          setMessage("Payment submitted — confirming with the gym, this page will update shortly.");
          setTimeout(() => router.refresh(), 3000);
        },
      });
      razorpay.open();
    } catch {
      setMessage("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      <button
        onClick={handlePay}
        disabled={loading}
        className="bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3 shadow-hard disabled:opacity-60"
      >
        {loading ? "Starting..." : "Pay Now"}
      </button>
      {message && <p className="font-body text-sm text-tertiary mt-3">{message}</p>}
    </>
  );
}
