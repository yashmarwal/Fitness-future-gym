"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function AttendanceQrCode() {
  const [override, setOverride] = useState<string | null>(null);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  const liveOrigin = typeof window !== "undefined" ? window.location.origin : "";
  const baseUrl = override ?? liveOrigin;

  useEffect(() => {
    if (!baseUrl) return;
    QRCode.toDataURL(`${baseUrl}/attendance`, { width: 1024, margin: 2 })
      .then(setDataUrl)
      .catch(() => setDataUrl(null));
  }, [baseUrl]);

  return (
    <div className="flex flex-col gap-6 max-w-md">
      <div className="bg-surface-container-low rounded-2xl shadow-soft p-5 flex flex-col gap-1">
        <label className="font-label text-[10px] uppercase tracking-widest text-outline">
          Site URL (edit once you have your real domain)
        </label>
        <input
          value={baseUrl}
          onChange={(e) => setOverride(e.target.value.replace(/\/$/, ""))}
          placeholder="https://yourdomain.com"
          className="rounded-xl bg-surface-container border border-surface-variant text-on-surface font-body px-4 py-3 outline-none focus:border-primary-container"
        />
      </div>

      {dataUrl && (
        <div className="bg-surface-container-lowest rounded-2xl shadow-soft flex flex-col items-center gap-4 p-6">
          {/* eslint-disable-next-line @next/next/no-img-element -- data: URL, next/image can't optimize it */}
          <img src={dataUrl} alt="Attendance check-in QR code" className="w-64 h-64 rounded-xl" />
          <p className="font-label text-xs uppercase tracking-wide text-on-surface text-center">
            Points to {baseUrl}/attendance
          </p>
          <a
            href={dataUrl}
            download="attendance-qr-code.png"
            className="flex items-center gap-2 rounded-xl bg-primary-container hover:bg-secondary-container text-on-primary-container font-label text-sm uppercase font-bold px-6 py-3 shadow-soft transition-colors"
          >
            <span className="material-symbols-outlined text-lg leading-none">download</span>
            Download PNG For Printing
          </a>
        </div>
      )}

      <p className="font-body text-xs text-tertiary">
        Print this and place it at the front desk. It&apos;s a static code — the URL never changes, so you
        only need to print it once per domain. If you ever change domains, generate and print a new one here.
      </p>
    </div>
  );
}
