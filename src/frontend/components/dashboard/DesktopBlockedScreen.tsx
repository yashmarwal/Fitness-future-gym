import QRCode from "qrcode";
import { SITE_URL } from "@/frontend/lib/siteConfig";

// Shown instead of the real dashboard whenever the viewport is lg+ (see
// dashboard/layout.tsx — the whole real experience is wrapped in
// `lg:hidden`, this is the one thing that renders in its place). The
// member dashboard is built mobile-first and stays that way rather than
// chasing a second, parallel desktop experience the way the admin panel
// does — this screen is the honest "this isn't for you" instead of
// serving a cramped, awkwardly-stretched version of the phone UI on a
// monitor. Same QR-with-offset-accent-panel treatment as the membership
// card page (dashboard/card/page.tsx), for the same reason: it's already
// this app's established "here's a code, scan it" visual language.
export default async function DesktopBlockedScreen() {
  const qrDataUrl = await QRCode.toDataURL(`${SITE_URL}/dashboard`, { width: 260, margin: 1 }).catch(() => null);

  return (
    <div className="hidden lg:flex min-h-screen flex-col items-center justify-center gap-6 bg-black px-8 text-center">
      <span className="w-20 h-20 rounded-full flex items-center justify-center bg-surface-container-low text-primary-container shadow-soft">
        <span className="material-symbols-outlined text-4xl leading-none">smartphone</span>
      </span>

      <div className="flex flex-col gap-2 max-w-md">
        <h1 className="font-display text-3xl text-on-surface uppercase tracking-wide">Switch To Your Phone</h1>
        <p className="font-body text-sm text-tertiary">
          The member dashboard is built for mobile — logging a set, scanning the check-in QR, resting between
          sets, none of it belongs on a desktop monitor. Scan the code below with your phone to pick up right
          where you are.
        </p>
      </div>

      {qrDataUrl && (
        <div className="relative mt-2">
          <div className="absolute top-1.5 left-1.5 w-full h-full bg-primary-container rounded-2xl" aria-hidden="true" />
          {/* eslint-disable-next-line @next/next/no-img-element -- data: URL, next/image can't optimize it */}
          <img src={qrDataUrl} alt="QR code to open the member dashboard on your phone" className="relative w-44 h-44 bg-white p-2.5 rounded-2xl" />
        </div>
      )}

      <p className="font-label text-[10px] uppercase tracking-widest text-outline">
        Or open fitnessfuturegym.in/dashboard on your phone
      </p>
    </div>
  );
}
