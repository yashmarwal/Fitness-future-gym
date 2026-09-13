"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { buildUpiLink } from "@/frontend/lib/upi";

export default function UpiPayButton({
  vpa,
  payeeName,
  amount,
  memberName,
}: {
  vpa: string;
  payeeName: string;
  amount: number;
  memberName: string;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  const upiLink = buildUpiLink({
    vpa,
    payeeName,
    amount,
    note: `Fitness Future fee - ${memberName}`,
  });

  useEffect(() => {
    QRCode.toDataURL(upiLink, { width: 512, margin: 2 })
      .then(setDataUrl)
      .catch(() => setDataUrl(null));
  }, [upiLink]);

  return (
    <div className="flex flex-col items-center gap-4">
      {dataUrl && (
        <div className="bg-surface-container-lowest p-3 shadow-hard">
          {/* eslint-disable-next-line @next/next/no-img-element -- data: URL, next/image can't optimize it */}
          <img src={dataUrl} alt="UPI payment QR code" className="w-48 h-48" />
        </div>
      )}

      <a
        href={upiLink}
        className="w-full inline-flex items-center justify-center gap-2 bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3 shadow-hard transition-colors"
      >
        <span className="material-symbols-outlined text-lg leading-none">qr_code_scanner</span>
        Pay ₹{amount} Via UPI App
      </a>

      <p className="font-body text-xs text-tertiary text-center">
        Scan the code or tap the button on your phone to pay via GPay, PhonePe, Paytm, or any UPI app.
        The front desk will confirm your payment and update your due date shortly after.
      </p>
    </div>
  );
}
